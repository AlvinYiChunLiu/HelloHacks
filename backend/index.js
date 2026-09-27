import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'node:url';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
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

  try {
    await ensureUsersTable();
    await ensureEventsTable();
  } catch (databaseError) {
    console.error('Database setup failed:', databaseError.message);
    process.exit(1);
  }
});

function ensureUsersTable() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        nationality TEXT NOT NULL,
        university TEXT NOT NULL,
        residence TEXT NOT NULL,
        year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
        major TEXT NOT NULL,
        hobbies TEXT NOT NULL DEFAULT '[]',
        sports TEXT NOT NULL DEFAULT '[]',
        languages TEXT NOT NULL DEFAULT '[]',
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        social_media TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`, (createError) => {
        if (createError) {
          reject(createError);
          return;
        }

        db.all('PRAGMA table_info(users)', (pragmaError, columns) => {
          if (pragmaError) {
            reject(pragmaError);
            return;
          }

          const available = new Set((columns || []).map((column) => column.name));
          const missingColumns = [];

          if (!available.has('languages')) {
            missingColumns.push("ALTER TABLE users ADD COLUMN languages TEXT NOT NULL DEFAULT '[]'");
          }
          if (!available.has('social_media')) {
            missingColumns.push("ALTER TABLE users ADD COLUMN social_media TEXT NOT NULL DEFAULT '[]'");
          }

          const finishSetup = () => {
            db.run("UPDATE users SET hobbies = '[]' WHERE hobbies IS NULL OR hobbies = ''", (hobbiesError) => {
              if (hobbiesError) {
                reject(hobbiesError);
                return;
              }

              db.run("UPDATE users SET sports = '[]' WHERE sports IS NULL OR sports = ''", (sportsError) => {
                if (sportsError) {
                  reject(sportsError);
                  return;
                }

                db.run("UPDATE users SET languages = '[]' WHERE languages IS NULL OR languages = ''", (languageError) => {
                  if (languageError) {
                    reject(languageError);
                    return;
                  }

                  db.run("UPDATE users SET social_media = '[]' WHERE social_media IS NULL OR social_media = ''", (socialError) => {
                    if (socialError) {
                      reject(socialError);
                      return;
                    }

                    resolve();
                  });
                });
              });
            });
          };

          if (missingColumns.length === 0) {
            finishSetup();
            return;
          }

          const statement = missingColumns.shift();
          db.run(statement, (alterError) => {
            if (alterError) {
              reject(alterError);
              return;
            }

            if (missingColumns.length === 0) {
              finishSetup();
              return;
            }

            const nextStatement = missingColumns.shift();
            db.run(nextStatement, (nextAlterError) => {
              if (nextAlterError) {
                reject(nextAlterError);
                return;
              }
              finishSetup();
            });
          });
        });
      });
    });
  });
}

function ensureEventsTable() {
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(events)', (error, columns) => {
      if (error) return reject(error);
      if (!columns?.length) return reject(new Error('The events table does not exist.'));
      const available = new Set(columns.map((column) => column.name));
      const migrations = [
        ['ends_at', "ALTER TABLE events ADD COLUMN ends_at TEXT NOT NULL DEFAULT ''"],
        ['latitude', 'ALTER TABLE events ADD COLUMN latitude REAL'],
        ['longitude', 'ALTER TABLE events ADD COLUMN longitude REAL'],
        ['display_location', "ALTER TABLE events ADD COLUMN display_location TEXT NOT NULL DEFAULT ''"],
        ['author_username', "ALTER TABLE events ADD COLUMN author_username TEXT NOT NULL DEFAULT ''"],
        ['author_nationality', "ALTER TABLE events ADD COLUMN author_nationality TEXT NOT NULL DEFAULT ''"],
      ].filter(([column]) => !available.has(column));
      const addNext = () => {
        const migration = migrations.shift();
        if (!migration) return resolve();
        db.run(migration[1], (migrationError) => migrationError ? reject(migrationError) : addNext());
      };
      addNext();
    });
  });
}

app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.get('/', (req, res) => {
  res.send('HelloHacks backend is running');
});

function readJsonArray(value) {
  if (Array.isArray(value)) return value
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
      languages: readJsonArray(row.languages ?? '[]'),
      socialMedia: readJsonArray(row.social_media ?? '[]'),
    }));

    return res.json(normalized);
  });
});

app.get('/api/events', (req, res) => {
  db.all(`SELECT rowid AS id, event_name, host_name, location, date_time, description,
    display_location, latitude, longitude, ends_at, author_username, author_nationality
    FROM events ORDER BY date_time ASC`, (error, rows) => {
    if (error) return res.status(500).json({ error: 'Unable to load events.' });
    return res.json((rows || []).map((row) => ({
      id: String(row.id),
      title: row.event_name,
      description: row.description,
      location: row.location,
      displayLocation: row.display_location || `${row.location}, UBC`,
      latitude: row.latitude,
      longitude: row.longitude,
      startsAt: row.date_time,
      endsAt: row.ends_at || new Date(Date.parse(row.date_time) + 60 * 60 * 1000).toISOString(),
      author: { name: row.host_name || 'UBC student', username: row.author_username, nationality: row.author_nationality },
    })));
  });
});

app.post('/api/events', (req, res) => {
  const event = req.body || {};
  const requiredStrings = ['id', 'title', 'location', 'startsAt', 'endsAt'];
  if (requiredStrings.some((key) => typeof event[key] !== 'string' || !event[key].trim())) {
    return res.status(400).json({ error: 'Event title, location, and dates are required.' });
  }
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);
  const startsAt = Date.parse(event.startsAt);
  const endsAt = Date.parse(event.endsAt);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
    return res.status(400).json({ error: 'Choose valid coordinates and an end time after the start.' });
  }
  const title = event.title.trim().slice(0, 100);
  const description = typeof event.description === 'string' ? event.description.trim().slice(0, 500) : '';
  const location = event.location.trim().slice(0, 240);
  const displayLocation = typeof event.displayLocation === 'string' ? event.displayLocation.trim().slice(0, 300) : location;
  const authorName = typeof event.author?.name === 'string' ? event.author.name.trim().slice(0, 80) : 'UBC student';
  const authorUsername = typeof event.author?.username === 'string' ? event.author.username.trim().toLowerCase().slice(0, 24) : '';
  const authorNationality = typeof event.author?.nationality === 'string' ? event.author.nationality.trim().toUpperCase().slice(0, 2) : '';
  db.run(`INSERT INTO events (event_name, host_name, location, date_time, description, display_location, latitude, longitude, ends_at, author_username, author_nationality)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, authorName || 'UBC student', location, event.startsAt, description, displayLocation, latitude, longitude, event.endsAt, authorUsername, authorNationality], function (error) {
    if (error) {
      console.error('Event insert failed:', error.message);
      return res.status(500).json({ error: 'Unable to save this event.' });
    }
    return res.status(201).json({ event: { id: String(this.lastID), title, description, location, displayLocation, latitude, longitude, startsAt: event.startsAt, endsAt: event.endsAt, author: { name: authorName || 'UBC student', username: authorUsername, nationality: authorNationality } } });
  });
});

app.delete('/api/events/:id', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  if (!username) return res.status(400).json({ error: 'Event author is required.' });
  db.run('DELETE FROM events WHERE rowid = ? AND author_username = ?', [Number(req.params.id), username], function (error) {
    if (error) return res.status(500).json({ error: 'Unable to remove this event.' });
    if (!this.changes) return res.status(404).json({ error: 'Event not found or not owned by this account.' });
    return res.json({ deleted: true });
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const trimmedUsername = username.trim().toLowerCase();
  if (!trimmedUsername || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [trimmedUsername], async (error, row) => {
    if (error) {
      return res.status(500).json({ error: 'Unable to sign in.' });
    }

    if (!row) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const [scheme, N, r, p, salt, hashHex] = String(row.password_hash).split('$');
    if (scheme !== 'scrypt') {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    try {
      const derivedKey = await scryptAsync(password, salt, 64, { N: Number(N), r: Number(r), p: Number(p), maxmem: 256 * 1024 * 1024 });
      const expectedHash = derivedKey.toString('hex');

      if (expectedHash !== hashHex) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      return res.json({
        user: {
          id: row.id,
          name: row.name,
          username: row.username,
          nationality: row.nationality,
          university: row.university,
          residence: row.residence,
          year: row.year,
          major: row.major,
          hobbies: readJsonArray(row.hobbies),
          sports: readJsonArray(row.sports),
          languages: readJsonArray(row.languages ?? '[]'),
          socialMedia: readJsonArray(row.social_media ?? '[]'),
          favoriteColor: '#2457d6',
          gender: 'prefer-not-to',
        },
      });
    } catch {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
  });
});

app.post('/api/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body || {};
  if (typeof username !== 'string' || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Username and both passwords are required.' });
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ error: 'Use a new password with 8 to 128 characters.' });
  }

  const normalizedUsername = username.trim().toLowerCase();
  db.get('SELECT id, password_hash FROM users WHERE username = ?', [normalizedUsername], async (error, row) => {
    if (error) return res.status(500).json({ error: 'Unable to change your password.' });
    if (!row) return res.status(404).json({ error: 'Account not found.' });

    const [scheme, N, r, p, salt, hashHex] = String(row.password_hash).split('$');
    if (scheme !== 'scrypt' || !salt || !hashHex) {
      return res.status(500).json({ error: 'This account password cannot be updated.' });
    }

    try {
      const currentHash = await scryptAsync(currentPassword, salt, 64, { N: Number(N), r: Number(r), p: Number(p), maxmem: 256 * 1024 * 1024 });
      const expectedHash = Buffer.from(hashHex, 'hex');
      if (currentHash.length !== expectedHash.length || !timingSafeEqual(currentHash, expectedHash)) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      const nextSalt = randomBytes(16).toString('hex');
      const nextHash = await scryptAsync(newPassword, nextSalt, 64, SCRYPT_OPTIONS);
      const passwordHash = `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${nextSalt}$${nextHash.toString('hex')}`;
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, row.id], function (updateError) {
        if (updateError) return res.status(500).json({ error: 'Unable to change your password.' });
        if (this.changes !== 1) return res.status(404).json({ error: 'Account not found.' });
        return res.json({ message: 'Password changed successfully.' });
      });
    } catch {
      return res.status(500).json({ error: 'Unable to change your password.' });
    }
  });
});

app.post('/api/users', async (req, res) => {
  const body = req.body || {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ field: 'body', error: 'A valid user body is required.' });
  }

  const requiredFields = ['name', 'username', 'nationality', 'university', 'residence', 'year', 'major', 'email', 'password'];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || (typeof body[field] === 'string' && !body[field].trim())) {
      return res.status(400).json({ field, error: `${field} is required.` });
    }
  }

  const name = String(body.name).trim();
  const username = String(body.username).trim().toLowerCase();
  const email = String(body.email).trim().toLowerCase();
  const nationality = String(body.nationality).trim().toUpperCase();
  const university = String(body.university).trim();
  const residence = String(body.residence).trim();
  const major = String(body.major).trim();
  const year = Number(body.year);
  const hobbies = Array.isArray(body.hobbies) ? body.hobbies : [];
  const sports = Array.isArray(body.sports) ? body.sports : [];
  const languages = Array.isArray(body.languages) ? body.languages : [];
  const socialMedia = Array.isArray(body.socialMedia) ? body.socialMedia : [];
  const password = String(body.password);

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return res.status(400).json({ field: 'username', error: 'Use 3–24 letters, numbers, or underscores.' });
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

  let passwordHash;
  try {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scryptAsync(password, salt, 64, SCRYPT_OPTIONS);
    passwordHash = `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${derivedKey.toString('hex')}`;
  } catch (error) {
    console.error('Password hashing failed:', error.message);
    return res.status(500).json({ error: 'Unable to secure your password. Please try again.' });
  }

  const insertSql = `INSERT INTO users (
    name, username, nationality, university, residence, year, major, hobbies, sports, languages, email, password_hash, social_media
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    name,
    username,
    nationality,
    university,
    residence,
    year,
    major,
    JSON.stringify(hobbies),
    JSON.stringify(sports),
    JSON.stringify(languages),
    email,
    passwordHash,
    JSON.stringify(socialMedia),
  ];

  db.run(insertSql, values, function (error) {
    if (error) {
      if (String(error.message).includes('UNIQUE constraint failed: users.username')) {
        return res.status(409).json({ field: 'username', error: 'That username is already in use.' });
      }

      if (String(error.message).includes('UNIQUE constraint failed: users.email')) {
        return res.status(409).json({ field: 'email', error: 'That email is already in use.' });
      }

      console.error('Profile insert failed:', error.message);
      return res.status(500).json({ error: 'Unable to save your profile.' });
    }

    return res.status(201).json({
      profile: {
        id: this.lastID,
        name,
        username,
        nationality,
        university,
        residence,
        year,
        major,
        hobbies,
        sports,
        languages,
        socialMedia,
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
