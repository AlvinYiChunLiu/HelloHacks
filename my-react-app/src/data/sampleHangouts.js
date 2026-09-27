function upcomingTime(daysFromToday, hour, minute = 0, durationHours = 2) {
  const start = new Date()
  start.setDate(start.getDate() + daysFromToday)
  start.setHours(hour, minute, 0, 0)
  if (start <= new Date()) start.setDate(start.getDate() + 1)
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)
  return { startsAt: start.toISOString(), endsAt: end.toISOString() }
}

// Fictional demo meetups with approximate UBC campus coordinates.
export const SAMPLE_HANGOUTS = [
  {
    id: 'demo-study-sprint',
    title: 'Midterm Study Sprint',
    location: 'Irving K. Barber Library',
    displayLocation: 'Irving K. Barber Library, UBC',
    latitude: 49.2678511,
    longitude: -123.2530875,
    ...upcomingTime(0, 18, 0, 2),
    description: 'A quiet study session with snack breaks. Bring the class you are working on.',
    author: { name: 'Maya Chen', nationality: 'CA' },
  },
  {
    id: 'demo-rec-centre-games',
    title: 'Pickup Badminton / Volleyball',
    location: 'Student Recreation Centre (SRC)',
    displayLocation: 'Student Recreation Centre, UBC',
    latitude: 49.2683,
    longitude: -123.24894,
    ...upcomingTime(1, 14, 0, 2),
    description: 'We will decide between badminton and volleyball when we get there. All levels welcome.',
    author: { name: 'Rafi Ahmed', nationality: 'BD' },
  },
  {
    id: 'demo-boba-nest',
    title: 'Boba & Chat',
    location: 'The AMS Nest',
    displayLocation: 'AMS Student Nest, UBC',
    latitude: 49.2665534,
    longitude: -123.249839,
    ...upcomingTime(2, 17, 30, 1.5),
    description: 'Grab a drink and meet a few friendly faces after class.',
    author: { name: 'Lin Zhang', nationality: 'CN' },
  },
]
