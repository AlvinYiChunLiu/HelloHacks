import { emptyProfile } from './profile.js'
import { normalizeProfile } from './profileSession.js'

const DRAFT_KEY = 'interbuddies.registration-draft'
function publicDraft(profile) {
  const normalized = normalizeProfile(profile)
  const clean = {}
  for (const field of Object.keys(emptyProfile())) {
    if (field !== 'password') clean[field] = normalized[field]
  }
  clean.favoriteColor = /^#[0-9a-f]{6}$/i.test(profile.favoriteColor || '') ? normalized.favoriteColor : ''
  clean.gender = ['male', 'female', 'prefer-not-to'].includes(profile.gender) ? profile.gender : ''
  clean.university = normalized.university || emptyProfile().university
  return clean
}

export function readRegistrationDraft() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')
    if (!stored || typeof stored.profile !== 'object' || !stored.profile || Array.isArray(stored.profile)) return null
    return { profile: { ...emptyProfile(), ...publicDraft(stored.profile), password: '' }, step: Number.isInteger(stored.step) && stored.step >= 0 && stored.step <= 6 ? stored.step : 0 }
  } catch { return null }
}

export function saveRegistrationDraft(profile, step) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ profile: publicDraft(profile), step }))
    return true
  } catch { return false }
}

export function clearRegistrationDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* The form still works without browser storage. */ }
}