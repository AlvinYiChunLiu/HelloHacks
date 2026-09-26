try {
  require('dotenv').config();
} catch {
  // dotenv is optional; the app still works without a .env file
}

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initializeProfiles, registerProfileRoute } = require('./profiles');

const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

async function createBackend({ dbPath = DB_PATH } = {}) {
  const db = await new Promise((resolve, reject) => {
    const connection = new sqlite3.Database(dbPath, (error) => {
      if (error) reject(error);
      else resolve(connection);
    });
  });
  const close = () => new Promise((resolve, reject) => {
    db.close((error) => error ? reject(error) : resolve());
  });
  try {
    // Finish the additive schema change before accepting any requests.
    await initializeProfiles(db);
  } catch (error) {
    await close();
    throw error;
  }
  const app = express();

  function getTableColumns(tableName, callback) {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        return callback(err);
      }

      const columns = rows.map((row) => row.name);
      callback(null, columns);
    });
  }

  app.use(cors());
  app.use('/api', express.json({ limit: '16kb' }));
  app.use(express.json());

  registerProfileRoute(app, db);

  app.get('/', (req, res) => {
    res.send('HelloHacks backend is running');
  });

  app.get('/db-status', (req, res) => {
    db.get('SELECT 1 AS ok', (err, row) => {
      if (err) {
        return res.status(500).json({
          connected: false,
          status: 'not_connected',
          error: err.message,
        });
      }

      res.json({
        connected: true,
        database: dbPath,
        status: 'connected',
        result: row,
      });
    });
  });

  app.get('/users', (req, res) => {
    db.all('SELECT * FROM users ORDER BY id DESC', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  app.post('/users', (req, res) => {
    const payload = req.body || {};

    if (!Object.keys(payload).length) {
      return res.status(400).json({ error: 'Request body is required.' });
    }

    getTableColumns('users', (err, columns) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const allowedKeys = columns.filter((column) => column !== 'id');
      const insertFields = Object.keys(payload).filter((key) => allowedKeys.includes(key));

      if (!insertFields.length) {
        return res.status(400).json({
          error: `No valid fields found for users table. Available columns: ${allowedKeys.join(', ') || 'none'}`,
        });
      }

      const placeholders = insertFields.map(() => '?').join(', ');
      const values = insertFields.map((key) => payload[key]);

      db.run(
        `INSERT INTO users (${insertFields.join(', ')}) VALUES (${placeholders})`,
        values,
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const createdUser = { id: this.lastID, ...payload };
          res.status(201).json(createdUser);
        }
      );
    });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });
  return { app, db, close };
}

async function start() {
  const backend = await createBackend();
  const server = backend.app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  server.on('error', async (error) => {
    console.error('Server failed to start:', error.message);
    await backend.close();
    process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close(async () => {
        await backend.close();
        process.exitCode = 0;
      });
    });
  }
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Backend initialization failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { createBackend };
