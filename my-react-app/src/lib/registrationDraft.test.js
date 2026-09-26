import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyProfile } from './profile.js'
import { clearRegistrationDraft, readRegistrationDraft, saveRegistrationDraft } from './registrationDraft.js'

function storage(t) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  const values = new Map()
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) } })
  t.after(() => descriptor ? Object.defineProperty(globalThis, 'sessionStorage', descriptor) : delete globalThis.sessionStorage)
  return values
}

test('signup resumes public answers and the current step without storing credentials', (t) => {
  const values = storage(t)
  const profile = { ...emptyProfile(), name: 'Alex', favoriteColor: '#F3D34A', gender: 'prefer-not-to', avatar: { type: 'smiley', value: 'wink' }, languages: ['French'], socialMedia: [{ platform: 'Instagram', username: 'alex' }], password: 'super-secret', token: 'secret-token', email: 'secret@example.com' }
  assert.equal(saveRegistrationDraft(profile, 5), true)
  assert(![...values.values()].join('').includes('secret'))
  const restored = readRegistrationDraft()
  assert.equal(restored.step, 5)
  assert.equal(restored.profile.password, '')
  assert.equal(restored.profile.gender, 'prefer-not-to')
  assert.deepEqual(restored.profile.avatar, profile.avatar)
  assert.deepEqual(restored.profile.socialMedia, profile.socialMedia)
  clearRegistrationDraft()
  assert.equal(readRegistrationDraft(), null)
})

test('incomplete drafts do not invent color or gender choices', (t) => {
  storage(t)
  saveRegistrationDraft(emptyProfile(), 0)
  const draft = readRegistrationDraft()
  assert.equal(draft.profile.favoriteColor, '')
  assert.equal(draft.profile.gender, '')
})

test('bad drafts, invalid steps, and unavailable storage are handled safely', (t) => {
  const values = storage(t)
  values.set('interbuddies.registration-draft', '{broken')
  assert.equal(readRegistrationDraft(), null)
  values.set('interbuddies.registration-draft', JSON.stringify({ profile: { password: 'secret', favoriteColor: {} }, step: 99 }))
  assert.equal(readRegistrationDraft().step, 0)
  assert.equal(readRegistrationDraft().profile.password, '')
  assert.equal(readRegistrationDraft().profile.favoriteColor, '')
  globalThis.sessionStorage.setItem = () => { throw new Error('Quota') }
  assert.equal(saveRegistrationDraft(emptyProfile(), 0), false)
})