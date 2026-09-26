import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'node:url';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SCRYPT_OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

const app = express();
const PORT = process.env.PORT || 5000;
const databasePath = fileURLToPath(new URL('./my.db', import.meta.url));

const db = new sqlite3.Database(databasePath, async (error) => {
  if (error) {
    console.error('SQLite connection failed:', error.message);
    process.exit(1);
  }

  console.log(`SQLite connected: ${databasePath}`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    birthday TEXT NOT NULL,
    nationality TEXT NOT NULL,
    university TEXT NOT NULL,
    residence TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
    major TEXT NOT NULL,
    hobbies TEXT NOT NULL DEFAULT '[]',
    sports TEXT NOT NULL DEFAULT '[]',
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.get('/', (req, res) => {
  res.send('HelloHacks backend is running');
});

function readJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];

  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY id ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const normalized = (rows || []).map((row) => ({
      ...row,
      hobbies: readJsonArray(row.hobbies),
      sports: readJsonArray(row.sports),
    }));

    return res.json(normalized);
  });
});

app.post('/api/users', async (req, res) => {
  const body = req.body || {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ field: 'body', error: 'A valid user body is required.' });
  }

  const requiredFields = ['name', 'username', 'birthday', 'nationality', 'university', 'residence', 'year', 'major', 'email', 'password'];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || (typeof body[field] === 'string' && !body[field].trim())) {
      return res.status(400).json({ field, error: `${field} is required.` });
    }
  }

  const name = String(body.name).trim();
  const username = String(body.username).trim().toLowerCase();
  const email = String(body.email).trim().toLowerCase();
  const birthday = String(body.birthday).trim();
  const nationality = String(body.nationality).trim().toUpperCase();
  const university = String(body.university).trim();
  const residence = String(body.residence).trim();
  const major = String(body.major).trim();
  const year = Number(body.year);
  const hobbies = Array.isArray(body.hobbies) ? body.hobbies : [];
  const sports = Array.isArray(body.sports) ? body.sports : [];
  const password = String(body.password);

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return res.status(400).json({ field: 'username', error: 'Use 3–24 letters, numbers, or underscores.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return res.status(400).json({ field: 'birthday', error: 'Use a valid birthday in YYYY-MM-DD format.' });
  }

  if (String(year) === 'NaN' || !Number.isInteger(year) || year < 1 || year > 6) {
    return res.status(400).json({ field: 'year', error: 'Year must be between 1 and 6.' });
  }

  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ field: 'password', error: 'Use a password with 8–128 characters.' });
  }

  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*$/i;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ field: 'email', error: 'Enter a valid email address.' });
  }

  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64, SCRYPT_OPTIONS);
  const passwordHash = `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${derivedKey.toString('hex')}`;

  const insertSql = `INSERT INTO users (
    name, username, birthday, nationality, university, residence, year, major, hobbies, sports, email, password_hash
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    name,
    username,
    birthday,
    nationality,
    university,
    residence,
    year,
    major,
    JSON.stringify(hobbies),
    JSON.stringify(sports),
    email,
    passwordHash,
  ];

  db.run(insertSql, values, function (error) {
    if (error) {
      if (String(error.message).includes('UNIQUE constraint failed: users.username')) {
        return res.status(409).json({ field: 'username', error: 'That username is already in use.' });
      }

      if (String(error.message).includes('UNIQUE constraint failed: users.email')) {
        return res.status(409).json({ field: 'email', error: 'That email is already in use.' });
      }

      return res.status(500).json({ error: 'Unable to save your profile.' });
    }

    return res.status(201).json({
      profile: {
        id: this.lastID,
        name,
        username,
        birthday,
        nationality,
        university,
        residence,
        year,
        major,
        hobbies,
        sports,
        email,
      },
    });
  });
});

app.post('/api/profiles', async (req, res) => {
  return app._router ? app._router.handle(req, res) : res.status(501).json({ error: 'Route not available.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
