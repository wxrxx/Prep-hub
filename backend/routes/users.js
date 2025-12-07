// ============================================
// PREP HUB Backend - Users Routes (Admin)
// ============================================

const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { search, role, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT id, name, email, role, avatar, created_at FROM users WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const users = db.all(query, params);

        // Get favorites count for each user
        const usersWithStats = users.map(user => {
            const favCount = db.get(`
                SELECT COUNT(*) as count FROM favorites WHERE user_id = ?
            `, [user.id]);
            return { ...user, favorites_count: favCount ? favCount.count : 0 };
        });

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const countParams = [];
        if (search) {
            countQuery += ' AND (name LIKE ? OR email LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        if (role) {
            countQuery += ' AND role = ?';
            countParams.push(role);
        }
        const countResult = db.get(countQuery, countParams);
        const total = countResult ? countResult.total : 0;

        res.json({ users: usersWithStats, total });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// GET /api/users/stats/overview - Get user statistics
router.get('/stats/overview', authenticateToken, requireAdmin, (req, res) => {
    try {
        const totalUsers = db.get('SELECT COUNT(*) as count FROM users');
        const adminUsers = db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");

        // New users this month
        const newUsers = db.get(`
            SELECT COUNT(*) as count FROM users 
            WHERE created_at >= date('now', 'start of month')
        `);

        res.json({
            total: totalUsers ? totalUsers.count : 0,
            admins: adminUsers ? adminUsers.count : 0,
            regularUsers: (totalUsers?.count || 0) - (adminUsers?.count || 0),
            newThisMonth: newUsers ? newUsers.count : 0
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// GET /api/users/:id - Get single user (Admin only)
router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const user = db.get(`
            SELECT id, name, email, role, avatar, created_at 
            FROM users WHERE id = ?
        `, [req.params.id]);

        if (!user) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }

        // Get user's favorites
        const favorites = db.all(`
            SELECT c.id, c.title, c.brand, c.price
            FROM favorites f
            JOIN courses c ON f.course_id = c.id
            WHERE f.user_id = ?
        `, [user.id]);

        res.json({ user, favorites });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/users/:id/role - Update user role (Admin only)
router.put('/:id/role', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Role ไม่ถูกต้อง' });
        }

        // Can't change own role
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน role ตัวเองได้' });
        }

        db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);

        res.json({ message: 'อัปเดต role สำเร็จ' });

    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        // Can't delete self
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' });
        }

        // Delete user's favorites first
        db.run('DELETE FROM favorites WHERE user_id = ?', [req.params.id]);

        // Delete user
        const result = db.run('DELETE FROM users WHERE id = ?', [req.params.id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }

        res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
