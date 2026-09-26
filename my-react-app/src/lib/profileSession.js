import { normalizeAvatar } from './avatar.js'

const PROFILE_SESSION_KEY = 'interbuddies.active-profile'
const LEGACY_DEV_SESSION_KEY = 'interbuddies.dev-preview'
const DEFAULT_COLOR = '#2457d6'

export const DEV_PROFILE = {
  id: 'dev-preview',
  isDev: true,
  name: 'Dev',
  username: 'dev',
  birthday: '2004-04-15',
  gender: 'prefer-not-to',
  avatar: null,
  nationality: 'CA',
  university: 'University of British Columbia',
  residence: 'Totem Park',
  year: 2,
  major: 'Computer Science (BSc)',
  hobbies: ['Photography', 'Cooking', 'Live music'],
  sports: ['Soccer', 'Badminton', 'Swimming'],
  languages: ['English', 'French'],
  favoriteColor: DEFAULT_COLOR,
  socialMedia: [],
}

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function stringList(value, maxItems) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => text(item, 100)).filter(Boolean))].slice(0, maxItems)
}

function isProfile(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Keep only the public fields needed by the frontend. Account credentials and
// API responses must never be copied wholesale into browser storage.
export function normalizeProfile(profile) {
  const source = isProfile(profile) ? profile : {}
  const year = Number(source.year)
  return {
    id: typeof source.id === 'number' && Number.isFinite(source.id) ? source.id : text(source.id, 120),
    isDev: source.isDev === true,
    name: text(source.name, 80),
    username: text(source.username, 24),
    birthday: text(source.birthday, 10),
    gender: ['male', 'female', 'prefer-not-to'].includes(source.gender) ? source.gender : 'prefer-not-to',
    avatar: normalizeAvatar(source.avatar),
    nationality: text(source.nationality, 2),
    university: text(source.university, 160),
    residence: text(source.residence, 160),
    year: Number.isInteger(year) && year >= 1 && year <= 6 ? year : '',
    major: text(source.major, 200),
    hobbies: stringList(source.hobbies, 40),
    sports: stringList(source.sports, 40),
    languages: stringList(source.languages, 100),
    favoriteColor: typeof source.favoriteColor === 'string' && /^#[0-9a-f]{6}$/i.test(source.favoriteColor)
      ? source.favoriteColor
      : DEFAULT_COLOR,
    socialMedia: Array.isArray(source.socialMedia)
      ? source.socialMedia.filter(isProfile).map((account) => ({
        platform: text(account.platform, 40),
        username: text(account.username, 100),
      })).filter((account) => account.platform).slice(0, 20)
      : [],
  }
}

export function readActiveProfile() {
  try {
    const stored = sessionStorage.getItem(PROFILE_SESSION_KEY)
    if (stored !== null) {
      const profile = JSON.parse(stored)
      return isProfile(profile) ? normalizeProfile(profile) : null
    }
    if (sessionStorage.getItem(LEGACY_DEV_SESSION_KEY) === 'dev') {
      const profile = normalizeProfile(DEV_PROFILE)
      saveActiveProfile(profile)
      return profile
    }
    return null
  } catch {
    return null
  }
}

export function saveActiveProfile(profile) {
  if (!isProfile(profile)) return false
  try {
    sessionStorage.removeItem(LEGACY_DEV_SESSION_KEY)
    sessionStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(normalizeProfile(profile)))
    return true
  } catch {
    return false
  }
}

export function clearActiveProfile() {
  let cleared = true
  for (const key of [PROFILE_SESSION_KEY, LEGACY_DEV_SESSION_KEY]) {
    try {
      sessionStorage.removeItem(key)
    } catch {
      cleared = false
    }
  }
  return cleared
}
