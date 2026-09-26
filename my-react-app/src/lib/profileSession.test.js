import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearActiveProfile,
  DEV_PROFILE,
  normalizeProfile,
  readActiveProfile,
  saveActiveProfile,
} from './profileSession.js'

const PROFILE_KEY = 'interbuddies.active-profile'
const LEGACY_KEY = 'interbuddies.dev-preview'

function useStorage(t, initial = {}) {
  const data = new Map(Object.entries(initial))
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, String(value)),
      removeItem: (key) => data.delete(key),
    },
  })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous)
    else delete globalThis.sessionStorage
  })
  return data
}

test('public profiles exclude credentials and unknown fields, including nested account values', () => {
  const profile = normalizeProfile({
    ...DEV_PROFILE,
    email: 'dev@accounts.interbuddies.invalid',
    password: 'secret',
    password_hash: 'hashed-secret',
    token: 'secret-token',
    account: { email: 'private@example.com' },
    socialMedia: [{ platform: 'Instagram', username: 'dev', password: 'nested-secret', token: 'nested-token' }],
  })
  assert.deepEqual(profile, {
    ...DEV_PROFILE,
    socialMedia: [{ platform: 'Instagram', username: 'dev' }],
  })
})

test('missing real-profile details remain empty without dev demographic defaults', () => {
  const profile = normalizeProfile({ id: 42, name: 'Alice', username: 'alice' })
  assert.equal(profile.id, 42)
  assert.equal(profile.name, 'Alice')
  assert.equal(profile.isDev, false)
  for (const field of ['birthday', 'nationality', 'university', 'residence', 'year', 'major']) {
    assert.equal(profile[field], '', field)
  }
  for (const field of ['hobbies', 'sports', 'languages', 'socialMedia']) assert.deepEqual(profile[field], [])
  assert.equal(profile.favoriteColor, '#2457d6')
  assert.equal(normalizeProfile(null).name, '')
})

test('normalization handles malformed lists and colors and bounds stored values', () => {
  const profile = normalizeProfile({
    name: 'x'.repeat(100),
    username: ' dev ',
    year: '3',
    isDev: 'true',
    hobbies: ['Cooking', null, 'Cooking', 42, '', ' Photography '],
    sports: 'Swimming',
    languages: Array.from({ length: 110 }, (_, index) => `Language ${index}`),
    favoriteColor: 'red; background: url(example.com)',
    socialMedia: [null, {}, { platform: 'Instagram', username: ' dev ' }, { platform: 'Discord', username: '' }],
  })
  assert.equal(profile.name.length, 80)
  assert.equal(profile.username, 'dev')
  assert.equal(profile.year, 3)
  assert.equal(profile.isDev, false)
  assert.deepEqual(profile.hobbies, ['Cooking', 'Photography'])
  assert.deepEqual(profile.sports, [])
  assert.equal(profile.languages.length, 100)
  assert.equal(profile.favoriteColor, '#2457d6')
  assert.deepEqual(profile.socialMedia, [{ platform: 'Instagram', username: 'dev' }, { platform: 'Discord', username: '' }])
  assert.equal(normalizeProfile({ favoriteColor: '#Aa33FF' }).favoriteColor, '#Aa33FF')
  for (const favoriteColor of ['#fff', '#12345678', 'red', null, {}]) {
    assert.equal(normalizeProfile({ favoriteColor }).favoriteColor, '#2457d6')
  }
})

test('session save and reload retain edits and strip secrets from serialized storage', (t) => {
  const storage = useStorage(t)
  const edited = { ...DEV_PROFILE, username: 'new_dev', languages: ['Spanish'], favoriteColor: '#ad286a' }
  assert.equal(saveActiveProfile({ ...edited, password: 'secret', email: 'private@example.com' }), true)
  assert.deepEqual(readActiveProfile(), edited)
  assert.deepEqual(JSON.parse(storage.get(PROFILE_KEY)), edited)
  assert.equal(DEV_PROFILE.username, 'dev')
  assert.deepEqual(DEV_PROFILE.languages, ['English', 'French'])
})

test('normalization creates independent interest and social arrays', () => {
  const source = { ...DEV_PROFILE, socialMedia: [{ platform: 'Instagram', username: 'dev' }] }
  const profile = normalizeProfile(source)
  profile.hobbies.push('Writing')
  profile.socialMedia[0].username = 'edited'
  assert.equal(source.hobbies.includes('Writing'), false)
  assert.equal(source.socialMedia[0].username, 'dev')
})

test('legacy dev flag migrates to a full editable profile and is removed', (t) => {
  const storage = useStorage(t, { [LEGACY_KEY]: 'dev' })
  assert.deepEqual(readActiveProfile(), DEV_PROFILE)
  assert.equal(storage.has(LEGACY_KEY), false)
  assert.deepEqual(JSON.parse(storage.get(PROFILE_KEY)), DEV_PROFILE)
})

test('real profile saves and session clearing prevent stale dev flags from returning', (t) => {
  const storage = useStorage(t, { [LEGACY_KEY]: 'dev' })
  assert.equal(saveActiveProfile({ name: 'Alice', username: 'alice' }), true)
  assert.equal(storage.has(LEGACY_KEY), false)
  assert.equal(readActiveProfile().isDev, false)
  storage.set(LEGACY_KEY, 'dev')
  assert.equal(clearActiveProfile(), true)
  assert.equal(storage.size, 0)
  assert.equal(readActiveProfile(), null)
})

test('corrupted and non-object stored profiles return null without reviving a dev flag', (t) => {
  const storage = useStorage(t, { [LEGACY_KEY]: 'dev' })
  for (const value of ['invalid json', 'null', '[]', '42', '"dev"']) {
    storage.set(PROFILE_KEY, value)
    assert.equal(readActiveProfile(), null)
  }
  assert.equal(saveActiveProfile(null), false)
  assert.equal(saveActiveProfile([]), false)
})

test('blocked session storage is safe to read, save, and clear', (t) => {
  useStorage(t)
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get() { throw new Error('Storage blocked') },
  })
  assert.equal(readActiveProfile(), null)
  assert.equal(saveActiveProfile(DEV_PROFILE), false)
  assert.equal(clearActiveProfile(), false)
})

test('a storage quota error does not leave a legacy dev flag behind', (t) => {
  const storage = useStorage(t, { [LEGACY_KEY]: 'dev' })
  globalThis.sessionStorage.setItem = () => { throw new Error('Quota exceeded') }
  assert.equal(saveActiveProfile({ name: 'Alice' }), false)
  assert.equal(storage.has(LEGACY_KEY), false)
  assert.equal(readActiveProfile(), null)
})
