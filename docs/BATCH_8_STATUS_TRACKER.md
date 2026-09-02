# BrainBite Batch 8 Status Tracker

Date: 2026-09-02

## Use

Fill this out while executing `docs/BATCH_8_EXTERNAL_LAUNCH_PLAN.md` in the real GitHub checkout.

## Snapshot Status

- In-repo automated release gate is green in this snapshot.
- Public Privacy, Support, and Terms pages are present and linked from the footer.
- External launch gates below remain pending until the real GitHub checkout and production systems are available.

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

- [ ] Dedicated Firebase project confirmed
- [ ] Email/Password Auth enabled
- [ ] Firestore created
- [ ] `firebase/firestore.rules` deployed
- [ ] App configured with production Project ID and Web API key

Evidence:

- Project ID:
- Auth status:
- Rules deploy result:
- App config result:

## Gate 8.3 Two-Session Sync

- [ ] Session A signed in
- [ ] Session B signed in
- [ ] Learner created or updated in session A
- [ ] Push to cloud succeeded
- [ ] Pull in session B succeeded
- [ ] Duplicate sync did not duplicate progress

Evidence:

- Account:
- Learner:
- Push result:
- Pull result:
- Merge result:

## Gate 8.4 Real Device Matrix

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

- Gate 8.1 is complete with runtime evidence in the real checkout.
- Gates 8.2–8.6 require production Firebase credentials, real devices, human review, and production domain/support setup.
- **Next unambiguous action:** execute Gate 8.2 using `docs/FIREBASE_SETUP_v10.md` and `config/integration-config.example.json`.
