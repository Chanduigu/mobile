const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

console.log('Starting migration: split_payment_columns...');

try {
    // 1. Add columns if not exist
    try {
        db.prepare('ALTER TABLE orders ADD COLUMN cash_paid REAL DEFAULT 0').run();
        console.log('Added cash_paid column.');
    } catch (e) {
        console.log('cash_paid column likely exists.');
    }

    try {
        db.prepare('ALTER TABLE orders ADD COLUMN upi_paid REAL DEFAULT 0').run();
        console.log('Added upi_paid column.');
    } catch (e) {
        console.log('upi_paid column likely exists.');
    }

    // 2. Backfill existing data
    console.log('Backfilling existing orders...');

    // Set cash_paid = paid_amount where payment_method = 'cash'
    const cashResult = db.prepare(`
        UPDATE orders 
        SET cash_paid = paid_amount, upi_paid = 0 
        WHERE payment_method = 'cash'
    `).run();
    console.log(`Updated ${cashResult.changes} cash orders.`);

    // Set upi_paid = paid_amount where payment_method = 'upi'
    const upiResult = db.prepare(`
        UPDATE orders 
        SET upi_paid = paid_amount, cash_paid = 0 
        WHERE payment_method = 'upi'
    `).run();
    console.log(`Updated ${upiResult.changes} upi orders.`);

    console.log('Migration completed successfully.');

} catch (error) {
    console.error('Migration failed:', error);
}

db.close();
