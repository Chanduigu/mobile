const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('--- Simulating Order Creation (Cash vs UPI) ---');

const driverId = 'test-driver-001';
const routeId = 'test-route-001';
const storeId = 'test-store-001';

// 1. Setup Mock Data
try {
    // Create Driver
    db.prepare("INSERT OR REPLACE INTO users (id, name, role, email, password) VALUES (?, ?, ?, ?, ?)").run(driverId, 'Test Driver', 'driver', 'driver@test.com', 'pass');
    // Create Store
    db.prepare("INSERT OR REPLACE INTO stores (id, name, address) VALUES (?, ?, ?)").run(storeId, 'Test Store', 'Test Address');
    // Create Route
    db.prepare("INSERT OR REPLACE INTO routes (id, driver_id, date, status) VALUES (?, ?, ?, ?)").run(routeId, driverId, new Date().toISOString().split('T')[0], 'active');

    console.log('Mock Data Setup Complete.');
} catch (e) {
    console.error('Setup Failed:', e.message);
    process.exit(1);
}

// 2. Insert Cash Order
const cashOrderId = uuidv4();
console.log(`\nInserting Cash Order: ${cashOrderId}`);
try {
    db.prepare(`
        INSERT INTO orders (id, store_id, driver_id, route_id, date, status, total_amount, paid_amount, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cashOrderId, storeId, driverId, routeId, new Date().toISOString(), 'delivered', 100, 100, 'cash');
    console.log('Cash Insert Success.');
} catch (e) {
    console.error('Cash Insert Failed:', e.message);
}

// 3. Insert UPI Order
const upiOrderId = uuidv4();
console.log(`\nInserting UPI Order: ${upiOrderId}`);
try {
    db.prepare(`
        INSERT INTO orders (id, store_id, driver_id, route_id, date, status, total_amount, paid_amount, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(upiOrderId, storeId, driverId, routeId, new Date().toISOString(), 'delivered', 100, 100, 'upi');
    console.log('UPI Insert Success.');
} catch (e) {
    console.error('UPI Insert Failed:', e.message);
}

// 4. Verify
console.log('\n--- Verification ---');
const cashOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(cashOrderId);
const upiOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(upiOrderId);

console.log('Cash Order route_id:', cashOrder.route_id, '(Expected:', routeId, ')');
console.log('UPI Order route_id:', upiOrder.route_id, '(Expected:', routeId, ')');

if (cashOrder.route_id === routeId && upiOrder.route_id === routeId) {
    console.log('SUCCESS: Both orders linked correctly.');
} else {
    console.log('FAILURE: One or both orders missing route link.');
}
