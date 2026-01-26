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
    database: process.env.MYSQL_DATABASE || 'resume_upload',
    port: parseInt(process.env.MYSQL_PORT) || 3306
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
let dbConnected = false;

async function initDatabase() {
    // Check if database credentials are provided via environment variables
    // Don't try to connect if using default localhost values (means env vars not set)
    const hasEnvVars = process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD;
    const isLocalhost = DB_CONFIG.host === 'localhost' || DB_CONFIG.host === '127.0.0.1' || DB_CONFIG.host === '::1';
    
    if (!hasEnvVars || isLocalhost) {
        console.warn('⚠️  Database credentials not configured. Server will start without database.');
        console.warn('⚠️  Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD environment variables in Render dashboard.');
        console.warn('⚠️  Uploads will be saved to disk but not stored in database.');
        return;
    }

    try {
        console.log('🔄 Connecting to database...');
        console.log(`   Host: ${DB_CONFIG.host}`);
        console.log(`   Port: ${DB_CONFIG.port}`);
        console.log(`   User: ${DB_CONFIG.user}`);
        console.log(`   Database: ${DB_CONFIG.database}`);
        // For FreeMySQLHosting, database already exists - connect directly
        db = mysql.createPool({
            host: DB_CONFIG.host,
            port: DB_CONFIG.port,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            database: DB_CONFIG.database,
            waitForConnections: true,
            connectionLimit: 10,
            connectTimeout: 10000
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

        dbConnected = true;
        console.log('✅ Database initialized and connected');
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
        console.error('⚠️  Server will start without database. Uploads will be saved but not stored in database.');
        console.error('⚠️  Please check your database credentials in environment variables.');
        dbConnected = false;
        // Don't exit - allow server to start without database
    }
}

// ---------- ROUTES ----------

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Backend running', 
        status: 'ok',
        database: dbConnected ? 'connected' : 'not connected'
    });
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

        // Save to database if connected
        if (dbConnected && db) {
            try {
                await db.query(
                    `INSERT INTO submissions (name, email, whatsapp, resume_path, submitted_at)
                     VALUES (?, ?, ?, ?, ?)`,
                    [submission.name, submission.email, submission.whatsapp, submission.resumePath, submission.submittedAt]
                );
                console.log('✅ Saved to database');
            } catch (dbErr) {
                console.error('⚠️  Database save failed, but file is saved:', dbErr.message);
            }
        } else {
            console.log('⚠️  Database not connected - file saved but not stored in database');
        }

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
