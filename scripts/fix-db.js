const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
console.log('Opening DB at:', dbPath);

try {
    const db = new Database(dbPath);
    console.log('Adding route_id column...');
    db.prepare('ALTER TABLE orders ADD COLUMN route_id text REFERENCES routes(id)').run();
    console.log('Success: Column added.');
} catch (e) {
    console.error('Error:', e.message);
}
