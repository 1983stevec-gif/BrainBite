# BrainBite Firebase Setup

1. Create a dedicated Firebase project named BrainBite.
2. Add a Web App in Firebase Project Settings.
3. Enable Authentication → Email/Password.
4. Create Firestore Database.
5. Deploy `firestore.rules`.
6. Copy the Firebase Project ID and Web API key.
7. In BrainBite → Integrations, choose Firebase and enter those public web values.
8. In Account & Sync, create/sign in to the parent account.
9. Push Cloud Sync.

Never put a Firebase service-account JSON or Admin SDK private key in the browser app.
