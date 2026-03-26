import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

try {
  const db = new Database('./sqlite.db');

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, username, password, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    insertUser.run(uuidv4(), 'Owner', 'owner', '123', 'owner');
    insertUser.run(uuidv4(), 'Driver 1', 'driver1', '123', 'driver');
  })();

  const users = db.prepare('SELECT * FROM users').all();
  fs.writeFileSync('./db-output.json', JSON.stringify({seeded: true, users}, null, 2));
} catch(e) {
  fs.writeFileSync('./db-output.json', JSON.stringify({error: e.message}));
}
