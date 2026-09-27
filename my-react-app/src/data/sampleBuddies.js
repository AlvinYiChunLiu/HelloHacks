import { UNIVERSITY } from '../lib/profile.js'
import { SOCIAL_PLATFORMS } from './socialPlatforms.js'

// Fictional students for exploring the interface. These are not real accounts.
const examples = [
  ['Leo Martin', 'CA', 'Walter Gage', 4, 'Mechanical Engineering', ['Gaming', 'Board games', 'Technology'], ['Ice hockey', 'Running'], ['English'], '#059669', 'Board game evenings and weekend runs are my thing.'],
  ['Sofia Costa', 'BR', 'Place Vanier', 2, 'International Relations', ['Dancing', 'Cooking', 'Travel'], ['Soccer', 'Swimming'], ['Portuguese', 'English'], '#f97316', 'Let?™s trade recipes and explore Vancouver together.'],
  ['Ren Ito', 'JP', 'Ritsumeikan-UBC House', 3, 'Film Production', ['Film & TV', 'Photography', 'Live music'], ['Badminton', 'Climbing'], ['Japanese', 'English'], '#0d9488', 'Finding little stories through film and photography.'],
  ['Aisha Khan', 'PK', 'Ponderosa Commons', 2, 'Biology', ['Books & reading', 'Cooking', 'Gardening'], ['Badminton', 'Tennis'], ['Urdu', 'English'], '#a855f7', 'Tea, books, and a friendly badminton match.'],
  ['Mateo Rivera', 'MX', 'Totem Park', 1, 'Commerce', ['Music & instruments', 'Live music', 'Cooking'], ['Soccer', 'Basketball'], ['Spanish', 'English'], '#dc2626', 'Learning guitar and looking for people to jam with.'],
  ['Elena Rossi', 'IT', 'Exchange', 4, 'Design in Architecture, Landscape Architecture, and Urbanism', ['Art & drawing', 'Photography', 'Travel'], ['Cycling', 'Swimming'], ['Italian', 'English'], '#d97706', 'I love drawing buildings and discovering quiet cafes.'],
  ['Kwame Mensah', 'GH', 'Brock Commons', 3, 'Electrical Engineering', ['Technology', 'Gaming', 'Live music'], ['Soccer', 'Running'], ['English', 'Akan'], '#0284c7', 'Building small projects and finding good live music.'],
  ['Yuna Park', 'KR', 'Orchard Commons', 2, 'Media Studies', ['Dancing', 'Photography', 'Film & TV'], ['Badminton', 'Volleyball'], ['Korean', 'English'], '#db2777', 'Dance practices, movie nights, and sunny photo walks.'],
  ['Arjun Rao', 'IN', 'Thunderbird', 3, 'Data Science', ['Cooking', 'Board games', 'Technology'], ['Badminton', 'Swimming'], ['Hindi', 'English', 'Telugu'], '#16a34a', 'Happy to teach a board game or learn your favourite dish.'],
  ['Lina Haddad', 'LB', 'Fairview Crescent', 2, 'Linguistics', ['Learning languages', 'Books & reading', 'Cooking'], ['Running', 'Tennis'], ['Arabic', 'French', 'English'], '#7c3aed', 'Language exchanges and conversations over coffee.'],
  ['Oskar Lind', 'SE', 'Fraser Hall', 4, 'Environmental Sciences', ['Hiking', 'Photography', 'Gardening'], ['Skiing', 'Swimming'], ['Swedish', 'English'], '#0891b2', 'Exploring trails and learning about local plants.'],
  ['Chloe Dubois', 'FR', 'Place Vanier', 1, 'Art History', ['Art & drawing', 'Live music', 'Writing'], ['Swimming', 'Cycling'], ['French', 'English'], '#e11d48', 'Museum afternoons and tiny notebook adventures.'],
  ['Diego Alvarez', 'CO', 'Marine Drive', 3, 'Civil Engineering', ['Cooking', 'Hiking', 'Music & instruments'], ['Soccer', 'Climbing'], ['Spanish', 'English'], '#ca8a04', 'Weekend hikes with good snacks and good company.'],
  ['Zara Okafor', 'NG', 'Ponderosa Commons', 2, 'Political Science', ['Volunteering', 'Live music', 'Books & reading'], ['Basketball', 'Badminton'], ['English', 'Igbo'], '#9333ea', 'A book recommendation is always a good conversation starter.'],
  ['Samir El Amrani', 'MA', 'Walter Gage', 4, 'Mathematics (BSc)', ['Photography', 'Board games', 'Travel'], ['Soccer', 'Tennis'], ['Arabic', 'French', 'English'], '#ea580c', 'Chess after class and photo walks on the weekend.'],
  ['Minh Nguyen', 'VN', 'Totem Park', 1, 'Food Science', ['Cooking', 'Gaming', 'Learning languages'], ['Badminton', 'Running'], ['Vietnamese', 'English'], '#0f766e', 'Trying a new recipe every week. Taste testers welcome!'],
  ['Grace Wilson', 'AU', 'Exchange', 3, 'Kinesiology', ['Hiking', 'Travel', 'Live music'], ['Swimming', 'Soccer', 'Volleyball'], ['English'], '#4f46e5', 'Here for ocean swims, trail days, and campus gigs.'],
  ['Emre Kaya', 'TR', 'Brock Commons', 2, 'Computer Engineering', ['Photography', 'Technology', 'Film & TV'], ['Basketball', 'Cycling'], ['Turkish', 'English'], '#be123c', 'Exploring the city through a camera lens.'],
]

export const SAMPLE_BUDDIES = examples.map(([
  name, nationality, residence, year, major, hobbies, sports, languages, favoriteColor, bio,
], index) => ({
  id: `sample-buddy-${index + 1}`,
  name,
  username: `sample_${name.toLowerCase().replaceAll(' ', '_')}`,
  nationality,
  gender: ['female', 'male', 'prefer-not-to'][index % 3],
  university: UNIVERSITY,
  residence,
  year,
  major,
  hobbies,
  sports,
  languages,
  socialMedia: [...new Set([SOCIAL_PLATFORMS[index % SOCIAL_PLATFORMS.length], SOCIAL_PLATFORMS[(index * 3 + 2) % SOCIAL_PLATFORMS.length]])].map((platform) => ({ platform, username: `sample_${name.toLowerCase().replaceAll(' ', '_')}` })),
  favoriteColor,
  bio,
}))
