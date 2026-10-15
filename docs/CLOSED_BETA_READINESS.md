# BrainBite Closed-Beta Readiness

Date: 2026-10-15
Scope: Phase 4.3 of `docs/BRAINBITE_PRODUCTION_GOAL.md` — package, defect ledger,
external gates, and rollback.

This document is the honest state of the closed-beta candidate. It separates what is
verified locally from what is not, and it does not claim external gates.

The PR #2 implementation and its CI/native results are historical evidence, not current
verification. The current local audit, including the final digest-gate acceptance fix,
passes the focused content-review checks and the integrated unit, browser, and smoke gates
listed below. No remote CI, native, device, educator, or external certification is claimed.
Steve owns the eventual merge under decision D6.

## 1. Runtime package

Built by `npm run native:stage` (`scripts/stage-site.mjs`) from an explicit allowlist.

| Measure | Value |
|---|---|
| Package-manifest files | 105 |
| Package-manifest size | 6,216,993 bytes |
| Contents | `index.html`, `app.js`, `brainbite-core.mjs`, `styles.css`, `fonts.css`, `sw-register.js`, `service-worker.js`, `manifest.webmanifest`, public pages, `assets/`, `audio/`, `content/`, `icons/`, `presentation/`, `vendor/` |
| Excluded | `docs`, `tests`, `scripts`, `release-evidence`, `node_modules`, `.git`, `.github`, `.cursor`, `AGENTS.md`, `package.json` |

`npm run check:stage` rebuilds the package and fails if any precached asset or any file
`index.html`/`fonts.css` references is missing, if developer material leaks in, or if the
package no longer matches `release-evidence/package-manifest.json`. Regenerate that
manifest with `npm run package:manifest` whenever the runtime allowlist or a runtime file
changes. The check exists because `fonts.css`, `sw-register.js`, and both font files were
silently missing from the package before it was written.

The 2026-10-15 manifest read reports **105 files / 6,216,993 bytes**. A fresh
`npm run check:stage` attempt was blocked before validation by an `EPERM` lock on
`.native-site-check`, so this refresh does not claim a new successful staging check.

`CHECKSUMS.json` was retired in this cycle. It was hand-maintained and had drifted to 45
entries pointing at files that no longer exist (old `.wav` audio, removed tests and
scripts) plus 20 stale digests. The generated package manifest replaces it: it is derived
from the same allowlist that builds the package, so it cannot describe files the package
does not contain.

Clean-install procedure (Windows closed-beta artifact):

```powershell
Set-Location D:\Codex\Brainbite
git status --short --branch        # expect a known revision
npm ci
npm run check:content
npm run check:content-review
npm run check:static
npm run test:unit
npm run test:e2e
npm run smoke
npm run probe:performance
npm run native:verify              # stage + shell verification + packaging test
npm run native:build               # produces the installer under src-tauri/target
```

The installer is unsigned and is an internal closed-beta artifact.

## 2. Historical and current local evidence

| Area | Source | Evidence |
|---|---|---|
| Current focused content-review tests | `node --test tests/content-review.test.mjs` | **25/25** |
| Current content-review validator | `npm run check:content-review` | **PASS**, 105 records, 0 digest mismatches |
| Current integrated unit run | `npm run test:unit` | **267/267**, zero failed/skipped |
| Current browser suite | Local audit run | **220/220, zero retries** |
| Current smoke checks | Local audit run | **11/11**, including Chrome+Edge Windows matrix |
| Historical repository validators | Prior Cycle 2 audit | content, content-review, static (10 checks), runtime, release, Firebase, launch, final, Firebase security, native package, and release evidence — all PASS |
| Historical performance budgets | Prior Cycle 2 audit | 0 headless budget violations; device-only measurements remain unverified |
| Offline | Static inventory and historical browser checks | 94 precached URLs; offline reload, offline 3D reopen, and PWA installability are historical Chrome/Edge results |
| Profile isolation | Prior unit and browser coverage | Cross-tab reconciliation tests in all three lock modes |
| Historical native runtime | Prior PR #2 local record | Fresh `npm run native:build`; `npm run native:verify:runtime` opened BrainBite and its child processes with zero TCP listeners |
| Content safety | Current manifest and gate contract | Production mode fails closed; 30 registry missions are production-eligible; 75 records remain quarantined or non-production |
| Historical automated accessibility | Prior PR #2 local record | axe: zero serious/critical violations across 21 primary screens plus the live battle HUD |

## 3. Evidence inventory

| Artifact | Produced by | Status |
|---|---|---|
| `.ui-captures/release-evidence/smoke-report.json` | `npm run smoke` | Durable git-ignored latest-run report outside Playwright result directories; replaced on each run, with `capturedAt` and an in-file retention notice |
| `release-evidence/smoke-report.json` | `npm run evidence:refresh` (or smoke `--promote`) | Tracked validator input remains at this path; deliberate promotion replaces it with the promoted run |
| `release-evidence/package-manifest.json` | `npm run package:manifest` | Manifest read on 2026-10-15: 105 files, 6,216,993 bytes; fresh staging validation not claimed in this refresh |
| `release-evidence/content-review-packet.{json,html}` | `npm run review:packet` | Prior packet: 75 pending records, 0 digest mismatches |
| `.ui-captures/release-evidence/performance-evidence/{desktop,mobile,summary}.json` | `npm run probe:performance` | Durable git-ignored latest-run reports outside Playwright result directories; replaced on each run, with `capturedAt` and an in-file retention notice |
| `test-results/performance-evidence/{desktop,mobile,summary}.json` | `npm run probe:performance` | Compatibility output retained at its existing path; transient because Playwright can clear `test-results/` |
| `release-evidence/local-certification.json` | `npm run certify:local` | Historical: **17/17 stages**, 210 browser cases (2 passed on retry), 11/11 smokes, probe exit 0 with zero headless budget violations. The report was captured on `36887b9` with the final stylesheet/evidence changes in the worktree and records that initial tree as dirty; those changes are committed in `a6786aa`. No-retry follow-ups passed `tests/release.spec.js` 92/92 and BrainBase/MATCH 14/14 |

`.ui-captures/release-evidence/` is the shared durable local evidence root: it is already
git-ignored, neither harness deletes it, and Playwright cleanup does not manage that directory.
These files preserve the latest run rather than an archive; copy a timestamped snapshot elsewhere
when multiple historical runs must be retained.

## 4. Defect ledger

### Fixed in this cycle

| Defect | Impact | Evidence it is fixed |
|---|---|---|
| Cross-tab evidence under-counted (one attempt counted as one across two tabs) | Silent learning-data loss | `concurrent tabs reconcile…` passes in all three lock modes |
| Parent shell visible to children on the child hub | Child could see and reach parent destinations | `[hidden]` is authoritative; `boots without runtime errors and separates the child hub from parent tools` |
| Two live startup errors (`#installBtn`, `#updateStatus`) | Console errors on every load | Real install control and update notice added; startup error capture is empty |
| Dead code paths asserted by tests that could never fail | False confidence | Vacuous-assertion validator plus real dock coverage |
| Fourteen smoke/capture scripts and the performance probe unreachable on port 4317 | No smoke evidence could be produced | `check:test-ports`; `npm run smoke` passes 11/11 |
| Six smoke checks broken by the child/parent split | Latent breakage nobody saw | Each rewritten against the current IA and passing |
| Native package missing `fonts.css`, `sw-register.js`, and both font files | Shipped app had fallback typography and no service worker | `check:stage` |
| Save latency measured where software rasterization dominates | Misleading 2.5 s save readings | Gated sample moved to the shipping DOM path (8 ms) |

### Also fixed in this cycle

- `CHECKSUMS.json` retired (see section 1) and replaced by
  `release-evidence/package-manifest.json`, verified by `check:stage`.
- CI (`ci.yml`) now runs `check:static` and the smoke runner instead of a hand-rolled
  six-script block, and uploads `smoke-report.json` as an artifact.
- Pages deploy (`pages.yml`) now runs `check:static` before staging, so a deploy cannot
  ship a package that is missing a referenced or precached asset. It already deployed only
  from `main`, only after a successful CI run at the exact tested commit.
- The performance probe now starts its own server when the port is idle and closes it
  again. Before this it required a server to already be listening and reported the
  resulting connection refusal as a measurement, which is why its earlier evidence was
  empty and `certify:local`'s performance stage could not have measured anything.

### A lost WebGL context could throw in front of a child

The context-loss tests dispatched `webglcontextlost` by hand, which is not what a browser
does. `loseContext()` marks the context lost **synchronously** and dispatches the event
afterwards, so frames can run against a dead context in between. Rendering in that window
made three.js read a null uniform name:

```
TypeError: Cannot read properties of null (reading 'trim')
  at onFirstUse (three.module.js) -> WebGLProgram.getUniforms
  -> setProgram -> renderBufferDirect -> WebGLShadowMap.render
```

The exception escaped the frame loop as an unhandled error, killing the loop. Both scenes now
route every render through one guard that consults the renderer's live context state
(`renderer.getContext().isContextLost()`), not only the event flag, and both tests use a real
loss and a real restore instead of synthetic events. Verified: the premise holds 24/24, 0 page
errors across 24 real context losses, webgl group 32/32, full suite 161/161.

### The save latency "p95" was the median of three samples

The probe took three saves, reported the middle one as `statistic: "p95"`, and gated it
against the p95 budget, so the tail it claimed to check was never measured. It now takes 20
samples and reports real median, p95 and max, gating p95 and max separately. Measured after
the fix: desktop median 4.0 ms / p95 6.6 / max 7.2, mobile median 6.6 / p95 10.1 / max 10.2,
against a 250 ms p95 and 1000 ms max budget. Tails under real device load remain unverified.

### The educator review tooling could never have recorded an approval

Preparing the reviewer workflow exposed two defects that would have made the first review
outcome either corrupt the manifest or fail outright. Both were latent because the shipped
manifest has no approvals yet, so neither path had ever run.

| Defect | Effect | Fix |
|---|---|---|
| The block rewrite used `/const X = \{\n[\s\S]*?\n  \};/` | The regex needs at least one line between the braces, so for an **empty** block it does not stop at its own closing line — it runs on to the next `};` in the file. The first approval ever recorded would have deleted every line between the approvals block and that point, including the reviewer findings block | `replaceDataBlock` matches the opening and closing lines separately and cannot overrun; a regression test proves neighbouring code survives |
| `getReviewManifest()` did not include the `approvals` or `reviewerFindings` blocks | The validator read `undefined` for both, so it expected every record to look unapproved. An approval could never have validated, and no finding could ever have been checked | Both blocks are part of the manifest object |

The review also had no way to record a **negative** outcome: `review:approve` was the only
command, so a reviewer who found a wrong answer key had no recorded path, and the packet
gave no criteria to assess against. That is now a finding that quarantines the record (so it
can never be approved and never ships), a seven-point rubric in the packet, and a
`--list` that no longer offers records which cannot be approved.

### The certification harness certified less than it claimed

Running `npm run certify:local` for the first time in this cycle exposed three defects in
the harness itself, all of which made the artifact look better than the run behind it:

| Defect | Effect | Fix |
|---|---|---|
| It started a server on port **4317** and waited for it | Nothing ever connected: Playwright's global setup and the smoke runner each serve 4318, so the readiness gate proved nothing. `check:test-ports` was exempting this exact file, which is why the drift was never flagged | The runner starts no server; every stage serves itself, and the file is scanned again |
| `tests/bubble-reef-preview.spec.js` was in no group | The run covered 159 of the 161 browser tests and still reported a clean sweep | It joins the activity group, and `check:certification-coverage` fails when a configured spec is in no group |
| The git snapshot was taken at the end | `workingTreeClean` was always false, because the run regenerates tracked evidence by design, so the field carried no information | Snapshot taken before anything is written |

The browser groups also ran with zero retries while CI uses one, so a single load-induced
WebGL mount or reload timeout failed a twenty-minute run. They now match CI, and each entry
records passed/flaky/failed counts parsed from the Playwright JSON report, so a test that
only passes on retry is visible as flaky rather than hidden.

The top-level certification report now aggregates those retry recoveries as `summary.flaky`
and emits one of three statuses: `passed` (no failed stage and no retry-recovered browser
test), `passed-with-retries` (no failed stage, but at least one retry recovery), or `failed`
(at least one failed stage). Retry recovery currently remains exit-success policy; whether it
should fail certification is deliberately deferred to the owner. This describes report
semantics only; certification was not rerun for this documentation refresh.

### Harness provenance and adaptive timing

The development server exposes `/.brainbite-test-provenance`, containing a SHA-256 of the
checkout's `index.html`. Playwright verifies it when server reuse is explicitly requested,
and the smoke runner verifies it whenever it finds an answering server. A stale or generic
server now aborts the run instead of being silently trusted.

Run `npm run smoke` for the inventory, optionally adding `-- --only <name>` or
`-- --timeout <ms>`. Default per-script budgets start from four times the recorded duration
plus 60 seconds, adapt to observed host slowdown, and are capped at 600 seconds. The runner
prints a `BUDGET` line for every smoke and persists the timeout and its basis. Run
`npm run probe:performance` separately; it polls scene readiness and prints/persists each
effective scene-settle budget instead of relying on one fixed delay. Neither harness run was
repeated for this documentation refresh.

### CI found two cross-platform bugs the Windows workstation could not see

The first pull request ran the real workflow for the first time. Both failures were
Windows-only blind spots:

| Failure | Cause | Fix |
|---|---|---|
| `check:static` failed on six package manifest digests (app.js, index.html, boot.mjs, capability.mjs, service-worker.js, three.module.js) | The manifest hashed raw working-copy bytes; the Windows copy had mixed CRLF/LF endings while CI checked out LF | `.gitattributes` normalizes text to LF in the repository and every checkout; text hashing is line-ending independent and binaries are still hashed byte for byte |
| `smoke-pwa-installability` failed 10/11 | It hardcoded `D:/Codex/Brainbite` as the repository root, so every manifest icon lookup failed on Linux | The root is derived from the module location; `check:host-paths` joined `check:static` to prevent a recurrence |

Historical PR #2 evidence for fully tested gameplay commit `3ebcf35d8bc7ea18d7c69b64b9015cdedd7201e6` is recorded in [CI run 43](https://github.com/1983stevec-gif/BrainBite/actions/runs/36316190009) and [CI run 44](https://github.com/1983stevec-gif/BrainBite/actions/runs/36316192782): each passed all validators, native package verification, 236 unit tests, 211 browser tests with zero retries, 11/11 smoke checks, the clean-tree guard, and the Firestore emulator job. This is not current Cycle 2 verification. The 3D pointer regression was exercised in that historical suite. Runs 41/42 exposed two test races: the local-storage tab check read rotating snapshots before persistence reconciliation, and the Classic Practice Lab test deduplicated repeated correct cells. Both were fixed before runs 43/44.

### Open, non-blocking

| Item | Severity | Note |
|---|---|---|
| GLB geometry: 53% of vertices are duplicated | **Closed, no geometry change made** | The GLBs alone measure 374 KB brotli and Draco measured as a wash. Authored raster surfaces are accounted for separately in section 5 |
| Rebuilding the Blender kit is not byte-reproducible | P3 | Same Blender 5.2.40 and the same committed script: three of five GLBs rebuild byte-identically, the kraken differs by one accessor and 4,456 bytes, the mascot by 4 bytes. Verify assets against the committed manifest (`--verify-only`); do not expect a rebuild to match |
| Device-only budgets unverified: frame pacing, long-task tails, scene load, asset load | P2 (external) | Recorded in every probe run; requires real hardware |
| `app.js` remains a large classic script with a full re-render on save | P3 | Measured `render()` at 5–6 ms, so it is not a current bottleneck |

### Known follow-ups

- Use [`CSS_CASCADE_REVIEW_2026_10_15.md`](CSS_CASCADE_REVIEW_2026_10_15.md) as the companion
  review when it lands. The current verbose dead-CSS diagnostic reports 134 duplicate selector
  declarations; they need classification, not blind removal.
- Work through the deferred owner decisions in
  [`ENHANCEMENT_PLAN_2026_10_15.md`](ENHANCEMENT_PLAN_2026_10_15.md) and the dated audit/build
  plans. They include retry policy, Expedition/offline policy, currency legacy boundaries,
  concurrent review writes, and the external gates in section 6.

## 5. 3D payload: full shipped set

After optimization, the shipped 3D set is recorded as **3,459,795 raw bytes**:
3,161,104 bytes of GLBs plus 298,691 bytes of authored raster surface assets. The textures
were reduced from 1,427,208 bytes. Against the 4,194,304-byte budget, that leaves 734,509
bytes of headroom. This is a byte-count result, not a
startup or device-performance guarantee.

The geometry analysis below applies only to the five GLBs. It shows that over half of
their vertices are copied instead of referenced, because every part is created with its
own mesh datablock in the Blender pipeline.

| Asset | KiB | primitives | distinct geometries | redundant vertices | largest duplicate group |
|---|---:|---:|---:|---:|---:|
| mascot | 1,284 | 56 | 11 | 17,379 of 21,204 (82%) | 18× |
| kraken | 898 | 64 | 13 | 11,760 of 21,463 (55%) | 16× |
| answer pillars | 338 | 28 | 9 | 3,540 of 8,294 (43%) | 8× |
| portal | 313 | 16 | 7 | 1,020 of 7,505 (14%) | 8× |
| jungle props | 254 | 28 | 14 | 574 of 5,603 (10%) | 5× |
| **GLB total** | **3,087** | 192 | 54 | **34,273 of 64,069 (53%)** | |

### Why this is not worth a risky change

The 2026-10-15 `npm run measure:payload` output reads the five GLBs and two authored raster
surfaces:

| | raw | gzip | brotli |
|---|---:|---:|---:|
| complete seven-asset set | 3,459,795 bytes | 1,085,948 bytes | 681,340 bytes |

The same output rounds those totals to **3,379 KB raw / 1,060 KB gzip / 665 KB brotli**, and
reports the raw payload within the 4,194,304-byte budget by 734,509 bytes. These figures now
cover the complete measured asset set, but remain byte-count/transfer measurements rather
than physical-device performance evidence.

Draco was implemented, measured, and then reverted:

- The compressed GLBs came to **693 KB** (78% off) and Blender re-imported all five
  successfully, so the pipeline works.
- Reading them needs a decoder: 245 KB for the wasm build or 500 KB for the JS build.
  That puts the total at 938–1,193 KB against 374–769 KB compressed — **a wash, or worse.**
- It also costs two CSP relaxations: `'wasm-unsafe-eval'` for WebAssembly compilation, and
  a blob worker because three's `DRACOLoader` builds its worker from a Blob. This app
  deliberately ships `script-src 'self'; worker-src 'self'`.

Blender-side mesh sharing cannot help either. `export_apply` has to stay on (the bevel and
armature modifiers depend on it), and it makes the exporter evaluate every object
separately, so sharing a mesh datablock deduplicates nothing in the exported GLB.

The latest recorded single-run peak was about 126,000 triangles of the 250,000 ceiling and
about 29 MB memory of the 512 MB ceiling. Jungle measured up to 174 home draw calls and 136
battle draw calls. Bubble Reef home measured 143 desktop / 145 mobile against the 200
ceiling in one run. Desktop
startup measured 2,798 ms against 3,000 ms in one load-sensitive run, leaving only about
200 ms of observed headroom, not a budget guarantee. The GLB duplication is retained here
so it is not re-opened without new information; a decoder already present for another
reason would change the Draco arithmetic.

## 6. External gates — not part of this package

| Gate | Owner | Requirement |
|---|---|---|
| Educator review of the 75 pending records | Human reviewer | `npm run review:packet` produces a printable sheet with the content and a seven-point rubric. `npm run review:approve` records an approval against the exact source digest; `npm run review:reject -- --reason "<finding>"` records a finding that quarantines the record, blocks any approval and keeps it out of production |
| Physical-device matrix (phones, tablets, Chromebook, controller) | Steve | `docs/GATE_8_4_OPERATOR_CHECKLIST.md` |
| Real screen-reader pass | Human reviewer | `docs/GATE_8_5_SR_OPERATOR.md` |
| Legal / privacy sign-off | Human reviewer | `docs/GATE_8_5_LEGAL_CLAUSE_MAP.md` |
| Spanish fluency review | Human reviewer | `docs/GATE_8_5_SPANISH_INVENTORY.md` |
| Production domain, HTTPS, support contact | Steve | `docs/GATE_8_6_OPERATOR_CHECKLIST.md` |
| Production Firebase delete/export verification | Steve | Requires a signed-in production session |
| Store packaging and signing | Steve | The current installer is unsigned |
| Enable GitHub Pages so the deploy can run | Steve | Settings, Pages, Source: GitHub Actions. PR #2 must first be merged; until Pages is enabled the deploy workflow fails with `Get Pages site failed` |

## 7. Rollback

The runtime is a static package plus local storage, so rollback is bounded and offline.

1. **Application code**: the closed-beta package is staged from a single revision. To roll
   back, re-run `npm run native:stage` on the previous revision and rebuild with
   `npm run native:build`. Nothing in the package mutates the repository.
2. **Learner data**: local storage keeps three generations — primary `bb-core-v3`, backup
   `bb-core-v3-back`, and recovery `bb-core-v3-recovery`. A corrupt primary recovers from
   a distinct known-good snapshot automatically on load; a parent can also use
   Parent → Recovery → Restore Backup, which first writes a pre-operation rollback snapshot
   to `bb-core-v3-pre-operation-rollback`.
   If all generations are unreadable, `bb-core-v3-unreadable-quarantine` retains only the
   three newest corruption-event snapshots. It prunes oldest first and records bounded
   pruning diagnostics so retention changes remain inspectable.
3. **Content**: production content is fail-closed by digest. Removing an approval from
   `content/content-review-manifest.js` immediately returns that record to non-production
   without touching the content itself.
4. **Service worker**: the cache name is versioned. Bumping it forces every client to
   re-precache on next launch; `sw-register.js` registers the worker and the Advanced screen
   offers a reload prompt when an update takes control.
5. **Native shell**: uninstall the app; local storage is removed with the profile directory,
   so export progress first from Parent → Recovery → Export Versioned Progress.

## 8. What is deliberately not claimed

- No physical-device, educator, legal, Spanish/language, screen-reader, publishing, signing,
  or store certification.
- No production Firebase or other production-cloud verification.
- No claim that the 3D presentation matches the approved reference art.
- No claim of sustained device performance; the headless budgets above are the only
  performance numbers that are asserted.

## 9. Export boundary

Parent-authorized profile, full-backup, cloud-snapshot, and release-backup export paths now
construct profiles from an explicit field allowlist and recursively redact credential-like
keys case-insensitively, including known synonyms. The deliberate trade-off is fail-closed:
an unknown future profile field is omitted until the export schema and its round-trip tests
are intentionally updated. This improves confidentiality but does not promise forward
compatibility for undeclared fields, and it is not legal/privacy approval or production
Firebase export verification.
