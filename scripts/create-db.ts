import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    // Connect to default 'postgres' database to create the new database
    const connectionString = process.env.DATABASE_URL!.replace('chandan_db', 'postgres');

    console.log('Connecting to postgres database to check/create chandan_db...');
    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();

        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'chandan_db'");
        if (res.rowCount === 0) {
            console.log("Database 'chandan_db' not found. Creating...");
            await client.query('CREATE DATABASE chandan_db');
            console.log("Database 'chandan_db' created successfully.");
        } else {
            console.log("Database 'chandan_db' already exists.");
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

main();
