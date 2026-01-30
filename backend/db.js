const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306
};

let db = null;

function readSubmissionsFromFile() {
    try {
        if (fs.existsSync(SUBMISSIONS_FILE))
            return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    } catch (e) { console.error('Read submissions file error:', e.message); }
    return [];
}

function saveSubmissionToFile(submission) {
    const list = readSubmissionsFromFile();
    const id = list.length ? Math.max(...list.map(s => s.id)) + 1 : 1;
    list.unshift({
        id,
        name: submission.name,
        email: submission.email,
        whatsapp: submission.whatsapp,
        resume_path: submission.resumePath,
        submitted_at: submission.submittedAt
    });
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

async function initDatabase() {
    if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password || !DB_CONFIG.database) {
        console.warn('⚠️ Database env vars missing. Skipping DB connection.');
        return;
    }
    try {
        console.log('🔄 Connecting to database...');
        db = mysql.createPool({
            host: DB_CONFIG.host,
            port: DB_CONFIG.port,
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
        db = null;
        console.log('📁 Using file storage (data/submissions.json) – uploads will work.');
    }
}

function getDb() {
    return db;
}

module.exports = {
    initDatabase,
    getDb,
    readSubmissionsFromFile,
    saveSubmissionToFile
};
