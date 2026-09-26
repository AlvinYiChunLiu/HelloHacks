import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { env, execPath } from 'node:process'
import test from 'node:test'
import {
  emptyProfile,
  getAge,
  registrationPayload,
  stepForField,
  todayDate,
  UNIVERSITY,
  validateStep,
} from './profile.js'

const today = new Date(2026, 8, 26, 12)
const options = {
  countries: [{ code: 'CA', name: 'Canada' }, { code: 'JP', name: 'Japan' }],
  residences: [{ value: 'Totem Park' }, { value: 'Off campus / commuting' }],
  majors: [{ value: 'Computer Science' }, { value: 'Undeclared / exploring majors' }],
}

function validProfile(overrides = {}) {
  return {
    ...emptyProfile(),
    name: 'Alex Taylor',
    username: 'alex_taylor',
    birthday: '2005-09-26',
    nationality: 'CA',
    residence: 'Totem Park',
    year: '2',
    major: 'Computer Science',
    email: 'alex@example.com',
    password: 'Good password 123!',
    ...overrides,
  }
}

function errorsFor(step, overrides) {
  return validateStep(step, validProfile(overrides), options, today)
}

test('age changes on the birthday, with the preceding and following days handled correctly', () => {
  assert.equal(getAge('2005-09-26', new Date(2026, 8, 25)), 20)
  assert.equal(getAge('2005-09-26', new Date(2026, 8, 26)), 21)
  assert.equal(getAge('2005-09-26', new Date(2026, 8, 27)), 21)
  assert.equal(getAge('2005-12-31', new Date(2026, 0, 1)), 20)
  assert.equal(getAge('2005-01-01', new Date(2026, 11, 31)), 21)
})

test('birthday validation rejects malformed, impossible, future, and unsupported dates', () => {
  for (const birthday of ['', '2005-9-26', '26/09/2005', 'invalid', '2005-00-26', '2005-13-01', '2005-04-31', '2005-09-00', '1900-02-29', '1899-12-31', '2026-09-27', '2030-01-01']) {
    assert.equal(getAge(birthday, today), null, birthday)
  }
  assert.equal(getAge('1900-01-01', today), 126)
  assert.equal(getAge('2026-09-26', today), 0)
})

test('leap birthdays stay valid and increment after February in non-leap years', () => {
  assert.equal(getAge('2004-02-29', new Date(2024, 1, 28)), 19)
  assert.equal(getAge('2004-02-29', new Date(2024, 1, 29)), 20)
  assert.equal(getAge('2004-02-29', new Date(2025, 1, 28)), 20)
  assert.equal(getAge('2004-02-29', new Date(2025, 2, 1)), 21)
  assert.equal(getAge('2000-02-29', today), 26)
  assert.equal(getAge('2005-02-29', today), null)
})

test('todayDate formats local calendar values with zero padding', () => {
  assert.equal(todayDate(new Date(2026, 0, 3)), '2026-01-03')
  assert.equal(todayDate(new Date(2026, 11, 31)), '2026-12-31')
})

test('age and the maximum birthday use Vancouver local date near UTC midnight', () => {
  const moduleUrl = new URL('./profile.js', import.meta.url).href
  const script = `
    import { getAge, todayDate } from ${JSON.stringify(moduleUrl)};
    const now = new Date('2026-09-27T06:30:00Z');
    console.log(JSON.stringify({ date: todayDate(now), age: getAge('2000-09-27', now), future: getAge('2026-09-27', now) }));
  `
  const result = spawnSync(execPath, ['--input-type=module', '--eval', script], {
    env: { ...env, TZ: 'America/Vancouver' },
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { date: '2026-09-26', age: 25, future: null })
})

test('new profiles have UBC selected and independent empty interest arrays', () => {
  const first = emptyProfile()
  const second = emptyProfile()
  assert.equal(first.university, UNIVERSITY)
  assert.deepEqual(first.hobbies, [])
  assert.deepEqual(first.sports, [])
  first.hobbies.push('Reading')
  first.sports.push('Swimming')
  assert.deepEqual(second.hobbies, [])
  assert.deepEqual(second.sports, [])
})

test('a complete profile passes every step and interests can be skipped', () => {
  for (const step of [0, 1, 2, 3]) assert.deepEqual(errorsFor(step, {}), {})
  assert.deepEqual(validateStep(2, emptyProfile(), options, today), {})
})

test('about-you step reports each missing field without validating later steps', () => {
  assert.deepEqual(Object.keys(validateStep(0, emptyProfile(), options, today)).sort(), ['birthday', 'name', 'nationality', 'username'])
  assert.deepEqual(errorsFor(0, { email: '', password: '', residence: '', major: '', year: '' }), {})
  assert.ok(errorsFor(0, { name: '   ' }).name)
  assert.ok(errorsFor(0, { name: 'a'.repeat(81) }).name)
  assert.deepEqual(errorsFor(0, { name: `  ${'a'.repeat(80)}  ` }), {})
})

test('usernames support the stated characters and length after surrounding whitespace is removed', () => {
  for (const username of ['Ab_12', 'abc', 'a'.repeat(24), '  alex_21  ']) {
    assert.deepEqual(errorsFor(0, { username }), {}, username)
  }
  for (const username of ['', 'ab', 'a'.repeat(25), 'alex smith', 'alex-smith', 'alex@example', 'alice!']) {
    assert.ok(errorsFor(0, { username }).username, username)
  }
})

test('nationality must match a country code and birthday errors use the supplied current date', () => {
  assert.deepEqual(errorsFor(0, { nationality: 'JP' }), {})
  for (const nationality of ['', 'Canada', 'ca', 'ZZ']) {
    assert.ok(errorsFor(0, { nationality }).nationality, nationality)
  }
  assert.ok(errorsFor(0, { birthday: '2026-09-27' }).birthday)
  assert.ok(errorsFor(0, { birthday: '2005-02-29' }).birthday)
})

test('campus details require the supported university and listed residence and major values', () => {
  assert.ok(errorsFor(1, { university: 'Another university' }).university)
  for (const residence of ['', 'Made-up residence', 'totem park']) {
    assert.ok(errorsFor(1, { residence }).residence, residence)
  }
  for (const major of ['', 'Made-up major', 'computer science']) {
    assert.ok(errorsFor(1, { major }).major, major)
  }
  assert.deepEqual(errorsFor(1, { residence: 'Off campus / commuting', major: 'Undeclared / exploring majors' }), {})
})

test('years 1 through 6 are accepted and fractional, padded, and out-of-range values are rejected', () => {
  for (const year of ['1', '2', '3', '4', '5', '6', 1, 6]) {
    assert.deepEqual(errorsFor(1, { year }), {}, String(year))
  }
  for (const year of ['', '0', '7', '-1', '1.5', '01', ' 1 ', '1st', null]) {
    assert.ok(errorsFor(1, { year }).year, String(year))
  }
})

test('email validation permits common aliases and rejects malformed or oversized addresses', () => {
  for (const email of ['alex@example.com', ' Alex.Taylor+ubc@EXAMPLE.CO.UK ']) {
    assert.deepEqual(errorsFor(3, { email }), {}, email)
  }
  for (const email of ['', 'alex', 'alex@example', '@example.com', 'alex@@example.com', 'alex taylor@example.com', 'alex@exam ple.com', `${'a'.repeat(243)}@example.com`]) {
    assert.ok(errorsFor(3, { email }).email, email)
  }
})

test('password validation enforces the 8-128 character boundaries', () => {
  assert.deepEqual(errorsFor(3, { password: 'a'.repeat(8) }), {})
  assert.deepEqual(errorsFor(3, { password: 'a'.repeat(128) }), {})
  assert.ok(errorsFor(3, { password: 'a'.repeat(7) }).password)
  assert.ok(errorsFor(3, { password: 'a'.repeat(129) }).password)
  assert.ok(errorsFor(3, { password: '' }).password)
})

test('server field errors return users to the corresponding profile step', () => {
  for (const field of ['name', 'username', 'birthday', 'nationality']) assert.equal(stepForField(field), 0, field)
  for (const field of ['university', 'residence', 'year', 'major']) assert.equal(stepForField(field), 1, field)
  for (const field of ['hobbies', 'sports']) assert.equal(stepForField(field), 2, field)
  for (const field of ['email', 'password', 'unknown']) assert.equal(stepForField(field), 3, field)
})

test('registration normalizes identity fields and numeric year while preserving the exact password and source profile', () => {
  const profile = validProfile({
    name: '  Alex Taylor  ',
    username: '  Alex_Taylor  ',
    email: '  Alex.Taylor@Example.COM  ',
    year: '6',
    password: '  My mixed CASE password!  ',
    hobbies: ['Photography', 'Cooking'],
    sports: ['Swimming'],
  })
  const original = structuredClone(profile)
  const payload = registrationPayload(profile)
  assert.notEqual(payload, profile)
  assert.deepEqual(payload, {
    ...original,
    name: 'Alex Taylor',
    username: 'alex_taylor',
    email: 'alex.taylor@example.com',
    year: 6,
  })
  assert.equal(payload.password, profile.password)
  assert.deepEqual(profile, original)
})
