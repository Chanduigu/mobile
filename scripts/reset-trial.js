const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('--- Resetting Transactional Data for Fresh Trial ---');

try {
    const deleteOrderItems = db.prepare('DELETE FROM order_items');
    const deleteOrders = db.prepare('DELETE FROM orders');
    const deleteRouteStops = db.prepare('DELETE FROM route_stops');
    const deleteRoutes = db.prepare('DELETE FROM routes');

    const info1 = deleteOrderItems.run();
    console.log(`Deleted ${info1.changes} order items.`);

    const info2 = deleteOrders.run();
    console.log(`Deleted ${info2.changes} orders.`);

    const info3 = deleteRouteStops.run();
    console.log(`Deleted ${info3.changes} route stops.`);

    const info4 = deleteRoutes.run();
    console.log(`Deleted ${info4.changes} routes.`);

    console.log('Successfully reset all transactional data.');
    console.log('Users, Stores, and Items have been PRESERVED.');
} catch (error) {
    console.error('Error resetting data:', error);
}
