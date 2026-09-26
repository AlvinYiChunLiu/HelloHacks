import { SAMPLE_BUDDIES } from '../data/sampleBuddies.js'

function sharedInterests(selected, interests) {
  const choices = new Set(Array.isArray(selected) ? selected : [])
  return [...new Set(Array.isArray(interests) ? interests : [])].filter((interest) => choices.has(interest))
}

function compareMatches(a, b) {
  return b.shared.length - a.shared.length || a.name.localeCompare(b.name)
}

function platformNames(accounts) {
  if (!Array.isArray(accounts)) return []
  return accounts.map((account) => typeof account === 'string' ? account : account?.platform).filter(Boolean)
}

export function emptyBuddyFilters() {
  return { nationality: '', major: '', year: '', sports: [], hobbies: [] }
}

export function getSharedProfileTraits(profile = {}, buddy = {}) {
  const shared = []
  if (profile.nationality && profile.nationality === buddy.nationality) shared.push('Same nationality')
  if (profile.major && profile.major === buddy.major) shared.push('Same major')
  if (profile.year && String(profile.year) === String(buddy.year)) shared.push('Same year')
  if (profile.residence && profile.residence === buddy.residence) shared.push('Same residence')
  for (const sport of sharedInterests(profile.sports, buddy.sports)) shared.push(`Sport: ${sport}`)
  for (const hobby of sharedInterests(profile.hobbies, buddy.hobbies)) shared.push(`Hobby: ${hobby}`)
  for (const language of sharedInterests(profile.languages, buddy.languages)) shared.push(`Language: ${language}`)
  for (const platform of sharedInterests(platformNames(profile.socialMedia), platformNames(buddy.socialMedia))) shared.push(`Platform: ${platform}`)
  return shared
}

export function getFilteredBuddies(profile = {}, filters = emptyBuddyFilters(), buddies = SAMPLE_BUDDIES) {
  const scalarFields = ['nationality', 'major', 'year']
  const multiFields = ['sports', 'hobbies']
  return buddies
    .filter((buddy) => {
      if ((profile.id != null && buddy.id === profile.id) ||
        (profile.username && buddy.username?.toLowerCase() === profile.username.toLowerCase())) return false
      if (scalarFields.some((field) => filters[field] && String(buddy[field]) !== String(filters[field]))) return false
      return multiFields.every((field) => {
        const selected = Array.isArray(filters[field]) ? filters[field] : []
        return !selected.length || selected.some((value) => (buddy[field] || []).includes(value))
      })
    })
    .map((buddy) => {
      const shared = getSharedProfileTraits(profile, buddy)
      return { ...buddy, shared, commonCount: shared.length }
    })
    .sort((a, b) => b.commonCount - a.commonCount || a.name.localeCompare(b.name))
}

export function getBuddyMatches(profile = {}, buddies = SAMPLE_BUDDIES) {
  const matches = { nationality: [], sports: [], hobbies: [] }
  const seen = new Set()

  for (const buddy of buddies) {
    if ((profile.id != null && buddy.id === profile.id) || seen.has(buddy.id)) continue
    seen.add(buddy.id)

    if (profile.nationality && buddy.nationality === profile.nationality) {
      matches.nationality.push({ ...buddy, shared: [profile.nationality] })
    }
    for (const category of ['sports', 'hobbies']) {
      const shared = sharedInterests(profile[category], buddy[category])
      if (shared.length) matches[category].push({ ...buddy, shared })
    }
  }

  for (const category of Object.keys(matches)) matches[category].sort(compareMatches)
  return matches
}

export function getSuggestedBuddies(profile = {}, buddies = SAMPLE_BUDDIES) {
  const matches = getBuddyMatches(profile, buddies)
  const scores = new Map()
  for (const category of Object.values(matches)) {
    for (const buddy of category) scores.set(buddy.id, (scores.get(buddy.id) || 0) + buddy.shared.length)
  }
  const seen = new Set()
  return buddies.filter((buddy) => {
    if (!scores.has(buddy.id) || seen.has(buddy.id)) return false
    seen.add(buddy.id)
    return true
  }).sort((a, b) => scores.get(b.id) - scores.get(a.id) || a.name.localeCompare(b.name))
}
