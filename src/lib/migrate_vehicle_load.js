
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

console.log('Running migration: Create route_vehicle_load table...');

try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS "route_vehicle_load" (
            "id" text PRIMARY KEY NOT NULL,
            "route_id" text NOT NULL,
            "item_id" text NOT NULL,
            "quantity" integer NOT NULL,
            FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON UPDATE no action ON DELETE cascade,
            FOREIGN KEY ("item_id") REFERENCES "items"("id") ON UPDATE no action ON DELETE no action
        );
    `).run();
    console.log('Created route_vehicle_load table successfully.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
