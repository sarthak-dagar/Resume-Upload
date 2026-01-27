
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const os = require('os');

const app = express();
const PORT = 5500;


// ---------- DATABASE CONFIG ----------
const DB_CONFIG = {
    host: process.env.MYSQL_HOST ,
    user: process.env.MYSQL_USER ,
    password: process.env.MYSQL_PASSWORD ,
    database: process.env.MYSQL_DATABASE ,
    port: parseInt(process.env.MYSQL_PORT)
};

// ---------- CREATE UPLOADS FOLDER IF NOT EXISTS ----------
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// ---------- MULTER CONFIGURATION ----------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
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
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ---------- MIDDLEWARE ----------
app.use(express.static(__dirname)); // serve index.html, style.css, uploads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- DATABASE INIT ----------
let db;

async function initDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: DB_CONFIG.host,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``);
        await connection.end();

        db = mysql.createPool({
            host: DB_CONFIG.host,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            database: DB_CONFIG.database,
            waitForConnections: true,
            connectionLimit: 10
        });

        await db.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                whatsapp VARCHAR(50),
                resume_path VARCHAR(500) NOT NULL,
                submitted_at DATETIME NOT NULL
            )
        `);

        console.log('Database initialized ✅');
    } catch (err) {
        console.error('Database initialization error:', err);
        process.exit(1);
    }
}

// ---------- ROUTES ----------

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle resume upload
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

        await db.query(
            `INSERT INTO submissions (name, email, whatsapp, resume_path, submitted_at)
             VALUES (?, ?, ?, ?, ?)`,
            [submission.name, submission.email, submission.whatsapp, submission.resumePath, submission.submittedAt]
        );

        res.send(`
            <html>
            <head>
                <style>
                    body { font-family: Arial; text-align: center; padding: 50px; }
                    .success { color: #4CAF50; font-size: 24px; }
                </style>
            </head>
            <body>
                <div class="success">✓ Your resume is submitted.</div>
                <p>Thank you, ${submission.name}. We'll contact you soon.</p>
                <a href="/">Submit another resume</a>
            </body>
            </html>
        `);

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).send('Error uploading resume');
    }
});

// ---------- GET LOCAL IP ADDRESS ----------
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// ---------- START SERVER ----------
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        const localIP = getLocalIP();
        console.log('\n========================================');
        console.log('✅ Server is running!');
        console.log('========================================');
        console.log(`📍 Local:    http://localhost:${PORT}`);
        console.log(`📍 Network:  http://${localIP}:${PORT}`);
        console.log('========================================');
        console.log(`\n📱 Phone se access karne ke liye use karein: http://${localIP}:${PORT}`);
        console.log('(Dono devices same WiFi network par hone chahiye)\n');
    });
});
