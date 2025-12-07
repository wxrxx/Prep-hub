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
            phone TEXT,
            role TEXT DEFAULT 'user',
            avatar TEXT DEFAULT '👤',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Migration: Add phone column if it doesn't exist
    try {
        const tableInfo = db.prepare('PRAGMA table_info(users)').all();
        const hasPhone = tableInfo.some(col => col.name === 'phone');
        if (!hasPhone) {
            console.log('🔄 Migrating: Adding phone column to users table...');
            db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
        }
    } catch (error) {
        console.error('Migration error:', error);
    }

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

    // Create Messages table
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'unread',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Database tables created');

    // Create admin user if not exists
    await createAdminUser();
}

async function createAdminUser() {
    // Check if admin exists
    const adminExists = db.get("SELECT id FROM users WHERE email = 'admin@prephub.com'");

    if (!adminExists) {
        console.log('👑 Creating admin user...');

        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('admin123', 10);

        db.run(`INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)`,
            ['Admin', 'admin@prephub.com', hashedPassword, 'admin', '👑']);

        console.log('✅ Admin user created');
        console.log('   Login: admin@prephub.com / admin123');
    }
}

module.exports = { initializeDatabase };

