# Remaining Manual Launch Gates

Do not publicly launch until every item below is completed.

## EXTERNAL SETUP REQUIRED

1. Create a dedicated Firebase project containing only BrainBite data.
2. Enable Email/Password Authentication and Firestore.
3. Deploy the included rules and configure the web Project ID/API key.
4. In Browser A, create a parent account, add distinctive progress, and push.
5. In a separate Browser B profile/session, sign in to the same account, pull, and confirm exact profiles/progress.
6. In Browser C, sign in with a different account and confirm the first family's names and progress are absent. Confirm denied cross-family requests in browser/network or Firebase logs.
7. Delete a test account in BrainBite and confirm both its Firestore profile documents and Authentication user are gone.

## HUMAN REVIEW REQUIRED

- Educator review of mission correctness, age fit, and adaptive-review messaging.
- Fluent Spanish review of all Spanish content and speech prompts.
- Legal review of Privacy, Terms, child-data handling, consent flow, retention, export, and deletion.
- Screen-reader tests with NVDA/JAWS on Windows and VoiceOver on iOS/macOS.
- Real-device phone/tablet tests for touch, orientation, 200% zoom, audio, install, update, offline/reconnect, and OS reduced-motion/high-contrast behavior.
- Replace draft support details with the production support channel.

## SNAP-TO-GAME POLICY

Extraction is only a drafting aid. A parent must review and explicitly save the topic, examples, correct answers, and wrong answers. Never auto-publish extracted or generated answers to a child mission.
