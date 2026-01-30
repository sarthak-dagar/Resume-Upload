const path = require('path');
const { getDb, readSubmissionsFromFile, saveSubmissionToFile } = require('./db');
const { upload } = require('./upload');

function registerRoutes(app, rootPath) {
    // Home – serve template/index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(rootPath, 'template', 'index.html'));
    });

    // Resume upload
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
}

module.exports = { registerRoutes };
