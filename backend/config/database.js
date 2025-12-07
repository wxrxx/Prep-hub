// ============================================
// PREP HUB Backend - Database Configuration (sql.js)
// ============================================

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

// Initialize database
async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new
    try {
        if (fs.existsSync(dbPath)) {
            const fileBuffer = fs.readFileSync(dbPath);
            db = new SQL.Database(fileBuffer);
            console.log('📦 Database loaded from file');
        } else {
            db = new SQL.Database();
            console.log('📦 New database created');
        }
    } catch (err) {
        console.log('📦 Creating new database');
        db = new SQL.Database();
    }

    return db;
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Get database instance
function getDb() {
    return db;
}

// Helper function to run query and get all results
function all(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
        stmt.bind(params);
    }

    const results = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row);
    }
    stmt.free();
    return results;
}

// Helper function to get single result
function get(sql, params = []) {
    const results = all(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Helper function to run statement (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
    return {
        lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0,
        changes: db.getRowsModified()
    };
}

// Helper function to execute raw SQL
function exec(sql) {
    db.exec(sql);
    saveDatabase();
}

module.exports = {
    initDatabase,
    getDb,
    saveDatabase,
    all,
    get,
    run,
    exec
};
