# BrainBite v2.0

BrainBite is a local-first educational PWA with 30 missions across Number Nebula, Wordwood, and Spanish Portal, plus one boss per world. It supports keyboard and touch play, profiles, progression, stars, Spark, Bite unlocks, cosmetics, adaptive review, Memory Drops, Practice Lab, parent-reviewed Snap-to-Game, parent controls, save recovery, accessibility preferences, audio, offline play, and optional parent-authenticated Firebase sync.

## Run locally

Requirements: Node.js 20 or newer.

```powershell
npm install
npm run serve
```

Open `http://127.0.0.1:8080`. Run the complete release gate with:

```powershell
npm run release:check
```

## Firebase setup

Use a dedicated Firebase project for BrainBite. Enable Email/Password Authentication and create a Firestore database. Install the Firebase CLI, sign in, select only the dedicated project, then deploy the included rules:

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules --config firebase/firebase.json
```

In BrainBite, open Integrations, select Firebase, and enter the Firebase Project ID and public Web API key. These browser values are expected to be public; never add Admin SDK credentials or a service-account JSON file to the app.

Before launch, run the real-project two-browser procedure in `MANUAL_LAUNCH_GATES.md`. The automated suite verifies the same client flow against a controlled Firebase REST contract, but does not substitute for testing the deployed project and rules.

## Data and privacy

Gameplay is local-first. Cloud sync is opt-in and parent-authenticated. Snap-to-Game never treats extracted or generated answers as trusted: a parent must review topic, examples, correct answers, and distractors before saving. Account deletion deletes the signed-in family's cloud profile documents and then the Firebase Authentication account.

See `TEST_RESULTS.md`, `RELEASE_NOTES.md`, `MANUAL_LAUNCH_GATES.md`, and `DEPLOYMENT.md` for release evidence and launch steps.
