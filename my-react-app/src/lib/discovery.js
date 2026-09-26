const fold = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function searchBuddies(buddies, query, countryNames = {}) {
  const terms = fold(query).replaceAll('@', '').trim().split(/\s+/).filter(Boolean)
  return buddies.filter((buddy) => {
    const text = fold([
      buddy.name, buddy.username, buddy.major, buddy.residence, buddy.nationality,
      countryNames[buddy.nationality], ...(buddy.languages || []), ...(buddy.sports || []),
      ...(buddy.hobbies || []), ...(buddy.socialMedia || []).map(({ platform, username }) => `${platform} ${username || ''}`),
    ].join(' '))
    return terms.every((term) => text.includes(term))
  })
}

export function activeFilterChoices(filters) {
  return Object.entries(filters).flatMap(([field, value]) =>
    (Array.isArray(value) ? value : value ? [value] : []).map((choice) => ({ field, value: choice })))
}

export function removeFilterChoice(filters, field, value) {
  return { ...filters, [field]: Array.isArray(filters[field]) ? filters[field].filter((choice) => choice !== value) : '' }
}

function savedKey(profile) {
  return `interbuddies.saved-buddies:${encodeURIComponent(profile.id || profile.username || 'preview')}`
}

function cleanIds(value) {
  return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string' && id.length <= 120))].slice(0, 500) : []
}

export function readSavedBuddies(profile) {
  try { return cleanIds(JSON.parse(sessionStorage.getItem(savedKey(profile)) || '[]')) } catch { return [] }
}

export function saveBuddies(profile, ids) {
  try {
    sessionStorage.setItem(savedKey(profile), JSON.stringify(cleanIds(ids)))
    return true
  } catch { return false }
}

export function conversationStarter(profile, buddy) {
  const name = buddy.name?.split(' ')[0] || 'there'
  const sport = buddy.sports?.find((item) => profile.sports?.includes(item))
  const hobby = buddy.hobbies?.find((item) => profile.hobbies?.includes(item))
  if (sport) return `Hey ${name}! I noticed we both like ${sport.toLowerCase()}. Would you be up for a game or a practice together sometime?`
  if (hobby) return `Hey ${name}! We both picked ${hobby.toLowerCase()} as an interest. How did you get into it?`
  if (profile.major && profile.major === buddy.major) return `Hey ${name}! I'm studying ${profile.major} too. How are you finding it so far?`
  return `Hey ${name}! I'm looking to meet more people at UBC. What's been your favorite part of campus life so far?`
}