const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { initDatabase, getDb, readSubmissionsFromFile, saveSubmissionToFile } = require('./backend/db');
const session = require('express-session');
const { registerAdminRoutes } = require('./backend/admin');

const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 5500;

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

// ---------- ROUTES: Resume upload (/, /upload) ----------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

app.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, whatsapp } = req.body;
        const file = req.file;

        if (!file) return res.status(400).send('No file uploaded');

        const submission = {
            name,
            email,
            whatsapp: whatsapp || 'Not provided',
            resumePath: file.path,
            submittedAt: new Date()
        };

        console.log('New submission:', submission);

        const db = getDb();
        if (db) {
            await db.query(
                `INSERT INTO submissions (name, email, whatsapp, resume_path, submitted_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [submission.name, submission.email, submission.whatsapp, submission.resumePath, submission.submittedAt]
            );
        } else {
            saveSubmissionToFile(submission);
        }

        res.redirect('/?success=1&name=' + encodeURIComponent(submission.name || ''));
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).send('Error uploading resume');
    }
});

// ---------- ROUTES: Admin login & dashboard (/admin, /admin/dashboard) ----------
registerAdminRoutes(app, __dirname);

// ---------- ERROR HANDLER (e.g. file too large) ----------
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
    app.listen(PORT, '0.0.0.0', () => {
        const localIP = getLocalIP();
        console.log('\n========================================');
        console.log('✅ Server is running!');
        console.log('========================================');
        console.log(`📍 Local:    http://localhost:${PORT}`);
        console.log(`📍 Network:  http://${localIP}:${PORT}`);
        console.log('========================================');
    });
});
