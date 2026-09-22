# BrainBite Production Goal

Updated: 2026-09-20
Status: ACTIVE
Authority: This document supersedes earlier batch plans for implementation order and status.

## Goal

Move BrainBite from its current strong-alpha state to a production-safe closed-beta
candidate. Preserve the verified learning engine, profile isolation, local-first play,
offline event handling, and reward idempotency while fixing the product, safety,
recovery, deployment, and child-experience defects identified in the 2026-09-18
audit.

External certification is not part of this goal. Real-device labs, legal review,
educator approval, store approval, and real-family beta metrics remain external
gates and must not be reported as completed by repository work.

## Scope Control

In scope:

- Repository stabilization, reproducible verification, and a no-port installed Windows build.
- Production-playable reviewed content with generated content kept fail-closed.
- Recoverable content review signals that never punish a struggling learner.
- Real backup, recovery, sync retry, and service-worker reliability.
- Secure parent access, enforced time limits, privacy, exports, and cloud rules.
- Child hub, battle, parent center, responsive layout, and accessibility cleanup.
- Closed-beta telemetry, evidence packaging, defect gates, and local release readiness.

Deferred until this goal is complete:

- Bubble Reef production expansion and additional worlds.
- Create mode and expanded Code Lab/programmable Bits scope.
- New hand-authored 3D asset production and screenshot parity work.
- External certification or launch claims.

## Delivery Roles

- Orchestrator: architecture, production gates, integration, verification, and final acceptance.
- Luna workers: bounded pattern-following implementation, tests, validators, and documentation.
- Sol workers: difficult security/native work and any substantive Luna lane that did not complete.
- Independent review: permitted reviewer models only; Astra workers are not allowed by the deployment policy.

No phase advances because a roadmap says it is complete. It advances only after
its implementation, focused tests, integration checks, and recorded evidence pass.

## Phase 0 - Repository Stabilization

Status: IN PROGRESS

### Batch 0.1 - Establish repository truth

- Record branch, HEAD, remote, dirty files, runtime architecture, and test commands.
- Make this file the authoritative implementation plan.
- Reconcile or mark stale trackers and release declarations.
- Repair known-red focused tests before feature work.

Exit checks:

- Current branch and dirty state are documented.
- Unit and focused browser baselines are reproducible.
- Old roadmap work cannot silently advance deferred worlds.

### Batch 0.2 - Clean release boundaries

- Remove generated test outputs and debug artifacts from source control scope.
- Expand `.gitignore` without hiding required release evidence.
- Regenerate or retire stale checksums and version declarations.
- Separate developer/orchestrator material from the public deployment allowlist.

Exit checks:

- A fresh clone has no generated-output churn.
- Release evidence needed for verification is retained and reproducible.
- Public artifacts contain only the runtime allowlist.

### Batch 0.3 - Gate CI and deployment

- Use deterministic dependency installation and cached browser setup.
- Produce retry traces and a test report artifact.
- Deploy only from `main`, only after CI succeeds.
- Remove the spike branch from deployment triggers.
- Fail release checks on a dirty tree or unresolved performance-budget failure.

Exit checks:

- A red CI run cannot deploy.
- The deploy workflow has an explicit runtime allowlist.
- The local verification command matches the CI release command.

### Batch 0.4 - Installed app packaging

- Package the verified runtime as a Tauri 2 Windows application.
- Bundle runtime assets behind the native app protocol; production must not start an HTTP server.
- Keep local ports limited to development and automated browser verification.
- Use a restrictive capability policy and explicit content security policy.
- Produce a reproducible installer/executable and verify that its process opens no listening socket.
- Preserve the web test harness until native-runtime parity is independently proven.

Exit checks:

- BrainBite launches from an installed executable without opening a browser.
- No production process binds `localhost`, `127.0.0.1`, or any TCP listening port.
- The package excludes tests, docs, orchestration files, source-control data, and development output.
- Learning, persistence, WebGL, accessibility, and optional authenticated cloud requests work inside the native shell.

## Phase 1 - P0 Correctness And Recovery

Status: COMPLETE

### Batch 1.1 - Production content availability

- Promote reviewed registry missions through an explicit production-safe tier.
- Keep generated and unreviewed content fail-closed.
- Validate exact digests and programmatic answers before launch.
- Add a non-localhost production-mode end-to-end check.

Exit checks:

- Reviewed missions launch in production mode.
- Tampered, generated, stale-digest, and unreviewed content remain denied.
- Production mode is never an empty game.

### Batch 1.2 - Recoverable content review

- Treat retries, misses, and hint use as learner-support telemetry, not punishment.
- Require corroborated content-quality evidence across an adequate observation window.
- Never permanently lock one learner out because they struggled.
- Add parent/developer review and clear controls for real quarantines.

Exit checks:

- Three wrong answers cannot quarantine content.
- A struggling learner can retry or receive remediation.
- A genuine content anomaly can still be isolated and reviewed.

### Batch 1.3 - Real backup and recovery

- Rotate distinct primary, backup, and last-known-good snapshots.
- Preserve recovery snapshots through normalization and migration.
- Restore with replacement semantics when explicitly requested.
- Isolate a corrupt learner or skill instead of wiping every profile.
- Handle storage quota and partial writes visibly.

Exit checks:

- Corrupt primary data recovers from a distinct known-good snapshot.
- Valid profiles survive a corrupt sibling record.
- Explicit restore is not overwritten by a newer corrupt primary.

### Batch 1.4 - Bounded sync and offline reliability

- Cap authentication refresh/retry attempts and surface terminal failures.
- Bound offline queues and sent-event identifiers.
- Preserve exactly-once reconciliation and profile ownership.
- Add document-size preflight before cloud writes.
- Correct service-worker precache, update, and offline-start behavior.

Exit checks:

- A missing refresh token cannot recurse forever.
- Offline play survives restart and reconciles once.
- A first offline launch loads every required runtime module.

### Batch 1.5 - Learning merge invariants

- Make self-merge idempotent.
- Deduplicate attempts by stable attempt identity.
- Handle out-of-order origin sequences without silent learning loss.
- Use bounded and testable time/order semantics.

Exit checks:

- `merge(state, state)` equals `state`.
- Duplicate and out-of-order events cannot inflate or erase mastery.
- Existing mastery-weighting and spaced-review tests remain green.

## Phase 2 - Parent Safety, Privacy, And Control

Status: IN PROGRESS

### Batch 2.1 - Secure parent access

- Replace the default/plaintext PIN with salted WebCrypto verification.
- Force setup or change from legacy/default credentials.
- Add five-attempt lockout with accessible recovery messaging.
- Strip credentials and tokens from profile, progress, and cloud exports.

Exit checks:

- No plaintext parent secret is persisted, exported, or synchronized.
- Brute-force attempts are rate-limited and tested.

### Batch 2.2 - Enforced time controls

- Enforce daily and session limits before mission launch.
- Track active play with a resilient periodic tick.
- Provide a child-safe time-up screen and parent override.
- Keep limits profile/family scoped without cross-profile leakage.

Exit checks:

- Expired limits block new play and end active play safely.
- Restarting or going offline cannot trivially bypass limits.

### Batch 2.3 - Parent-only destructive operations

- Move profiles, import, export, recovery, delete, sync, and advanced tools under Parents.
- Require parent authorization for destructive operations.
- Replace browser alerts/confirms with accessible themed dialogs.
- Ensure development tools remain absent from production mode.

Exit checks:

- A child cannot delete, import, restore, or expose family data.
- Dialogs trap focus and restore focus correctly.

### Batch 2.4 - Privacy, cloud, and Snap decision

- Replace substring PII scrubbing with structural minimization.
- Type and bound cloud progress data; prevent un-delete; document App Check and sign-up policy.
- Correct privacy documentation to match actual sync behavior.
- Either finish Snap-to-Game through reviewed content or remove it from production.

Decision (2026-09-19): remove Snap-to-Game from the production closed-beta surface. Preserve legacy Snap records locally and in parent-authorized recovery exports, but do not sync worksheet text/images; the cloud projection must carry an empty Snap collection. Internal review tooling may retain a parent-gated fixture only when it is not reachable in production mode.

Exit checks:

- Exported and synchronized data meet the minimum-data contract.
- Firebase rules tests cover size, type, ownership, and deletion semantics.
- No production control promises functionality it does not provide.

## Phase 3 - Child And Parent Experience

Status: IN PROGRESS

Batch 3.1 (navigation and information architecture): IMPLEMENTED/VERIFIED.
The child hub is six primary tiles plus three utility controls, the child dock is a
single five-target dock, the parent shell is hidden outside parent context, the
presentation selector is a parent-only device setting, and the placeholder
news/promo/energy/reward-hat cards, duplicate dock CSS, and debug badge are removed.

Batch 3.2 (battle composition): IMPLEMENTED/VERIFIED for the single-answer-surface and
one-screen requirements. The DOM board and the 3D answer controls are mutually
exclusive per active challenge, 3D pillar taps are live, and the battle fits one
viewport at 390x844, 768x1024, and 1280x800 in both DOM and live-3D presentation.
Landscape prompting and the remaining pointer-parity checks stay open.

### Batch 3.1 - Navigation and information architecture

- Reduce the child hub to six primary tiles and three small utility controls.
- Use one dock with no more than five stable targets.
- Create a distinct parent shell for Progress, Limits, Profiles, Account/Sync, Recovery, and Advanced.
- Remove placeholders, duplicate docks, debug badges, and false affordances.

Exit checks:

- Child and parent responsibilities are visibly separated.
- Every visible control performs its named action.

### Batch 3.2 - Battle composition

- Fit battle into one `100dvh` screen with no phone scroll.
- Use one answer surface: 3D interaction or DOM fallback, never duplicated.
- Make prompt, boss, and world derive from one mission record.
- Add a landscape prompt where the phone viewport cannot support battle safely.

Exit checks:

- 390x844, 768px, and desktop layouts pass overflow and interaction tests.
- Pointer input works in the active presentation mode.

### Batch 3.3 - Accessibility and first-run flow

- Finish form labels, alternative text, live announcements, language metadata, and focus visibility.
- Apply reduced motion, data-saving, and device-tier fallbacks.
- Build name to world to guided-mission choreography with disappearing prompts.
- Self-host production fonts and add a restrictive content security policy.

Exit checks:

- Automated accessibility checks pass on all primary screens.
- Reduced-motion and low-end modes remain fully playable.
- A first-time learner reaches and understands the first mission without parent help.

### Batch 3.4 - Maintainable application shell

- Extract stable modules from the `app.js` monolith incrementally.
- Render only the active screen and memoize immutable content-gate digests.
- Preserve compatibility contracts while removing global coupling.
- Cache parsed GLTF assets and restore WebGL context or fall back without changing answer semantics.

Exit checks:

- Existing browser contracts remain green after each extraction.
- Navigation and answer behavior do not depend on script load races.

## Phase 4 - Closed-Beta Readiness

Status: NOT STARTED

### Batch 4.1 - Test matrix and deterministic evidence

- Run unit, content, accessibility, offline, sync, recovery, and production-mode browser suites.
- Add supported-browser and representative mobile emulation coverage.
- Bring ad-hoc smoke checks under one reported runner where practical.
- Record commands, versions, results, and known limitations in tracked evidence.

Exit checks:

- No reproducible P0 remains.
- Known flakes are fixed or fail the gate; isolated retries are not accepted as proof.

### Batch 4.2 - Performance and reliability budgets

- Measure startup, mission launch, scene transition, save latency, memory, and frame pacing.
- Apply runtime quality fallback from actual device capability.
- Treat budget violations as failures rather than diagnostic passes.
- Verify offline startup, interrupted save, corrupt content, and expired authentication.

Exit checks:

- All declared local budgets pass in the supported automated environments.
- Unsupported real-device performance remains clearly marked external/unverified.

### Batch 4.3 - Closed-beta package

- Produce a minimal runtime package and a reproducible clean-install procedure.
- Confirm production development-tool exclusion and content quarantine behavior.
- Publish an honest defect ledger, external-gate list, and rollback instructions.
- Freeze new feature work until closed-beta defects are resolved.

Exit checks:

- Local closed-beta package is reproducible from a clean checkout.
- Functionality, UI readiness, reliability, and external gaps are reported separately.

## External Gates - Not Part Of Goal Completion

- Real-family beta observation and outcome metrics.
- Educator/curriculum approval.
- Legal/privacy review.
- Physical-device lab and store certification.
- Production cloud-account policy approval.

Repository work may prepare evidence for these gates but may not mark them complete.

## Current Baseline

- Current engine: static local-first JavaScript/Three.js runtime; its browser harness remains for development and tests.
- Production shell decision (2026-09-19): Tauri 2 installed Windows app with bundled assets and no localhost listener.
- Unity: absent; a full Unity rewrite remains a separate future engine migration, not a claim of this closed-beta build.
- Branch: `batch-9-webgl-spike`.
- Product state: strong alpha engine with verified Phase 1 recovery/correctness and Phase 2 parent-access, time-control, destructive-action, privacy, and cloud-minimization foundations; still pre-beta.
- Working estimate: about 83% functional, 38% reference-UI match, and 48% through this closed-beta hardening plan.
- Immediate blockers: Firebase update-rule optimization, child/parent information architecture, responsive/accessibility closure, release instrumentation, and clean-checkout reproducibility.

## Verified Progress Ledger

Updated: 2026-09-22

- 2026-09-22 repository synced, pushed, and CI green:
  - Committed the verified working tree (`1b538e5`, 299 files) and pushed
    `batch-9-webgl-spike`; opened PR #1 to `main`. `check:evidence` passes for the first
    time because the tree is clean.
  - The evidence declaration was refreshed from stale 2026-09-13 numbers (123 unit / 118
    browser) to the real gate (198 unit, 161 browser, 11 smokes, 0 headless budget
    violations, 96 packaged files), and the validator now cross-checks counts against the
    evidence the gate produces instead of hardcoded constants.
  - The commit provenance rule required `evidence.commit === HEAD`, which no commit can
    satisfy because committing the evidence moves HEAD; it now requires an ancestor on the
    same branch with a clean tree.
  - CI found two cross-platform bugs invisible on Windows: platform-dependent package
    manifest hashes from mixed CRLF/LF endings (fixed with `.gitattributes` plus
    line-ending-independent text hashing) and a hardcoded `D:/Codex/Brainbite` path in the
    PWA installability smoke (fixed, with `check:host-paths` added to `check:static`).
    Both CI runs are now green (`9m11s`).
  - Measured the 3D payload and closed it as a non-problem. It is 3,183 KB raw with 53% of
    vertices (34,273 of 64,069) duplicated geometry, but it compresses to 769 KB gzip and
    **374 KB brotli**, because duplicated spheres and repeated float32 buffers are exactly
    what a compressor removes. `npm run measure:payload` reports the three columns.
  - Draco was implemented and measured before being reverted: the compressed GLBs came to
    693 KB (78% off) and Blender re-imported all five, but the decoder adds 245 KB (wasm)
    or 500 KB (JS), making the total 938-1,193 KB against 374-769 KB compressed — a wash —
    and it would cost two CSP relaxations (`'wasm-unsafe-eval'` plus a blob worker for
    three's `DRACOLoader`) on an app that deliberately ships `script-src 'self'`.
  - Blender-side mesh sharing cannot reduce the GLBs either: `export_apply` must stay on
    for the bevel and armature modifiers, and it makes the exporter evaluate each object
    separately. Recorded in `docs/CLOSED_BETA_READINESS.md` section 5.
  - Also recorded: rebuilding the kit is not byte-reproducible on the same Blender version
    and script (three of five GLBs match; the kraken differs by one accessor and 4,456
    bytes, the mascot by 4 bytes), so assets are verified against the committed manifest
    rather than by rebuilding.
  - Refreshed the local certification, which was stale since 2026-09-13. The first run in
    this cycle exposed three defects in the harness itself:
    - it started a server on port 4317 that nothing ever connected to (Playwright's global
      setup and the smoke runner each serve 4318), while `check:test-ports` exempted the
      file that hid it; the runner now starts no server and is scanned again;
    - `tests/bubble-reef-preview.spec.js` was in no certification group, so the run covered
      159 of the 161 browser tests and still reported a clean sweep; it joins the activity
      group and `check:certification-coverage` (in `check:static`) fails when a configured
      spec is in no group;
    - the git snapshot was taken after the run, so `workingTreeClean` was always false.
    The browser groups now retry once, matching CI, and record passed/flaky/failed counts
    so a retry is visible rather than hidden. Result: **16/16 stages, 161 browser tests,
    11/11 smokes, probe exit 0, zero headless budget violations**, from a clean tree at
    `57864b4`.
  - `CHECKSUMS.json` retired: 45 of its 176 entries pointed at files that no longer exist
    (old `.wav` audio, removed tests and scripts) and 20 digests were stale. Replaced by a
    generated `release-evidence/package-manifest.json` derived from the same allowlist that
    builds the runtime package, verified by `npm run check:stage`
    (`npm run package:manifest` regenerates it).
  - CI now runs `check:static` and `npm run smoke` (replacing a hand-rolled six-script
    block that started its own server) and uploads the smoke evidence artifact.
  - Pages deploys now run `check:static` before staging, so the deployed artifact carries
    the same allowlist, completeness, and integrity guarantees as the local package. Remote
    workflow proof still requires a push.
- 2026-09-22 Phase 4.1–4.3 advanced:
  - 4.1: `npm run smoke` runs all 11 smoke checks under one reported runner with evidence in
    `release-evidence/smoke-report.json`, and it is a stage of `release:check`.
    `certify:local` calls the runner instead of keeping its own list. Six checks were broken
    by earlier IA changes and invisible because nothing ran them; each was rewritten against
    the current navigation and now passes.
  - 4.2: the performance probe measures and gates every budget it declares. Headless-judged
    and passing: startup 720/600 ms of 3000, save 8/8.9 ms of 250, payload 3,183/3,222 KB of
    4,096, memory 20 MB of 512, draw calls 117/198 of 200, triangles 39,656 of 250,000.
    Frame pacing, long-task tails, scene load, and asset load are recorded as device-only
    and explicitly unverified. Save latency had been measured inside a WebGL session where
    software rasterization dominates (~600 ms of frame time); the gated sample now comes
    from the shipping DOM path.
  - 4.3: `npm run check:stage` rebuilds the closed-beta package and fails on any missing
    precached or referenced asset, or any leaked developer path. It exists because
    `fonts.css`, `sw-register.js`, and both font files were missing from the package. The
    package is 96 files / ~5.4 MB with no developer material, and
    `docs/CLOSED_BETA_READINESS.md` records the verified surface, defect ledger, external
    gates, and rollback procedure.
  - Learning: a wrong answer now surfaces the reviewed explanation that already existed in
    the content (35 of 36 templates carry one), and the guided hint is assisted-only so it
    no longer gives away the strategy on independent attempts. Read-aloud extends to the
    feedback line.
  - Verification: six static checks now gate the release (`npm run check:static`): dead CSS,
    element ids, test selectors including `nav` structural drift, vacuous DOM assertions,
    precache existence with font SHA-256, and test port drift. Each was proven to catch its
    target regression by injecting one.
  - Testability: the save-generation policy moved to `content/storage-copies.js` and is
    unit-tested against a fake storage (8 tests in 75 ms) instead of only through browser
    timing; the LearningCore readiness contract is explicit via `bb:core-ready`.
  - Evidence: the performance probe now fails on headless-judgeable budgets and lists
    device-only ones as unverified, with a new environment-independent payload ceiling
    (measured 3,154 KB against a 4,096 KB budget). The content review packet generates for
    all 75 pending records with zero digest mismatches, and `review:approve` refuses
    quarantined, unknown, stale-digest, and already-shipping records.
  - Reliability: a bounded local issue log (50 entries, four sanitized fields) is surfaced
    in Diagnostics and included in the diagnostic bundle.
  - Fixed while building: fourteen smoke/capture scripts and the performance probe were
    pinned to port 4317 while the test server serves on 4318, so none could reach the app;
    `scripts/serve.mjs` now defaults to 4318 and `check:test-ports` prevents recurrence.
  Unit tests grew to 198; the browser suite to 161.
- Phase 0.1: the focused baseline was repaired. The repository was red before this
  session: `tests/accessibility-contract.test.mjs` and `tests/release.spec.js` still
  targeted the superseded single-nav markup, two startup `null` element errors were
  live, `tests/webgl-accessibility.spec.js` pointed at port `4317` while the suite
  serves on `4318`, and two `tests/webgl.spec.js` dock assertions passed vacuously
  against `Math.min(...[])`. After repair: unit `183/183`, browser `150/150`, and all
  repository validators pass.
- 2026-09-21 audit executed (`docs/AUDIT_2026-09-21.md`): automated sweeps found zero
  runtime errors across 25 screens, zero horizontal overflow at 390/768/1280, zero axe
  violations on 24 screens, and clean state-survival and offline-boot checks. Seven
  findings were then executed:
  - Phase 3.2 completed: dismissible rotation prompt on short landscape phones.
  - Phase 3.3 completed: the WCAG gate now scans 21 primary screens plus the live battle
    HUD; fonts are self-hosted as two variable woff2 files (68,860 bytes) with
    `fonts.css`, an external service-worker registration file, and a restrictive CSP
    meta; the first-run choreography (name to world to a guided first mission with a
    retiring prompt) is implemented per profile.
  - Phase 3.4 completed: WebGL context loss now has a 1.5 s restore window before the
    DOM fallback, and parsed GLB documents are cached per URL with
    `SkeletonUtils.clone` mounts and detach-only disposal.
  - Maintainability: 78 dead CSS rules and 27 dead selectors removed from a 120,633-byte
    stylesheet (now 111,345 bytes) with a verified walker; `npm run check:css` added as a
    read-only dead-selector diagnostic.
  - The last known flake is fixed: the same-installation writer test read
    `.recentPerformance.at(-1)` and could pick up the sibling tab's attempt after
    cross-tab sync; it now reads its own attempt by identity and passes `4/4` with
    `--repeat-each=4`.
  - Remaining from the audit: `check:evidence` still needs a commit decision.
  Verified along the way: webgl `27/27`, webgl-assets `7/7`, and the focused
  first-run, landscape, font/CSP, context-restore, and dead-CSS checks. `app.js` is a
  classic script that runs before the deferred `brainbite-core.mjs` module, so the
  initial canonical load merged stored generations with a fallback that unions attempt
  records but keeps `evidence`/`evidenceProvenance` from one side only. Two tabs each
  recording one attempt therefore kept both records while counting one attempt and
  dropping the other writer's provenance source. A one-time
  `reconcileCanonicalStateWithCore()` now performs the union once LearningCore is
  available, constrained to the profiles the installation still has, and converges all
  three slots; ordinary autosaves keep rotating distinct generations.
- Phase 3.1: IMPLEMENTED/VERIFIED. `[hidden]` is now authoritative, so the parent
  shell no longer leaks onto the child hub; the child dock is a single styled
  five-target dock; the scene selector moved to parent-only Advanced; the home
  placeholder cards, fake energy counter, reward hat, carousel dots, and
  `#webglBadge` are removed; the battle minimap is bound to real world/mission data;
  the missing `#installBtn` and `#updateStatus` elements were added with a real
  PWA install control and service-worker update notice.
- Phase 3.2: one answer surface and one-screen battle verified. The DOM board is
  hidden while the 3D answer controls are active and vice versa, `.webgl-canvas`
  accepts pointer input so pillar taps work, and the battle shell fits
  `100dvh` exactly at 390x844, 768x1024, and 1280x800 for both DOM and live 3D.
- Phase 3.3 (partial): the three unlabeled form controls now have labels, the battle
  prompt carries `lang="es"` for Spanish missions, and focus visibility was already
  global. First-run choreography and self-hosted fonts/CSP remain open.
- Phase 0.2: `release-evidence/` is not gitignored; the tracked evidence gap remains
  the dirty working tree, which blocks `check:evidence` and clean-checkout
  reproducibility.

- Phase 0.1: focused baselines are reproducible, but a full clean-checkout release run is still required.
- Phase 0.2: the explicit staged-site allowlist excludes Blender sources, specifications, and developer material; fresh-clone verification remains open.
- Phase 0.3: CI uses deterministic installation and retained Playwright evidence, and Pages is gated on successful `main` CI at the exact tested commit. Remote workflow proof remains open.
- Batch 0.4: COMPLETE. Browser-test defaults moved away from occupied port 8080 to 4317/4318. The Tauri 2 Windows installer builds from staged assets, opens a BrainBite window, and its app/WebView2 process tree binds zero TCP listeners. `native:verify`, Cargo check, two release builds, and the live runtime listener audit pass. The installer is unsigned and remains an internal closed-beta artifact.
- Batch 1.1: production-reviewed registry missions launch on a non-localhost production host; generated, tampered, and stale-digest content remains fail-closed.
- Batch 1.2: ordinary learner struggle records support/review telemetry without quarantine; corroboration requires stable cross-learner evidence. Parent/developer clear controls remain open.
- Batch 1.3: primary, backup, and recovery generations rotate distinctly; explicit restore replaces newer state; malformed primary data falls back; corrupt skills are isolated; quota failures are visible.
- Batch 1.4: COMPLETE. Authorization retry, cached WebGL dependencies, bounded offline/sync histories, deletion priority, canonical tombstones, and Firestore document-size preflight are verified.
- Batch 1.5: stable attempt provenance, duplicate resistance, stale-sequence rejection, and idempotent skill merging have focused coverage; integration closure follows Batch 1.4.
- Batch 2.1: COMPLETE. Parent access uses a device-local PBKDF2-SHA256 verifier (600,000 iterations), fixed persisted lockout, memory-only authorization, legacy secret scrubbing, parent-route gating, and shared sanitized export/cloud projections.
- Batch 2.2: COMPLETE. Daily/session limits are enforced before and during play with per-profile device-local ledgers, recovery-aware monotonic accounting, bounded lifecycle checkpoints, a child-safe time-up route, and fresh-PIN extensions. The final independent review reproduced the held-lock `visibilitychange(hidden)` plus `pagehide` race and verified `16000 ms` persisted exactly once with no replay.
- Batch 2.3: COMPLETE. Destructive operations use an accessible fresh-PIN step-up dialog; profile deletion requires the exact learner name; restore/import create a distinct pre-operation rollback snapshot; production debug controls are Lab-only; and cloud deletion reports partial outcomes without clearing local session/queue state prematurely. Strict pre-import identity validation rejects duplicate, malformed, tombstoned, and invalid-active profile identities before authorization, rollback, or mutation.
- Batch 2.4: COMPLETE. Snap-to-Game and OCR controls are absent from production, while legacy records remain available in parent-authorized local recovery exports. Cloud synchronization uses typed, bounded, recursive structural projections; worksheet text/images, data/blob/file URLs, unknown nested objects, Code Lab projects, and Snap records cannot cross the cloud boundary. Mission-only legacy sessions round-trip without reopening private-data leakage, and bounded deletion tombstones remain authoritative against stale-device resurrection.

Current focused evidence:

- `node --test tests/core.test.mjs`: 44 passed, 0 failed.
- `node --test tests/content-review.test.mjs`: 22 passed, 0 failed.
- Recovery/content/auth production subset in `tests/release.spec.js`: 7 passed, 0 failed.
- Offline cached 3D dependency check in `tests/webgl-assets.spec.js`: 1 passed, 0 failed.
- Full unit suite after parent-security integration: 183 passed, 0 failed.
- Parent-auth and cloud integration subset on isolated port: 5 passed, 0 failed.
- Phase 2.2 focused Playwright suite: 10 passed, 0 failed on independent ports.
- Phase 2.2 exact held-lock exit-race reproduction: baseline `1000 ms`, reconciled `16000 ms`, second reconciliation unchanged at `16000 ms`.
- Phase 2.3 focused Playwright suite: 9 passed, 0 failed; independent exact duplicate-ID and blank-ID probes preserved store, sync, primary, backup, recovery, and rollback unchanged.
- Phase 2.3 destructive-dialog stress: 5 repeated tests covering 105 fresh-PIN approvals passed; full unit suite remains 183 passed, 0 failed.
- Phase 2.4 final independent review: privacy/Firebase/tombstone suite 4 passed, Phase 2.2-2.3 regression suite 19 passed, Phase 2.1 counterexamples 3 passed, static Firebase rules 19 passed with 1 emulator test skipped, and runtime/release/Firebase validators passed.
- Phase 2.4 native staging: `native:verify` staged 90 files and passed 1/1; staged forbidden-surface scans returned zero Snap/OCR controls, source/staged hashes matched, and the service-worker cache is `v35-snap-retired`.
- Native package verification: 1 passed, Cargo check passed, release build passed, live process listener audit passed with zero TCP listeners.

Repository evidence:

- Branch: `batch-9-webgl-spike` at `96d3bb75069e7baa61a3ecf657d0df572e16f2bf`.
- Remote: `https://github.com/1983stevec-gif/BrainBite`.
- The branch is currently two commits ahead of `origin/main`.
- The development tree currently reports 151 changed/untracked entries (10 index-or-both, 18 worktree-only, 123 untracked). This is an open Phase 0 blocker: current implementation evidence is not yet reproducible from a clean checkout.

## Next Assignment Order

1. Complete Phase 3.3: first-run choreography (name to world to guided mission with
   disappearing prompts) and self-hosted fonts with a restrictive content security policy.
2. Complete Phase 3.4: cache parsed glTF assets behind an explicit clone/dispose
   ownership model, and restore the WebGL context instead of only falling back.
3. Complete Phase 4.1-4.3 closed-beta instrumentation and evidence packaging.
4. Optimize the Firebase update authorization boundary only after the required
   explicit user approval, then rerun the real emulator suite.
5. Return to Phase 0 clean-checkout and remote workflow proof before any release claim.
