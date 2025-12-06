// ============================================
// PREP HUB Backend - Database Schema & Seed
// ============================================

const db = require('../config/database');

async function initializeDatabase() {
    console.log('🔧 Initializing database...');

    // Create Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            avatar TEXT DEFAULT '👤',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create Courses table
    db.exec(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            subject TEXT,
            brand TEXT,
            teacher TEXT,
            teacher_bio TEXT,
            duration TEXT,
            lessons INTEGER DEFAULT 0,
            price INTEGER,
            original_price INTEGER,
            rating REAL DEFAULT 0,
            reviews_count INTEGER DEFAULT 0,
            students_count INTEGER DEFAULT 0,
            image_url TEXT,
            highlights TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create Favorites table
    db.exec(`
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            UNIQUE(user_id, course_id)
        )
    `);

    // Create Brands table
    db.exec(`
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            logo TEXT,
            courses_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Database tables created');

    // Seed initial data if empty
    await seedData();
}

async function seedData() {
    // Check if courses exist
    const courseCount = db.get('SELECT COUNT(*) as count FROM courses');

    if (!courseCount || courseCount.count === 0) {
        console.log('🌱 Seeding initial data...');

        // Insert sample brands
        db.run(`INSERT INTO brands (name, description, logo, courses_count) VALUES (?, ?, ?, ?)`,
            ['Enconcept', 'สถาบันติวชั้นนำ มากประสบการณ์', '🎯', 150]);
        db.run(`INSERT INTO brands (name, description, logo, courses_count) VALUES (?, ?, ?, ?)`,
            ['Dek-D School', 'เรียนออนไลน์ คุณภาพสูง', '📚', 200]);
        db.run(`INSERT INTO brands (name, description, logo, courses_count) VALUES (?, ?, ?, ?)`,
            ['Chula Tutor', 'ติวโดยรุ่นพี่จุฬาฯ', '🏛️', 120]);

        // Insert sample courses
        const courses = [
            {
                title: 'คณิตศาสตร์ ม.6 เทอม 1 (Full Course)',
                description: 'คอร์สเรียนคณิตศาสตร์ ม.6 เทอม 1 แบบครบถ้วน ครอบคลุมทุกบท',
                category: 'ม.6',
                subject: 'คณิตศาสตร์',
                brand: 'Enconcept',
                teacher: 'อ.ปอนด์',
                teacher_bio: 'ครูสอนคณิตศาสตร์ชื่อดัง ประสบการณ์มากกว่า 10 ปี',
                duration: '30 ชม.',
                lessons: 45,
                price: 2990,
                original_price: 3990,
                rating: 4.9,
                reviews_count: 245,
                students_count: 1250,
                image_url: 'https://via.placeholder.com/400x200/0ea5e9/ffffff?text=Math',
                highlights: JSON.stringify(['เนื้อหาครบ 45 บทเรียน', 'แบบฝึกหัดพร้อมเฉลย'])
            },
            {
                title: 'TGAT ติวเข้ม ครบทุกเทคนิค',
                description: 'คอร์สติว TGAT แบบเข้มข้น รวมเทคนิคการทำข้อสอบทุกรูปแบบ',
                category: 'ม.6',
                subject: 'TGAT',
                brand: 'Dek-D School',
                teacher: 'อ.เบิร์ด',
                teacher_bio: 'ผู้เชี่ยวชาญด้านการสอบเข้ามหาวิทยาลัย',
                duration: '25 ชม.',
                lessons: 35,
                price: 3500,
                original_price: 4500,
                rating: 4.8,
                reviews_count: 189,
                students_count: 980,
                image_url: 'https://via.placeholder.com/400x200/0369a1/ffffff?text=TGAT',
                highlights: JSON.stringify(['เทคนิคการทำข้อสอบ', 'ข้อสอบจำลอง 10 ชุด'])
            },
            {
                title: 'ฟิสิกส์ ม.6 พื้นฐาน-ยาก',
                description: 'เรียนฟิสิกส์ ม.6 จากพื้นฐานไปจนถึงโจทย์ยากสุด',
                category: 'ม.6',
                subject: 'ฟิสิกส์',
                brand: 'Chula Tutor',
                teacher: 'อ.โอม',
                teacher_bio: 'รุ่นพี่วิศวะจุฬาฯ เกรด 4.0',
                duration: '28 ชม.',
                lessons: 40,
                price: 2790,
                original_price: 3500,
                rating: 4.9,
                reviews_count: 312,
                students_count: 1500,
                image_url: 'https://via.placeholder.com/400x200/7dd3fc/000000?text=Physics',
                highlights: JSON.stringify(['สอนละเอียดทุกบท', 'โจทย์กว่า 500 ข้อ'])
            },
            {
                title: 'ชีววิทยา สายแพทย์ ฉบับสมบูรณ์',
                description: 'คอร์สชีววิทยาสำหรับน้องที่มุ่งสู่สายแพทย์โดยเฉพาะ',
                category: 'สายแพทย์',
                subject: 'ชีววิทยา',
                brand: 'Enconcept',
                teacher: 'อ.แบงค์',
                teacher_bio: 'จบแพทย์จุฬาฯ สอบติดอันดับ 1',
                duration: '35 ชม.',
                lessons: 50,
                price: 4200,
                original_price: 5500,
                rating: 5.0,
                reviews_count: 428,
                students_count: 2000,
                image_url: 'https://via.placeholder.com/400x200/38bdf8/ffffff?text=Biology',
                highlights: JSON.stringify(['เนื้อหาเกินหลักสูตร', 'ข้อสอบสนามจริง'])
            },
            {
                title: 'เคมี ม.6 เล่ม 1-5',
                description: 'คอร์สเคมี ม.6 ครบทั้ง 5 เล่ม สอนละเอียดเข้าใจง่าย',
                category: 'ม.6',
                subject: 'เคมี',
                brand: 'Enconcept',
                teacher: 'อ.เก๋',
                teacher_bio: 'เคมีโอลิมปิก ประสบการณ์ 8 ปี',
                duration: '40 ชม.',
                lessons: 60,
                price: 3990,
                original_price: 4990,
                rating: 4.7,
                reviews_count: 156,
                students_count: 890,
                image_url: 'https://via.placeholder.com/400x200/22c55e/ffffff?text=Chemistry',
                highlights: JSON.stringify(['ครบทั้ง 5 เล่ม', 'สรุปสูตรครบ'])
            }
        ];

        courses.forEach(course => {
            db.run(`
                INSERT INTO courses (title, description, category, subject, brand, teacher, teacher_bio, duration, lessons, price, original_price, rating, reviews_count, students_count, image_url, highlights, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                course.title, course.description, course.category, course.subject,
                course.brand, course.teacher, course.teacher_bio, course.duration,
                course.lessons, course.price, course.original_price, course.rating,
                course.reviews_count, course.students_count, course.image_url,
                course.highlights, 'active'
            ]);
        });

        // Insert admin user (password: admin123)
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('admin123', 10);

        db.run(`INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)`,
            ['Admin', 'admin@prephub.com', hashedPassword, 'admin', '👑']);

        console.log('✅ Seed data inserted');
        console.log('   Admin login: admin@prephub.com / admin123');
    }
}

module.exports = { initializeDatabase };
