# Enhancement plan — 2026-10-15

Baseline: `audit/verified-build-plan` at `6da27b6`, clean tree. This plan continues
`AUDIT_BUILD_PLAN_2026_10_01.md` after rounds 1–6 and uses `HANDOFF.md` as the current
boundary record. It schedules evidence-backed engineering work, not release, device,
production, or human-review certification.

Evidence labels retain the source round. **Round 7** means the 2026-10-15 follow-up audit,
which confirmed or narrowed a carry-forward finding against this baseline.

## Selected for this round
### 1. Prove reused-server provenance
- **Evidence:** Round 6 / R10 found that an answering server was accepted without proving it
  served the intended checkout; Round 7 confirmed both Playwright reuse and
  smoke readiness still trust availability alone.
- **Owning files:** `tests/playwright-global-setup.mjs`, `scripts/smoke-runner.mjs`,
  `scripts/serve.mjs`, `scripts/probe-performance.mjs`.
- **Improvement:** expose and verify a checkout fingerprint derived from a stable served file
  before any reused server is trusted. A mismatch must stop the run, not silently start or use
  another tree under the current tree's name.
- **Acceptance check:** a server from a different fixture checkout answers normally but all
  reuse paths fail with expected/actual fingerprint evidence; a matching server and a newly
  owned server proceed and report the verified fingerprint.

### 2. Replace load-sensitive fixed timing assumptions
- **Evidence:** Round 6 / R10 measured the longest smoke at 56 seconds against the fixed
  120-second Linux child ceiling and identified the probe's fixed five-second scene settle;
  the recheck found only a separate fixed Windows ceiling had been added.
- **Owning files:** `tests/playwright-global-setup.mjs`, `scripts/smoke-runner.mjs`,
  `scripts/serve.mjs`, `scripts/probe-performance.mjs`.
- **Improvement:** derive startup, child, and scene-settle budgets from one documented policy
  with explicit margin and supported overrides; print and persist the effective values.
- **Acceptance check:** focused tests exercise the derivation, override, timeout, and success
  paths; smoke and probe reports identify each effective budget, and a deliberately slow but
  in-budget fixture does not false-fail.

### 3. Make profile exports allowlisted and credential-aware
- **Evidence:** Round 2 / R2 deferred an allowlisted export schema. Its diagnostic redaction
  fix did not change `scrubSecrets()`; Round 7 found exports still depend on an
  exact, case-sensitive `SECRET_KEYS` blacklist.
- **Owning files:** `app.js`, `tests/release.spec.js`.
- **Improvement:** construct exported profiles from an explicit field allowlist, then apply
  case-insensitive, synonym-aware credential-key redaction recursively as defense in depth.
  The trade-off is intentional: unknown future profile fields are omitted until the export
  schema and tests are deliberately updated, improving confidentiality at the cost of forward
  compatibility for undeclared fields.
- **Acceptance check:** mixed-case and synonym credentials at nested levels never appear in
  profile, full-backup, cloud-snapshot, or release-backup exports; an unknown benign field is
  demonstrably omitted, while every allowlisted recovery field round-trips.

### 4. Bound unreadable-quarantine retention
- **Evidence:** Round 4 / R7 found `bb-core-v3-unreadable-quarantine` unbounded across distinct
  corruption incidents and deferred its retention policy; Round 7 confirmed
  snapshots are still appended without a cap.
- **Owning files:** `app.js`, `tests/storage-copies.test.mjs`, `tests/release.spec.js`.
- **Improvement:** retain at most the three newest corruption-event snapshots. Trim oldest
  first only while preparing a successfully written replacement; never discard the newest
  snapshot, including when older quarantine data needs migration.
- **Acceptance check:** four distinct incidents leave exactly the newest three in order; the
  newest bytes survive migration and quota/write-failure cases, and ordinary recovery remains
  unchanged.

### 5. Make mobile readability claims precise
- **Evidence:** Round 6 / R11 found that named readability cases in
  `tests/mobile-home-layout.spec.js` prove overflow and 44px boxes, but not text clipping; the
  Round 7 recheck also separated initial-viewport placement from mere visibility.
- **Owning files:** `tests/mobile-home-layout.spec.js`.
- **Improvement:** where a case says readable or initial, assert unclipped text and initial
  viewport geometry; otherwise rename it to the narrower property actually tested.
- **Acceptance check:** a fixture that clips the long learner name fails a legibility test,
  and a below-fold control fails an initial-viewport test before focus or scrolling can move it.

### 6. Detect `!important` cascade fights without blind cleanup
- **Evidence:** Round 6 / R11 found the dead-CSS check cannot see duplicate declarations or
  `!important` shadowing. Round 7 confirmed existing fights between the base rail colors
  (`.rail-brain`, `.rail-worlds`, `.rail-base`, `.rail-shop`) and their later adventure-home
  overrides; reduced-motion, `[hidden]`, canvas sizing, and mode visibility rules also require
  classification rather than blanket removal.
- **Owning files:** `scripts/check-dead-css.mjs`, `styles.css`.
- **Improvement:** parse declarations sufficiently to detect a later `!important` declaration
  shadowing the same property for an overlapping selector, and make that finding fail the
  strict check. Record the named existing fights as follow-up/temporary exceptions; do not
  refactor the stylesheet merely to silence the new detector.
- **Acceptance check:** a synthetic overlapping shadow fails with selectors, property, and
  source locations; non-overlapping and justified utility rules do not false-fail; every
  current exception is explicit and the four rail-color fights remain visible as follow-up.

### 7. Report retry-recovered certification honestly
- **Evidence:** Round 6 / R10 found flaky counts recorded per browser group while the overall
  certification still reports a fully passed run; its fail-or-not policy was left open.
- **Owning files:** `scripts/certify-local-release.mjs`.
- **Improvement:** aggregate flaky tests into the top-level summary and mark the overall run
  `passed-with-flakes` (or equivalent) whenever retries recover failures. Do not choose whether
  flakes should fail certification; expose that as an owner policy decision.
- **Acceptance check:** fixture reports with zero and nonzero flaky counts produce distinct
  summaries, totals equal the group sum, and a retry-recovered run cannot display an
  unqualified fully-passed status.

### 8. Move pinned actions only after verifying supported majors
- **Evidence:** Round 7 found GitHub's Node 24 forced-runtime warning
  applies to pinned workflow actions; this was not part of the Round 6 CI split itself.
- **Owning files:** `.github/workflows/ci.yml`, `.github/workflows/pages.yml`.
- **Improvement:** inventory every `uses:` pin, verify the latest published major and its
  Node 24 support from the action's upstream release/tag record, then bump only verified
  majors. Preserve workflow permissions, artifacts, sharding, and Pages ordering.
- **Acceptance check:** the plan/PR evidence records the upstream major checked for each action;
  workflow validation passes, all CI jobs and Pages dependencies remain present, and no pin is
  changed to a major that does not exist.

## Deferred to the owner — recorded, not scheduled
- Whether Expedition becomes the Windows default, and fresh-install offline proof for it.
- Currency-ledger residual boundaries: concurrent unreceipted score and unknown legacy earnings.
- Review-write atomicity for concurrent operators.
- Whether retry-recovered flakes fail certification or only mark it degraded.
- Educator review, physical-device matrix, Pages enablement, legal/privacy, Spanish, screen-reader review, production Firebase, and package/store signing.

## Not claimed
No implementation, passing check, release readiness, publication, production Firebase result,
device result, or human approval is claimed; each remains unverified until its listed acceptance check or owner gate supplies evidence.
