import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const globalForDb = globalThis as unknown as { conn: Database.Database | undefined };

const dbPath = path.join(process.cwd(), 'sqlite.db');

const sqlite = globalForDb.conn ?? new Database(dbPath);

if (process.env.NODE_ENV !== 'production') globalForDb.conn = sqlite;

export const db = drizzle(sqlite, { schema });
