# BrainBite Batch 8 Status Tracker

Date: 2026-09-02

## Use

Fill this out while executing `docs/BATCH_8_EXTERNAL_LAUNCH_PLAN.md` in the real GitHub checkout.

## Snapshot Status

- In-repo automated release gate is green in this snapshot.
- Public Privacy, Support, and Terms pages are present and linked from the footer.
- Gates 8.1–8.3 are complete. Gates 8.4–8.6 remain pending.

## Gate 8.1 Real Git Checkout

- [x] Real clone created from `https://github.com/1983stevec-gif/BrainBite`
- [x] Branch confirmed
- [x] Remote confirmed
- [x] Clean status confirmed
- [x] `npm ci`
- [x] `npm run release:check`

Evidence:

- Commit: `331cea5` (verified again on 2026-09-02 after `npm ci` + `npm run release:check`)
- Branch: `main`
- Remote: `origin` → `https://github.com/1983stevec-gif/BrainBite`
- Result: PASS — 29 content packs, 40 question sets, 16 unit tests, 22 Playwright tests

## Gate 8.2 Production Firebase Setup

- [x] Dedicated Firebase project confirmed
- [x] Email/Password Auth enabled
- [x] Firestore created
- [x] `firebase/firestore.rules` deployed
- [x] App configured with production Project ID and Web API key

Evidence:

- Project ID: `brainbite-prod`
- Auth status: Email/Password enabled; parent account created and signed in from BrainBite
- Rules deploy result: rules deployed from `firebase/`; Firestore path created
- App config result: Integrations saved; Push to Cloud created `families/{uid}/profiles`
- Firestore path verified: `families/OvC2ntxWqkcHjZkDuHec4PSkUQk1/profiles`

## Gate 8.3 Two-Session Sync

- [x] Session A signed in
- [x] Session B signed in
- [x] Learner created or updated in session A
- [x] Push to cloud succeeded
- [x] Pull in session B succeeded
- [x] Duplicate sync did not duplicate progress

Evidence:

- Account: production Email/Password parent on `brainbite-prod`
- Learner: local profiles synced under family UID `OvC2ntxWqkcHjZkDuHec4PSkUQk1`
- Push result: PASS — Firestore `families/.../profiles` populated
- Pull result: PASS — operator confirmed Gate 8.3 done (Incognito second session)
- Merge result: PASS — second-session pull restored family progress without reported duplication

## Gate 8.4 Real Device Matrix

Note (2026-09-02): Screenshot-fidelity UI pause ended. Device matrix validates the **shipping 2D PWA**. True 3D match to approved references is tracked in `docs/BATCH_9_3D_PRESENTATION_PLAN.md` (WebGL presentation layer; not a Unity rewrite).

Record each device with pass/fail and notes.

| Device | First load | PWA install | Offline reload | Touch/keyboard | Persistence | Accessibility | Audio | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android Chrome phone |  |  |  |  |  |  |  |  |
| Android Chrome tablet |  |  |  |  |  |  |  |  |
| iPhone Safari |  |  |  |  |  |  |  |  |
| iPad Safari |  |  |  |  |  |  |  |  |
| Windows Chrome |  |  |  |  |  |  |  |  |
| Windows Edge |  |  |  |  |  |  |  |  |
| Chromebook Chrome |  |  |  |  |  |  |  |  |

## Gate 8.5 External Review

- [ ] Educator review complete
- [ ] Fluent Spanish review complete
- [ ] Legal/privacy review complete
- [ ] Screen-reader QA complete

Evidence:

- Educator result:
- Spanish result:
- Legal result:
- Screen-reader result:

## Gate 8.6 Production Readiness

- [ ] Production domain confirmed
- [ ] HTTPS confirmed
- [ ] Support contact confirmed
- [ ] Launch URLs confirmed
- [ ] Account deletion verified
- [ ] Export verified
- [ ] Final launch checklist closed

Evidence:

- Domain:
- HTTPS:
- Support:
- URLs:
- Deletion:
- Export:
- Launch checklist:

## Closeout

- [ ] No P0 blockers remain
- [ ] No P1 blockers remain
- [ ] Batch 8 ready to mark complete

Notes:

- Gates 8.1–8.3 are complete with runtime evidence.
- Screenshot-fidelity UI pause closed: true 3D match deferred to Batch 9 (`docs/BATCH_9_3D_PRESENTATION_PLAN.md`).
- Gates 8.5–8.6 still require human review and production domain/support setup.
- **Next unambiguous action:** resume Gate 8.4 device matrix on the shipping 2D PWA (or start Batch 9.0 WebGL spike).
