const path = require('path');
const { getDb, readSubmissionsFromFile } = require('./db');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function requireAdmin(req, res, next) {
    if (req.session && req.session.admin) return next();
    res.redirect('/admin');
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function registerAdminRoutes(app, rootPath) {
    // Admin login page
    app.get('/admin', (req, res) => {
        if (req.session && req.session.admin) return res.redirect('/admin/dashboard');
        res.sendFile(path.join(rootPath, 'template', 'admin.html'));
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
    app.get('/admin/dashboard', requireAdmin, async (req, res) => {
        let submissions = [];
        const db = getDb();
        if (db) {
            try {
                const [rows] = await db.query(
                    'SELECT id, name, email, whatsapp, resume_path, submitted_at FROM submissions ORDER BY submitted_at DESC'
                );
                submissions = rows;
            } catch (e) {
                console.error('Dashboard DB error:', e.message);
            }
        } else {
            submissions = readSubmissionsFromFile();
        }

        const resumeBase = '/uploads/';
        const rowsHtml = submissions.map(s => {
            const resumeUrl = s.resume_path ? resumeBase + path.basename(s.resume_path) : '#';
            return `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.whatsapp || '-')}</td>
            <td><a href="${resumeUrl}" target="_blank">View</a></td>
            <td>${new Date(s.submitted_at).toLocaleString()}</td>
        </tr>`;
        }).join('');

        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin – Submissions</title>
    <link rel="stylesheet" href="/style/style.css">
    <style>
        .dashboard { max-width: 1000px; margin: 0 auto; padding: 24px; }
        .dashboard h1 { margin-bottom: 20px; font-size: 22px; }
        .nav-links { margin-bottom: 20px; }
        .nav-links a { color: #5570f1; text-decoration: none; margin-right: 16px; }
        .nav-links a:hover { text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
        th { background: #5570f1; color: #fff; }
        tr:hover { background: #f8f9ff; }
        .empty { color: #666; padding: 24px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="nav-links">
            <a href="/admin/logout">Logout</a>
            <a href="/">← Home</a>
        </div>
        <h1>Resume Submissions</h1>
        ${submissions.length === 0 ? '<p class="empty">No submissions yet.</p>' : `
        <table>
            <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Resume</th><th>Date</th></tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        `}
    </div>
</body>
</html>
        `);
    });
}

module.exports = { registerAdminRoutes };
