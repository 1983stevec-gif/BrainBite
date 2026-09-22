# BrainBite Closed-Beta Readiness

Date: 2026-09-22
Scope: Phase 4.3 of `docs/BRAINBITE_PRODUCTION_GOAL.md` — package, defect ledger,
external gates, and rollback.

This document is the honest state of the closed-beta candidate. It separates what is
verified locally from what is not, and it does not claim external gates.

## 1. Runtime package

Built by `npm run native:stage` (`scripts/stage-site.mjs`) from an explicit allowlist.

| Measure | Value |
|---|---|
| Staged files | 96 |
| Staged size | ~5.4 MB |
| Contents | `index.html`, `app.js`, `brainbite-core.mjs`, `styles.css`, `fonts.css`, `sw-register.js`, `service-worker.js`, `manifest.webmanifest`, public pages, `assets/`, `audio/`, `content/`, `icons/`, `presentation/`, `vendor/` |
| Excluded | `docs`, `tests`, `scripts`, `release-evidence`, `node_modules`, `.git`, `.github`, `.cursor`, `AGENTS.md`, `package.json` |

`npm run check:stage` rebuilds the package and fails if any precached asset or any file
`index.html`/`fonts.css` references is missing, if developer material leaks in, or if the
package no longer matches `release-evidence/package-manifest.json`. Regenerate that
manifest with `npm run package:manifest` whenever the runtime allowlist or a runtime file
changes. The check exists because `fonts.css`, `sw-register.js`, and both font files were
silently missing from the package before it was written.

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

## 2. Verified locally

| Area | Evidence |
|---|---|
| Unit tests | `198/198` |
| Browser suite | `161/161`, exit 0 |
| Smoke checks | `11/11` via `npm run smoke`, evidence in `release-evidence/smoke-report.json` |
| Repository validators | content, content-review, static (7 checks), runtime, release, Firebase, launch, final, Firebase security — all PASS |
| Performance budgets (headless-judgeable) | startup 720/600 ms of 3000; save 8/8.9 ms of 250; payload 3,183/3,222 KB of 4,096; memory 20 MB of 512; draw calls 117/198 of 200; triangles 39,656 of 250,000 — zero violations |
| Offline | service worker precaches 90 assets; offline reload, offline 3D reopen, and PWA installability pass on Chrome and Edge |
| Profile isolation | unit and browser coverage, plus the cross-tab reconciliation tests in all three lock modes |
| Content safety | production mode fails closed; 30 reviewed registry missions ship; 75 records remain quarantined or non-production |
| Accessibility | axe: zero serious/critical violations across 21 primary screens plus the live battle HUD |

## 3. Evidence inventory

| Artifact | Produced by | Status |
|---|---|---|
| `release-evidence/smoke-report.json` | `npm run smoke` | Current: 11/11 passed |
| `release-evidence/package-manifest.json` | `npm run package:manifest` | Current: 96 files, verified by `check:stage` |
| `release-evidence/content-review-packet.{json,html}` | `npm run review:packet` | Current: 75 pending records, 0 digest mismatches |
| `test-results/performance-evidence/{desktop,mobile}.json` | `npm run probe:performance` | Current: zero headless budget violations |
| `release-evidence/local-certification.json` | `npm run certify:local` | Current: **16/16 stages**, 161 browser tests (92 + 23 + 32 + 14), 11/11 smokes, probe exit 0 with zero headless budget violations |

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

### CI found two cross-platform bugs the Windows workstation could not see

The first pull request ran the real workflow for the first time. Both failures were
Windows-only blind spots:

| Failure | Cause | Fix |
|---|---|---|
| `check:static` failed on six package manifest digests (app.js, index.html, boot.mjs, capability.mjs, service-worker.js, three.module.js) | The manifest hashed raw working-copy bytes; the Windows copy had mixed CRLF/LF endings while CI checked out LF | `.gitattributes` normalizes text to LF in the repository and every checkout; text hashing is line-ending independent and binaries are still hashed byte for byte |
| `smoke-pwa-installability` failed 10/11 | It hardcoded `D:/Codex/Brainbite` as the repository root, so every manifest icon lookup failed on Linux | The root is derived from the module location; `check:host-paths` joined `check:static` to prevent a recurrence |

CI is green on the branch (`9m11s` for the pull request run).

### Open, non-blocking

| Item | Severity | Note |
|---|---|---|
| 3D payload: 53% of vertices are duplicated geometry | **Closed, no change made** | Measured; it compresses to 374 KB brotli and Draco measured as a wash. See section 5 |
| Rebuilding the Blender kit is not byte-reproducible | P3 | Same Blender 5.2.40 and the same committed script: three of five GLBs rebuild byte-identically, the kraken differs by one accessor and 4,456 bytes, the mascot by 4 bytes. Verify assets against the committed manifest (`--verify-only`); do not expect a rebuild to match |
| Device-only budgets unverified: frame pacing, long-task tails, scene load, asset load | P2 (external) | Recorded in every probe run; requires real hardware |
| `app.js` remains a large classic script with a full re-render on save | P3 | Measured `render()` at 5–6 ms, so it is not a current bottleneck |

## 5. 3D payload: measured, and deliberately not "fixed"

The runtime package ships 3,183 KB of 3D assets, which is 78% of the 4,096 KB budget.
Analysing the GLB accessors shows that over half of it is the same geometry copied
instead of referenced, because every part is created with its own mesh datablock in the
Blender pipeline.

| Asset | KB | primitives | distinct geometries | redundant vertices | largest duplicate group |
|---|---:|---:|---:|---:|---:|
| mascot | 1,284 | 56 | 11 | 17,379 of 21,204 (82%) | 18× |
| kraken | 898 | 64 | 13 | 11,760 of 21,463 (55%) | 16× |
| answer pillars | 338 | 28 | 9 | 3,540 of 8,294 (43%) | 8× |
| portal | 313 | 16 | 7 | 1,020 of 7,505 (14%) | 8× |
| jungle props | 254 | 28 | 14 | 574 of 5,603 (10%) | 5× |
| **total** | **3,183** | 192 | 54 | **34,273 of 64,069 (53%)** | |

### Why this is not worth a risky change

`npm run measure:payload` reports what the assets cost to download:

| | raw | gzip | brotli |
|---|---:|---:|---:|
| all five 3D assets | 3,087 KB | 769 KB | **374 KB** |

Compression removes 75% (gzip) and 88% (brotli) of the raw bytes, because the redundancy
measured above is exactly what a compressor removes: duplicated spheres and repeated
float32 buffers. GitHub Pages serves brotli, so the real download is about 374 KB. The
probe deliberately gates the **raw** column, so the budget stays meaningful on a host that
does not compress.

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

The duplication therefore costs nothing measurable: triangles are 39,656 of 250,000 and
memory is 20 MB of 512 MB. It is recorded here so a future session does not re-open it
without new information — a decoder that is already present for another reason would
change the arithmetic.

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
| Enable GitHub Pages so the deploy can run | Steve | Settings, Pages, Source: GitHub Actions. Until then the `pages` workflow fails on `main` with `Get Pages site failed`. The closed-beta code itself is merged and CI is green on `main` |

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
3. **Content**: production content is fail-closed by digest. Removing an approval from
   `content/content-review-manifest.js` immediately returns that record to non-production
   without touching the content itself.
4. **Service worker**: the cache name is versioned. Bumping it forces every client to
   re-precache on next launch; `sw-register.js` registers the worker and the Advanced screen
   offers a reload prompt when an update takes control.
5. **Native shell**: uninstall the app; local storage is removed with the profile directory,
   so export progress first from Parent → Recovery → Export Versioned Progress.

## 8. What is deliberately not claimed

- No device, educator, legal, language, or store certification.
- No production-cloud verification.
- No claim that the 3D presentation matches the approved reference art.
- No claim of sustained device performance; the headless budgets above are the only
  performance numbers that are asserted.
