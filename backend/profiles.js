const { randomBytes, scrypt } = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);
// OWASP Password Storage Cheat Sheet: scrypt N=2^17, r=8, p=1.
const SCRYPT_OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const COUNTRY_CODES = new Set(
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '),
);
// Kosovo uses XK in the profile country picker.
COUNTRY_CODES.add('XK');

function run(db, sql, values = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, values, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

async function initializeProfiles(db) {
  await run(db, `CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    birthday TEXT NOT NULL,
    nationality TEXT NOT NULL,
    university TEXT NOT NULL,
    residence TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
    major TEXT NOT NULL,
    hobbies TEXT NOT NULL DEFAULT '[]',
    sports TEXT NOT NULL DEFAULT '[]',
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

function invalid(field, error) {
  return { field, error };
}

function validateProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'A profile request body is required.' };
  }

  const profile = {};
  for (const [field, label, max] of [
    ['name', 'Name', 80],
    ['username', 'Username', 24],
    ['birthday', 'Birthday', 10],
    ['nationality', 'Nationality', 2],
    ['university', 'University', 100],
    ['residence', 'Residence', 200],
    ['major', 'Major', 200],
    ['email', 'Email', 254],
  ]) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return invalid(field, `${label} is required.`);
    }
    const value = body[field].trim();
    if (value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
      return invalid(field, `${label} must contain at most ${max} characters and no control characters.`);
    }
    profile[field] = value;
  }

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(profile.username)) {
    return invalid('username', 'Use 3–24 letters, numbers, or underscores for your username.');
  }
  profile.username = profile.username.toLowerCase();
  profile.email = profile.email.toLowerCase();
  const emailParts = profile.email.split('@');
  if (emailParts.length !== 2 || emailParts[0].length > 64 ||
      !/^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*$/i.test(emailParts[0]) ||
      !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(emailParts[1])) {
    return invalid('email', 'Enter a valid email address.');
  }

  const birthdayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.birthday);
  if (!birthdayMatch) return invalid('birthday', 'Enter a valid birthday in YYYY-MM-DD format.');
  const [, year, month, day] = birthdayMatch.map(Number);
  const birthday = new Date(0);
  birthday.setUTCFullYear(year, month - 1, day);
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (year < 1900 || birthday.getUTCFullYear() !== year ||
      birthday.getUTCMonth() !== month - 1 || birthday.getUTCDate() !== day ||
      profile.birthday > todayString) {
    return invalid('birthday', 'Choose a valid birthday from 1900 through today.');
  }

  profile.nationality = profile.nationality.toUpperCase();
  if (!COUNTRY_CODES.has(profile.nationality)) {
    return invalid('nationality', 'Choose a country from the list.');
  }
  if (profile.university !== 'University of British Columbia') {
    return invalid('university', 'Choose University of British Columbia.');
  }
  if (!Number.isInteger(body.year) || body.year < 1 || body.year > 6) {
    return invalid('year', 'Choose a university year from 1 to 6.');
  }
  profile.year = body.year;

  for (const field of ['hobbies', 'sports']) {
    const values = body[field] === undefined ? [] : body[field];
    if (!Array.isArray(values) || values.length > 30 ||
        values.some((value) => typeof value !== 'string' || !value.trim() ||
          value.trim().length > 80 || /[\u0000-\u001f\u007f]/.test(value))) {
      return invalid(field, `Choose up to 30 ${field} from the list.`);
    }
    profile[field] = [...new Set(values.map((value) => value.trim()))];
  }
  // Preserve the exact password, including intentional leading/trailing spaces.
  if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
    return invalid('password', 'Use a password with 8–128 characters.');
  }
  return { profile };
}

function registerProfileRoute(app, db) {
  // Bound the memory used by expensive hashes; clients can retry if busy.
  let activeHashes = 0;
  app.post('/api/profiles', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const result = validateProfile(req.body);
    if (!result.profile) return res.status(400).json(result);
    if (activeHashes >= 2) {
      res.set('Retry-After', '2');
      return res.status(503).json({ error: 'Profile creation is busy. Please try again in a moment.' });
    }

    const { profile } = result;
    activeHashes += 1;
    let passwordHash;
    try {
      const salt = randomBytes(16).toString('hex');
      const derivedKey = await scryptAsync(req.body.password, salt, 64, SCRYPT_OPTIONS);
      passwordHash = `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${derivedKey.toString('hex')}`;
    } catch {
      return res.status(500).json({ error: 'Unable to create your profile. Please try again.' });
    } finally {
      activeHashes -= 1;
    }

    try {
      const { id } = await run(db, `INSERT INTO profiles (
        name, username, birthday, nationality, university, residence, year,
        major, hobbies, sports, email, password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        profile.name, profile.username, profile.birthday, profile.nationality,
        profile.university, profile.residence, profile.year, profile.major,
        JSON.stringify(profile.hobbies), JSON.stringify(profile.sports),
        profile.email, passwordHash,
      ]);
      return res.status(201).json({ profile: { id, ...profile } });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        const field = error.message.includes('profiles.email') ? 'email'
          : error.message.includes('profiles.username') ? 'username' : null;
        if (field) {
          return res.status(409).json({ error: `That ${field} is already in use.`, field });
        }
      }
      return res.status(500).json({ error: 'Unable to save your profile. Please try again.' });
    }
  });
}

module.exports = { initializeProfiles, registerProfileRoute };
