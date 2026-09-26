import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SAMPLE_BUDDIES } from '../data/sampleBuddies.js'
import { getBuddyMatches, getSuggestedBuddies } from './buddies.js'
import { HOBBIES, SPORTS, UNIVERSITY } from './profile.js'

const profile = { id: 'me', nationality: 'CA', hobbies: ['Cooking', 'Photography'], sports: ['Soccer', 'Swimming'] }
const buddies = [
  { id: 'one', name: 'Ari', nationality: 'JP', hobbies: ['Cooking'], sports: ['Soccer'] },
  { id: 'two', name: 'Zoe', nationality: 'CA', hobbies: ['Cooking', 'Photography'], sports: ['Swimming', 'Soccer'] },
  { id: 'three', name: 'Bea', nationality: 'CA', hobbies: ['Photography'], sports: [] },
  { id: 'four', name: 'Dee', nationality: 'FR', hobbies: ['Gaming'], sports: ['Tennis'] },
  { ...profile, name: 'Me' },
]

test('matches only shared nationality and interests and ranks the strongest overlaps first', () => {
  const matches = getBuddyMatches(profile, buddies)
  assert.deepEqual(matches.nationality.map(({ name }) => name), ['Bea', 'Zoe'])
  assert.deepEqual(matches.sports.map(({ name }) => name), ['Zoe', 'Ari'])
  assert.deepEqual(matches.hobbies.map(({ name }) => name), ['Zoe', 'Ari', 'Bea'])
  assert.deepEqual(matches.sports[0].shared, ['Swimming', 'Soccer'])
  assert.deepEqual(matches.nationality[0].shared, ['CA'])
  assert.ok(Object.values(matches).flat().every(({ id }) => id !== 'me' && id !== 'four'))
})

test('unset fields do not create false matches', () => {
  assert.deepEqual(getBuddyMatches({}, [{ id: 'empty', name: 'Empty' }]), { nationality: [], sports: [], hobbies: [] })
  assert.deepEqual(getSuggestedBuddies({}), [])
  assert.deepEqual(getBuddyMatches(profile, []), { nationality: [], sports: [], hobbies: [] })
})

test('suggestions combine overlap scores, break ties by name, and include each person once', () => {
  const suggestions = getSuggestedBuddies(profile, [...buddies, buddies[0]])
  assert.deepEqual(suggestions.map(({ name }) => name), ['Zoe', 'Ari', 'Bea'])
  assert.equal(suggestions[0], buddies[1], 'returns the original profile without category-specific shared data')
})

test('repeated interests and repeated users do not inflate matches', () => {
  const repeated = { id: 'repeat', name: 'Repeated', sports: ['Soccer', 'Soccer'], hobbies: [] }
  const matches = getBuddyMatches({ sports: ['Soccer', 'Soccer'] }, [repeated, repeated])
  assert.equal(matches.sports.length, 1)
  assert.deepEqual(matches.sports[0].shared, ['Soccer'])
})

test('matching keeps input profiles and interest arrays unchanged', () => {
  const original = structuredClone(buddies)
  const originalProfile = structuredClone(profile)
  getBuddyMatches(profile, buddies)
  getSuggestedBuddies(profile, buddies)
  assert.deepEqual(buddies, original)
  assert.deepEqual(profile, originalProfile)
})

test('fictional examples use valid UBC options and selectable interests', () => {
  const options = JSON.parse(readFileSync(new URL('../data/ubcOptions.json', import.meta.url), 'utf8'))
  const countryCodes = new Set(JSON.parse(readFileSync(new URL('../data/countries.json', import.meta.url), 'utf8')).map(({ code }) => code))
  assert.ok(SAMPLE_BUDDIES.length >= 18 && SAMPLE_BUDDIES.length <= 24)
  assert.equal(new Set(SAMPLE_BUDDIES.map(({ id }) => id)).size, SAMPLE_BUDDIES.length)
  for (const buddy of SAMPLE_BUDDIES) {
    assert.equal(buddy.university, UNIVERSITY)
    assert.ok(options.residences.some(({ name }) => name === buddy.residence), buddy.residence)
    assert.ok(options.majors.some(({ name }) => name === buddy.major), buddy.major)
    assert.ok(countryCodes.has(buddy.nationality), buddy.nationality)
    assert.ok(buddy.hobbies.every((hobby) => HOBBIES.includes(hobby)), buddy.name)
    assert.ok(buddy.sports.every((sport) => SPORTS.includes(sport)), buddy.name)
    assert.match(buddy.favoriteColor, /^#[\da-f]{6}$/i)
  }
  const matches = getBuddyMatches(profile)
  assert.ok(matches.nationality.length >= 3)
  assert.ok(matches.sports.length >= 3)
  assert.ok(matches.hobbies.length >= 3)
})
