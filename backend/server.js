const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = 'demo_secret_key'; // Hardcoded for this assignment demo

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid email or password' });
        
        const token = jwt.sign({ id: row.id, name: row.name }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { id: row.id, name: row.name, email: row.email } });
    });
});

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authentication required' });
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// --- User Routes ---

// Get all rooms
app.get('/api/rooms', (req, res) => {
    db.all("SELECT * FROM rooms", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get bookings (filtered by date if provided)
app.get('/api/bookings', (req, res) => {
    const date = req.query.date;
    let sql = "SELECT * FROM bookings";
    let params = [];

    if (date) {
        sql += " WHERE date(start_time) = ? OR date(end_time) = ?";
        params = [date, date];
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create a booking (Protected Route)
app.post('/api/bookings', authenticateUser, (req, res) => {
    const { room_id, start_time, end_time } = req.body;
    const user_id = req.user.id;

    if (!room_id || !start_time || !end_time) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ error: "End time must be after start time." });
    }

    // Check for overlap
    const checkSql = `
        SELECT * FROM bookings 
        WHERE room_id = ? 
        AND (start_time < ? AND end_time > ?)
    `;
    
    db.get(checkSql, [room_id, end_time, start_time], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
             return res.status(400).json({ error: "This room is already booked during the selected time slot." });
        }

        const insertSql = `INSERT INTO bookings (room_id, user_id, start_time, end_time) VALUES (?, ?, ?, ?)`;
        db.run(insertSql, [room_id, user_id, start_time, end_time], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, room_id, user_id, start_time, end_time });
        });
    });
});

// --- Admin Routes ---

// Simple login check
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    db.get("SELECT value FROM config WHERE key = 'admin_password'", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.value === password) {
            res.json({ token: "admin_token_123" }); // Dummy token for simplicity
        } else {
            res.status(401).json({ error: "Invalid password" });
        }
    });
});

// Admin get all bookings with room details and user names
app.get('/api/admin/bookings', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin_token_123') {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const sql = `
        SELECT b.id, u.name as user_name, b.start_time, b.end_time, r.name as room_name 
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        JOIN users u ON b.user_id = u.id
        ORDER BY b.start_time DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin remove a booking
app.delete('/api/admin/bookings/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin_token_123') {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    db.run("DELETE FROM bookings WHERE id = ?", id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
