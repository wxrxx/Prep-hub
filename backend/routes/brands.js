// ============================================
// PREP HUB Backend - Brands Routes
// ============================================

const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/brands - Get all brands
router.get('/', (req, res) => {
    try {
        const brands = db.all('SELECT * FROM brands ORDER BY name');

        res.json({ brands });

    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// GET /api/brands/:id - Get single brand with courses
router.get('/:id', (req, res) => {
    try {
        const brand = db.get('SELECT * FROM brands WHERE id = ?', [req.params.id]);

        if (!brand) {
            return res.status(404).json({ error: 'ไม่พบสถาบันนี้' });
        }

        // Get courses by this brand
        const courses = db.all(`
            SELECT * FROM courses WHERE brand = ? AND status = 'active'
            ORDER BY rating DESC
        `, [brand.name]);

        res.json({ brand, courses });

    } catch (error) {
        console.error('Get brand error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/brands - Create brand (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { name, description, logo } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อสถาบัน' });
        }

        const result = db.run(`
            INSERT INTO brands (name, description, logo) VALUES (?, ?, ?)
        `, [name, description, logo || '🏫']);

        res.status(201).json({
            message: 'เพิ่มสถาบันสำเร็จ',
            brandId: result.lastInsertRowid
        });

    } catch (error) {
        console.error('Create brand error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/brands/:id - Update brand (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { name, description, logo } = req.body;

        const currentBrand = db.get('SELECT * FROM brands WHERE id = ?', [req.params.id]);
        if (!currentBrand) {
            return res.status(404).json({ error: 'ไม่พบสถาบันนี้' });
        }

        db.run(`
            UPDATE brands SET 
                name = ?,
                description = ?,
                logo = ?
            WHERE id = ?
        `, [
            name || currentBrand.name,
            description || currentBrand.description,
            logo || currentBrand.logo,
            req.params.id
        ]);

        res.json({ message: 'อัปเดตสถาบันสำเร็จ' });

    } catch (error) {
        console.error('Update brand error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/brands/:id - Delete brand (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const result = db.run('DELETE FROM brands WHERE id = ?', [req.params.id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'ไม่พบสถาบันนี้' });
        }

        res.json({ message: 'ลบสถาบันสำเร็จ' });

    } catch (error) {
        console.error('Delete brand error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
