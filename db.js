const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// ---------- PATHS & CONFIGURATION ----------
// Root directory path
const ROOT = __dirname;
// Data directory for JSON fallback storage
const DATA_DIR = path.join(ROOT, 'data');
// JSON file path for storing submissions
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// MySQL database configuration from environment variables
const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306
};

// Database connection pool (null if not connected)
let db = null;

// ---------- FILE OPERATIONS ----------
/**
 * Read all submissions from JSON file
 * Used as fallback when database is not available
 * @returns {Array} Array of submission objects
 */
function readSubmissionsFromFile() {
    try {
        if (fs.existsSync(SUBMISSIONS_FILE))
            return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    } catch (e) { console.error('Read submissions file error:', e.message); }
    return [];
}

/**
 * Save a new submission to JSON file
 * Used when database is not available
 * @param {Object} submission - Submission object with name, email, whatsapp, etc.
 */
function saveSubmissionToFile(submission) {
    const list = readSubmissionsFromFile();
    // Generate auto-incrementing ID
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

// ---------- DATABASE OPERATIONS ----------
/**
 * Initialize MySQL database connection
 * Creates submissions table if not exists
 * Falls back to file storage if database config is missing
 */
async function initDatabase() {
    // Check if all required environment variables are present
    if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password || !DB_CONFIG.database) {
        console.warn('⚠️ Database env vars missing. Skipping DB connection.');
        return;
    }
    try {
        console.log('🔄 Connecting to database...');
        // Create MySQL connection pool
        db = mysql.createPool({
            host: DB_CONFIG.host,
            port: DB_CONFIG.port,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            database: DB_CONFIG.database,
            waitForConnections: true,
            connectionLimit: 10
        });
        // Create submissions table with required columns
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
        // If connection fails, use file storage
        db = null;
        console.log('📁 Using file storage (data/submissions.json) – uploads will work.');
    }
}

/**
 * Get the database connection pool
 * @returns {Object|null} Database pool or null if not connected
 */
function getDb() {
    return db;
}

// ---------- QUERY OPERATIONS ----------
/**
 * Get all submissions from database or file
 * Tries database first, falls back to JSON if needed
 * @returns {Array} Array of all submissions
 */
async function getAllSubmissions() {
    let submissions = [];
    const database = getDb();
    // Try to fetch from MySQL database
    if (database) {
        try {
            const [rows] = await database.query(
                'SELECT id, name, email, whatsapp, resume_path, submitted_at FROM submissions ORDER BY submitted_at DESC'
            );
            submissions = rows;
        } catch (e) {
            console.error('Get submissions DB error:', e.message);
            // Fallback to JSON if query fails
            submissions = readSubmissionsFromFile();
        }
    } else {
        // Use JSON file if database is not available
        submissions = readSubmissionsFromFile();
    }
    return submissions;
}

/**
 * Insert a new resume submission
 * Saves to database if available, otherwise to JSON file
 * @param {String} name - Candidate name
 * @param {String} email - Candidate email
 * @param {String} whatsapp - Candidate WhatsApp number
 * @param {String} resumePath - Path to uploaded resume file
 * @returns {Object} Submission object
 */
async function insertSubmission(name, email, whatsapp, resumePath) {
    const submission = {
        name,
        email,
        whatsapp: whatsapp || 'Not provided',
        resumePath,
        submittedAt: new Date()
    };

    console.log('New submission:', submission);

    const database = getDb();
    // Try to save to MySQL database
    if (database) {
        try {
            await database.query(
                `INSERT INTO submissions (name, email, whatsapp, resume_path, submitted_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [submission.name, submission.email, submission.whatsapp, submission.resumePath, submission.submittedAt]
            );
        } catch (e) {
            console.error('Insert submission DB error:', e.message);
            // Fallback to JSON if insert fails
            saveSubmissionToFile(submission);
        }
    } else {
        // Use JSON file if database is not available
        saveSubmissionToFile(submission);
    }
    
    return submission;
}

// ---------- UTILITY FUNCTIONS ----------
/**
 * Extract initials from a name
 * Gets first letter of each word and returns uppercase
 * Example: "Sarthak Kumar" → "SK"
 * @param {String} name - Full name
 * @returns {String} Initials (max 2 characters)
 */
function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * Converts dangerous characters to safe HTML entities
 * Example: "<script>alert('xss')</script>" → "&lt;script&gt;alert('xss')&lt;/script&gt;"
 * @param {String} text - Text to escape
 * @returns {String} Escaped text safe for HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = { 
        '&': '&amp;', 
        '<': '&lt;', 
        '>': '&gt;', 
        '"': '&quot;', 
        "'": '&#039;' 
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format date to readable local string format
 * Converts ISO date format to user-friendly format
 * Example: "2026-02-21T10:30:00Z" → "2/21/2026, 10:30:00 AM"
 * @param {String} dateStr - Date string in ISO format
 * @returns {String} Formatted date string
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
}

/**
 * Extract filename from a full file path
 * Gets only the filename, removes directory path
 * Example: "/uploads/1708518342-123456.pdf" → "1708518342-123456.pdf"
 * @param {String} path - Full file path
 * @returns {String} Filename only
 */
function getFileName(path) {
    if (!path) return '';
    return path.split('/').pop();
}

// ---------- EXPORTS ----------
module.exports = {
    initDatabase,           // Initialize database connection
    getDb,                  // Get database connection
    readSubmissionsFromFile, // Read from JSON file
    saveSubmissionToFile,   // Save to JSON file
    getAllSubmissions,      // Fetch all submissions
    insertSubmission,       // Insert new submission
    // Utility functions for data formatting and safety
    getInitials,            // Extract initials from name
    escapeHtml,             // Escape HTML characters for security
    formatDate,             // Format date to readable format
    getFileName             // Extract filename from path
};
