# BrainBite Enhancement Plan — 2026-09-21

Status: ACTIVE
Source: the recommendations raised after the 2026-09-21 audit
(`docs/AUDIT_2026-09-21.md`), each grounded in evidence found in this repository.

Every item below states its acceptance check. An item is done only when its focused
verification passes and the full release gate stays green.

## Item A — Surface the explanation the app already has

Evidence: 35 of 36 curriculum templates carry a non-empty `explanation`, the core
*requires* one (`Canonical generated content must include an explanation`), and it is
carried onto the runtime challenge (`explanation: template.explanation`). The child never
sees it: `incorrectAttemptMessage()` returns `"Not 18. Try another."`

Change: a wrong answer shows the challenge explanation when one exists, with the guided
hint still taking precedence for assisted play.

Acceptance: a browser test proves a wrong answer surfaces the explanation, and assisted
play still shows the guided hint.

## Item B — Static validators for the defects found by hand

Each of these was found manually in this session; each is cheap to automate.

| Validator | Would have caught |
|---|---|
| `check:element-ids` | `#installBtn`, `#updateStatus` — two live startup errors |
| `check:test-selectors` | the `nav button[data-screen=…]` drift that made the release suite unrunnable |
| `check:vacuous-assertions` | `Math.min(...[])` and `[].every()` — two tests green while asserting nothing |
| `check:precache` | a missing precache URL, which breaks the whole SW install (`addAll` is all-or-nothing) |

Acceptance: all four run as npm scripts, pass on the current tree, and are wired into the
release gate.

## Item C — Unit-test the persistence layer against a fake storage

Evidence: `writeStoreCopiesUnlocked`, `convergeStoreCopiesUnlocked`, `readAllStoredStores`,
and `readEveryStoredCopy` are the most safety-critical code in the app and are only
covered by slow browser tests with cross-tab timing.

Change: extract those primitives into `content/storage-copies.js`, parameterised by a
storage object and key set. `app.js` passes `localStorage`; the node test passes a fake.

Acceptance: `tests/storage-copies.test.mjs` covers rotation, convergence, corrupt-primary
fallback, tombstone precedence, idempotent re-write, and a throwing storage, and the
browser suite stays green.

## Item D — Make the LearningCore readiness contract explicit

Evidence: `app.js` is a classic script that runs before the deferred
`brainbite-core.mjs`, so the canonical load cannot use the real merge. Today that is
patched by "reconcile on the first render after core is available", which relies on
render timing.

Change: `brainbite-core.mjs` dispatches `bb:core-ready`; `app.js` listens once and runs
the reconciliation, keeping the render-time call as an idempotent safety net.

Acceptance: a test asserts the readiness event fires and that reconciliation runs exactly
once.

## Item E — Split the performance budget into pass/fail and external

Evidence: every budget violation is currently recorded as "diagnostic, needs real-device
confirmation", so no performance gate exists. Headless frame tails are meaningless;
scene load, save latency, memory, and renderer counts are not.

Change: classify each budget metric as `headless` or `device-only`. The probe fails on
headless violations and prints device-only metrics as UNVERIFIED.

Acceptance: a unit test covers the classifier; the probe reports an explicit pass/fail
summary for headless budgets.

## Item F — Make the fail-closed content reviewable in one sitting

Evidence: 105 manifest records — 30 registry missions are `production: true`, and
`review.status === 'approved'` is `0`. The gate's contract for approving any other record
is exact: `educatorReview = { status:'approved', reviewer:{ id, role, reviewedAt } }`,
`runtime.prototype === false`, `runtime.production === true`, plus a matching source
digest.

Change: `scripts/gen-review-packet.mjs` emits a reviewer-facing packet (prompt, answers,
distractors, explanation, hint, skill, difficulty, digest) for every non-production
record; `scripts/approve-content.mjs` verifies digests and applies the approval
atomically, refusing on drift.

Acceptance: unit tests prove approval refuses a digest mismatch and produces a
gate-eligible record; the packet generates for all 75 records.

## Item G — Read-aloud beyond the battle prompt

Evidence: `speechSynthesis` is wired only to the battle prompt. The primary user may not
read fluently.

Change: a shared speak helper used by the prompt card, answer choices, and the wrong-answer
explanation, respecting the reduced-motion and captions settings.

Acceptance: a browser test proves an answer choice and the explanation are speakable.

## Item H — Bounded local error log

Evidence: failures become status text plus `globalThis.__BRAINBITE_PERSISTENCE_ERROR__`;
nothing is retained, so a closed-beta report of "it broke" is not actionable.

Change: a bounded ring buffer (memory + `localStorage`) recording error type, message,
context, and timestamp; surfaced in Diagnostics and included in `diagnosticBundle()`.

Acceptance: a test proves the buffer is bounded, survives a reload, and never stores
learner answers or names.

## Item I — Font and asset integrity check

Evidence: `fonts.css` is generated by a script that needs network access, and nothing
verifies the committed font files still match the generator.

Change: record SHA-256 for each generated font in `fonts.css` as a comment and verify it
in `check:precache`.

Acceptance: tampering with a font file fails the check.

## Results

All nine items are implemented and verified. Each row names its focused evidence.

| Item | Status | Evidence |
|---|---|---|
| A — surface the explanation | DONE | `a wrong answer explains why using the reviewed explanation`; assisted play still shows the guided hint first |
| B — static validators | DONE | `npm run check:static` runs six checks, each proven to catch its target regression: element ids, test selectors (including the `nav` structural drift), vacuous assertions, precache existence, test ports, dead CSS |
| C — persistence unit tests | DONE | `tests/storage-copies.test.mjs` 8/8 in 75 ms: rotation order, corrupt siblings, first-valid fallback, oldest-first reconciliation, idempotent convergence, throwing storage, no partial generation set |
| D — readiness contract | DONE | `bb:core-ready` is dispatched by the core and consumed once by `app.js`; `LearningCore readiness reconciles saved generations exactly once` |
| E — budget split | DONE | `classifyBudgetViolations` unit-tested; the probe now fails on headless budgets and lists device-only ones as unverified. Headless: 0 violations. Payload gate: 3,154 KB of a 4,096 KB ceiling |
| F — review packet and approvals | DONE | `npm run review:packet` generates a sheet for all 75 pending records with 0 digest mismatches; `npm run review:approve` refuses quarantined, unknown, stale-digest, and already-shipping records; the validator now enforces the approval contract instead of forbidding approvals |
| G — read-aloud | DONE | `the wrong-answer explanation can be read aloud` |
| H — bounded error log | DONE | `the local issue log is bounded, survives reload, and stores no learner data` (50-entry ceiling, four sanitized fields) |
| I — asset integrity | DONE | `check:precache` verifies every precache URL exists and every generated font matches its recorded SHA-256 |
| J — one reported smoke runner (Phase 4.1) | DONE | `npm run smoke` runs all 11 smoke checks in ~68 s and writes `release-evidence/smoke-report.json`; it is a stage of `release:check`, and `certify:local` now calls it instead of keeping its own list. Six checks were broken and invisible before this; each fix is listed under "Found while building" |
| K — Phase 4.2 measurement closure | DONE | The probe now measures every budget it declares and gates the ones a headless container can judge. Measured: startup **720/600 ms** (budget 3000), save **8/8.9 ms** (budget 250), payload **3,183/3,222 KB** (budget 4,096), memory 20 MB (budget 512), draw calls 117 home / 198 battle (budget 200), triangles 39,656 (budget 250,000). Headless violations: 0. Frame pacing, long-task tails, scene load, and asset load are recorded as device-only and unverified |
| L — Phase 4.3 closed-beta package | DONE | `npm run check:stage` rebuilds the 96-file package and fails on any missing precached or referenced asset, any leaked developer path, or any drift from `release-evidence/package-manifest.json`; `docs/CLOSED_BETA_READINESS.md` carries the verified surface, evidence inventory, defect ledger, external-gate list, and rollback procedure |
| M — Phase 0.2/0.3 declarations and deploy gating | DONE | Stale `CHECKSUMS.json` retired (45 dead entries, 20 stale digests) and replaced by a generated package manifest; CI runs `check:static` and the smoke runner and uploads smoke evidence; the Pages deploy validates the package with `check:static` before staging. Remote workflow proof still needs a push |

### Found while building

- **Fourteen smoke and capture scripts were pinned to port 4317** while the test server
  serves on 4318, so none of them could reach the app. All fourteen now derive the port,
  `scripts/serve.mjs` defaults to 4318, and `check:test-ports` prevents a recurrence.
  `scripts/probe-performance.mjs` was in the same state: its evidence had been measured
  against a manually started server, and it silently reported a connection failure as a
  measurement.
- **Six of eleven smoke checks were broken** and nothing had run them, so the breakage was
  invisible. `npm run smoke` now runs them all under one reported runner
  (`scripts/smoke-runner.mjs`, evidence in `release-evidence/smoke-report.json`) and the
  runner is a stage of `release:check`. Each fix was a real behaviour change the smokes had
  not kept up with:

  | Smoke | Stale assumption | Now |
  |---|---|---|
  | export-only | `Parent` button, 4-digit PIN, native `confirm()` | Parents orb, 6+ digit PIN, themed destructive dialog with exact-name confirmation, re-entry after access revocation |
  | export-a11y | `[data-screen="profiles"]` reachable without the shell; `Number Nebula` on the hub | parent shell navigation, then Worlds |
  | parent-practice-privacy | same | same, plus leaving the parent area for a child destination |
  | gate84-windows | `nav button[data-screen="settings"]` | home Settings utility |
  | gate84-viewports | `Number Nebula` on the hub | Worlds |
  | completion-pusher | `Number Nebula` on the hub | Worlds |

- `scripts/certify-local-release.mjs` listed nine smokes of its own; it now calls the runner
  so one place owns the smoke inventory, and its performance entry reports headless budget
  violations separately from device-only ones plus the measured payload.
- **The performance probe reported a connection failure as a measurement.** It required a
  server to already be listening, so when it ran after another stage closed its server it
  recorded `ERR_CONNECTION_REFUSED` and exited non-zero with empty metrics. It now starts
  its own server when the port is idle and closes it again, which is also why
  `certify:local`'s performance stage could never have measured anything.
- The mascot GLB is **1,284 KB of geometry with no embedded textures** (21,204 vertices,
  32,976 triangles, 56 primitives, all raw float32 attributes) and is the slowest asset at
  ~3.9 s cold. Total 3D payload is 3,183 KB. Draco compression is the highest-value
  remaining reduction and both halves are already local (Blender bundles the encoder,
  `three` ships the decoder and `DRACOLoader`), but it needs a vendored decoder and a
  loader wiring pass; a decimated re-export is the simpler alternative.
- **Save latency was being measured in the wrong place.** With a live WebGL scene the
  persistence chain queues behind software-rasterized frames — measured ~600 ms of pure
  frame time — which says nothing about save cost. The gated sample is now taken on the
  shipping DOM path, where steady-state saves measure 8 ms against a 250 ms budget. The
  WebGL-session save samples are retained in the report as informational, and the probe
  documents why.

## Not in this plan

- **Committing the work.** 165 changed entries are uncommitted and `check:evidence` cannot
  pass while the tree is dirty. This needs an explicit decision from Steve; it is not a
  build item.
- External gates (physical device, educator sign-off, legal, cloud, store) are unchanged
  and are not claimed by this plan.
