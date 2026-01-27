const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('--- Recent Orders ---');
const orders = db.prepare('SELECT id, store_id, driver_id, route_id, total_amount, date FROM orders ORDER BY date DESC LIMIT 5').all();
console.table(orders);

console.log('--- Routes ---');
const routes = db.prepare('SELECT id, driver_id, date, status FROM routes ORDER BY date DESC LIMIT 2').all();
console.table(routes);
