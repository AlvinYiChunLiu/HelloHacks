import assert from 'node:assert/strict'
import test from 'node:test'
import { activeFilterChoices, conversationStarter, readSavedBuddies, removeFilterChoice, saveBuddies, searchBuddies } from './discovery.js'
import { emptyBuddyFilters, getFilteredBuddies } from './buddies.js'

const people = [
  { id: 'one', name: 'Chloe', username: 'chloe', nationality: 'FR', major: 'Art History', hobbies: ['Photography'], sports: ['Swimming'], languages: ['French'], socialMedia: [{ platform: 'Instagram', username: 'chloe.photo' }] },
  { id: 'two', name: 'Noah', username: 'noah', nationality: 'CA', major: 'Economics', hobbies: ['Cooking'], sports: ['Swimming', 'Soccer'], languages: ['English'], gender: 'prefer-not-to' },
]

function storage(t) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  const values = new Map()
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } })
  t.after(() => descriptor ? Object.defineProperty(globalThis, 'sessionStorage', descriptor) : delete globalThis.sessionStorage)
  return values
}

test('discovery search combines terms across country, interests, and public social handles', () => {
  assert.deepEqual(searchBuddies(people, 'france PHOTO', { FR: 'France' }).map(({ id }) => id), ['one'])
  assert.deepEqual(searchBuddies(people, '@chloe.photo').map(({ id }) => id), ['one'])
  assert.deepEqual(searchBuddies(people, 'noah french'), [])
  assert.deepEqual(searchBuddies(people, 'prefer-not-to'), [])
  assert.equal(searchBuddies(people, '  ').length, 2)
  assert.equal(searchBuddies([{ name: 'Chlo\u00e9' }], 'chloe').length, 1)
})

test('removing one filter keeps all other choices and leaves original filters unchanged', () => {
  const filters = { ...emptyBuddyFilters(), nationality: 'CA', sports: ['Swimming', 'Soccer'] }
  const updated = removeFilterChoice(filters, 'sports', 'Soccer')
  assert.deepEqual(updated.sports, ['Swimming'])
  assert.equal(updated.nationality, 'CA')
  assert.deepEqual(filters.sports, ['Swimming', 'Soccer'])
  assert.equal(activeFilterChoices(updated).length, 2)
  assert.equal(removeFilterChoice(updated, 'nationality', 'CA').nationality, '')
})

test('filters combine sections but accept any selected choice within each section', () => {
  const filters = { ...emptyBuddyFilters(), nationality: 'CA', sports: ['Swimming', 'Tennis'] }
  assert.deepEqual(getFilteredBuddies({}, filters, people).map(({ id }) => id), ['two'])
  assert.equal(getFilteredBuddies({}, { ...filters, languages: ['French'] }, people).length, 0)
  assert.equal(getFilteredBuddies({ id: 'two' }, filters, people).length, 0)
})

test('bookmarks persist per account, deduplicate, and survive username edits', (t) => {
  storage(t)
  assert.equal(saveBuddies({ id: 'a', username: 'old' }, ['one', 'one', 'two', null]), true)
  assert.deepEqual(readSavedBuddies({ id: 'a', username: 'new' }), ['one', 'two'])
  assert.deepEqual(readSavedBuddies({ id: 'b' }), [])
  saveBuddies({ id: 'a' }, [])
  assert.deepEqual(readSavedBuddies({ id: 'a' }), [])
})

test('corrupt or unavailable bookmark storage does not break discovery', (t) => {
  const values = storage(t)
  values.set('interbuddies.saved-buddies:a', 'broken')
  assert.deepEqual(readSavedBuddies({ id: 'a' }), [])
  globalThis.sessionStorage.setItem = () => { throw new Error('Blocked') }
  assert.equal(saveBuddies({ id: 'a' }, ['one']), false)
})

test('conversation starters use a real shared interest and have a useful fallback', () => {
  assert.match(conversationStarter({ sports: ['Soccer'] }, people[1]), /soccer/)
  assert.match(conversationStarter({ hobbies: ['Photography'] }, people[0]), /photography/)
  assert.match(conversationStarter({}, people[0]), /UBC/)
})