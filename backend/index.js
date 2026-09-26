import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = process.env.PORT || 5000;
const db = new sqlite3.Database('my.db');
const databasePath = fileURLToPath(new URL('./database.sqlite', import.meta.url));

const database = new sqlite3.Database(databasePath, (error) => {
  if (error) {
    console.error('SQLite connection failed:', error.message);
    return;
  }

  console.log(`SQLite connection successful: ${databasePath}`);
});

app.use(cors());
app.use(express.json({ limit: '16kb' }));

try {
  const profileModule = await import('./profiles.js');
  if (typeof profileModule.registerProfileRoute === 'function') {
    profileModule.registerProfileRoute(app, db);
  }
} catch (error) {
  console.warn('Profile routes unavailable; continuing without them:', error.message);
}

app.get('/', (req, res) => {
  res.send('HelloHacks backend is running');
});

app.get('/db-status', (req, res) => {
  database.get('SELECT 1 AS ok', (error, row) => {
    if (error) {
      res.status(500).json({
        connected: false,
        database: databasePath,
        status: 'not_connected',
        error: error.message,
      });
      return;
    }

    res.json({
      connected: true,
      database: databasePath,
      status: 'connected',
      result: row,
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
