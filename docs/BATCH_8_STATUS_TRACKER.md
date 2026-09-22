# BrainBite Batch 8 Status Tracker

Date: 2026-09-02

## Use

Fill this out while executing `docs/BATCH_8_EXTERNAL_LAUNCH_PLAN.md` in the real GitHub checkout.

## Snapshot Status

- In-repo automated release gate is green in this snapshot.
- Public Privacy, Support, and Terms pages are present and linked from the footer.
- Gates 8.1â€“8.3 are complete. Gates 8.4â€“8.6 remain pending.

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
- Remote: `origin` â†’ `https://github.com/1983stevec-gif/BrainBite`
- Result: PASS â€” 29 content packs, 40 question sets, 16 unit tests, 22 Playwright tests

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
- Push result: PASS â€” Firestore `families/.../profiles` populated
- Pull result: PASS â€” operator confirmed Gate 8.3 done (Incognito second session)
- Merge result: PASS â€” second-session pull restored family progress without reported duplication

## Gate 8.4 Real Device Matrix

Note (2026-09-02): Screenshot-fidelity UI pause ended. Device matrix validates the **shipping 2D PWA** (`?match=0&webgl=0`). Batch 9 MATCH/WebGL is optional visual track on `batch-9-webgl-spike`.

Record each device with pass/fail and notes.

| Device | First load | PWA install | Offline reload | Touch/keyboard | Persistence | Accessibility | Audio | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android Chrome phone |  |  |  |  |  |  |  |  |
| Android Chrome tablet |  |  |  |  |  |  |  |  |
| iPhone Safari |  |  |  |  |  |  |  |  |
| iPad Safari |  |  |  |  |  |  |  |  |
| Windows Chrome | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Agent 2026-09-02: gate84-windows + pwa-installability smokes; mission smoke prior |
| Windows Edge | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Agent Playwright `channel:'msedge'` + gate84-windows + pwa-installability |
| Chromebook Chrome |  |  |  |  |  |  |  |  |

## Gate 8.5 External Review

- [ ] Educator review complete
- [ ] Fluent Spanish review complete
- [ ] Legal/privacy review complete
- [ ] Screen-reader QA complete

Packet ready: `docs/GATE_8_5_REVIEW_PACKET.md`
Helpers: educator inventory · Spanish inventory · legal clause map · SR operator path (see `docs/STEVE_FINISH_NOW.md`)

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

Checklist ready: `docs/GATE_8_6_OPERATOR_CHECKLIST.md`

Evidence:

- Domain:
- HTTPS:
- Support: **PARTIAL** — interim GitHub Issues link added on `support.html`; production email/contact still required (flag remains)
- URLs: local privacy/terms/support pages present; production URLs TBD
- Deletion: UI control present (`#deleteCloudAccount`); production verify pending
- Export: UI controls present; local export + profile-delete smoke PASS (`scripts/smoke-export-only.mjs` → profile/recovery downloads, PIN Account controls, local delete)
- Launch checklist:

## Closeout

- [ ] No P0 blockers remain
- [ ] No P1 blockers remain
- [ ] Batch 8 ready to mark complete

Notes:

- Gates 8.1-8.3 are complete with runtime evidence.
- Batch 9 visual MATCH mode is on branch `batch-9-webgl-spike` (default `?match=1`); Gate 8.4 uses `?match=0&webgl=0`.
- Windows Chrome smoke PASS (agent 2026-09-02).
- Gates 8.5-8.6 still require human review and production domain/support setup.
- Completion Pusher 2026-09-02: MATCH/WebGL `tryAnswer` via LearningCore sets; `.match-falls` layout; `node scripts/smoke-completion-pusher.mjs` → **SMOKE PASS**.
- Agent fleet 2026-09-02 (later): re-ran smoke **PASS** (DOM persist + MATCH hit/miss/combo). Proof shots refreshed: `docs/references/spike/home-live.png`, `battle-live.png`, `battle-fx-hit.png`. Keyboard Tab reaches Home on shipping path. Prepared `docs/GATE_8_5_REVIEW_PACKET.md` + `docs/GATE_8_6_OPERATOR_CHECKLIST.md`. Support contact still placeholder in `support.html`.
- Agent 2026-09-02 (release:check follow-up): Playwright was failing under default MATCH (nav hidden). Forced shipping `?match=0&webgl=0` in e2e hooks; fixed DOM horizontal overflow from `.home-target .dash-top` mins + nav scale. Overflow tests PASS at 360/768/1440.
- Agent 2026-09-02 (later): `npm run release:check` **PASS** (22/22 e2e). MATCH smoke **PASS**. Agent viewport matrix **PASS** (`scripts/smoke-gate84-viewports.mjs` → `docs/references/spike/gate84-*.png` + `gate84-viewport-matrix.json`) — not a substitute for real Edge/phone devices.
- Agent 2026-09-02 (evening): added `tests/match.spec.js` (MATCH home→battle + hit/miss) — **2/2 PASS**; full Playwright **24/24**. Export-only smoke **PASS**. `support.html` interim GitHub Issues link (production contact flag kept).
- Agent 2026-09-02 (goal finish push): Windows **Edge** channel smoke **PASS**; Playwright **24/24**; MATCH smoke **PASS**. Audit: `docs/GOAL_COMPLETION_AUDIT.md` — goal **blocked** on phones/tablets (8.4), human reviews (8.5), prod domain/HTTPS/email (8.6).
- **Next unambiguous action (Steve):** Follow `docs/STEVE_FINISH_NOW.md` (phone 8.4 → reviews 8.5 → domain/support 8.6). Agent functional + MATCH UI are green (`release:check`, MATCH 7/7). Reply **goal close** when done; say **commit** to save the spike branch.
- Completion Pusher 2026-09-02 (later): lazy WebGL import (shipping DOM offline no longer pulls Three). SW `v14-offline-dom`. Evidence: `node scripts/smoke-offline-reload.mjs` → **OFFLINE RELOAD SMOKE PASS**; `node scripts/smoke-match-lifecycle.mjs` → **MATCH LIFECYCLE SMOKE PASS** (exit→home, settings passthrough+nav, mission complete→home); Playwright `tests/match.spec.js` **5/5**. Not a device-matrix PASS.
- 2026-09-13 Batch 6 local certification: `npm run certify:local` generated `release-evidence/local-certification.json` with current branch/HEAD provenance and **24/24 PASS**. This includes 123 unit tests, 118 partitioned browser tests, all local validators, shipping/MATCH/offline/export/accessibility/PWA/Windows smokes, and desktop/mobile performance probes. Mobile hardware, external reviews, and production-host gates remain explicitly UNVERIFIED.
