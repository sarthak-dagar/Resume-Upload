const express = require('express');
const path = require('path');
const os = require('os');

const { initDatabase } = require('./backend/db');
const { registerRoutes } = require('./backend/routes');

const app = express();
const PORT = process.env.PORT || 5500;

// ---------- MIDDLEWARE ----------
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- ROUTES (backend folder) ----------
registerRoutes(app, __dirname);

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
