// ============================================
// PREP HUB Backend - Favorites Routes
// ============================================

const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/favorites - Get user's favorites
router.get('/', authenticateToken, (req, res) => {
    try {
        const favorites = db.all(`
            SELECT c.*, f.created_at as favorited_at
            FROM favorites f
            JOIN courses c ON f.course_id = c.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `, [req.user.id]);

        // Parse highlights
        const parsedFavorites = favorites.map(course => ({
            ...course,
            highlights: course.highlights ? JSON.parse(course.highlights) : []
        }));

        res.json({ favorites: parsedFavorites, count: favorites.length });

    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/favorites/:courseId - Add to favorites
router.post('/:courseId', authenticateToken, (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);

        // Check if course exists
        const course = db.get('SELECT id, title FROM courses WHERE id = ?', [courseId]);
        if (!course) {
            return res.status(404).json({ error: 'ไม่พบคอร์สนี้' });
        }

        // Check if already favorited
        const existing = db.get(`
            SELECT id FROM favorites WHERE user_id = ? AND course_id = ?
        `, [req.user.id, courseId]);

        if (existing) {
            return res.status(400).json({ error: 'คอร์สนี้อยู่ในรายการโปรดแล้ว' });
        }

        // Add to favorites
        db.run(`INSERT INTO favorites (user_id, course_id) VALUES (?, ?)`,
            [req.user.id, courseId]);

        res.status(201).json({
            message: 'เพิ่มในรายการโปรดแล้ว',
            course: course.title
        });

    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/favorites/:courseId - Remove from favorites
router.delete('/:courseId', authenticateToken, (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);

        const result = db.run(`
            DELETE FROM favorites WHERE user_id = ? AND course_id = ?
        `, [req.user.id, courseId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'ไม่พบคอร์สในรายการโปรด' });
        }

        res.json({ message: 'ลบออกจากรายการโปรดแล้ว' });

    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// GET /api/favorites/check/:courseId - Check if course is favorited
router.get('/check/:courseId', authenticateToken, (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);

        const favorite = db.get(`
            SELECT id FROM favorites WHERE user_id = ? AND course_id = ?
        `, [req.user.id, courseId]);

        res.json({ isFavorited: !!favorite });

    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
