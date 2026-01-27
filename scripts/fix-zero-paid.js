const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('--- Fixing Zero Paid Amounts ---');

// 1. Identify orders to fix
const ordersToFix = db.prepare(`
    SELECT * FROM orders 
    WHERE status = 'delivered' 
    AND (paid_amount IS NULL OR paid_amount = 0)
    AND total_amount > 0
`).all();

console.log(`Found ${ordersToFix.length} orders to fix.`);

if (ordersToFix.length > 0) {
    // 2. Update them
    const updateStmt = db.prepare(`
        UPDATE orders 
        SET paid_amount = total_amount 
        WHERE id = ?
    `);

    let updatedCount = 0;
    const updateTransaction = db.transaction((orders) => {
        for (const order of orders) {
            updateStmt.run(order.id);
            updatedCount++;
        }
    });

    updateTransaction(ordersToFix);
    console.log(`Successfully updated ${updatedCount} orders.`);
} else {
    console.log('No orders needed fixing.');
}
