# BrainBite Batch 8 External Launch Plan

Date: 2026-08-28

## Purpose

The in-repo release gate is green. Batch 8 is the first phase that requires external systems, real devices, and production validation. The goal is to prove the shipped snapshot works outside the local automated harness and to close the remaining launch blockers in order.

## Batch Structure

### 8.1 Real Git Checkout

- Clone `https://github.com/1983stevec-gif/BrainBite` into a real git worktree.
- Confirm branch, remote, and clean status.
- Run `npm ci`.
- Run `npm run release:check`.

Pass gate:
- all validators pass
- all unit tests pass
- all Playwright tests pass

### 8.2 Production Firebase Setup

- Create or confirm the dedicated BrainBite Firebase project.
- Enable Email/Password Auth.
- Create Firestore.
- Deploy `firebase/firestore.rules`.
- Configure the public Web API key and Project ID in the app.

Pass gate:
- parent sign-in works in the production project
- family-scoped documents are created under the expected path
- no cross-family reads are possible

### 8.3 Two-Session Sync

- Sign in as the same parent on two browser sessions.
- Create or update one learner in session A.
- Push to cloud.
- Pull in session B.
- Confirm the same family data merges once and only once.

Pass gate:
- push succeeds
- pull succeeds
- duplicate sync events do not duplicate progress

### 8.4 Real Device Matrix

Run the launch checklist on:

- Android Chrome phone
- Android Chrome tablet
- iPhone Safari
- iPad Safari
- Windows Chrome
- Windows Edge
- Chromebook Chrome

For each device:

- first load
- PWA install where supported
- offline reload
- touch or keyboard control
- profile persistence
- save/recovery
- accessibility settings
- audio behavior

Pass gate:
- no blocker on a required supported device
- no P0 or P1 regression on the launch-critical path

### 8.5 External Review

- Educator review of mission correctness and age fit.
- Fluent Spanish review of Spanish content.
- Legal review of privacy, terms, consent, retention, export, and deletion.
- Screen-reader QA on real assistive tech.

Pass gate:
- no unresolved critical review blockers

### 8.6 Production Readiness

- Verify production domain and HTTPS.
- Verify support contact and launch URLs.
- Confirm account deletion and export behavior in the production environment.
- Confirm release notes and final handoff are aligned with actual verification evidence.

Pass gate:
- no launch blockers remain
- final launch checklist is fully closed

## Recommended Execution Order

1. Real git checkout
2. `npm ci`
3. `npm run release:check`
4. Firebase production setup
5. Two-session cloud sync
6. Device matrix
7. External review
8. Production readiness

## Reuse Rule

Do not add new in-repo gameplay scope during Batch 8 unless a launch blocker proves it is necessary. The work here is validation, deployment, and evidence gathering.

## Acceptance Summary

Batch 8 is complete only when:

- the real checkout is clean
- production sync works
- device matrix is verified
- external reviews are closed
- launch checklist is closed
- no P0/P1 blockers remain

## Next After Batch 8

If Batch 8 passes, the next phase is not broad feature expansion. It is either:

- release polishing from real evidence
- post-launch defect burn-down
- or a new feature batch justified by launch data
