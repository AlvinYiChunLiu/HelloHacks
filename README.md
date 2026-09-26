# HelloHacks / InterBuddies

A full-stack social onboarding prototype for UBC students to create a profile, share interests, and discover common ground with potential study or social buddies.

## Overview

This repository contains a small React + Vite frontend and an Express + SQLite backend that together power a profile-creation flow for a student-driven friendship app.

The main experience is a guided onboarding flow where users can:

- create a profile with personal and campus details
- select hobbies, sports, and interests
- provide social handles
- set account credentials
- submit the profile to the backend for validation and storage

## Features

- welcome screen and onboarding navigation
- profile form with multi-step validation
- country, residence, and major selection
- interest and sports selection
- social media search and username collection
- duplicate email/username handling
- secure password hashing before database storage
- SQLite-backed profile persistence

## Getting started

### 1) Install the backend dependencies

```bash
cd backend
npm install
```

### 2) Start the backend

```bash
npm start
```

### 3) Install the frontend dependencies

Open a second terminal and run:

```bash
cd my-react-app
npm install
```

### 4) Start the frontend

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Notes

This project is a prototype and demo app, with the main page and full sign-in flow still being expanded beyond the current onboarding and registration experience.
