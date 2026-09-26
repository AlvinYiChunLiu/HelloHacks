# InterBuddies

A React + Vite app for meeting people at UBC Vancouver.

## Run locally

Start the backend in one terminal:

```sh
cd backend
npm install
npm start
```

From the repository root, start the frontend in another terminal:

```sh
cd my-react-app
npm install
npm run dev
```

Open the URL printed by Vite. Both servers must be running to create a profile. Vite forwards `/api` requests to the backend at `http://127.0.0.1:5000` in development and preview. For deployment, configure the host to forward `/api` to the backend as well.

## Current flow

- `#/`: Welcome page with Create profile and Sign in.
- `#/create-profile`: Four steps: personal details, UBC Vancouver campus details, optional hobbies/sports, then email/password.
- `#/main`: Registration success and a placeholder for the future main page.
- `#/sign-in`: Placeholder only; sign-in and authenticated sessions are not implemented yet.

Profile creation calls `POST /api/profiles` and stores the profile in SQLite. The backend hashes passwords; passwords are never saved in browser storage. Answers stay in memory while moving between form steps and reset if you leave or reload the form. A successful registration clears the form by navigating to the main-page placeholder.

## Where to make changes

- `src/App.jsx` and `src/App.css`: Welcome page, page navigation, and shared layout.
- `src/pages/CreateProfile.jsx` and `.css`: Form steps, interactions, and styling.
- `src/components/SearchSelect.jsx`: Searchable country and major pickers.
- `src/lib/profile.js`: Age calculation, validation, and hobby/sport options.
- `src/data/`: Bundled country, UBC residence, and program lists with source notes.
- `../backend/profiles.js`: Registration validation and storage.

The country picker includes countries and territories. Residence and major lists cover UBC Vancouver; off-campus and undeclared choices are also available. Program lists are bundled, so they should be reviewed as UBC updates its offerings.

## Checks

```sh
npm run build
npm run lint
npm test
```

Run `npm test` from `backend` for the registration integration tests. Tests use isolated databases.
