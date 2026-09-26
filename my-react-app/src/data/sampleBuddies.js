import { UNIVERSITY } from '../lib/profile.js'

// Fictional students for exploring the interface. These are not real accounts.
const examples = [
  ['Maya Chen', 'CA', '2005-04-18', 'Orchard Commons', 2, 'Computer Science (BSc)', ['Photography', 'Cooking', 'Hiking'], ['Badminton', 'Swimming'], ['English', 'Mandarin Chinese'], '#8b5cf6', 'Always up for a photo walk and a new recipe.'],
  ['Noah Tremblay', 'CA', '2004-11-09', 'Marine Drive', 3, 'Economics', ['Live music', 'Books & reading', 'Cooking'], ['Soccer', 'Cycling'], ['English', 'French'], '#2563eb', 'Looking for concert buddies and casual soccer games.'],
  ['Amara Brooks', 'CA', '2006-02-21', 'Totem Park', 1, 'Psychology', ['Art & drawing', 'Photography', 'Volunteering'], ['Swimming', 'Volleyball'], ['English', 'French'], '#ec4899', 'Sketchbook in hand, exploring campus one corner at a time.'],
  ['Leo Martin', 'CA', '2003-07-12', 'Walter Gage', 4, 'Mechanical Engineering', ['Gaming', 'Board games', 'Technology'], ['Ice hockey', 'Running'], ['English'], '#059669', 'Board game evenings and weekend runs are my thing.'],
  ['Sofia Costa', 'BR', '2005-08-03', 'Place Vanier', 2, 'International Relations', ['Dancing', 'Cooking', 'Travel'], ['Soccer', 'Swimming'], ['Portuguese', 'English'], '#f97316', 'Let’s trade recipes and explore Vancouver together.'],
  ['Ren Ito', 'JP', '2004-06-24', 'Ritsumeikan-UBC House', 3, 'Film Production', ['Film & TV', 'Photography', 'Live music'], ['Badminton', 'Climbing'], ['Japanese', 'English'], '#0d9488', 'Finding little stories through film and photography.'],
  ['Aisha Khan', 'PK', '2005-12-07', 'Ponderosa Commons', 2, 'Biology', ['Books & reading', 'Cooking', 'Gardening'], ['Badminton', 'Tennis'], ['Urdu', 'English'], '#a855f7', 'Tea, books, and a friendly badminton match.'],
  ['Mateo Rivera', 'MX', '2006-01-14', 'Totem Park', 1, 'Commerce', ['Music & instruments', 'Live music', 'Cooking'], ['Soccer', 'Basketball'], ['Spanish', 'English'], '#dc2626', 'Learning guitar and looking for people to jam with.'],
  ['Elena Rossi', 'IT', '2003-09-30', 'Exchange', 4, 'Design in Architecture, Landscape Architecture, and Urbanism', ['Art & drawing', 'Photography', 'Travel'], ['Cycling', 'Swimming'], ['Italian', 'English'], '#d97706', 'I love drawing buildings and discovering quiet cafes.'],
  ['Kwame Mensah', 'GH', '2004-03-16', 'Brock Commons', 3, 'Electrical Engineering', ['Technology', 'Gaming', 'Live music'], ['Soccer', 'Running'], ['English', 'Akan'], '#0284c7', 'Building small projects and finding good live music.'],
  ['Yuna Park', 'KR', '2005-10-25', 'Orchard Commons', 2, 'Media Studies', ['Dancing', 'Photography', 'Film & TV'], ['Badminton', 'Volleyball'], ['Korean', 'English'], '#db2777', 'Dance practices, movie nights, and sunny photo walks.'],
  ['Arjun Rao', 'IN', '2004-05-11', 'Thunderbird', 3, 'Data Science', ['Cooking', 'Board games', 'Technology'], ['Badminton', 'Swimming'], ['Hindi', 'English', 'Telugu'], '#16a34a', 'Happy to teach a board game or learn your favourite dish.'],
  ['Lina Haddad', 'LB', '2005-03-05', 'Fairview Crescent', 2, 'Linguistics', ['Learning languages', 'Books & reading', 'Cooking'], ['Running', 'Tennis'], ['Arabic', 'French', 'English'], '#7c3aed', 'Language exchanges and conversations over coffee.'],
  ['Oskar Lind', 'SE', '2003-12-19', 'Fraser Hall', 4, 'Environmental Sciences', ['Hiking', 'Photography', 'Gardening'], ['Skiing', 'Swimming'], ['Swedish', 'English'], '#0891b2', 'Exploring trails and learning about local plants.'],
  ['Chloe Dubois', 'FR', '2006-06-08', 'Place Vanier', 1, 'Art History', ['Art & drawing', 'Live music', 'Writing'], ['Swimming', 'Cycling'], ['French', 'English'], '#e11d48', 'Museum afternoons and tiny notebook adventures.'],
  ['Diego Alvarez', 'CO', '2004-02-29', 'Marine Drive', 3, 'Civil Engineering', ['Cooking', 'Hiking', 'Music & instruments'], ['Soccer', 'Climbing'], ['Spanish', 'English'], '#ca8a04', 'Weekend hikes with good snacks and good company.'],
  ['Zara Okafor', 'NG', '2005-07-27', 'Ponderosa Commons', 2, 'Political Science', ['Volunteering', 'Live music', 'Books & reading'], ['Basketball', 'Badminton'], ['English', 'Igbo'], '#9333ea', 'A book recommendation is always a good conversation starter.'],
  ['Samir El Amrani', 'MA', '2003-04-02', 'Walter Gage', 4, 'Mathematics (BSc)', ['Photography', 'Board games', 'Travel'], ['Soccer', 'Tennis'], ['Arabic', 'French', 'English'], '#ea580c', 'Chess after class and photo walks on the weekend.'],
  ['Minh Nguyen', 'VN', '2006-09-15', 'Totem Park', 1, 'Food Science', ['Cooking', 'Gaming', 'Learning languages'], ['Badminton', 'Running'], ['Vietnamese', 'English'], '#0f766e', 'Trying a new recipe every week. Taste testers welcome!'],
  ['Grace Wilson', 'AU', '2004-08-22', 'Exchange', 3, 'Kinesiology', ['Hiking', 'Travel', 'Live music'], ['Swimming', 'Soccer', 'Volleyball'], ['English'], '#4f46e5', 'Here for ocean swims, trail days, and campus gigs.'],
  ['Emre Kaya', 'TR', '2005-01-06', 'Brock Commons', 2, 'Computer Engineering', ['Photography', 'Technology', 'Film & TV'], ['Basketball', 'Cycling'], ['Turkish', 'English'], '#be123c', 'Exploring the city through a camera lens.'],
]

export const SAMPLE_BUDDIES = examples.map(([
  name, nationality, birthday, residence, year, major, hobbies, sports, languages, favoriteColor, bio,
], index) => ({
  id: `sample-buddy-${index + 1}`,
  name,
  username: `sample_${name.toLowerCase().replaceAll(' ', '_')}`,
  nationality,
  birthday,
  university: UNIVERSITY,
  residence,
  year,
  major,
  hobbies,
  sports,
  languages,
  favoriteColor,
  bio,
}))
