const express = require('express');
const router = express.Router();
const db = require('../config/database');

// POST /api/contact - Send a message
router.post('/', (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // Insert into database
        const stmt = db.prepare(`
            INSERT INTO messages (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(name, email, subject, message);

        res.status(201).json({
            message: 'ส่งข้อความเรียบร้อยแล้ว',
            id: result.lastInsertRowid
        });

    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    }
});

module.exports = router;
