const HANGOUTS_KEY = 'interbuddies.campus-hangouts.v1'
const GEOCODER_URL = import.meta.env.VITE_GEOCODER_URL || 'https://nominatim.openstreetmap.org/search'
let lastGeocodingRequestAt = 0

function normalizeHangout(item) {
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.title !== 'string') return null
  const latitude = Number(item.latitude)
  const longitude = Number(item.longitude)
  const startsAt = Date.parse(item.startsAt)
  const endsAt = Date.parse(item.endsAt)
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    !Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt < startsAt) return null
  return {
    id: item.id.slice(0, 120),
    title: item.title.trim().slice(0, 100),
    description: typeof item.description === 'string' ? item.description.trim().slice(0, 500) : '',
    location: typeof item.location === 'string' ? item.location.trim().slice(0, 240) : '',
    displayLocation: typeof item.displayLocation === 'string' ? item.displayLocation.trim().slice(0, 300) : '',
    latitude,
    longitude,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    author: {
      name: typeof item.author?.name === 'string' ? item.author.name.trim().slice(0, 80) : 'UBC student',
      nationality: typeof item.author?.nationality === 'string' ? item.author.nationality.slice(0, 2).toUpperCase() : '',
    },
  }
}

export function createHangoutId() {
  return globalThis.crypto?.randomUUID?.() || `hangout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function readHangouts() {
  try {
    const stored = JSON.parse(localStorage.getItem(HANGOUTS_KEY) || '[]')
    return Array.isArray(stored) ? stored.map(normalizeHangout).filter(Boolean).slice(0, 100) : []
  } catch {
    return []
  }
}

export function saveHangouts(hangouts) {
  try {
    localStorage.setItem(HANGOUTS_KEY, JSON.stringify(hangouts.map(normalizeHangout).filter(Boolean).slice(0, 100)))
    return true
  } catch {
    return false
  }
}

export function sortHangouts(hangouts = []) {
  return [...hangouts].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}

export async function findHangoutLocation(query) {
  const delay = Math.max(0, 1000 - (Date.now() - lastGeocodingRequestAt))
  if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay))
  lastGeocodingRequestAt = Date.now()

  const url = new URL(GEOCODER_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  const response = await fetch(url, { headers: { Accept: 'application/json' }, referrerPolicy: 'strict-origin-when-cross-origin' })
  if (!response.ok) throw new Error('Location search unavailable')
  const data = await response.json()
  const result = Array.isArray(data) ? data[0] : null
  const latitude = Number(result?.lat)
  const longitude = Number(result?.lon)
  return result && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude, displayLocation: result.display_name || query }
    : null
}
