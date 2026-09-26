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

export function todayDate(today = new Date()) {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function getAge(birthday, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null
  const [year, month, day] = birthday.split('-').map(Number)
  const birthDate = new Date(year, month - 1, day)
  if (year < 1900 || birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day || birthday > todayDate(today)) return null
  const birthdayIsAhead = today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)
  return today.getFullYear() - year - Number(birthdayIsAhead)
}

export function emptyProfile() {
  return {
    name: '', username: '', birthday: '', nationality: '',
    university: UNIVERSITY, residence: '', year: '', major: '',
    hobbies: [], sports: [], email: '', password: '',
  }
}

export function validateStep(step, profile, options, today = new Date()) {
  const errors = {}
  if (step === 0) {
    if (!profile.name.trim()) errors.name = 'Please enter your name.'
    else if (profile.name.trim().length > 80) errors.name = 'Use 80 characters or fewer.'
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(profile.username.trim())) errors.username = 'Use 3–24 letters, numbers, or underscores.'
    if (getAge(profile.birthday, today) === null) errors.birthday = 'Choose a valid birthday between 1900 and today.'
    if (!options.countries.some((country) => country.code === profile.nationality)) errors.nationality = 'Choose a country from the list.'
  }
  if (step === 1) {
    if (profile.university !== UNIVERSITY) errors.university = 'Choose the University of British Columbia.'
    if (!options.residences.some((residence) => residence.value === profile.residence)) errors.residence = 'Choose your residence or off-campus housing.'
    if (!/^[1-6]$/.test(String(profile.year))) errors.year = 'Choose your year, from 1st to 6th.'
    if (!options.majors.some((major) => major.value === profile.major)) errors.major = 'Choose a major from the list.'
  }
  if (step === 3) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) || profile.email.trim().length > 254) errors.email = 'Enter a valid email address.'
    if (profile.password.length < 8 || profile.password.length > 128) errors.password = 'Use a password with 8–128 characters.'
  }
  return errors
}

export function registrationPayload(profile) {
  return {
    ...profile,
    name: profile.name.trim(),
    username: profile.username.trim().toLowerCase(),
    year: Number(profile.year),
    email: profile.email.trim().toLowerCase(),
  }
}

export function stepForField(field) {
  if (['name', 'username', 'birthday', 'nationality'].includes(field)) return 0
  if (['university', 'residence', 'year', 'major'].includes(field)) return 1
  if (['hobbies', 'sports'].includes(field)) return 2
  return 3
}
