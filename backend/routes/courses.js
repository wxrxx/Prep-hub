// ============================================
// PREP HUB Backend - Courses Routes
// ============================================

const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses - Get all courses with filters
router.get('/', optionalAuth, (req, res) => {
    try {
        const { category, brand, subject, search, sort, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM courses WHERE status = "active"';
        const params = [];

        // Filters
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (brand) {
            query += ' AND brand = ?';
            params.push(brand);
        }
        if (subject) {
            query += ' AND subject = ?';
            params.push(subject);
        }
        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ? OR teacher LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                query += ' ORDER BY price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY price DESC';
                break;
            case 'rating':
                query += ' ORDER BY rating DESC';
                break;
            case 'popular':
                query += ' ORDER BY students_count DESC';
                break;
            case 'newest':
            default:
                query += ' ORDER BY created_at DESC';
        }

        // Pagination
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const courses = db.all(query, params);

        // Parse highlights JSON
        const parsedCourses = courses.map(course => ({
            ...course,
            highlights: course.highlights ? JSON.parse(course.highlights) : []
        }));

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM courses WHERE status = "active"';
        const countParams = [];

        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }
        if (brand) {
            countQuery += ' AND brand = ?';
            countParams.push(brand);
        }
        if (search) {
            countQuery += ' AND (title LIKE ? OR description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const countResult = db.get(countQuery, countParams);
        const total = countResult ? countResult.total : 0;

        res.json({
            courses: parsedCourses,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// GET /api/courses/categories/list - Get unique categories
router.get('/categories/list', (req, res) => {
    try {
        const categories = db.all(`
            SELECT DISTINCT category FROM courses WHERE status = 'active' AND category IS NOT NULL
        `);

        res.json({ categories: categories.map(c => c.category) });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// GET /api/courses/:id - Get single course
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const course = db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);

        if (!course) {
            return res.status(404).json({ error: 'ไม่พบคอร์สนี้' });
        }

        // Parse highlights
        course.highlights = course.highlights ? JSON.parse(course.highlights) : [];

        // Check if user has favorited (if logged in)
        let isFavorited = false;
        if (req.user) {
            const fav = db.get(`
                SELECT id FROM favorites WHERE user_id = ? AND course_id = ?
            `, [req.user.id, course.id]);
            isFavorited = !!fav;
        }

        res.json({ course, isFavorited });

    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/courses - Create course (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const {
            title, description, category, subject, brand, teacher, teacher_bio,
            duration, lessons, price, original_price, image_url, highlights
        } = req.body;

        if (!title || !price) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อคอร์สและราคา' });
        }

        const result = db.run(`
            INSERT INTO courses (title, description, category, subject, brand, teacher, teacher_bio, duration, lessons, price, original_price, image_url, highlights, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
            title, description, category, subject, brand, teacher, teacher_bio,
            duration, lessons || 0, price, original_price || price, image_url,
            highlights ? JSON.stringify(highlights) : '[]'
        ]);

        res.status(201).json({
            message: 'เพิ่มคอร์สสำเร็จ',
            courseId: result.lastInsertRowid
        });

    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/courses/:id - Update course (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const {
            title, description, category, subject, brand, teacher, teacher_bio,
            duration, lessons, price, original_price, image_url, highlights, status
        } = req.body;

        const course = db.get('SELECT id FROM courses WHERE id = ?', [req.params.id]);
        if (!course) {
            return res.status(404).json({ error: 'ไม่พบคอร์สนี้' });
        }

        // Get current course data
        const currentCourse = db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);

        db.run(`
            UPDATE courses SET 
                title = ?,
                description = ?,
                category = ?,
                subject = ?,
                brand = ?,
                teacher = ?,
                teacher_bio = ?,
                duration = ?,
                lessons = ?,
                price = ?,
                original_price = ?,
                image_url = ?,
                highlights = ?,
                status = ?
            WHERE id = ?
        `, [
            title || currentCourse.title,
            description || currentCourse.description,
            category || currentCourse.category,
            subject || currentCourse.subject,
            brand || currentCourse.brand,
            teacher || currentCourse.teacher,
            teacher_bio || currentCourse.teacher_bio,
            duration || currentCourse.duration,
            lessons || currentCourse.lessons,
            price || currentCourse.price,
            original_price || currentCourse.original_price,
            image_url || currentCourse.image_url,
            highlights ? JSON.stringify(highlights) : currentCourse.highlights,
            status || currentCourse.status,
            req.params.id
        ]);

        res.json({ message: 'อัปเดตคอร์สสำเร็จ' });

    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/courses/:id - Delete course (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const result = db.run('DELETE FROM courses WHERE id = ?', [req.params.id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'ไม่พบคอร์สนี้' });
        }

        res.json({ message: 'ลบคอร์สสำเร็จ' });

    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
