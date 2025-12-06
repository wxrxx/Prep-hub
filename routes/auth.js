// ============================================
// PREP HUB Backend - Auth Routes
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        // Check if email exists
        const existingUser = db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insert user
        const result = db.run(`
            INSERT INTO users (name, email, password, role, avatar) 
            VALUES (?, ?, ?, 'user', '👤')
        `, [name, email, hashedPassword]);

        // Generate token
        const token = jwt.sign(
            { id: result.lastInsertRowid, email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'สมัครสมาชิกสำเร็จ',
            token,
            user: {
                id: result.lastInsertRowid,
                name,
                email,
                role: 'user',
                avatar: '👤'
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        // Find user
        const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Check password
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = db.get(`
            SELECT id, name, email, role, avatar, created_at 
            FROM users WHERE id = ?
        `, [req.user.id]);

        if (!user) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }

        res.json({ user });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/auth/profile - Update profile
router.put('/profile', authenticateToken, (req, res) => {
    try {
        const { name, avatar } = req.body;

        db.run(`UPDATE users SET name = ?, avatar = ? WHERE id = ?`,
            [name || req.user.name, avatar || '👤', req.user.id]);

        res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
