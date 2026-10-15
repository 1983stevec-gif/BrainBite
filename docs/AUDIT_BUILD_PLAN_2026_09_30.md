# Complete Audit and Build Plan — 2026-09-30

## Executive decision

BrainBite is a locally verified closed-beta candidate, but it is **not ready to publish or claim production account-erasure readiness**. The current branch has the prior audited implementation as uncommitted work. Local static, unit, browser, smoke, native-package, content, Firebase-structure, dependency, and performance checks pass. The remaining blockers are release hygiene, one missing privileged cloud-erasure path, and external owner gates.

This audit made no application-code changes. It adds this plan only.

## Baseline and scope

- Repository: `D:\Codex\Brainbite`
- Branch: `audit/verified-build-plan`
- HEAD: `1b8ef46 fix: complete audited review and release gate hardening`
- Working tree: 12 modified tracked files and 2 untracked paths:
  - Intended test addition: `tests/ocr-provider.test.mjs`
  - Coordination material: `.omnirush/` — do not commit as product source
- Runtime changes already present in the working tree include offline replay resilience, profile-bound games, save-generation validation, Firestore pagination, keyboard-focus recovery, OCR boundary hardening, accessibility status semantics, and strict Firebase-rule validation.
- This plan treats those changes as implementation to review, commit, and merge; it does not re-implement them.

## Current verification evidence

| Area | Command | Current result |
|---|---|---|
| Static/package integrity | `npm run check:static` | PASS; 100 staged files, 94 precached URLs, 100 manifest entries |
| Unit suite | `npm run test:unit` | **267/267 passed**, 0 failed/skipped |
| Content structure | `npm run check:content` | PASS; registry plus 29 packs and 70 question sets |
| Content-review gate | `npm run check:content-review` | PASS; 105 records, 0 digest mismatches |
| Pending educator identities | `npm run review:list --silent` | **75 pending** |
| Firebase structure/security | `npm run check:firebase`, `npm run check:firebase:security` | PASS |
| Firebase contract tests | `node --test tests/firebase-security-rules.test.mjs` | **25 passed, 1 skipped**; emulator unavailable locally |
| Runtime/release/launch/final validators | `npm run check:runtime`, `check:release`, `check:launch`, `check:final` | PASS |
| Dependency audit | `npm audit --omit=dev` | 0 vulnerabilities |
| Browser suite | `BRAINBITE_TEST_PORT=4329 npm run test:e2e` | **220/220 passed** |
| Smoke suite | `BRAINBITE_TEST_PORT=4329 npm run smoke` | **11/11 passed** |
| Native package | `npm run native:verify` | PASS; 100 runtime files, no loopback URL/listener/capability permissions |
| Native runtime listener check | `npm run native:verify:runtime` | PASS; no TCP listener observed |
| Payload | `npm run measure:payload` | 3,087 KB raw, 769 KB gzip, 374 KB Brotli |
| Performance | `npm run probe:performance` | PASS; 0 headless violations; device-only frame/long-task/scene-load signals remain unverified |
| Evidence provenance | `npm run check:evidence:ci` | PASS with foreign-checkout allowance |
| Diff/syntax | `git diff --check`, `node --check app.js`, `node --check integrations/ocr-provider.js` | PASS |

The local results above are not remote CI, physical-device certification, human review, production Firebase evidence, or publication evidence.

## Audit findings and priorities

### P0 — release cannot be claimed yet

1. **Working tree is not merge-ready.** The audited implementation and tests are uncommitted. `release:check` is intentionally a clean-tree gate; the final evidence must be regenerated and committed with the exact tested revision.
2. **Production cloud account erasure is not implemented by the client.** `app.js` attempts client-side profile deletion, while `firebase/firestore.rules` intentionally denies physical profile deletion to preserve tombstones. The UI therefore cannot complete “Delete Cloud Data & Account” for a family with profile documents. Do not weaken the rule. Implement a privileged, authenticated, audited backend erasure flow before claiming production deletion compliance.
3. **Firestore emulator evidence is missing locally.** The static rule contract passes, but one executable emulator test is skipped because `FIRESTORE_EMULATOR_HOST` is not configured. CI/emulator evidence is required before accepting the deployed rules.

### P1 — owner/release gates

4. **GitHub Pages is not enabled.** The deploy workflow cannot publish until the repository owner enables Pages with GitHub Actions.
5. **Educator review is open.** `review:list` reports 75 pending identities. No content approval should be fabricated by automation.
6. **Current documentation contains historical counts and ports.** Handoff/readiness text still contains older 255/211-style evidence and some operator URLs reference port 4317, while the current checks use 267 unit tests, 220 browser tests, and test port 4318. Documentation must be reconciled before it is used as a release record.
7. **Current remote CI is not proven for this dirty worktree.** Push the intended commit/PR and require CI to validate the exact revision before merge.

### P2 — external certification and distribution

8. Physical-device matrix remains open: Android phone/tablet, iPhone/iPad, Chromebook, and Windows Chrome/Edge operator checks.
9. Human screen-reader, Spanish fluency, legal/privacy, and production-domain/support reviews remain open.
10. Device-only performance signals are intentionally unverified. The probe reports 0 headless violations but frame pacing, long tasks, scene load, and asset load require real hardware.
11. The native installer is unsigned. `native:verify` proves the package boundary and no-listener property, not store distribution or signing readiness.

### P3 — deferred engineering

12. The OCR provider is hardened and unit-tested but is not imported/staged as a production runtime feature. If OCR is enabled later, add an explicit product decision, file-upload limit, allowlisted destinations, staging/precache updates, privacy review, and end-to-end tests.
13. `app.js` remains a large classic script, but current measured render/save behavior is within automated budgets. Do not make a broad modularization or 3D compression change during closed-beta closure.
14. Draco and Blender mesh-sharing work are deliberately rejected until a decoder already exists for another reason; current Brotli transfer cost is 374 KB.
15. Review writes still assume a single operator and synchronous validation. Atomic crash recovery/concurrent reviewer locking is future work, not a reason to reopen the verified closed-beta implementation without a concrete incident.

## Ordered build plan

### Phase 0 — freeze, reconcile, and merge the audited implementation

**Owner:** repository owner plus implementation maintainer
**Dependency:** none
**Exit condition:** one clean, reviewable commit/PR

1. Review the complete diff against `1b8ef46`; confirm every modified file is intentional.
2. Keep `tests/ocr-provider.test.mjs` if the OCR boundary remains a supported tested module; exclude `.omnirush/` and generated test outputs from the product commit.
3. Reconcile current counts, URLs, and gate names in `docs/HANDOFF.md`, `docs/CLOSED_BETA_READINESS.md`, and operator checklists. Clearly label historical evidence versus current evidence.
4. Run `npm run package:manifest` after the final packaged-file set is settled.
5. Commit the implementation, tests, manifest, and required documentation together. Do not force-push or push directly to `main`.
6. On the clean branch run, at minimum:

   ```text
   npm run check:content
   npm run check:content-review
   npm run check:static
   npm run check:runtime
   npm run check:release
   npm run check:launch
   npm run check:final
   npm run check:firebase
   npm run check:firebase:security
   npm run native:verify
   npm run test:unit
   BRAINBITE_TEST_PORT=4329 npm run test:e2e
   BRAINBITE_TEST_PORT=4329 npm run smoke
   npm run check:evidence
   ```

7. Push a PR and require remote CI to pass for the exact commit. Steve retains merge authority.

### Phase 1 — implement privileged cloud account erasure

**Priority:** P0 before a public account-deletion claim
**Owner:** backend/Firebase maintainer
**Dependency:** Phase 0 branch and production Firebase policy decision

1. Choose a privileged backend boundary: preferably a Firebase callable/HTTPS function or equivalent service using Admin SDK credentials that never enter the browser.
2. Authenticate the caller and bind the requested family to the verified Firebase `uid`; reject arbitrary family IDs.
3. Make the operation idempotent and auditable. Delete live profile documents and tombstones under the family, then delete the Auth account only after verified Firestore cleanup.
4. Preserve client rules: ordinary clients must continue to be denied physical deletes; tombstones remain authoritative for normal sync.
5. Define partial-failure behavior and retry semantics. The client must show whether Firestore cleanup, Auth deletion, or local sync cleanup failed.
6. Add emulator and staging tests for:
   - cross-family denial;
   - authenticated family ownership;
   - deletion of live profiles and tombstones;
   - retry/idempotency;
   - refusal to delete Auth when document cleanup is incomplete;
   - successful end-to-end Auth plus Firestore erasure.
7. Run the production-like flow against `brainbite-prod` only with owner approval and capture evidence without storing credentials.

**Acceptance:** a signed-in parent can complete deletion in a controlled production-like environment; no client rule is weakened; failure states are truthful and retryable.

### Phase 2 — close repository and deployment gates

**Priority:** P1
**Dependency:** Phase 0 merge; Phase 1 for deletion claims

1. Enable GitHub Pages → GitHub Actions and verify the Pages workflow on `main`.
2. Confirm canonical production domain, HTTPS, redirect behavior, support contact, privacy, terms, and support URLs.
3. Deploy/verify the production Firebase configuration, App Check/API restrictions, sign-up policy, verified-email policy, and backup/export policy.
4. Run the Firebase emulator job with `FIRESTORE_EMULATOR_HOST` configured and require zero skips for the release candidate.
5. Circulate the review packet and have an identified educator process the 75 pending records. Record approve/reject decisions through the CLI; never hand-edit the manifest.
6. Re-run content-review validation after every content decision batch and preserve source-digest evidence.

**Acceptance:** publication is reachable, content decisions are human-owned and digest-bound, production cloud policy is documented, and no external gate is represented as complete without its evidence.

### Phase 3 — complete human/device certification

**Priority:** P2 external
**Dependency:** Phase 2 deployment URL

1. Execute `docs/GATE_8_4_OPERATOR_CHECKLIST.md` on physical Windows Chrome/Edge, Android Chrome phone/tablet, iPhone Safari, iPad Safari, and Chromebook Chrome.
2. Execute `docs/GATE_8_5_SR_OPERATOR.md` with NVDA, VoiceOver, or TalkBack.
3. Complete Spanish fluency review using `docs/GATE_8_5_SPANISH_INVENTORY.md`.
4. Complete legal/privacy clause review using `docs/GATE_8_5_LEGAL_CLAUSE_MAP.md`.
5. Record frame pacing, long-task tails, scene load, and asset load on representative devices; preserve the distinction between measured and unverified budgets.
6. Re-run offline install/reload, persistence, reduced-motion, large-target, audio, and no-network flows on installed/PWA surfaces.

**Acceptance:** all operator checklists have named owners, timestamps, PASS/FAIL notes, and linked evidence. A failed human/device gate blocks launch rather than being converted into a code percentage.

### Phase 4 — signed native distribution (optional after web beta)

**Priority:** P2/P3
**Dependency:** Phase 3 and distribution decision

1. Produce a release Tauri build from the exact verified runtime package.
2. Sign the installer and record certificate/version metadata.
3. Repeat `npm run native:verify` and the no-listener runtime audit against the signed artifact.
4. Verify install, upgrade, uninstall, export-before-uninstall, and native mirror recovery on a clean Windows machine.

**Acceptance:** signed internal installer, zero production listeners, no developer material, and documented rollback.

### Phase 5 — post-beta maintenance backlog

Only begin after the web closed beta is merged and external blockers are owned:

- atomic/recoverable concurrent content-review writes;
- richer release evidence retention outside transient Playwright directories;
- OCR product decision and privacy-safe integration, if approved;
- incremental `app.js` modularization with unchanged browser contracts;
- additional worlds/Bubble Reef production expansion;
- payload optimization only if real device measurements justify it.

## RACI / ownership

| Work | Responsible | Accountable | Evidence |
|---|---|---|---|
| Diff review, commit, PR, merge | Maintainer | Steve | clean status, PR, CI |
| Firebase erasure backend | Backend/Firebase maintainer | Steve | emulator/staging/production deletion record |
| Pages/domain/support | Steve/release owner | Steve | Pages workflow, HTTPS and URL checks |
| Educator decisions | Named educator | Steve | review CLI records and digest gate |
| Device/accessibility/language/legal | Named human reviewers | Steve | completed operator checklists |
| Native signing | Release owner | Steve | signed artifact and no-listener audit |

## Stop conditions

Do not publish or claim closed-beta certification when any of the following is true:

- intended changes remain uncommitted or the exact commit lacks remote CI;
- `check:static`, unit, browser, smoke, content, Firebase, or native gates fail;
- Firebase emulator coverage is skipped for the release candidate;
- cloud account erasure is advertised without the privileged backend flow;
- the 75 educator records are treated as approved without human decisions;
- Pages/domain/HTTPS/support evidence is missing;
- device, screen-reader, Spanish, or legal reviews are reported as automated passes;
- a device-only performance signal is presented as a headless measurement.

## Rollback and evidence preservation

- Keep the previous verified commit available for revert.
- Export local progress before native uninstall.
- Preserve the three web save generations and pre-operation rollback snapshot.
- Remove an educator approval to fail closed by source digest; do not mutate content to fit a review.
- Bump the service-worker cache when runtime assets change.
- Regenerate `release-evidence/package-manifest.json` after every packaged-file change.
- Store long-run logs outside directories that Playwright clears; do not commit credentials or production learner data.

## Phase 0 completion record — 2026-09-30

Executed by the handoff session, on the same branch and worktree.

- Reviewed the full diff against `1b8ef46` file by file. Every modified file is intentional:
  offline replay survives a throwing transport and keeps the event queued; a stale or deleted
  profile invalidates the loaded game; the attempt-origin sequence floor is refreshed before
  every allocation; acknowledged events no longer consume slots in the 500-event merge bound;
  cloud profile reads paginate; stored generations are validated before migration; focus is
  preserved across an activity redraw and moved to the new screen's heading; ARIA live regions
  were added; the OCR provider is hardened and unit-tested; the Firestore rules split `read`
  into a document-scoped `get` and a family-scoped `list` with the rationale recorded inline.
- Independently reproduced on this worktree: `npm run test:unit` **267/267** (0 failed, 0
  skipped), `npx playwright test` **220/220** in 15.5 minutes with zero retries,
  `npm run check:static` **10/10**, `npm run check:content-review` PASS, `npm run check:stage`
  100 files / 94 precached. `release:check` was not run as a single command; its stages were
  run individually.
- Reconciled documentation: `docs/HANDOFF.md` and `docs/CLOSED_BETA_READINESS.md` now record
  **267/267** unit and **220/220** browser instead of the stale 255/211.
- `tests/ocr-provider.test.mjs` is kept as a supported tested boundary. `.omnirush/` is
  coordination material and is now excluded by `.gitignore` rather than deleted.
- `.omnirush/` was never committed; no live approval or finding was added; the manifest was
  regenerated only for packaged-file changes.

Remote CI on the pushed commit is the authority for the full battery. Steve retains merge
authority; this record does not claim a merge, a publication, or any external gate.

## Final status

**Engineering:** locally green on the committed branch (see the completion record above).
**Merge:** not complete; a stacked PR is open against `mobile/runtime-readiness`.
**Publication:** not complete; Pages is an owner gate.
**Content:** 75 educator decisions pending.
**Cloud deletion:** blocked pending privileged backend implementation.
**External certification:** not complete.
**Next action:** review and merge the stacked PR, then Phase 1 (privileged cloud account
erasure) and Phase 2 (Pages, domain, and production Firebase). remote CI before beginning production/operator gates.
