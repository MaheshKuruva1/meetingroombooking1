const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run('PRAGMA foreign_keys = ON');

        // Create Users Table (for the 2 hardcoded users)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`, (err) => {
            if (!err) {
                db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
                    if (row && row.count === 0) {
                        const insert = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
                        // Hardcode 2 users: user1@demo.com/pass123 and user2@demo.com/pass456
                        db.run(insert, ['Alice Engineer', 'alice@demo.com', 'pass123']);
                        db.run(insert, ['Bob Manager', 'bob@demo.com', 'pass456']);
                    }
                });
            }
        });

        // Create Rooms Table
        db.run(`CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            amenities TEXT,
            image_url TEXT
        )`, (err) => {
            if (!err) {
                db.get("SELECT COUNT(*) as count FROM rooms", (err, row) => {
                    if (row && row.count === 0) {
                        const insert = `INSERT INTO rooms (name, capacity, amenities, image_url) VALUES (?, ?, ?, ?)`;
                        db.run(insert, ['Boardroom Alpha', 12, 'Projector, Whiteboard, Video Conferencing', 'var(--accent)']);
                        db.run(insert, ['Ideation Lab', 6, 'Whiteboard Walls, Casual Seating', 'var(--secondary)']);
                        db.run(insert, ['Focus Room 1', 2, 'Monitor, Ergonomic Chair', 'var(--text-muted)']);
                        db.run(insert, ['Focus Room 2', 2, 'Monitor, Ergonomic Chair', 'var(--text-muted)']);
                        db.run(insert, ['Executive Suite', 8, 'Premium Seating, 4K Display, Minibar', '#ffd700']);
                    }
                });
            }
        });

        // Drop the old bookings table and recreate it with user_id instead of user_name
        db.run(`DROP TABLE IF EXISTS bookings`, (err) => {
            db.run(`CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER,
                user_id INTEGER NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                FOREIGN KEY (room_id) REFERENCES rooms(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`);
        });
        
        // Simple admin config table
        db.run(`CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )`, (err) => {
             if (!err) {
                 db.get("SELECT * FROM config WHERE key = 'admin_password'", (err, row) => {
                    if (!row) {
                        db.run("INSERT INTO config (key, value) VALUES ('admin_password', 'admin123')");
                    }
                 });
             }
        });
    }
});

module.exports = db;
