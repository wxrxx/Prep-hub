// ============================================
// PREP HUB Backend - Main Server
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create data directory if not exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// CORS - Allow frontend to access API
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON body
app.use(express.json());

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
});

// ============================================
// Start Server
// ============================================

async function startServer() {
    try {
        // Initialize database
        const { initDatabase } = require('./config/database');
        await initDatabase();

        // Initialize schema and seed data
        const { initializeDatabase } = require('./models/init');
        await initializeDatabase();

        // Import routes
        const authRoutes = require('./routes/auth');
        const coursesRoutes = require('./routes/courses');
        const favoritesRoutes = require('./routes/favorites');
        const usersRoutes = require('./routes/users');
        const brandsRoutes = require('./routes/brands');

        // ============================================
        // API Routes
        // ============================================

        app.use('/api/auth', authRoutes);
        app.use('/api/courses', coursesRoutes);
        app.use('/api/favorites', favoritesRoutes);
        app.use('/api/users', usersRoutes);
        app.use('/api/brands', brandsRoutes);

        // ============================================
        // Health Check & Info
        // ============================================

        app.get('/api', (req, res) => {
            res.json({
                name: 'PREP HUB API',
                version: '1.0.0',
                status: 'running',
                endpoints: {
                    auth: '/api/auth',
                    courses: '/api/courses',
                    favorites: '/api/favorites',
                    users: '/api/users',
                    brands: '/api/brands'
                }
            });
        });

        app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // ============================================
        // Dashboard Stats (for Admin)
        // ============================================

        app.get('/api/stats', (req, res) => {
            try {
                const db = require('./config/database');

                const coursesCount = db.get('SELECT COUNT(*) as count FROM courses');
                const usersCount = db.get('SELECT COUNT(*) as count FROM users');
                const brandsCount = db.get('SELECT COUNT(*) as count FROM brands');
                const favoritesCount = db.get('SELECT COUNT(*) as count FROM favorites');

                res.json({
                    courses: coursesCount?.count || 0,
                    users: usersCount?.count || 0,
                    brands: brandsCount?.count || 0,
                    favorites: favoritesCount?.count || 0
                });
            } catch (error) {
                res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
            }
        });

        // ============================================
        // Error Handling
        // ============================================

        // 404 handler
        app.use((req, res) => {
            res.status(404).json({ error: 'ไม่พบ endpoint นี้' });
        });

        // Global error handler
        app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
        });

        // Start listening
        app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════');
            console.log('   📚 PREP HUB Backend API');
            console.log('═══════════════════════════════════════════');
            console.log(`   🚀 Server running on http://localhost:${PORT}`);
            console.log(`   📋 API docs: http://localhost:${PORT}/api`);
            console.log('');
            console.log('   Available endpoints:');
            console.log('   • POST /api/auth/register');
            console.log('   • POST /api/auth/login');
            console.log('   • GET  /api/courses');
            console.log('   • GET  /api/courses/:id');
            console.log('   • GET  /api/brands');
            console.log('   • GET  /api/favorites');
            console.log('');
            console.log('   Admin: admin@prephub.com / admin123');
            console.log('═══════════════════════════════════════════');
            console.log('');
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
