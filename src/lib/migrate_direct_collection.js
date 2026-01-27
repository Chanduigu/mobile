
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

console.log('Running migration: Add collected_by, collector_name, type to orders...');

try {
    // collected_by
    try {
        db.prepare("ALTER TABLE orders ADD COLUMN collected_by TEXT DEFAULT 'DRIVER'").run();
        console.log('Added collected_by');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('collected_by already exists');
        } else {
            throw e;
        }
    }

    // collector_name
    try {
        db.prepare("ALTER TABLE orders ADD COLUMN collector_name TEXT").run();
        console.log('Added collector_name');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('collector_name already exists');
        } else {
            throw e;
        }
    }

    // type
    try {
        db.prepare("ALTER TABLE orders ADD COLUMN type TEXT DEFAULT 'delivery'").run();
        console.log('Added type');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('type already exists');
        } else {
            throw e;
        }
    }

    console.log('Migration completed successfully.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
