try {
  require('dotenv').config();
} catch (error) {
  // dotenv is optional; the app still works without a .env file
}

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('SQLite connection failed:', err.message);
  } else {
    console.log(`Connected to SQLite database: ${DB_PATH}`);
  }
});

function initializeDatabase() {
  db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'", (err, row) => {
    if (err) {
      console.error('Error checking for users table:', err.message);
      return;
    }

    if (!row) {
      console.log('The users table does not exist yet. Create it in SQLite before using this API.');
      return;
    }

    console.log('Connected to existing users table.');
  });
}

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
app.use(express.json());

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
      database: DB_PATH,
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initializeDatabase();
});
