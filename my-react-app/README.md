# InterBuddies

A React + Vite app for meeting people at UBC Vancouver.

## Run locally

From the repository root, start the frontend:

```sh
cd my-react-app
npm install
npm run dev
```

Open the URL printed by Vite. Choose **Sign in** and use username `dev` and password `dev` to explore the dashboard and edit a sample profile. You can also use **Explore with the dev profile** on the sign-in page. This preview works without the backend.

Actual registration still requires the existing backend, which you can start in another terminal from the repository root:

```sh
cd backend
npm install
npm start
```

Vite forwards `/api` requests to `http://127.0.0.1:5000` in development and preview. For deployment, configure the host to forward `/api` to the backend as well.

## Current flow

- `#/`: Welcome page with Create profile and Sign in.
- `#/create-profile`: Seven steps: favorite color; About you (name, username, profile picture, and gender); Nationality (country and languages); UBC Vancouver campus details; optional hobbies/sports; optional social media; then password.
- `#/main`: Three columns of fictional buddies with the same nationality, sports, or hobbies, plus an editable profile panel. **Find buddy** opens filters for nationality, campus details, interests, languages, and social platforms. Cards open profile previews; messaging is not implemented.
- `#/edit-profile`: Edit the same six public-profile sections, including picture, gender, country, languages, and social accounts. Saving refreshes the dashboard and its matches.
- `#/sign-in`: Frontend test login with `dev` / `dev`. Real account sign-in is still pending.

Signup starts with a neutral page and 30 visible color swatches. Choosing a color immediately themes signup, profile editing, and the dashboard; the welcome page keeps its original colors. Theme controls use contrasting text for light and dark choices. Subtle entrance and hover animations respect reduced-motion preferences.

About you supports a local photo or one of five smiley expressions. Photos are resized to a square thumbnail in the browser and never uploaded. Gender has Male, Female, and Prefer not to choices; the private choice adds no gender row to public profiles. Country and multiple spoken languages are collected in the separate Nationality step. Selected social platforms and usernames appear in the profile panel and buddy previews, with a compact summary on cards.

Registration uses the existing `POST /api/profiles` integration and generated account-email convention. Favorite color, languages, gender, and avatar are retained by the frontend without adding fields to the registration API payload. The backend stores campus details and interests for account profiles.

Active profiles and edits are stored in `sessionStorage` for the current browser tab. Reloading retains the active profile; signing out clears it. Profile edits do not update backend records or account credentials. Passwords are never stored in browser storage. Signup drafts also persist in this tab, excluding the password. Reloading or returning to signup restores the answers and current step; successful registration or Start over clears the draft. Edit mode starts on About you and offers Save changes or Cancel from every section.

## Discovery features

- **For you** keeps the three matching columns. **Everyone** browses all profiles; **Saved** collects bookmarked people.
- Search across names, usernames, countries, majors, residences, interests, languages, and social handles. Searches ignore case and accents and support multiple words.
- Quick choices for a shared residence, major, or language; full filters with a live result count; removable filter chips; sorting by shared details or name.
- Bookmarks stay in the current browser tab, scoped to the profile ID. They survive reloads, editing, and signing back into the same profile during that tab session.
- Profile previews show all interests, shared details, and copyable social handles. Conversation starters are generated locally from shared interests and can be copied; nothing is sent to another person.
- Larger mobile controls, keyboard focus styles, a skip-to-content link, reduced-motion support, and a profile review before completing signup.

## Where to make changes

- `src/App.jsx` and `src/App.css`: Welcome page, navigation, and shared layout.
- `src/pages/MainPage.jsx` and `.css`: Buddy columns, profile panel, and buddy previews.
- `src/pages/CreateProfile.jsx` and `.css`: Signup and profile editing.
- `src/components/ProfileColorPicker.jsx`, `LanguagePicker.jsx`, and `SearchSelect.jsx`: Profile selectors.
- `src/components/ProfileAvatar.jsx`, `ProfilePicturePicker.jsx`, and `SmileyFace.jsx`: Local photo selection and five smiley expressions.
- `src/components/ProfileSocials.jsx` and `CountryFlag.jsx`: Shared social-account and nationality displays.
- `src/theme.css` and `src/lib/theme.js`: Scoped personal themes, readable color variants, and motion.
- `src/lib/profile.js`: Profile validation and form helpers.
- `src/lib/profileSession.js`: Public profile session storage and the dev profile.
- `src/lib/buddies.js`: Nationality and interest matching.
- `src/lib/discovery.js`: Search, filter chips, bookmarks, and conversation starters.
- `src/lib/registrationDraft.js`: Signup recovery without credentials.
- `src/enhancements.css`: Dashboard, responsive controls, profile previews, and onboarding refinements.
- `src/data/sampleBuddies.js`: 21 fictional UBC Vancouver profiles.
- `src/data/profileOptions.js`: The 30 profile colors and language choices.
- `src/data/`: Bundled country, UBC residence, and program lists with source notes.

The country picker includes countries and territories. Residence and major lists cover UBC Vancouver; off-campus and undeclared choices are also available. Program lists are bundled, so they should be reviewed as UBC updates its offerings.

Flags load from [FlagCDN](https://flagpedia.net/download/api) using country codes. If an image cannot load, its country code appears instead. Sample profiles and matching run locally.

## Frontend checks

```sh
npm run build
npm run lint
npm test
```
