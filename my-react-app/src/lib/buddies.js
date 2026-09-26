import { SAMPLE_BUDDIES } from '../data/sampleBuddies.js'

function sharedInterests(selected, interests) {
  const choices = new Set(Array.isArray(selected) ? selected : [])
  return [...new Set(Array.isArray(interests) ? interests : [])].filter((interest) => choices.has(interest))
}

function compareMatches(a, b) {
  return b.shared.length - a.shared.length || a.name.localeCompare(b.name)
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
