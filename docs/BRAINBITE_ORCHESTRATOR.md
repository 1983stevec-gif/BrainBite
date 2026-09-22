# BrainBite Orchestrator Control Plane

Last audited: 2026-09-12
Repository: `D:\Codex\Brainbite`
Remote: `https://github.com/1983stevec-gif/BrainBite`

This file is the working control plane for future Codex sessions. Read it before assigning work. Update it after every meaningful batch with evidence, not roadmap assumptions. Older planning documents remain useful context, but this file is the current status index.

## 1. Mission

Latest asset direction and expanded visual scope: read
`docs/HYBRID_ASSET_PRODUCTION_PLAN.md` and section 16 before the next dispatch.
The canonical ordered batch/phase queue is `docs/COMPLETE_BUILD_ROADMAP.md`.

BrainBite is a local-first educational adventure PWA. A child learns through physical-feeling 3D activities, adaptive practice, a persistent BrainBase, rewards, and world progression. The approved visual direction is the supplied premium jungle UI: blue Bite mascot, dense readable panels, Jungle Circuit, physical answer objects, and Fraction Kraken.

The project goal is a production-ready, visually beautiful, reliable app. The current repository is a static HTML/CSS/classic `app.js` plus Three.js/WebGL PWA. It is not a Unity project. Blender is used through the local CLI asset pipeline; no persistent Blender MCP is assumed.

Phase 3.0 registry status: COMPLETE for its implementation gate after all
validators, 68 unit tests, 72 browser tests, and independent Sol/medium review
passed. Product certification remains separate. See
`docs/PHASE_3_0_CANONICAL_REGISTRY_REPORT.md`.

## 2. Repository Truth

| Item | Current fact |
|---|---|
| Working directory | `D:\Codex\Brainbite` |
| Branch at last audit | `batch-9-webgl-spike` |
| HEAD at last audit | `96d3bb75069e7baa61a3ecf657d0df572e16f2bf` |
| Working tree | Dirty, with approximately 70 tracked/untracked changes at last audit. Preserve them. |
| Runtime | Static HTML/CSS/ES modules, service worker, vendored Three.js |
| Native engine | No Unity project found |
| WebGL default | Enabled for desktop and mobile when supported; DOM fallback remains available |
| Asset tool | Blender `5.2.1 LTS` at `D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe` |
| Cloud | Firebase configuration/rules and optional parent-auth sync are present; production cloud behavior is not fully verified |
| Primary app entry | `index.html`, `app.js`, `brainbite-core.mjs` |
| Presentation entry | `presentation/boot.mjs`, `presentation/presentation-adapter.mjs` |
| Unit test command | `npm run test:unit` |
| Browser test command | `npm run test:e2e` |
| Full release gate | `npm run release:check` |
| Local server | `npm run serve` |

Do not create a second engine, second learning graph, or second reward ledger. Extend the existing systems.

## 3. Architecture Map

| Area | Existing implementation | Status |
|---|---|---|
| Bootstrap | `presentation/boot.mjs`, app startup, service worker | PASS in automated launch checks |
| LearningCore | `brainbite-core.mjs` | One authoritative per-profile ledger; adaptive curriculum, evidence routing, recovery, exact cloud merge, and profile isolation are covered by the Phase 3.1 final evidence |
| Learner profiles | profile state, cloud merge and profile isolation | PASS in Phase 3.1 final automated verification |
| Skill graph | K-6 taxonomy, prerequisites, skill states, evidence | PASS in controlled tests; educator validation pending |
| Mastery | confidence/evidence weighting, independent vs assisted success, rapid/random resistance | PASS in unit tests; not externally validated with real learners |
| Adaptive Director | adaptive curriculum session generation, weak skills, review, confidence, stretch | PASS in automated coverage |
| Remediation | complexity/support/prerequisite/alternate-presentation plan | PASS in automated coverage |
| Spaced review | last practice, independent success, confidence, next review point | PASS in automated coverage |
| Typing progression | `content/typing-progression.mjs` foundation, runtime bridge, and encounter | FOUNDATION + ENCOUNTER VERIFIED; focused `5/5`, browser `7/7`, and unit `107/107` pass; multi-target progression, adaptive support, and device coverage remain open |
| Coding Bridge | `content/code-bridge.mjs` + `content/code-bridge-curriculum.mjs` | LESSON CATALOG + UI + EVIDENCE VERIFIED; focused activity browser `11/11`, unit `113/113`, full browser latest `108/109` with isolated local-storage retry `2/2`; production hides unreviewed suggestions, commands fail closed, evidence is idempotent; formal production content review remains open |
| Code Lab | `content/code-lab.mjs` | FOUNDATION VERIFIED; bounded profile-local projects, reset, versioned serialization, safe import/export, and LearningCore integration; focused browser `12/12`, unit `115/115`; programmable Bits and richer coding curriculum remain open |
| Programmable Bits | `content/programmable-bits.mjs`, `content/programmable-bit-curriculum.mjs`, `app.js`, `presentation/programmable-bit.mjs` | EDITOR + 3D COMPANION + INTERNAL-REVIEW LESSONS VERIFIED; bounded declarative actions, strict IDs, fail-closed migration, merge-safe profile persistence, explicit active Bit, reduced-motion-safe Three.js companions in home/battle, learning-event reactions, and four prerequisite-aware lessons; unit `123/123`, activity browser `18/18`, WebGL browser `30/30`, release browser `56/56`; educator approval remains open |
| Game Director | activity-family mapping and presentation selection | IMPLEMENTED/VERIFIED for the live family-aware resolver with independent reviewer PASS; focused coverage `14/14`, unit `102/102`, one known same-installation tab-writer flake in the `102/103` full browser run, and isolated repeat `3/3` PASS |
| Target Smash | numeric/text answer targets, choices, timing, retries, assistance | PASS as reusable core; full free-roaming physical UX is PARTIAL |
| Letter Trail | ordered sequence, distractors, errors, hints, restart | PASS as reusable core |
| Knowledge Platforms | generalized representations with equivalent-fraction implementation | PASS as reusable core |
| World reactions | activate, reveal, repair, grow, illuminate, transform | PARTIAL; WebGL/procedural layer is present, production authored reactions remain |
| BrainBase | hub shell, portal, house, trophies, locked expansion, upgrade hook | PASS as functional foundation; production art PARTIAL |
| Jungle Circuit | route, environment, targets, platforms, portal, minimap | PASS for automated/visual WebGL slice; physical-device validation pending |
| Fraction Kraken | phase progression and boss challenge mapping | PASS in automated progression; production phase presentation PARTIAL |
| Rewards | definitions, grants, inventory, transactions, idempotent Brainifact | PASS in automated tests |
| Save/recovery | versioned local save, primary plus last-known-good snapshot | PASS in automated tests |
| Offline events | queued typed events, profile IDs, schema versions, duplicate rejection/replay | Offline queue, recovery, and cross-tab persistence are covered by the Phase 3.1 final evidence; runtime/device/release acceptance remains unverified |
| Cross-tab lock modes | Web Locks; IndexedDB; localStorage-only generation-verified fallback | All three browser lock modes tested |
| Provenance | v5 compact Firestore-safe scalar | Exact per-writer identity/sequence/category totals retained; fail-closed at 8192 writers or 480 KiB; no lossy compaction within the supported ceiling |
| Content validation | generated-content semantic verification, answer ambiguity, approval and strict quarantine | Phase 3.2 security gate PASS after frozen gate+manifest APIs, the timing false-positive fix, unlinkable queue payloads, and ordered-family exact-template integrity hardening; ordered-family exact-template, taxonomy, and difficulty support bindings are verified; production content remains fail-closed pending formal educator approval |
| BrainBite Lab | development-only learner/skill/difficulty/activity/Kraken/save controls | PASS in repository; production exclusion needs release certification |
| Bite character | generated original GLB with rig, idle/blink clip, attachment-ready hierarchy | PARTIAL; locomotion, emotion layers, cosmetics, IK are not complete |
| Blender pipeline | `scripts/blender/build_brainbite_kit.py`, `mascot_v2.py`, generated GLBs and manifest | PASS for repeatable local generation; asset provenance still needs production review |
| Jungle art | instanced banks, procedural props, materials, water, house and terrain | PARTIAL; stylized greybox-to-production bridge, not AAA final art |
| Camera/animation | shared camera fitting, mixer wrapper, reduced-motion freeze | PASS for current slice; full cinematic library not complete |
| VFX/audio | hooks and visual effects exist in presentation layer | PARTIAL; production authored library and mix remain |
| HUD/UI | approved-look DOM UI plus responsive mobile layout | PASS for automated screenshot/interaction checks; not pixel-certified against all approved screenshots |
| Accessibility | reduced motion, scaling, readable status, keyboard/mouse/touch hooks | PASS in automated checks; real screen-reader/device checks pending |
| Quality tiers | Ultra, High, Balanced, Performance, Mobile policy and shadow/DPR budgets | PASS as policy tests; actual device FPS/memory evidence pending |
| Parent intelligence | canonical parent insights from LearningCore evidence | PASS for automated contract checks; production account/privacy review pending |
| PWA/offline shell | static PWA shell, offline queue, and cross-tab persistence | Automated Phase 3.1 evidence passes; runtime/device/release claims remain unverified |
| Production operations | launch/support/deletion/export/domain/HTTPS | EXTERNAL/PENDING environment and human work |

## 4. Verified Evidence

The dated Phase 9.x and visual records below are retained historical evidence. The
current authoritative evidence for this documentation update is the Phase 3.2 security-gate and live activity-family evidence, plus the Phase 3.3 typing foundation,
recorded below together with the
Phase 3.1 final record and Phase 3.2 inventory.

A retained historical post-fix release run on 2026-09-11 reported:

- Content validation: `29` packs and `40` question sets passed.
- Repository validators: runtime, release, Firebase, rules, launch, final, security, and evidence checks passed.
- Unit tests: `22/22` passed before the Phase 9.4 character-state additions.
- Browser tests: `53/53` passed in 4.0 minutes, using `PLAYWRIGHT_OUTPUT_DIR=test-results-release-20260911c`.
- Focused security/sync browser tests: `2/2` passed in 6.5 seconds.
- Focused WebGL tests: `7/7` passed in 25.1 seconds.
- Live 3D capture: desktop and mobile home/battle captures completed with no JavaScript errors and expected generated assets loaded, using `BB_CAPTURE_DIR=test-results-live-20260911/visual`.
- Blender kit verification: generated mascot, jungle props, portal, answer pillars, and Kraken GLBs passed manifest/size/structure checks.

Phase 9.4 focused evidence on 2026-09-11:

- Unit tests after the character-state additions: `25/25` passed.
- WebGL gameplay tests after live Bite reaction wiring: `8/8` passed.
- WebGL asset and accessibility tests: `10/10` passed.
- The new browser assertion proves correct and incorrect answer evidence reaches the live battle frame as `success` and `mistake`, including the async mascot-load race path.
- The prior `53/53` browser result is retained as pre-Phase-9.4 evidence only; the current post-fix release result is the `57/57` gate recorded below.

A retained historical post-fix full release gate completed after the Phase 9.4 fixes:

- Content validation: `29` packs and `40` question sets passed.
- All repository validators passed.
- Unit tests: `25/25` passed.
- Browser tests: `57/57` passed in about `3.1` minutes, using `PLAYWRIGHT_OUTPUT_DIR=test-results-release-20260911d`.
- The gate includes concurrent sync-queue preservation, Homophone Hollow answer-class separation, and reduced-motion Bite-pose regressions.

Phase 9.5 instrumentation evidence on 2026-09-11:

- Added presentation-independent frame, startup/scene-load/save, memory, percentile, budget-violation, and device-tier metrics.
- Live WebGL metrics browser check: `1/1` passed; unit coverage: `31/31` passed.
- Capture harness emitted desktop/mobile JSON plus PNGs with no JavaScript errors. Headless frame tails exceeded the 33.4 ms budget (desktop home p95 `832.6 ms`, battle p95 `700 ms`; mobile home p95 `627.6 ms`, battle p95 `665.9 ms`), so this is a diagnostic finding, not a performance pass.
- Captured scene-load maxima were below the 3 s budget and save samples were about `2.1-2.4 ms`; physical-device FPS/memory remains unverified.

Phase 9.5 post-review evidence on 2026-09-11:

- Renderer sampling is wired after `renderer.render()` in both live scenes. Fresh captures report home `69` geometries, `5` textures, `10` programs, `233` render calls, and battle `44/2/7/141`; asset timing count is `3` per scene.
- Scene-load timing now records when all scene GLB requests settle, including fallback failures. Fresh capture measured home `1028.8-1207.3 ms` and battle `1041.3-1249.0 ms`, both below the `3000 ms` maximum.
- The capture harness now reads battle metrics before screenshot capture and waits for the battle mascot, pillars, and Kraken. Fresh desktop/mobile captures completed with `errors: []` in `release-evidence/phase95-20260911f`.
- The focused live metrics browser test passed `1/1`; unit tests passed `36/36`; the full release gate passed `58/58` after the instrumentation changes. The final capture remains diagnostic rather than a performance pass: headless frame tails exceeded the `33.4 ms` budget and home render calls exceeded the `200` budget. Physical-device evidence is still unverified.
- Resource-timing sampling is idempotent across repeated reports. The independent post-change review requested the scene-ready and capture fixes; those fixes are now regression-covered. No reproducible automated P0 remains.

Phase 9.5 startup/navigation evidence on 2026-09-12:

- Added explicit presentation readiness and labeled screen-navigation telemetry while keeping `getPerformanceReport()` backward compatible.
- A non-visual WebGL runtime probe recorded startup readiness at `525.4 ms` on `home` and `home -> game` navigation at `251.5 ms`.
- The standard unit command now includes `tests/startup-performance.spec.mjs`: `39/39` passed. The focused WebGL/accessibility/assets/gameplay subset passed `21/21`; the full release gate passed `58/58` in about `2.3` minutes.
- Bootstrap screen observation now starts before the initial asynchronous mount and coalesces rapid mutations. This fixes early `startMission()` races without adding test-only waits.
- The read-only home draw-call inventory did not complete within its bounded window and was closed. The measured home render-call count remains `232-233` in headless capture, above the provisional `200` budget; this remains the next optimization target.

Phase 3.1 curriculum integration evidence, parent-verified on 2026-09-12:

- Final status: COMPLETE for the Phase 3.1 implementation gate.
- One canonical per-profile LearningCore owns learning evidence, adaptive curriculum, homework assisted-vs-independent evidence, parent intelligence, profile isolation, recovery, offline queue, exact cloud merge, cross-tab persistence, v5 compact provenance, BrainBite Lab, and all three activity-family core state machines.
- v5 retains exact per-writer identity, sequence, and category totals in a compact Firestore-safe scalar. The contract fails closed at `8192` writers or `480 KiB`; no lossy compaction occurs within the supported ceiling.
- Browser lock coverage includes Web Locks, IndexedDB, and a localStorage-only generation-verified fallback.
- Verification: `95/95` unit tests passed, `89/89` browser tests passed, all `9` validators passed, and the independent final reviewer returned `PASS`.

These are verified automated test and review results supplied for the Phase 3.1 gate. They do not by themselves certify unverified runtime, physical-device, or release behavior. No tests were run for this documentation-only update.

Phase 3.2 security/content-control and live activity-family evidence, parent-verified
on 2026-09-12:

- Sidecar inventory: `105` records total: `30` registry missions, `35` generated templates, and `40` JSON pack items.
- Of the `40` JSON pack items, `17` are taxonomy-linked but non-production and `23` are quarantined/unlinked.
- All `35` generated templates and `30` registry missions are internal/test prototypes pending formal educator approval. No record is falsely educator-approved.
- Tesla implemented the runtime content gate in `content/content-control-gate.js`. `index.html` loads the manifest and gate before `app.js`; the service worker caches both.
- The app routes registry/generated launches through the gate and records sanitized content telemetry. Production mode is fail-closed. Internal-review localhost/test mode allows exact-digest-validated, non-quarantined prototypes.
- Suspicious outcomes are flagged for review without punishing the learner. Package and CI content-review checks are included.
- Security gate result: PASS after the gate and manifest APIs were frozen, the timing false-positive was fixed, and queue payloads were made unlinkable. Ordered-family exact-template integrity hardening is included.
- Latest verification: `102/102` unit tests, focused coverage `14/14`, full browser `102/103` because of one known same-installation tab-writer flake, an isolated `3/3` retry PASS for that case, and all repository validators passed.
- Ordered-family exact-template, taxonomy, and difficulty support bindings are verified. The live family-aware resolver is IMPLEMENTED/VERIFIED for Target Smash, Letter Trail, and Knowledge Platforms, with independent reviewer PASS.
- Production content remains fail-closed pending formal educator approval.

Phase 3.3 typing progression evidence, parent-verified on 2026-09-12:

- The typing progression foundation is implemented in `content/typing-progression.mjs`.
- Focused coverage is `5/5` in `tests/typing-progression.test.mjs`, and `test:unit` passes
  `107/107` with the typing test wired in.
- The verified runtime bridge exposes `window.BrainBiteGame.submitTypedAnswer` and
  `window.BrainBiteTyping`.
- Full keyboard encounter UI, target progression, and runtime typing acceptance remain
  OPEN; this foundation does not establish device or production acceptance.

Recommended evidence commands from the repository root:

```powershell
Set-Location D:\Codex\Brainbite
git status --short --branch
git log -1 --oneline
npm install
npm run test:unit
npm run test:e2e
npm run release:check
```

For live 3D captures, run the local server and then:

```powershell
npm run serve
node scripts/capture-live-3d.mjs
```

## 5. Full Feature Contract

The following capabilities remain the definition of done, even where the current implementation is only partial:

### Learning and content

- `LearnerProfile`, `SkillDefinition`, `SkillState`, `LearningChallenge`, `LearningAttempt`, `MasteryEvidence`, `MasteryState`, `DifficultyProfile`, `PrerequisiteDefinition`, `ReviewSchedule`, and `SessionPlan`.
- Accuracy, attempts, independent success, assistance, hints, response time, recent history, confidence, review history, stale review, and session duration.
- Evidence-based mastery. Never replace the model with a fixed “three correct answers” rule.
- Adaptive Director decides what to learn; Game Director decides how to present it.
- Remediation lowers complexity, adds support, reviews prerequisites, changes presentation, and later seeks independent evidence.
- Target Smash, Letter Trail, and Knowledge Platforms remain reusable and subject-agnostic.
- K-6 Math, Reading, Spelling, Vocabulary, and Grammar taxonomy with prerequisites, difficulty, supported activities, explanations, hints, and mastery relevance.
- Deterministic generators, answer checking, distractors, ambiguity rejection, grade/readability hooks, safety checks, quality scoring, duplicate detection, approval, telemetry, and quarantine.
- Homework evidence is assisted evidence and must not silently become independent mastery.

### Game and presentation

- Profile flow to BrainBase, Play Portal, Jungle Circuit, all three activities, secret/reward, Fraction Kraken, BrainBase upgrade, save, exit, reopen, continue.
- Player movement, run, jump, land, camera-relative movement, ground detection, interaction, respawn, and configurable input independent of Bite visuals.
- BrainBase spawn, Bite, Play Portal, World Gate, Bite House, trophy/Brainifact area, locked expansion, upgrade hooks, and persistent Kraken transformation.
- Generic world reactions: Activate, Reveal, Repair, Grow, Illuminate, Transform.
- Kraken states: INTRO, RECOGNITION, TRANSITION, EQUIVALENCE, TRANSITION, COMPARISON, BRAINBLAST, VICTORY.
- Production Bite silhouette, expressions, locomotion layers, look-at, blink, IK where useful, cosmetics, personality reactions, VFX, audio, cinematic cameras, premium HUD, quality tiers, instrumentation, and visual regression captures.

### Reliability and operations

- Versioned profile-isolated saves, primary plus last-known-good recovery, migration, partial-write handling, interrupted-session recovery, and corruption recovery without progress loss.
- Offline packs, local event queue, exactly-once/idempotent replay, cloud sync, conflict handling, expired-auth behavior, and reconnect reconciliation.
- Accessibility: scaling, read-aloud, repeat, captions, reduced motion, camera reduction, high contrast, color-independent feedback, simplified/dyslexia-friendly presentation where practical, keyboard, mouse, touch, and controller.
- Parent views derived from evidence: what is going well, where the child struggles, whether improvement is real, and what to do next.
- Privacy, deletion/export hooks, support, domain/HTTPS, production build integrity, and exclusion of BrainBite Lab from production.

## 6. Batch and Phase Roadmap

Status is evidence-based and may not be advanced by a roadmap document alone.

| Batch/phase | Scope | Status | Exit evidence |
|---|---|---|---|
| Phase 0 | Repository truth, orchestration, source-of-truth docs | IN PROGRESS | This file plus clean audit trail |
| Batch 1 | Functional greybox, adaptive core, remediation, review, rewards, persistence, offline/recovery, Lab, tests | MOSTLY IMPLEMENTED | Release/unit/browser gates pass; remaining real-world validation |
| Batch 2 | Production Bite, Jungle art kit, Kraken presentation, VFX/audio/camera/HUD, quality/performance | PARTIAL | Current WebGL assets and automated captures; not AAA-certified |
| Batch 3 | K-6 curriculum expansion, generators, QA telemetry, BrainBite Mix, homework, parent intelligence | PHASE 3.1 GATE COMPLETE; PHASE 3.2 RESOLVER IMPLEMENTED/VERIFIED; INDEPENDENT REVIEWER PASS | Security gate is PASS; resolver focused coverage is `14/14`; unit `102/102`; full browser `102/103` due one known same-installation tab-writer flake with isolated `3/3` retry PASS; ordered-family exact-template, taxonomy, and difficulty support bindings verified; formal educator approval remains pending |
| Phase 3.1 | K-6 taxonomy linkage, deterministic curriculum generation, content QA and evidence routing | COMPLETE FOR IMPLEMENTATION GATE | `95/95` unit, `89/89` browser, all `9` validators, and independent final reviewer `PASS`; content inventory remains controlled and non-production pending Phase 3.2 |
| Phase 3.2 | Content control, educator/content production approval and expansion; live family-specific activity presentation integration | RESOLVER IMPLEMENTED/VERIFIED; INDEPENDENT REVIEWER PASS | Frozen gate+manifest APIs, timing false-positive fix, unlinkable queue payloads, and ordered-family exact-template integrity hardening; ordered-family exact-template, taxonomy, and difficulty support bindings verified; focused `14/14`, unit `102/102`, full browser `102/103` due one known same-installation tab-writer flake, isolated `3/3` retry PASS, all validators pass; formal educator approval remains pending |
| Phase 3.3 | Typing progression foundation, runtime bridge, and encounter | FOUNDATION + ENCOUNTER VERIFIED; EXPANSION OPEN | `content/typing-progression.mjs`; focused `5/5`, typing/activity browser `7/7`, and `test:unit` `107/107` pass; multi-target progression, adaptive support, and device coverage remain open |
| Batch 4 | Accessibility, offline packs, save/sync hardening, failure cases, low-end scaling, privacy audit | PARTIAL | Automated coverage exists; physical devices, cloud, and privacy review remain |
| Batch 5 | First 10-15 minutes, tutorial choreography, UX polish, P0/P1 burn-down | NOT CERTIFIED | Clean acceptance matrix across learner types |
| Batch 6 | AAA Jungle certification, clean install, package integrity, device/performance matrix | LOCAL AUTOMATION COMPLETE; EXTERNAL GATES OPEN | `npm run certify:local` 24/24 and `npm run release:check` 123 unit + 118 browser PASS; `release-evidence/local-certification.json`; mobile hardware, sustained device performance, human review, and production operations remain unverified |
| Batch 7 | One second world, recommended Bubble Reef, reuse measurement and pipeline proof | IMPLEMENTATION STARTED; CERTIFICATION SKIPPED BY USER | Reusable 3D world profile/decor seam is integrated and unit-tested; playable route, interaction, progression, and performance evidence remain open |
| Internal 9.4 | Bite movement, expression, attachment/cosmetic hooks, authored reactions | PASS | Semantic state API, async live battle reaction path, reduced-motion pose, regression tests, and full `58/58` release gate |
| Internal 9.5 | Measured frame-time/performance, real-device preparation, screenshot fidelity | IN PROGRESS | Runtime metrics and capture JSON exist; headless frame-budget violations and physical-device/device-tier evidence remain |
| External gate | Educator, Spanish, legal, parent, accessibility, support, domain/HTTPS, deletion/export | BLOCKED ON HUMAN/ENVIRONMENT | Signed reviews and production environment evidence |

## 7. Orchestration Policy

The orchestrator owns scope, assignment, integration, audit, and the final report. A worker never defines project truth by itself.

1. Read this file, `AGENTS.md`, the relevant batch report, and the current git diff.
2. Run a narrow reality check before assigning implementation.
3. Select exactly one highest-priority unblocked objective. Prefer closing a P0/P1 or an acceptance gap over decorative additions.
4. Use no more than three concurrent workers unless a future session explicitly updates the repository policy. Keep ownership disjoint.
5. Use Luna for narrow inventories, extraction, test-gap lists, and mechanical/pattern-following work. Do not use Luna for open-ended architecture.
6. The user requested Astra visual subagents, but the active deployment policy forbids Astra workers. Keep visual architecture/acceptance with the orchestrator and use only policy-permitted bounded specialists until that policy changes.
7. Use an independent reviewer for every substantive batch. The reviewer is read-only and must inspect the resulting diff and evidence rather than merely restate the task.
8. Do not claim a worker changed code unless its result and the git diff prove it. Do not overwrite unrelated user changes.
9. Run the smallest relevant tests during iteration, then the full release gate before marking a batch complete.
10. If a required gate needs a physical device, human reviewer, production credential, or external service, mark it `UNVERIFIED` or `EXTERNAL`, name the owner, and do not invent a pass.
11. Update this file with the batch result, exact commands, files, risks, and worker telemetry.
12. Do not commit or push unless the user explicitly requests it. Preserve the dirty worktree.

## 8. Worker Assignment Contract

Every worker prompt must include:

- objective and non-goals;
- exact repository path and files it may touch;
- whether it is read-only or implementation-authorized;
- model and reasoning level;
- acceptance checks and expected artifacts;
- instruction not to commit, reset, or revert unrelated work.

Every worker result must include:

- status: `PASS`, `PARTIAL`, `BLOCKED`, or `FAIL`;
- files inspected/changed;
- commands run and concise results;
- evidence paths;
- remaining risks and assumptions;
- model/reasoning;
- token usage and errors when telemetry is exposed, otherwise `not exposed`.

## 9. Current Assignment

Phase 3.1 is complete for its implementation gate. Its authoritative contract and
verified evidence are documented in
`docs/PHASE_3_1_CURRICULUM_INTEGRATION_REPORT.md`; its implemented/verified runtime
content gate and controlled inventory are documented in
`docs/PHASE_3_2_CONTENT_CONTROL_REPORT.md`.

Phase 3.2's security gate is PASS after the frozen gate+manifest APIs, timing
false-positive fix, and unlinkable queue payloads. Ordered-family exact-template
integrity hardening is included. Ordered-family exact-template, taxonomy, and
difficulty support bindings are verified. The live family-aware activity resolver is
IMPLEMENTED/VERIFIED with focused coverage `14/14`; the full browser run is `102/103`
because of one known same-installation tab-writer flake, with an isolated `3/3` retry
PASS. Independent reviewer PASS is recorded. Formal educator approval is pending for the
internal/test prototypes; no record is educator-approved by implication, and
production content remains fail-closed.

Phase 3.3 typing progression foundation is implemented in
`content/typing-progression.mjs`, with focused `5/5` tests passing in
`tests/typing-progression.test.mjs` and `test:unit` passing `107/107`. The verified
runtime bridge exposes `window.BrainBiteGame.submitTypedAnswer` and
`window.BrainBiteTyping`. Full keyboard encounter UI, target progression, and
runtime typing acceptance remain OPEN.

P0 residual status: no residual list was supplied. The independent final reviewer
returned `PASS`, but this documentation update does not infer the absence of runtime,
device, or release P0 issues.

P1/open acceptance gaps (severity is not reclassified by this documentation update):

- The full browser run is `102/103` because of one known same-installation tab-writer flake; isolated retry is `3/3` PASS after focused `14/14` coverage. Independent reviewer PASS is recorded.
- `17` taxonomy-linked JSON items remain non-production; `23` JSON items remain quarantined/unlinked.
- All `35` generated templates and `30` registry missions remain internal/test prototypes pending formal educator approval.
- Runtime gate behavior is verified by automated evidence, but broad runtime, physical-device, and release claims remain unverified; approved UI screenshot match remains `38%`.
- Phase 3.3 typing progression runtime app integration remains open; full keyboard encounter UI, target progression, and runtime typing acceptance remain OPEN.

Current model/reasoning records, token counts, and cumulative error telemetry are
unavailable for this documentation update. No tests were run for the documentation-only
change.

Batch 6 local certification precursor is now reproducible through
`npm run certify:local`. The captured report `release-evidence/local-certification.json`
records the current branch and HEAD, working-tree state, and **24/24 PASS** local steps:
all validators, 123 unit tests, 118 partitioned browser tests, shipping/MATCH/offline/
export/accessibility/PWA/Windows smokes, and desktop/mobile performance probing. The
runner intentionally labels mobile hardware, external reviews, and production-host
operations UNVERIFIED. Batch 7 remains gated on the external Jungle certification items.

The canonical `npm run release:check` was rerun after the certification changes and
passed with `123/123` unit tests and `118/118` browser tests. Playwright output now
defaults to ignored `.playwright-results/` rather than the protected `test-results/`
directory. The performance probe remains diagnostic: its headless frame/long-task
violations are recorded, not promoted to device-certification evidence.

### Retained Historical Orchestration Notes

The following visual, security, and performance records are retained as history. They
are not the current assignment and must not override the Phase 3.2 queue above.

Highest-priority completed batch: **Security and sync integrity remediation**, followed by **Internal Phase 9.4 Bite reaction foundations**. The independent reviews found and the parent fixed unsafe profile/topic interpolation, deletion resurrection risk, non-idempotent cloud history merges, an async reaction race, an equivalent-event queue race, an ambiguous Homophone Hollow token, and reduced-motion pose application.

The active security patch is now implemented and verified in the automated suite. It adds DOM-safe rendering for profile/topic/Lab data, persistent deletion tombstones, stale-write protection, stable history deduplication, and regression coverage. Residual concurrency, production Firebase, physical-device, and human-review gates remain unverified.

Internal Phase 9.4 is complete for its bounded scope: semantic animation state API, async live battle wiring, reduced-motion pose application, and regression coverage are implemented and included in the full `58/58` gate. The active safe presentation batch is **Internal Phase 9.5, measured frame-time/performance, real-device preparation, and screenshot fidelity**. Runtime metrics and startup/navigation telemetry are implemented; settled home render calls are now within the provisional budget, while headless frame tails, physical-device evidence, and screenshot fidelity remain open.

Recommended split:

- Sol-medium implementation: add bounded Bite animation state transitions and semantic reaction hooks without changing LearningCore. Touch only assigned presentation files and tests. PASS for the current focused scope.
- Sol-low inventory: identify the smallest existing animation/presentation seams and exact test additions. Read-only. PASS; it identified the async caller and scene-bob risks.
- Sol-medium independent reviewer: inspect every substantive diff, run targeted tests/captures, and report location, trigger, impact, and evidence for each finding. Phase 9.4 review found four P1 correctness issues across two passes; all four were fixed and covered by the post-fix `58/58` release gate. The final post-last-fix reviewer turn was not returned, so retain the reviewer’s residual risk that production Firebase concurrency and physical performance remain unverified.
- Sol-medium implementation: build the isolated performance-budget utility and tests. PASS; parent integrated frame, scene-ready-load, memory, renderer, asset, and save hooks into the live presentation and capture harness.
- Sol-low inventory: identify exact performance seams and evidence gaps. PASS/PARTIAL; it confirmed there is no physical-device or screenshot-diff certification yet.
- Sol-medium independent reviewer: audit the post-integration performance evidence read-only. CHANGES REQUESTED; scene-ready timing, capture ordering, battle mascot wait, and renderer sampling were corrected and reverified. Remaining concerns are headless performance validity, physical-device evidence, and the existing distinction between manual and Resource Timing asset records.
- Sol-medium implementation: add startup readiness and labeled screen-navigation telemetry. PASS; bootstrap race protection was added, focused tests pass, and the full `58/58` gate remains green.
- Sol-medium independent review: audit the corrected steady-state renderer sampling boundary. TIMED OUT and closed after the bounded review window; no files changed, no visual work started. Parent verification passed syntax, `39/39` unit tests, the focused live asset-budget browser test, a no-screenshot settled-assets probe, and the fresh full `npm run release:check` gate with all `58/58` browser tests passing. The initial probe reported home `233` calls / `69` geometries / `35,410` triangles / `919 ms` scene load and battle `165` calls / `44` geometries / `33,036` triangles / `693 ms` scene load; the later instancing sub-batch brought home to `182` calls.
- Sol-low inventory: identify the home scene draw-call sources. TIMED OUT; no files changed, no visual work started. Parent inspection confirmed the loaded jungle GLB is additive to the intentional procedural density, so hiding it was rejected as a visual regression risk.
- Sol-medium implementation: replace repeated procedural stepping stones and garden elements with equivalent `InstancedMesh` batches. PASS; transforms, materials, visibility, fallback behavior, and gameplay remained unchanged. The settled no-screenshot probe improved home from `233` to `182` render calls while battle remained `165`; the home budget assertion is now automated.
- Sol-medium independent review: audit the instancing optimization and regression guard. TIMED OUT and closed after the bounded review window; no files changed or visual work started. Parent verification passed syntax, `39/39` unit tests, the focused draw-call browser test, and the fresh full `npm run release:check` gate with all `58/58` browser tests passing. Keep physical-device performance and visual-regression review open.
- Sol-medium implementation: start frame-tail samples only after all scene assets settle and reset the first post-load interval. PASS; telemetry and settled-metric browser assertions were updated without changing the render loop or presentation. The no-screenshot probe reported home frame p95 `250.3 ms` and battle frame p95 `654.3 ms` under headless scheduling, both conservatively recommending `mobile`; this is diagnostic only, not device certification. The focused test and fresh full release gate passed.
- Sol-medium independent review: audit the frame-tail telemetry boundary. TIMED OUT and closed after the bounded review window; no files changed or visual work started. Parent verification passed syntax, `39/39` unit tests, the focused settled-metric browser test, and the fresh full `npm run release:check` gate with all `58/58` browser tests passing.
- Sol-medium implementation: add `longTask` performance-budget telemetry with `PerformanceObserver`, scene lifecycle disconnects, and unit/browser report coverage. PASS; no visual or gameplay behavior changed. A no-screenshot probe recorded home long-task p95 `524 ms` and battle long-task p95 `469 ms`, aligning with the headless frame-tail violations and confirming that the current evidence is diagnostic rather than physical-device certification. Fresh verification passed `40/40` unit tests and `58/58` browser tests.
- Sol-medium independent review: audit long-task observer fallback, cleanup, and report compatibility. TIMED OUT and closed after the bounded review window; no files changed or visual work started. Parent verification passed syntax, `40/40` unit tests, the focused live WebGL budget test, and the fresh full release gate with all `58/58` browser tests passing.
- Sol-medium implementation: add the no-visual `probe:performance` evidence pack and package script. PASS; desktop and mobile JSON reports include startup, navigation, save latency, settled scene metrics, long tasks, renderer counters, asset timing, recommendations, errors, warnings, and resource-failure URLs. The probe completed with zero app-origin errors; each viewport recorded one expected offline Google Fonts warning. Desktop home reported `182` calls, mobile home `209`, desktop/mobile battle `165`/`139`; mobile draw-call and all frame-tail thresholds remain unverified P1 device work. Fresh syntax, probe, unit, and full release checks passed.
- Sol-medium independent review: audit the performance evidence pack and warning classification. TIMED OUT and closed after the bounded review window; no files changed or visual work started. Parent verification passed the probe on both viewports and the fresh full release gate with all `58/58` browser tests passing.

Do not start Batch 7 until the Jungle slice has a certification-quality report. Do not call the app “100% functional” while physical-device, human-review, production-cloud, or production-operations gates remain unverified.

## 10. Retained Historical Orchestration Record

Parent orchestrator: `GPT-5`; parent reasoning/telemetry: `not exposed`.
Current Phase 3.1/3.2 model and reasoning records, token counts, and cumulative error
telemetry are unavailable. The historical worker records below are retained for
traceability only.

| Agent | Model / reasoning | Role | Result | Tokens / errors |
|---|---|---|---|---|
| Hubble (`01a092cb-79ba-7cc2-b0a6-94e458c025f2`) | `gpt-5.6-sol` / low | Read-only repository inventory | PASS, historical inconsistencies identified | tokens not exposed; errors 0 observed / total errors 0 |
| Huygens (`01a092cb-7c3f-7490-895e-985197e3d687`) | `gpt-5.6-sol` / low | Read-only roadmap reconciliation | PASS, phases mapped to evidence | tokens not exposed; errors 0 observed / total errors 0 |
| Wegener (`01a092cb-7db2-7461-bd0b-22bb3d1f32b4`) | `gpt-5.6-sol` / medium | Independent read-only review | FAIL production-ready gate; findings fixed or queued | tokens not exposed; errors 0 observed / total errors 0 |
| Laplace (`01a092d1-be4e-7862-90e9-d8457a4b4c62`) | `gpt-5.6-sol` / medium | Bounded security/sync implementation | PARTIAL initially; targeted and full gates now pass | tokens not exposed; errors 0 observed / total errors 0 |
| Harvey (`01a092dc-c6d9-7622-b42d-5fa58910aacc`) | `gpt-5.6-sol` / medium | Independent post-patch review | PARTIAL; residual concurrency/XSS sinks were addressed or recorded | tokens not exposed; errors 0 observed / total errors 0 |
| Feynman (`01a09300-6bf2-7b80-a9a8-dbc9b666df0b`) | `gpt-5.6-sol` / low | Read-only Phase 9.4 seam inventory | PASS/PARTIAL; found caller wiring and async-load risks | tokens not exposed; errors 0 observed / total errors 0 |
| Confucius (`01a09300-6cb0-7592-a43b-6ca44a81a33e`) | `gpt-5.6-sol` / medium | Bite semantic animation implementation | PASS; API, reduced-motion behavior, lifecycle tests | tokens not exposed; errors 0 observed / total errors 0 |
| Dalton (`01a0930f-1ff6-7d03-b93f-01fb8421aadf`) | `gpt-5.6-sol` / medium | Independent Phase 9.4 review | PARTIAL; three initial findings plus an equivalent-event race were fixed and regression-verified; no separate final reviewer turn after the last fix | tokens not exposed; errors 0 observed / total errors 0 |
| Aquinas (`01a09323-af4d-7060-a03a-85c3f63c20e2`) | `gpt-5.6-sol` / low | Read-only Phase 9.5 performance seam inventory | PASS/PARTIAL; identified frame, asset, save, capture, and low-end seams | tokens not exposed; errors 0 observed / total errors 0 |
| Halley (`01a09323-aff9-72b3-8bc0-4e113b47dd25`) | `gpt-5.6-sol` / medium | Performance budget implementation | PASS for bounded utility; six unit tests and syntax checks pass; runtime integration completed by parent | tokens not exposed; errors 0 observed / total errors 0 |
| Sartre (`01a09344-f9cf-7061-84a6-6f94be90d443`) | `gpt-5.6-sol` / medium | Independent post-integration Phase 9.5 review | CHANGES REQUESTED initially; all actionable scene-ready, capture-order, mascot-wait, and renderer-order findings were fixed and regression-verified; physical-device/performance acceptance remains open | tokens not exposed; errors 0 observed / total errors 0 |
| Epicurus (`01a0961e-5442-7bd2-897e-bc7371f981d2`) | `gpt-5.6-sol` / medium | Startup/navigation telemetry implementation | PASS; readiness, navigation, queue-based lifecycle protection, focused tests, and full regression gate | tokens not exposed; errors 0 observed / total errors 0 |
| Ohm (`01a0961e-5527-7500-8891-ca2609730ebc`) | `gpt-5.6-sol` / low | Read-only home draw-call inventory | TIMED OUT and closed; no files changed or visual work started | tokens not exposed; errors 0 observed / total errors 0 |
| Locke (`01a0963f-2a14-7812-b0d5-6992ffb1704e`) | `gpt-5.6-sol` / medium | Independent steady-state sampling review | TIMED OUT and closed; no files changed or visual work started | tokens not exposed; errors 0 observed / total errors 0 |
| Hooke (`01a09646-60d3-74a3-a16b-3d000658f350`) | `gpt-5.6-sol` / low | Read-only home draw-call cause inventory | TIMED OUT and closed; no files changed or visual work started | tokens not exposed; errors 0 observed / total errors 0 |
| Gauss (`01a0964e-eca4-79d3-9886-24c7a6946b62`) | `gpt-5.6-sol` / medium | Independent instancing optimization review | TIMED OUT and closed; no files changed or visual work started | tokens not exposed; errors 0 observed / total errors 0 |
| Dalton (`01a09658-79cb-7ea1-a98a-ee814f2bb08f`) | `gpt-5.6-sol` / medium | Independent frame-tail telemetry review | TIMED OUT and closed; no files changed or visual work started | tokens not exposed; errors 0 observed / total errors 0 |
| Turing (`01a0965d-76de-7cf0-a268-700502c6dd8a`) | `gpt-5.6-sol` / medium | Independent long-task telemetry review | TIMED OUT and closed; no files changed or visual work started | tokens not exposed; errors 0 observed / total errors 0 |
| Volta (`01a09664-40e8-7930-8d5b-807bacd85604`) | `gpt-5.6-sol` / medium | Independent performance evidence-pack review | TIMED OUT and closed; no files changed or visual work started | tokens not exposed; errors 0 observed / total errors 0 |

Agent budget remaining is not exposed by the current tooling. The only observed test/tool errors in this chat were the expected locked historical `test-results` path failures and the initial Phase 9.4 test failure that exposed the async reaction race; both were resolved without reverting unrelated work. No code worker committed or reset the repository.

## 11. Progress Snapshot

These are planning estimates, not certification metrics:

| Measure | Estimate | Meaning |
|---|---:|---|
| Functionality foundation | ~96% | Core learning, profile, evidence, activity, persistence, offline, and routing foundations are automated; external acceptance remains |
| Overall product functionality | ~80% | Learning, profile, activity, Bit curriculum, 3D companion, persistence, offline, and release paths have current automated evidence; educator, device, cloud, and external acceptance remain open |
| Approved UI screenshot match | ~39% | WebGL/PWA presentation exists, but approved visual parity and physical-device fidelity remain incomplete |
| Weighted 49-phase progress | ~55% | Phase progress is evidence-weighted; local Batch 6 certification is 24/24, while physical-device, human-review, and later-world phases remain open |
| Strong-beta readiness | ~78% | Automated foundation and certification evidence are substantial; educator, device, cloud, production, and polish gates remain |
| AAA Jungle readiness | ~56% | Three.js/WebGL presentation, companion integration, and local performance evidence are verified; final art, sustained device performance, and external certification remain |

These are conservative planning estimates, not certification scores. Broad product
completion remains open. Recalculate after each batch from new evidence; never increase
a percentage solely because code was added.

## 12. Chat-End Report Template

Use this compact report at the end of every orchestration chat:

```text
Current project context:
- path, branch, HEAD, dirty/clean state
- current batch/phase and objective

Agents:
- name: model / reasoning / role / status
- tokens used: exact value or not exposed
- errors: count / total errors: count
- token budget remaining: exact value or not exposed

Evidence:
- commands and results
- files changed
- reviewer findings

Progress:
- functionality: __%
- approved UI screenshot match: __%
- batches/phases: __%
- strong-beta readiness: __%

Next:
- next batch/phase
- recommended model/reasoning
- explicit blockers and owner
```

## 13. Known Non-Goals and Guardrails

- Do not migrate to Unity merely because the product brief mentions Unity; the verified app is a web PWA and the current WebGL pipeline is the shortest safe path.
- Do not add a Blender MCP as a prerequisite. The local Blender CLI pipeline is reproducible and sufficient for current work; revisit only if a concrete automation gap justifies it.
- Do not ship unknown-provenance art, direct AI-to-child content, fixed-count mastery, cross-profile state, duplicate rewards, or production BrainBite Lab tooling.
- Do not treat screenshot similarity as functional correctness or automated browser success as physical-device certification.
- Do not advance second-world 3D production while the Jungle slice lacks certification-quality device/performance evidence.
- Do not mark curriculum coverage complete until the reconciled mission inventory has educator review and production content-quality evidence.

## 14. Latest Visual Batch: 2026-09-12

This section is retained historical visual context. It does not supersede the current
Phase 3.2 content-control queue or the current estimates in Section 11.

The user explicitly authorized visual updates. The first live-scene composition/material pass is implemented in `D:\Codex\Brainbite`; no commits or pushes were made, and existing dirty work was preserved.

Read `docs/VISUAL_UPDATE_2026-09-12.md` for exact scope, files, commands, failed checks, fixes, and remaining gates. Final desktop/phone home and battle captures are in `release-evidence/visual-update-final/`. They are actual live WebGL renders, not MATCH reference plates.

Implemented: immersive desktop HUD, small/short-screen scroll fallback, retained subject navigation, cyan portal shader, warm jungle lighting, wood/gold signs, textured water, and seven instanced tree batches. Learning and persistence code was not changed. Regression coverage now includes shader compilation errors, real clicks and uncovered HUD at three viewport sizes, plus tree-transform identity.

Evidence: final combined `npm run release:check` PASS, exit 0, all validators plus 41/41 unit tests and 62/62 browser tests (2.3 minutes). Three focused viewport tests also passed; four final live screenshots inspected with zero captured page/shader errors. Output directory: `playwright-output-visual-release-final-20260912`. Capture render calls: home 110 desktop and phone; battle 165 desktop / 139 phone. Hardware performance is NOT certified. Existing buffered long-task and too-early capture sampling limitations remain; never treat a one-frame Ultra recommendation as stable performance.

Agents this batch:

| Agent | Model / Reasoning | Work | Result | Tokens / Errors |
|---|---|---|---|---|
| Orchestrator | Current session; model/reasoning telemetry not exposed | Scene/material code, integration, tree batching, tests, final audit | Implementation and verification owner | Tokens and cumulative errors not exposed; observed failed checks documented in the visual report |
| Arendt (`01a0966d-ec30-76a2-bb19-52e4457a8607`) | `gpt-5.6-sol` / medium | CSS-only HUD, navigation and responsive layout | COMPLETE; integration layering/navigation findings fixed; viewport checks passed | Tokens/cumulative error telemetry not exposed |
| Confucius (`01a09670-0722-74d3-bddb-db11051cd83c`) | `gpt-5.6-sol` / medium | Independent read-only scene, CSS and tree-batching review | COMPLETE; no remaining credible static findings; 10/10 presentation tests passed | Tokens/cumulative error telemetry not exposed |

Historical planning estimates from this visual batch are retained for context only;
they are not current estimates or certification scores.

Historical next step: continue Internal Phase 9.5 with a bounded Bite/jungle asset and
landmark-camera composition pass, followed by a compact mobile HUD pass and
physical-device verification. This is superseded by the current Phase 3.2 queue above.

## 15. Latest Follow-Up: Bite, Framing, Mobile

User `n` authorized this follow-up. Read `docs/VISUAL_FRAMING_MOBILE_2026-09-12.md` for exact files and verification history. Repository/branch/HEAD remain `D:\Codex\Brainbite`, `batch-9-webgl-spike`, `96d3bb7`; dirty work preserved, no commit/push.

Implemented: house and portal/signs moved clear of the desktop side panels; fallback/GLB/shader/Play anchor share placement values. Blender pipeline1.2.0 refines Bite's smile, crest, chest, shoes and materials while retaining rig/idle/socket compatibility; all5 GLBs rebuilt and re-imported. Phone HUD is substantially shorter with retained subject links, 44px answers/read-aloud controls, and wrapping dock labels that support enlarged text. Renderer dimensions now match the actual small host rather than an obsolete minimum. Cache keyv28 refreshes cache-first visual assets.

Evidence: final combined `npm run release:check` PASS, exit 0: all validators, 41/41 unit tests, and 66/66 browser tests (3.2 minutes). Output: `playwright-output-framing-mobile-verified`. Two focused framing/compact-phone tests and final three phone/double-text checks also passed. Earlier timing failures and their corrections remain documented in the follow-up report. Final captures are `release-evidence/visual-framing-mobile-final/`, with zero captured page/shader errors. Normal-scale screenshots are visually inspected; physical devices remain unverified.

Agents: Arendt, Sol/medium, completed CSS-only implementation and normal360/390 checks. Confucius, Sol/medium, completed read-only review and identified the enlarged-text dock risk; parent corrected it and added passing regressions. Orchestrator owned Blender/framing/render-size changes, integration and final evidence. Exact model/reasoning telemetry for the orchestrator, agent tokens and cumulative error counters are not exposed. Observed test/tool failures and corrections are recorded in the follow-up report.

This dated visual follow-up recorded a prior planning snapshot of core automated
functionality 92%, full product 79%, approved UI match 52%, batches/phases 84%, and
strong beta 67%. It is historical visual context; the current conservative estimates
are in Section 11 and the Phase 3.1 report. Internal Phase 9.5 and production
certification remain partial.

Historical next safe batch: continue Jungle/battle art and camera refinement, followed
by physical-device and sustained performance verification. This is superseded by the
current Phase 3.2 queue above.

## 16. Hybrid Asset Pipeline And Expanded Visual Targets

The user supplied coding-bridge, typing-runner and world-selection targets, plus
a proposed 3D AI Studio / Blender pipeline. Full production plan and phased gates:
`docs/HYBRID_ASSET_PRODUCTION_PLAN.md`. Exact reference copies and hashes are recorded
there, with images under `docs/references/expanded-vision/`.

Adopt optional AI candidates -> quarantine -> Blender standardization -> validated
GLB -> existing Three.js/WebGL. Preserve the working game and authored fallback.
Unity is a consequential optional migration, not the current engine and not an
implicit prerequisite. Do not build a nominal Unity validator with no editor/project
to verify it. No vendor account was connected and no paid jobs or uploads occurred.

This update is documentation/reference preservation only. The previous 41/41 unit,
66/66 browser result remains prior runtime evidence, not a newly executed test run.
The existing Blender builder is not yet a generic third-party intake validator.

Typing, coding, Code Lab, Bits/Create and seven-world concept navigation require
inventory and separate functional acceptance. Do not mark these implemented from
the screenshots. Historical 79% functionality / 52% UI / 84% phases describe the
prior scope only; expanded-scope completion is UNASSESSED until reconciliation.

Next dispatch supersedes section 15's art-only next step: Phase A1, local asset
intake/provenance/quarantine/Blender normalization and runtime GLB validation, with
negative fixtures and safe promotion/rollback. Use a bounded Sol/medium owner and
independent reviewer. This can proceed without vendor keys or spending. Follow
with the three-prop pilot before bulk generation or hero replacement.

## 17. Phase 2.1 Asset Intake Completion

Phase 2.1 is COMPLETE for the isolated offline intake and approval boundary. Read
`docs/PHASE_2_1_ASSET_INTAKE_REPORT.md` and `docs/ASSET_INTAKE.md`. The implementation
adds strict self-contained GLB/provenance/budget validation, immutable quarantine,
separate local approval, pre-promotion hash recheck, idempotent promotion and
interruption rollback. `assets/intake/` is Git-ignored and not cached or shipped.

Final evidence on the corrected state: `node --check` PASS; 8/8 focused intake
tests; 49/49 unit tests; `npm run release:check` PASS with every validator and
66/66 browser tests (2.8 minutes), output `playwright-output-asset-intake-a1-final`.

Independent review initially found numeric IDs could be regex-coerced and fail
before quarantine. Strict string checks plus a regression fixed it; follow-up
review passed. One earlier Sol/medium reviewer was blocked by an automated safety
classifier and produced no review or edits. Luna inventory/reviewer and exact
telemetry are recorded in the phase report; token counters are not exposed.

No Blender cleanup or runtime asset replacement is claimed. Next visual phase is
2.2, the three-prop pilot. Batch 0 Phase 0.4 expanded feature reconciliation runs
in parallel because it is read-only and independent.

## 18. Expanded Scope Reconciliation And Rebaseline

Batch 0 Phases 0.4 and 0.5 are COMPLETE. Read
`docs/EXPANDED_SCOPE_RECONCILIATION.md`. Repository evidence shows typing PARTIAL,
Coding Bridge ABSENT, learner Code Lab ABSENT, programmable Bits ABSENT, Create
PARTIAL, and world selection PARTIAL. At reconciliation time, the live app
contained 3 worlds / 30 missions / 3 bosses while the vertical-slice LearningCore
described 1 world / 3 activities / 1 boss. Phase 3.0 now records the canonical
runtime inventory in `content/experience-registry.js` and keeps the vertical-slice
defaults registry-managed.

That divergence was a P0 architecture gate for expanded modes, not proof of a
current child-data failure. Phase 3.0 established the canonical
activity/world/progression registry and legacy-save parity boundary before
typing/coding work.
Never create another mastery, reward, unlock or profile ledger.

The pre-Phase 3.1 expanded-scope baseline recorded existing core automation 92%,
expanded functionality 63%, all-target UI match 38%, weighted 49-phase progress 39%,
expanded strong-beta readiness 55%, and AAA Jungle readiness 45%. This is historical
context only; the current conservative estimates are in Section 11 and the Phase 3.1
report, and none are certification scores.

Ramanujan, Luna/xhigh investigator, completed the read-only full-repository feature
inventory. No edits, runtime tests, commits or pushes. Exact token and cumulative
error telemetry are not exposed. The orchestrator integrated the evidence into the
roadmap and retains the architecture decision.

## 19. Phase 2.2 Blender Normalization Tooling

Read `docs/PHASE_2_2_BLENDER_NORMALIZATION_REPORT.md`. The nonvisual portion of
Phase 2.2 is verified: approved static props can be normalized with Blender factory
settings/autoexec disabled, meter units, stable material naming, canonical root and
bottom-center pivot; GLB and `.blend` outputs are staged, re-imported, budget/hash
validated and idempotently rechecked. No shipping asset or runtime visual changed.

Final evidence: 14/14 focused Node tests, 3/3 real Blender integration scenarios,
and `npm run release:check` PASS with all validators, 55/55 unit tests and 66/66
browser tests (2.9 minutes). Output directory:
`playwright-output-blender-geometry-phase22-final`.

Independent Sol/medium reviews covered cache validation, promotion identity,
second-pass drift, root metadata, geometry preservation, report trust, GLB accessor
and decoded-bounds validation, deterministic material names, timeout cleanup and
bounded hostile-input work. All findings were fixed with regressions; Gibbs returned
a final PASS with no actionable findings. Tesla and Mencius, Luna/xhigh, supplied
read-only seam/fixture inventories. Exact agent tokens are not exposed; no agent task
execution errors occurred in this phase.

Phase 2.2 remains IN PROGRESS because its rock/fern/ruin visual assets, comparisons
and runtime/device art acceptance are not complete. That phase's historical snapshot
was weighted roadmap progress 40%, expanded functionality 63%, all-target visual
match 38%, expanded strong-beta readiness 55%, and AAA Jungle readiness 45%; the
current conservative estimates are in Section 11 and the Phase 3.1 report. The next action is actual
visual work, which the user reserved for Astra. Active deployment policy forbids
Astra subagents, so continue with an Astra parent/orchestrator or obtain an allowed
visual ownership decision before changing visual assets.

## 20. Phase 3.0 Canonical Registry

Read `docs/PHASE_3_0_CANONICAL_REGISTRY_REPORT.md`. The verified nonvisual Phase
3.0 work makes `content/experience-registry.js` canonical for one realm, three
live worlds, 30 missions, three live mission bosses plus non-mission Fraction
Kraken, three activity families, and the vertical-slice defaults.

The app save schema migrates v7 to v8 with canonical progression. LearningCore
defaults consume the registry. `bb-core-v3` remains the canonical profile store,
with adaptive state embedded as per-profile `learningCore`; standalone foundation
keys import once and are then removed. The service worker caches the registry,
and content validation covers registry/manifest parity and answer ambiguity.
Mission 12 overlap is fixed.

Final evidence is 12 registry tests, 68 complete unit tests, and 72 complete
browser tests passed. All release validators passed. Independent Sol/medium
review returned PASS with no remaining P0/P1 findings after fixes for concurrent
LearningCore merges, recovery-source selection, locked reward prevention,
profile-scoped parent authorization, and ambiguous educational classifications.
Phase 3.0 is COMPLETE for its implementation gate. No visual work occurred in
this phase, and this is not whole-product certification.

Phase 3.1 is COMPLETE for its implementation gate. Final evidence is recorded in
`docs/PHASE_3_1_CURRICULUM_INTEGRATION_REPORT.md`: `95/95` unit, `89/89` browser,
all `9` validators, and independent final reviewer `PASS`. Phase 3.2's security gate
is PASS after the frozen gate+manifest APIs, timing false-positive fix, and
unlinkable queue payloads. Ordered-family exact-template integrity hardening is
included, and ordered-family exact-template, taxonomy, and difficulty support bindings
are verified. Latest evidence is focused `14/14`, unit `102/102`, full browser `102/103`
because of one known same-installation tab-writer flake, isolated `3/3` retry PASS, and
all validators pass. The live family-aware resolver is IMPLEMENTED/VERIFIED with
independent reviewer PASS. The visual Phase 2.2 asset pilot remains a separate concern
and is not advanced by this curriculum status.

Phase 3.3 typing progression foundation is implemented in `content/typing-progression.mjs`,
with focused `5/5` tests passing in `tests/typing-progression.test.mjs` and `test:unit`
passing `107/107`. The verified runtime bridge exposes
`window.BrainBiteGame.submitTypedAnswer` and `window.BrainBiteTyping`; full keyboard
encounter UI, target progression, and runtime typing acceptance remain OPEN.
