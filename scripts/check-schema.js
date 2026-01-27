const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('--- Orders Table Info ---');
const info = db.prepare("PRAGMA table_info(orders)").all();
console.table(info);
