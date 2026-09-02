# Exact Deployment Steps

## 1. Validate

```powershell
npm ci
npm run release:check
```

## 2. Configure Firebase

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules --config firebase/firebase.json
```

Choose only the dedicated BrainBite Firebase project. Enable Email/Password Authentication and Firestore in Firebase Console. Do not copy service-account credentials into this repository.

## 3. Deploy the static PWA

Deploy the repository root as static files over HTTPS. No build transformation is required. For Firebase Hosting, add Hosting configuration to the dedicated project, set the public directory to `.`, exclude `node_modules`, `tests`, `scripts`, and Markdown files, then run:

```powershell
firebase deploy --only hosting,firestore:rules --config firebase/firebase.json
```

Alternatively, use the included `deploy/vercel.json` or `deploy/netlify.toml`, with the app root as the publish directory.

## 4. Production acceptance

Open the production HTTPS URL in two independent browser profiles, complete every external and human gate in `MANUAL_LAUNCH_GATES.md`, verify offline reload after one online visit, and confirm the current service worker controls the page. Roll back hosting if any P0/P1 gate fails.
