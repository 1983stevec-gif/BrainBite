# BrainBite Release Evidence

Date: 2026-09-02

## Automated Gate

Latest verified command:

```powershell
cd D:\Codex\Brainbite
npm ci
npm run release:check
```

Result: PASS on 2026-09-02 in the real GitHub checkout.

Verified in this checkout:

- 29 content packs and 40 question sets validated.
- 16 unit tests passed.
- 22 Playwright release tests passed.
- Runtime, release, launch, final hardening, Firebase, and Firebase security validators passed.
- Public policy pages for Privacy, Support, and Terms are present, linked from the footer, and labeled for launch review.

## Current Git State

- Checkout: `D:\Codex\Brainbite`
- Branch: `main`
- Remote: `origin` → `https://github.com/1983stevec-gif/BrainBite`
- Push state: pushed and clean on 2026-09-02

## Batch 8 Progress

- Gate 8.1 Real Git Checkout: **PASS**
- Gate 8.2 Production Firebase Setup: **PASS** (`brainbite-prod`, Email/Password, rules, Integrations, Push created `families/{uid}/profiles`)
- Gate 8.3 Two-Session Sync: **PASS** (operator-confirmed second-session pull)
- Gate 8.4 Real Device Matrix: **PENDING**
- Gate 8.5 External Review: **PENDING**
- Gate 8.6 Production Readiness: **PENDING**

Batch 8 is not complete until gates 8.4–8.6 are closed with runtime evidence.

## Verified Product Surface

- Profile flow and profile isolation.
- BrainBase progression and upgrade persistence.
- Number Nebula, Wordwood, and Spanish Portal mission lists.
- 30 missions and 3 boss encounters.
- Target Smash, Letter Trail, and Knowledge Platforms.
- Adaptive LearningCore, remediation, and spaced review.
- Reward idempotency.
- Local save, backup, recovery snapshot, corrupt-save fallback, and legacy migration.
- Offline queue replay and duplicate-event rejection.
- PWA manifest, service-worker cache boundary, and offline reload.
- Parent-authenticated Firebase flow against mocked REST contracts.
- Accessibility settings, focus behavior, 200% zoom, and automated WCAG scan.
- Low-end device detection and Performance mode hint.
- Launch policy pages and footer links for Privacy, Support, and Terms.

## Remaining External Gates

- Real Firebase project setup and two-device sync.
- Account deletion against the production Firebase project.
- Real phone/tablet install, touch, audio, offline/reconnect, and orientation checks.
- Screen-reader QA.
- Educator curriculum review.
- Fluent Spanish review.
- Legal/privacy/terms/support review.
- Production domain, HTTPS, and support contact verification.

## Cursor Continuation Rule

Cursor should run `npm ci` and `npm run release:check` in the real GitHub checkout before editing. If the gate is green, continue with Batch 8: external launch validation and real-device certification. If any automated gate fails, fix that blocker before adding new scope.
