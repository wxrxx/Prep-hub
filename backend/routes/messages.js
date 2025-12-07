// ============================================
// PREP HUB - Messages Routes (Admin)
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET /api/messages - Get all messages (Admin only)
// ============================================
router.get('/', authenticateToken, (req, res) => {
    try {
        // Check admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
        }

        const messages = db.all(`
            SELECT id, name, email, subject, message, status, created_at 
            FROM messages 
            ORDER BY created_at DESC
        `);

        res.json({ messages: messages || [] });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ============================================
// PUT /api/messages/:id/read - Mark as read
// ============================================
router.put('/:id/read', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
        }

        const { id } = req.params;

        db.run(`UPDATE messages SET status = 'read' WHERE id = ?`, [id]);

        res.json({ success: true, message: 'อัปเดตสถานะแล้ว' });
    } catch (error) {
        console.error('Update message error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ============================================
// DELETE /api/messages/:id - Delete message
// ============================================
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
        }

        const { id } = req.params;

        db.run(`DELETE FROM messages WHERE id = ?`, [id]);

        res.json({ success: true, message: 'ลบข้อความแล้ว' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
