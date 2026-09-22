# BrainBite v2.0

BrainBite is a local-first educational game packaged as an installed Windows app. Its current game runtime uses JavaScript and Three.js inside a locked-down Tauri/WebView2 shell; the PWA-compatible browser surface is retained only for development and automated testing. The game supports keyboard and touch play, profiles, progression, adaptive review, rewards, parent controls, save recovery, accessibility preferences, audio, offline play, and optional parent-authenticated Firebase sync.

## Browser development only

Requirements: Node.js 20 or newer.

```powershell
npm install
npm run serve
```

Open `http://127.0.0.1:4317`. Run the complete release gate with:

```powershell
npm run release:check
```

## Run as a Windows app

The production Windows package is a Tauri 2/WebView2 app. It loads the same verified runtime from bundled assets and does not start or connect to a localhost web server. The local HTTP server above remains available only for browser development and automated tests.

Requirements: the Node.js requirement above, the stable Rust MSVC toolchain, Microsoft C++ Build Tools, and WebView2 (included with supported Windows versions).

```powershell
npm install
npm run native:verify
npm run native:dev
```

Build the current-user NSIS installer and prove the built process does not bind a TCP listening port:

```powershell
npm run native:build
npm run native:verify:runtime
```

The installer is written beneath `src-tauri/target/release/bundle/nsis/`. Optional Firebase sync still makes outbound HTTPS requests when a parent configures it; that is unrelated to serving the app itself.

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

Gameplay is local-first. Cloud sync is opt-in and parent-authenticated, and sends only a minimized progress projection. Worksheet images and worksheet text are never synchronized. Parent PIN verifiers, play-time ledgers, integration credentials, and authentication tokens remain device-local. Parent-authorized recovery exports are versioned and may preserve legacy Snap-to-Game records created by earlier builds. Account deletion deletes the signed-in family's cloud profile documents and then the Firebase Authentication account.

See `TEST_RESULTS.md`, `RELEASE_NOTES.md`, `MANUAL_LAUNCH_GATES.md`, and `DEPLOYMENT.md` for release evidence and launch steps.
