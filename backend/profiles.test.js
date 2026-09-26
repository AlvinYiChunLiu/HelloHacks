const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtemp, unlink, rmdir } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { scrypt } = require('node:crypto');
const { promisify } = require('node:util');
const { createBackend } = require('./index');

const scryptAsync = promisify(scrypt);
const input = (changes = {}) => ({
  name: '  Test Student  ',
  username: 'Test_Student',
  birthday: '2004-02-29',
  nationality: 'ca',
  university: 'University of British Columbia',
  residence: 'Totem Park',
  year: 2,
  major: 'Computer Science',
  hobbies: ['Reading', 'Music'],
  sports: ['Swimming', 'Badminton'],
  email: 'Student@Example.com',
  password: ' A test password with spaces! ',
  ...changes,
});

function query(db, sql, values = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, values, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

async function fixture(t, dbPath = ':memory:') {
  const backend = await createBackend({ dbPath });
  const server = backend.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await backend.close();
  };
  t.after(close);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const post = async (body, route = '/api/profiles') => {
    const response = await fetch(`${baseUrl}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  };
  return { ...backend, close, baseUrl, post };
}

test('registration persists a complete normalized profile across a database reopen without exposing credentials', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'interbuddies-profile-test-'));
  const databasePath = path.join(directory, 'profiles.sqlite');
  const app = await fixture(t, databasePath);
  const result = await app.post(input());
  assert.equal(result.status, 201);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  const { profile } = result.body;
  assert.deepEqual(profile, {
    id: 1,
    name: 'Test Student',
    username: 'test_student',
    birthday: '2004-02-29',
    nationality: 'CA',
    university: 'University of British Columbia',
    residence: 'Totem Park',
    major: 'Computer Science',
    email: 'student@example.com',
    year: 2,
    hobbies: ['Reading', 'Music'],
    sports: ['Swimming', 'Badminton'],
  });
  assert.equal(JSON.stringify(result.body).includes('password'), false);
  await app.close();

  const reopened = await createBackend({ dbPath: databasePath });
  try {
    const [stored] = await query(reopened.db, 'SELECT * FROM profiles WHERE id = ?', [profile.id]);
    assert.equal(stored.email, profile.email);
    assert.equal(stored.name, profile.name);
    assert.deepEqual(JSON.parse(stored.hobbies), profile.hobbies);
    assert.deepEqual(JSON.parse(stored.sports), profile.sports);
    assert.equal(Object.hasOwn(stored, 'password'), false);
    assert.equal(JSON.stringify(stored).includes(input().password), false);
    const [algorithm, cost, blockSize, parallelism, salt, hash] = stored.password_hash.split('$');
    assert.equal(algorithm, 'scrypt');
    assert.equal(Number(cost), 131072);
    assert.equal(Number(blockSize), 8);
    assert.equal(Number(parallelism), 1);
    assert.match(salt, /^[a-f0-9]{32}$/);
    assert.match(hash, /^[a-f0-9]{128}$/);
    const derived = await scryptAsync(input().password, salt, 64, {
      N: Number(cost), r: Number(blockSize), p: Number(parallelism), maxmem: 256 * 1024 * 1024,
    });
    assert.equal(derived.toString('hex'), hash, 'the exact password, including spaces, is hashed');
  } finally {
    await reopened.close();
    await unlink(databasePath);
    await rmdir(directory);
  }
});

test('duplicate normalized email and username return field-specific conflicts without another row', async (t) => {
  const app = await fixture(t);
  assert.equal((await app.post(input())).status, 201);
  const duplicateEmail = await app.post(input({ username: 'different_user', email: 'STUDENT@example.com' }));
  assert.equal(duplicateEmail.status, 409);
  assert.equal(duplicateEmail.body.field, 'email');
  const duplicateUsername = await app.post(input({ username: 'TEST_STUDENT', email: 'different@example.com' }));
  assert.equal(duplicateUsername.status, 409);
  assert.equal(duplicateUsername.body.field, 'username');
  const [count] = await query(app.db, 'SELECT COUNT(*) AS count FROM profiles');
  assert.equal(count.count, 1);
});

test('validates required fields, dates, types, lengths and choices before writing a profile', async (t) => {
  const app = await fixture(t);
  const invalidValues = [
    ['name', ''], ['name', 42], ['name', 'A'.repeat(81)], ['name', 'A\u0000B'],
    ['username', 'ab'], ['username', 'not valid'], ['username', 'a'.repeat(25)],
    ['birthday', '2003-02-29'], ['birthday', '1900-02-29'], ['birthday', '2024-04-31'],
    ['birthday', '2020-00-02'], ['birthday', '2020-12-00'], ['birthday', '9999-01-01'],
    ['birthday', '2004-2-9'], ['birthday', '1899-12-31'],
    ['nationality', 'XX'], ['nationality', 'Canada'],
    ['university', 'Another university'], ['residence', null], ['residence', 'X'.repeat(201)],
    ['major', {}], ['major', ''], ['year', '2'], ['year', 0], ['year', 7], ['year', 1.5],
    ['hobbies', 'Reading'], ['sports', [null]], ['hobbies', ['']],
    ['hobbies', Array(31).fill('Reading')], ['sports', ['X'.repeat(81)]],
    ['email', 'invalid'], ['email', 'student@'], ['email', 'a..b@example.com'],
    ['email', 'a@-example.com'], ['email', 'A'.repeat(65) + '@example.com'],
    ['password', 'short'], ['password', 'X'.repeat(129)], ['password', {}],
  ];
  for (const [field, value] of invalidValues) {
    const result = await app.post(input({ [field]: value }));
    assert.equal(result.status, 400, `${field} should reject ${JSON.stringify(value)}`);
    assert.equal(result.body.field, field);
    assert.equal(Object.hasOwn(result.body, 'profile'), false);
  }
  for (const field of ['name', 'username', 'birthday', 'nationality', 'university', 'residence', 'year', 'major', 'email', 'password']) {
    const data = input();
    delete data[field];
    const result = await app.post(data);
    assert.equal(result.status, 400, `${field} is required`);
    assert.equal(result.body.field, field);
  }
  assert.equal((await app.post([])).status, 400);
  const [count] = await query(app.db, 'SELECT COUNT(*) AS count FROM profiles');
  assert.equal(count.count, 0);
});

test('accepts skipped interests, off-campus residence, undeclared major, and uses unique salts', async (t) => {
  const app = await fixture(t);
  const first = await app.post(input({ hobbies: undefined, sports: undefined, nationality: 'XK', residence: 'Off campus / commuting', major: 'Undeclared / exploring majors' }));
  assert.equal(first.status, 201);
  assert.equal(first.body.profile.nationality, 'XK');
  assert.deepEqual(first.body.profile.hobbies, []);
  assert.deepEqual(first.body.profile.sports, []);
  const today = new Date();
  const birthday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const second = await app.post(input({ username: 'second_student', email: 'second@example.com', birthday, hobbies: ['Reading', 'Reading'] }));
  assert.equal(second.status, 201);
  assert.deepEqual(second.body.profile.hobbies, ['Reading']);
  const rows = await query(app.db, 'SELECT password_hash FROM profiles ORDER BY id');
  assert.notEqual(rows[0].password_hash.split('$')[4], rows[1].password_hash.split('$')[4]);
  assert.notEqual(rows[0].password_hash, rows[1].password_hash);
});

test('returns bounded JSON errors for malformed and oversized bodies without echoing request contents', async (t) => {
  const app = await fixture(t);
  for (const [body, status] of [
    ['{"password":"secret-parse-error",', 400],
    [JSON.stringify({ name: 'A'.repeat(17000), password: 'secret-parse-error' }), 413],
  ]) {
    const response = await fetch(`${app.baseUrl}/api/profiles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    });
    assert.equal(response.status, status);
    const result = await response.json();
    assert.equal(typeof result.error, 'string');
    assert.equal(JSON.stringify(result).includes('secret-parse-error'), false);
  }
});

test('keeps the legacy users table and routes working separately from profiles', async (t) => {
  const app = await fixture(t);
  await query(app.db, 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
  const legacy = await app.post({ name: 'Legacy fixture' }, '/users');
  assert.equal(legacy.status, 201);
  assert.equal((await app.post(input({ name: "Test'); DROP TABLE users; --" }))).status, 201);
  const response = await fetch(`${app.baseUrl}/users`);
  assert.deepEqual(await response.json(), [{ id: 1, name: 'Legacy fixture' }]);
  const [stored] = await query(app.db, 'SELECT name FROM profiles');
  assert.equal(stored.name, "Test'); DROP TABLE users; --");
});

test('fails cleanly before listening when the database cannot be opened', async () => {
  await assert.rejects(createBackend({ dbPath: path.join(__dirname, 'missing-test-directory', 'db.sqlite') }), /SQLITE_CANTOPEN/);
});
