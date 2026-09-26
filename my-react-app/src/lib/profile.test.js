import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { env, execPath } from 'node:process'
import test from 'node:test'
import {
  emptyProfile,
  getAge,
  registrationPayload,
  profileChanges,
  profileDraft,
  stepForField,
  todayDate,
  UNIVERSITY,
  validateStep,
} from './profile.js'

import { DEFAULT_PROFILE_COLOR, LANGUAGES, PROFILE_COLORS } from '../data/profileOptions.js'

const today = new Date(2026, 8, 26, 12)
const options = {
  countries: [{ code: 'CA', name: 'Canada' }, { code: 'JP', name: 'Japan' }],
  residences: [{ value: 'Totem Park' }, { value: 'Off campus / commuting' }],
  majors: [{ value: 'Computer Science' }, { value: 'Undeclared / exploring majors' }],
}

function validProfile(overrides = {}) {
  return {
    ...emptyProfile(),
    favoriteColor: DEFAULT_PROFILE_COLOR,
    languages: ['English', 'French'],
    name: 'Alex Taylor',
    username: 'alex_taylor',
    birthday: '2005-09-26',
    nationality: 'CA',
    residence: 'Totem Park',
    year: '2',
    major: 'Computer Science',
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
  for (const step of [0, 1, 2, 3, 4, 5]) assert.deepEqual(errorsFor(step, {}), {})
  assert.deepEqual(validateStep(3, emptyProfile(), options, today), {})
})

test('about-you step reports each missing field without validating later steps', () => {
  assert.deepEqual(Object.keys(validateStep(1, emptyProfile(), options, today)).sort(), ['birthday', 'languages', 'name', 'nationality', 'username'])
  assert.deepEqual(errorsFor(1, { email: '', password: '', residence: '', major: '', year: '' }), {})
  assert.ok(errorsFor(1, { name: '   ' }).name)
  assert.ok(errorsFor(1, { name: 'a'.repeat(81) }).name)
  assert.deepEqual(errorsFor(1, { name: `  ${'a'.repeat(80)}  ` }), {})
})

test('usernames support the stated characters and length after surrounding whitespace is removed', () => {
  for (const username of ['Ab_12', 'abc', 'a'.repeat(24), '  alex_21  ']) {
    assert.deepEqual(errorsFor(1, { username }), {}, username)
  }
  for (const username of ['', 'ab', 'a'.repeat(25), 'alex smith', 'alex-smith', 'alex@example', 'alice!']) {
    assert.ok(errorsFor(1, { username }).username, username)
  }
})

test('nationality must match a country code and birthday errors use the supplied current date', () => {
  assert.deepEqual(errorsFor(1, { nationality: 'JP' }), {})
  for (const nationality of ['', 'Canada', 'ca', 'ZZ']) {
    assert.ok(errorsFor(1, { nationality }).nationality, nationality)
  }
  assert.ok(errorsFor(1, { birthday: '2026-09-27' }).birthday)
  assert.ok(errorsFor(1, { birthday: '2005-02-29' }).birthday)
})

test('campus details require the supported university and listed residence and major values', () => {
  assert.ok(errorsFor(2, { university: 'Another university' }).university)
  for (const residence of ['', 'Made-up residence', 'totem park']) {
    assert.ok(errorsFor(2, { residence }).residence, residence)
  }
  for (const major of ['', 'Made-up major', 'computer science']) {
    assert.ok(errorsFor(2, { major }).major, major)
  }
  assert.deepEqual(errorsFor(2, { residence: 'Off campus / commuting', major: 'Undeclared / exploring majors' }), {})
})

test('years 1 through 6 are accepted and fractional, padded, and out-of-range values are rejected', () => {
  for (const year of ['1', '2', '3', '4', '5', '6', 1, 6]) {
    assert.deepEqual(errorsFor(2, { year }), {}, String(year))
  }
  for (const year of ['', '0', '7', '-1', '1.5', '01', ' 1 ', '1st', null]) {
    assert.ok(errorsFor(2, { year }).year, String(year))
  }
})

test('registration keeps the current username-derived email contract without a visible email field', () => {
  const profile = validProfile({ username: '  Alex_Taylor  ' })
  assert.equal(registrationPayload(profile).email, 'alex_taylor@accounts.interbuddies.invalid')
  assert.equal(Object.hasOwn(emptyProfile(), 'email'), false)
  assert.deepEqual(errorsFor(5, {}), {})
})

test('password validation enforces the 8-128 character boundaries', () => {
  assert.deepEqual(errorsFor(5, { password: 'a'.repeat(8) }), {})
  assert.deepEqual(errorsFor(5, { password: 'a'.repeat(128) }), {})
  assert.ok(errorsFor(5, { password: 'a'.repeat(7) }).password)
  assert.ok(errorsFor(5, { password: 'a'.repeat(129) }).password)
  assert.ok(errorsFor(5, { password: '' }).password)
})

test('server field errors return users to the corresponding six-step profile section', () => {
  assert.equal(stepForField('favoriteColor'), 0)
  for (const field of ['name', 'username', 'birthday', 'nationality', 'languages']) assert.equal(stepForField(field), 1, field)
  for (const field of ['university', 'residence', 'year', 'major']) assert.equal(stepForField(field), 2, field)
  for (const field of ['hobbies', 'sports']) assert.equal(stepForField(field), 3, field)
  assert.equal(stepForField('socialMedia'), 4)
  for (const field of ['email', 'password', 'unknown']) assert.equal(stepForField(field), 5, field)
})

test('registration normalizes identity fields and numeric year while preserving the exact password and source profile', () => {
  const profile = validProfile({
    name: '  Alex Taylor  ',
    username: '  Alex_Taylor  ',
    year: '6',
    password: '  My mixed CASE password!  ',
    hobbies: ['Photography', 'Cooking'],
    sports: ['Swimming'],
  })
  const original = structuredClone(profile)
  const payload = registrationPayload(profile)
  assert.notEqual(payload, profile)
  const expected = { ...original }
  delete expected.favoriteColor
  delete expected.languages
  assert.deepEqual(payload, {
    ...expected,
    name: 'Alex Taylor',
    username: 'alex_taylor',
    email: 'alex_taylor@accounts.interbuddies.invalid',
    year: 6,
  })
  assert.equal(payload.password, profile.password)
  assert.deepEqual(profile, original)
})


test('color choices contain exactly 30 unique named colors including the default', () => {
  assert.equal(PROFILE_COLORS.length, 30)
  assert.equal(new Set(PROFILE_COLORS.map(({ name }) => name)).size, 30)
  assert.equal(new Set(PROFILE_COLORS.map(({ value }) => value)).size, 30)
  assert.ok(PROFILE_COLORS.every(({ name, value }) => name && /^#[0-9a-f]{6}$/i.test(value)))
  assert.ok(PROFILE_COLORS.some(({ value }) => value === DEFAULT_PROFILE_COLOR))
})

test('signup requires a color choice and accepts every available swatch', () => {
  assert.equal(emptyProfile().favoriteColor, '')
  for (const { value } of PROFILE_COLORS) assert.deepEqual(errorsFor(0, { favoriteColor: value }), {})
  for (const favoriteColor of ['', 'red', '#000000']) assert.ok(errorsFor(0, { favoriteColor }).favoriteColor)
})

test('languages include a broad sorted list and require at least one listed selection', () => {
  assert.ok(LANGUAGES.length > 100)
  assert.equal(new Set(LANGUAGES).size, LANGUAGES.length)
  assert.deepEqual(LANGUAGES, [...LANGUAGES].sort((a, b) => a.localeCompare(b, 'en')))
  assert.deepEqual(errorsFor(1, { languages: ['English', 'Portuguese', 'Mandarin'] }), {})
  for (const languages of [[], undefined, ['Unlisted'], 'English']) assert.ok(errorsFor(1, { languages }).languages)
})

test('registration keeps local color and language additions out of the unchanged API payload', () => {
  const payload = registrationPayload(validProfile())
  assert.equal(Object.hasOwn(payload, 'favoriteColor'), false)
  assert.equal(Object.hasOwn(payload, 'languages'), false)
  assert.equal(payload.password, 'Good password 123!')
})

test('edit drafts prefill public fields and make independent arrays without retaining credentials', () => {
  const original = validProfile({ username: 'dev', year: 2, socialMedia: [{ platform: 'Instagram', username: 'alex' }] })
  const draft = profileDraft(original)
  assert.equal(draft.password, '')
  assert.equal(draft.year, '2')
  for (let step = 0; step < 5; step += 1) assert.deepEqual(validateStep(step, draft, options, today), {})
  draft.languages.push('Spanish')
  draft.socialMedia[0].username = 'new_name'
  assert.deepEqual(original.languages, ['English', 'French'])
  assert.equal(original.socialMedia[0].username, 'alex')
  assert.equal(profileDraft({}).favoriteColor, DEFAULT_PROFILE_COLOR)
})

test('local edits retain all public details, normalize names, and omit password and account metadata', () => {
  const original = validProfile({ id: 'demo', email: 'private@example.com', username: ' DEV ', name: '  Alex  ', languages: ['English', 'French', 'English'], socialMedia: [{ platform: 'Instagram', username: '  alex  ' }] })
  const saved = profileChanges(original)
  assert.equal(saved.name, 'Alex')
  assert.equal(saved.username, 'dev')
  assert.equal(saved.year, 2)
  assert.deepEqual(saved.languages, ['English', 'French'])
  assert.equal(saved.favoriteColor, DEFAULT_PROFILE_COLOR)
  assert.deepEqual(saved.socialMedia, [{ platform: 'Instagram', username: 'alex' }])
  for (const key of ['password', 'id', 'email']) assert.equal(Object.hasOwn(saved, key), false)
  assert.equal(original.socialMedia[0].username, '  alex  ')
})
