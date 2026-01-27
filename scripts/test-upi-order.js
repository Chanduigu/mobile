const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('--- Simulating UPI Order Creation ---');

// 1. Mock Data
const driverId = 'mock-driver-id';
const routeId = 'mock-route-id';
const storeId = 'mock-store-id';
const orderId = uuidv4();
const paymentMethod = 'upi';

// 2. Insert mock Store and Route if needed (omitted for brevity, assume foreign keys might be checked if strict)
// Actually, strict FKs might fail if these don't exist.
// Let's use existing IDs if possible, or creating dummy ones.

// Create dummy user (driver)
try {
    db.prepare("INSERT OR IGNORE INTO users (id, name, role, email) VALUES (?, ?, ?, ?)").run(driverId, 'Mock Driver', 'driver', 'mock@test.com');
    // Create dummy route
    db.prepare("INSERT OR IGNORE INTO routes (id, driver_id, date, status) VALUES (?, ?, ?, ?)").run(routeId, driverId, new Date().toISOString(), 'active');
    // Create dummy store
    db.prepare("INSERT OR IGNORE INTO stores (id, name, address) VALUES (?, ?, ?)").run(storeId, 'Mock Store', '123 Mock St');
} catch (e) {
    console.log('Setup warning (might already exist):', e.message);
}

// 3. Insert Order with UPI
console.log(`Inserting Order: ID=${orderId}, Route=${routeId}, Start=${paymentMethod}`);

try {
    const stmt = db.prepare(`
        INSERT INTO orders (id, store_id, driver_id, route_id, date, status, total_amount, paid_amount, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        orderId,
        storeId,
        driverId,
        routeId,
        new Date().toISOString(),
        'delivered',
        100, // total
        100, // paid
        paymentMethod
    );

    console.log('Insert Success.');
} catch (e) {
    console.error('Insert Failed:', e.message);
}

// 4. Verify Insertion
const insertedOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
console.log('Inserted Order Record:', insertedOrder);

if (insertedOrder.route_id === routeId && insertedOrder.payment_method === 'upi') {
    console.log('SUCCESS: Route ID and Payment Method saved correctly.');
} else {
    console.log('FAILURE: Data mismatch.');
}
