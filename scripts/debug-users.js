const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('--- Users ---');
const users = db.prepare('SELECT id, name, username, role FROM users').all();
console.table(users);

console.log('--- Active Routes ---');
const routes = db.prepare('SELECT id, driver_id, date, status FROM routes WHERE date = ?').all('2026-01-22');
console.table(routes);
