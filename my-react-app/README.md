# InterBuddies

A React + Vite app for meeting people at UBC Vancouver.

## Run locally

From the repository root, start the frontend:

```sh
cd my-react-app
npm install
npm run dev
```

Open the URL printed by Vite. Choose **Sign in** and use username `dev` and password `dev` to explore the dashboard and edit a sample profile. This preview works without the backend.

Actual registration still requires the existing backend, which you can start in another terminal from the repository root:

```sh
cd backend
npm install
npm start
```

Vite forwards `/api` requests to `http://127.0.0.1:5000` in development and preview. For deployment, configure the host to forward `/api` to the backend as well.

## Current flow

- `#/`: Welcome page with Create profile and Sign in.
- `#/create-profile`: Six steps: favorite color; personal details and languages; UBC Vancouver campus details; optional hobbies/sports; optional social media; then password.
- `#/main`: Three columns of fictional buddies with the same nationality, sports, or hobbies, plus an editable profile panel. **Find buddy** cycles through matching sample profiles. Cards open profile previews; messaging is not implemented.
- `#/edit-profile`: Edit color, personal details, languages, campus details, interests, and social media. Saving refreshes the dashboard and its matches.
- `#/sign-in`: Frontend test login with `dev` / `dev`. Real account sign-in is still pending.

The 30-color picker sets only profile avatar rings; it does not recolor the website. Languages support multiple selections. The nationality column displays the active user's country flag.

Registration retains the existing `POST /api/profiles` integration and generated account-email convention. Favorite color, languages, and social media are retained by the frontend without changing that API payload. The backend is unchanged.

Active profiles and edits are stored in `sessionStorage` for the current browser tab. Reloading retains the active profile; signing out clears it. Profile edits do not update backend records or account credentials. Passwords are never stored in browser storage. Unsubmitted form answers stay in memory and reset when leaving or reloading the form.

## Where to make changes

- `src/App.jsx` and `src/App.css`: Welcome page, navigation, and shared layout.
- `src/pages/MainPage.jsx` and `.css`: Buddy columns, profile panel, and buddy previews.
- `src/pages/CreateProfile.jsx` and `.css`: Signup and profile editing.
- `src/components/ProfileColorPicker.jsx`, `LanguagePicker.jsx`, and `SearchSelect.jsx`: Profile selectors.
- `src/components/ProfileAvatar.jsx` and `CountryFlag.jsx`: Shared profile visuals.
- `src/lib/profile.js`: Age calculation, validation, and form helpers.
- `src/lib/profileSession.js`: Public profile session storage and the dev profile.
- `src/lib/buddies.js`: Nationality and interest matching.
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
