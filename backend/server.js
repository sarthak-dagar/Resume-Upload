const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- DATABASE CONFIG ----------
const DB_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'resume_upload'
};

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- CREATE UPLOADS FOLDER IF NOT EXISTS ----------
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads', { recursive: true });
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

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Backend running', status: 'ok' });
});

// Handle resume upload
app.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, whatsapp } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

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

        res.json({
            success: true,
            message: `Thank you, ${submission.name}. Your resume has been submitted successfully.`,
            data: {
                name: submission.name,
                email: submission.email
            }
        });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Error uploading resume', details: err.message });
    }
});

// ---------- START SERVER ----------
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log('\n========================================');
        console.log('✅ Server is running!');
        console.log('========================================');
        console.log(`📍 Server running on port ${PORT}`);
        console.log('========================================\n');
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
