import { DEFAULT_PROFILE_COLOR, LANGUAGES, PROFILE_COLORS } from '../data/profileOptions.js'
import { normalizeAvatar } from './avatar.js'

export const UNIVERSITY = 'University of British Columbia'

export const HOBBIES = [
  'Art & drawing', 'Board games', 'Books & reading', 'Cooking', 'Dancing',
  'Film & TV', 'Gaming', 'Gardening', 'Hiking', 'Learning languages',
  'Live music', 'Music & instruments', 'Photography', 'Technology', 'Travel',
  'Volunteering', 'Writing', 'Yoga',
]

export const SPORTS = [
  'Badminton', 'Baseball', 'Basketball', 'Climbing', 'Cycling', 'Field hockey',
  'Football', 'Golf', 'Ice hockey', 'Martial arts', 'Rowing', 'Rugby', 'Running',
  'Skiing', 'Snowboarding', 'Soccer', 'Swimming', 'Tennis', 'Ultimate frisbee',
  'Volleyball', 'Weight training',
]

export function emptyProfile() {
  return {
    favoriteColor: '', name: '', username: '', gender: '', avatar: null, nationality: '', languages: [],
    university: UNIVERSITY, residence: '', year: '', major: '',
    hobbies: [], sports: [], socialMedia: [], password: '',
  }
}

export function validateStep(step, profile, options) {
  const errors = {}
  if (step === 0 && !PROFILE_COLORS.some((color) => color.value === profile.favoriteColor)) {
    errors.favoriteColor = 'Choose your favorite color.'
  }
  if (step === 1) {
    if (!profile.name.trim()) errors.name = 'Please enter your name.'
    else if (profile.name.trim().length > 80) errors.name = 'Use 80 characters or fewer.'
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(profile.username.trim())) errors.username = 'Use 3–24 letters, numbers, or underscores.'
    if (!['male', 'female', 'prefer-not-to'].includes(profile.gender)) errors.gender = 'Choose a gender option, or prefer not to say.'
  }
  if (step === 2) {
    if (!options.countries.some((country) => country.code === profile.nationality)) errors.nationality = 'Choose a country from the list.'
    if (!Array.isArray(profile.languages) || !profile.languages.length || profile.languages.some((language) => !LANGUAGES.includes(language))) errors.languages = 'Choose at least one language from the list.'
  }
  if (step === 3) {
    if (profile.university !== UNIVERSITY) errors.university = 'Choose the University of British Columbia.'
    if (!options.residences.some((residence) => residence.value === profile.residence)) errors.residence = 'Choose your residence or off-campus housing.'
    if (!/^[1-6]$/.test(String(profile.year))) errors.year = 'Choose your year, from 1st to 6th.'
    if (!options.majors.some((major) => major.value === profile.major)) errors.major = 'Choose a major from the list.'
  }
  if (step === 6) {
    if (profile.password.length < 8 || profile.password.length > 128) errors.password = 'Use a password with 8–128 characters.'
  }
  return errors
}

export function registrationPayload(profile) {
  const username = profile.username.trim().toLowerCase()
  return {
    name: profile.name.trim(),
    nationality: profile.nationality,
    university: profile.university,
    residence: profile.residence,
    major: profile.major,
    hobbies: [...profile.hobbies],
    sports: [...profile.sports],
    languages: [...profile.languages],
    password: profile.password,
    username,
    year: Number(profile.year),
    // The current frontend-only registration contract still requires an email.
    email: `${username}@accounts.interbuddies.invalid`,
    socialMedia: (profile.socialMedia || []).map(({ platform, username: socialUsername }) => ({ platform, username: socialUsername.trim() })),
  }
}

export function stepForField(field) {
  if (field === 'favoriteColor') return 0
  if (['name', 'username', 'avatar', 'gender'].includes(field)) return 1
  if (['nationality', 'languages'].includes(field)) return 2
  if (['university', 'residence', 'year', 'major'].includes(field)) return 3
  if (['hobbies', 'sports'].includes(field)) return 4
  if (field === 'socialMedia') return 5
  return 6
}

// Build an independent form draft; credentials are never prefilled for editing.
export function profileDraft(initialProfile = {}) {
  const draft = emptyProfile()
  for (const field of ['name', 'username', 'nationality', 'university', 'residence', 'major']) {
    if (typeof initialProfile[field] === 'string') draft[field] = initialProfile[field]
  }
  draft.year = initialProfile.year ? String(initialProfile.year) : ''
  draft.gender = ['male', 'female', 'prefer-not-to'].includes(initialProfile.gender) ? initialProfile.gender : 'prefer-not-to'
  draft.avatar = normalizeAvatar(initialProfile.avatar)
  draft.favoriteColor = PROFILE_COLORS.some((color) => color.value === initialProfile.favoriteColor)
    ? initialProfile.favoriteColor : DEFAULT_PROFILE_COLOR
  for (const field of ['languages', 'hobbies', 'sports']) {
    draft[field] = Array.isArray(initialProfile[field]) ? [...initialProfile[field]] : []
  }
  draft.socialMedia = Array.isArray(initialProfile.socialMedia)
    ? initialProfile.socialMedia.map(({ platform, username }) => ({ platform, username: username || '' })) : []
  return draft
}

// These public profile changes are saved locally by the parent screen.
export function profileChanges(profile) {
  return {
    favoriteColor: profile.favoriteColor,
    name: profile.name.trim(),
    username: profile.username.trim().toLowerCase(),
    gender: profile.gender,
    avatar: normalizeAvatar(profile.avatar),
    nationality: profile.nationality,
    languages: [...new Set(profile.languages)],
    university: profile.university,
    residence: profile.residence,
    year: Number(profile.year),
    major: profile.major,
    hobbies: [...profile.hobbies],
    sports: [...profile.sports],
    socialMedia: profile.socialMedia.map(({ platform, username }) => ({ platform, username: username.trim() })),
  }
}
