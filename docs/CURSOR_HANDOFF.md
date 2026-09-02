# BrainBite Cursor Handoff

## Repo State

- Product: BrainBite
- Type: local-first educational PWA
- Current verified state: release gate green in real checkout
- Source repo: `https://github.com/1983stevec-gif/BrainBite`
- Real checkout: `D:\Codex\Brainbite`
- Branch: `main`
- Remote: `origin`
- Push state: pushed and clean as of 2026-09-02
- Batch 8: Gate 8.1 complete; gates 8.2–8.6 pending external validation

## What This App Is

BrainBite is a browser-based child learning app with:

- 30 missions across 3 worlds:
  - Number Nebula
  - Wordwood
  - Spanish Portal
- one boss per world
- profile isolation
- local save + backup + recovery snapshot
- offline queue and replay
- Firebase Auth/Firestore support for parent sync
- accessibility settings
- Practice Lab
- Snap-to-Game
- BrainBite Lab

## Important Files

- `app.js` - browser app, UI, missions, profiles, save, sync, accessibility
- `brainbite-core.mjs` - learning core, recovery, challenge generation, validation, offline replay
- `index.html` - app shell and screens
- `styles.css` - responsive UI and accessibility/low-end styling
- `tests/core.test.mjs` - unit coverage
- `tests/release.spec.js` - browser/release coverage
- `scripts/validate-*.mjs` - release validators
- `firebase/firebase.json` and `firebase/firestore.rules` - Firebase deployment and security

## Verified Behavior

- Boot works without runtime errors
- All 30 missions and all 3 bosses launch and complete
- Profile isolation works
- Save/load, backup recovery, and recovery snapshot fallback work
- Offline queue dedupes and replays exactly once
- Low-end device detection and performance-tier styling work
- Accessibility checks pass
- PWA offline reload passes
- Firebase family isolation passes in mocked browser tests

## Architecture Summary

- Presentation is browser-native PWA, not Unity
- `brainbite-core.mjs` is the presentation-independent learning foundation
- `app.js` is the browser shell and game loop
- `STORE` in `app.js` handles browser-local progress
- `SYNC` in `app.js` handles queued cloud sync events
- `brainbite-core.mjs` handles the adaptive learning graph, mastery, remediation, recovery, offline replay, and foundation state

## Exact Local Start Steps

1. Clone the source repo
```powershell
git clone https://github.com/1983stevec-gif/BrainBite
cd BrainBite
```

2. Install dependencies
```powershell
npm ci
```

3. Run the release gate
```powershell
npm run release:check
```

4. Start the app locally
```powershell
npm run serve
```

4. Open the local URL shown by the server
- usually `http://127.0.0.1:8080`

## Exact Verification Steps

1. Confirm the app loads
2. Confirm the main navigation buttons appear
3. Open `Number Nebula`, `Wordwood`, and `Spanish Portal`
4. Confirm mission lists render
5. Run one mission in each world
6. Confirm boss missions show boss UI
7. Switch profiles and confirm isolation
8. Open `Recovery`
9. Create backup
10. Corrupt primary save in localStorage
11. Reload and confirm recovery snapshot fallback
12. Open `Settings`
13. Toggle accessibility settings and confirm persistence
14. Confirm low-end class behavior using the release tests
15. Open `BrainBite Lab`
16. Simulate correct, incorrect, assisted, and random attempts
17. Confirm offline queue replay stays idempotent

## External Launch Steps

1. Create a dedicated Firebase project for BrainBite only
2. Enable Authentication `Email/Password`
3. Create Firestore
4. Deploy Firestore rules
5. Copy the Firebase Project ID and Web API key into BrainBite `Integrations`
6. Sign in as parent in `Account & Sync`
7. Push one profile to cloud
8. Open a second browser profile/session and pull the same account
9. Confirm same-family sync works
10. Open a third browser profile/session with a different parent account
11. Confirm cross-family data is absent
12. Delete a test account and confirm Firestore docs and Auth user are removed

## Firebase Commands

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules --config firebase/firebase.json
firebase deploy --only hosting,firestore:rules --config firebase/firebase.json
```

## Human Review Still Required

- educator review of mission correctness and age fit
- fluent Spanish review of Spanish content
- legal review of privacy, terms, consent, retention, export, and deletion
- screen-reader tests on real assistive tech
- real phone/tablet tests for touch, orientation, zoom, audio, install, offline/reconnect, reduced motion, and high contrast

## If Cursor Continues Editing

- Start from a fresh clone of `https://github.com/1983stevec-gif/BrainBite`
- Keep the app as a PWA unless a new requirement explicitly changes the platform
- Do not replace the learning core with presentation logic
- Do not weaken profile isolation or recovery behavior
- Do not add cloud dependencies to core gameplay
- Run `npm run release:check` after any risky change
- Prefer `apply_patch` for edits
- Do not overwrite existing user work

## Latest Automated Evidence

Latest verified command:

```powershell
npm run release:check
```

Result: PASS on 2026-09-02.

The evidence manifest is `release/v14-evidence.json`; the human-readable audit file is `docs/RELEASE_EVIDENCE.md`.

## Current Recommended Next Work

Batch 8 Gate 8.1 is complete. Continue with **Gate 8.2 Production Firebase Setup** in `docs/BATCH_8_EXTERNAL_LAUNCH_PLAN.md`:

1. Create or confirm the dedicated BrainBite Firebase project.
2. Enable Email/Password Auth and Firestore.
3. Deploy `firebase/firestore.rules`.
4. Enter Project ID and Web API key in BrainBite Integrations.
5. Run the two-session sync checklist in `docs/V13_TWO_DEVICE_FIREBASE_TEST.md`.

Do not mark Batch 8 complete until gates 8.2–8.6 have runtime evidence.
