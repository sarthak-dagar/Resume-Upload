const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { initDatabase, insertSubmission, getAllSubmissions } = require('./db');
const session = require('express-session');

const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 5500;

// ---------- CONFIG ----------
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ---------- MIDDLEWARE: Admin Protection ----------
function requireAdmin(req, res, next) {
    if (req.session && req.session.admin) return next();
    res.redirect('/admin');
}

// ---------- UPLOAD (multer) ----------
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// ---------- MIDDLEWARE ----------
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'resume-upload-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ---------- ROUTES: Main Page ----------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

// ---------- ROUTES: Resume Upload ----------
app.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, whatsapp } = req.body;
        const file = req.file;

        if (!file) return res.status(400).send('No file uploaded');

        await insertSubmission(name, email, whatsapp, file.path);
        res.redirect('/?success=1&name=' + encodeURIComponent(name || ''));
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).send('Error uploading resume');
    }
});

// ---------- ROUTES: Admin (Login, Dashboard, API) ----------
// Admin login page
app.get('/admin', (req, res) => {
    if (req.session && req.session.admin) return res.redirect('/admin/dashboard');
    res.sendFile(path.join(__dirname, 'template', 'admin.html'));
});

// Admin login submit
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        req.session.admin = true;
        return res.redirect('/admin/dashboard');
    }
    res.redirect('/admin?error=invalid');
});

// Admin logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin'));
});

// Admin dashboard (protected)
app.get('/admin/dashboard', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'admin-dashboard.html'));
});

// API endpoint to get submissions data (protected)
app.get('/api/admin/submissions', requireAdmin, async (req, res) => {
    try {
        const submissions = await getAllSubmissions();
        res.json(submissions);
    } catch (err) {
        console.error('API error:', err);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// API endpoint to download resume (protected)
/**
 * Download resume file
 * Query param: file - the filename to download
 */
app.get('/api/download-resume', requireAdmin, (req, res) => {
    const filename = req.query.file;
    if (!filename) return res.status(400).send('No file specified');
    
    const filePath = path.join(UPLOADS_DIR, filename);
    
    // Security: Prevent directory traversal attacks
    if (!filePath.startsWith(UPLOADS_DIR)) {
        return res.status(403).send('Access denied');
    }
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    
    res.download(filePath);
});

// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.redirect('/?error=filesize');
    }
    console.error(err);
    res.status(500).send('Something went wrong');
});

// ---------- SERVER START ----------
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return 'localhost';
}

initDatabase().then(() => {
    const host = '0.0.0.0';
    let port = Number(process.env.PORT) || Number(PORT);
    const maxAttempts = 10;

    function start(attempt = 0) {
        const server = app.listen(port, host, () => {
            const localIP = getLocalIP();
            console.log('\n========================================');
            console.log('✅ Server is running!');
            console.log('========================================');
            console.log(`📍 Local:    http://localhost:${port}`);
            console.log(`📍 Network:  http://${localIP}:${port}`);
            console.log('========================================\n');
        });

        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                if (attempt < maxAttempts) {
                    console.warn(`Port ${port} in use — trying ${port + 1}...`);
                    port += 1;
                    setTimeout(() => start(attempt + 1), 200);
                } else {
                    console.error(`Port ${port} still in use after ${maxAttempts} attempts. Exiting.`);
                    process.exit(1);
                }
            } else {
                console.error('Server error:', err);
                process.exit(1);
            }
        });
    }

    start();
});
