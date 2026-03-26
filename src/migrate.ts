import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';

async function main() {
    console.log('Migrating database...');
    // This will run migrations on the database, skipping the ones already applied
    migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migration complete.');
    process.exit(0);
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
