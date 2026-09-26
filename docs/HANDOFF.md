# BrainBite — closed beta handoff

**Revision:** `3c522ca` on `main`, in sync with `origin/main`, working tree clean.
**Written:** 2026-09-22.

This document is the entry point. It says what is verified, what is not, who owns what is
left, and the operational details that are easy to get wrong. The other documents go deeper:

| Document | Contents |
|---|---|
| `docs/BRAINBITE_PRODUCTION_GOAL.md` | The authoritative plan and the dated progress ledger |
| `docs/CLOSED_BETA_READINESS.md` | Verified surface, evidence inventory, defect ledger, external gates, rollback |
| `docs/BRAINBITE_ENHANCEMENT_PLAN.md` | Enhancement items A–M with acceptance checks and results |
| `docs/AUDIT_2026-09-21.md` | The audit that this cycle acted on |

---

## 1. Where the project stands

The closed-beta candidate is **merged to `main`** (PR #1, merge commit `6b43a59`) and every
gate that can be checked locally is green. CI passes on `main` for the first time; every
earlier run on `main`, from 2026-09-02, had failed.

Two things are deliberately **not** done:

- **Nothing is published.** GitHub Pages is not enabled, so the `pages` workflow fails with
  `Get Pages site failed`. The code and CI are fine; this is a repository setting (§3).
- **No content is approved.** The educator gate is external and 75 records are pending. The
  tooling to run that review is complete and hardened (§5), but approving content is not a
  step an automated agent can take on a reviewer's behalf.

---

## 2. Verified now

Every row below is reproducible from this revision. Evidence files are committed.

| Gate | Command | Result | Evidence |
|---|---|---|---|
| Static checks (9) | `npm run check:static` | PASS | console |
| Unit tests | `npm run test:unit` | **205/205** | console |
| Browser suite | `npm run test:e2e` | **161/161** | console |
| Smoke inventory | `npm run smoke` | **11/11** | `release-evidence/smoke-report.json` |
| Performance probe | `npm run probe:performance` | exit 0, **0 headless budget violations** | `test-results/performance-evidence/summary.json` |
| Local certification | `npm run certify:local` | **16/16 stages**, 161 browser tests, 0 flaky | `release-evidence/local-certification.json` |
| Release evidence | `npm run check:evidence` | PASS | `release/v14-evidence.json` |
| Package integrity | `npm run check:stage` | 96 files, no developer material | `release-evidence/package-manifest.json` |
| Content review gate | `npm run check:content-review` | PASS, 0 digest mismatches | console |
| Native shell | `npm run native:verify` | 96 runtime files + 11 shell files; no loopback URL, dev URL, listener, or native permissions | console |
| Remote CI | GitHub Actions | **success** on `main` | Actions run 35798993052 |

Measured budgets (headless-judgeable, all passing):

| Metric | Measured | Budget |
|---|---:|---:|
| Startup | ~720 ms | 3000 ms |
| Save latency (desktop p95 / max) | 6.6 ms / 7.2 ms | 250 ms / 1000 ms |
| Save latency (mobile p95 / max) | 10.1 ms / 10.3 ms | 250 ms / 1000 ms |
| Payload | 3,222 KB raw | 4,096 KB |
| Memory | ~20 MB | 512 MB |
| Draw calls | 117 home / 198 battle | 200 |
| Triangles | 39,656 | 250,000 |

`npm run measure:payload` additionally reports transfer size: the 3.2 MB of 3D assets
compress to **769 KB gzip / 374 KB brotli**, which is why Draco was rejected (§7).

Device-only metrics — frame pacing, long-task tails, scene load, asset load — are recorded as
**unverified** in every probe run. They need real hardware.

---

## 3. Not verified — external gates and owners

None of these can be closed from code. They are re-stated in
`docs/CLOSED_BETA_READINESS.md` §6.

| Gate | Owner | Requirement |
|---|---|---|
| **Enable GitHub Pages** | Steve | Settings → Pages → Source: **GitHub Actions**. Until this is set, `pages` fails on `main` and the app is not published. This is the only step that unblocks shipping |
| Educator review of 75 records | Human reviewer | `npm run review:packet`, then approve or reject per record (§5) |
| Physical-device matrix | Steve | `docs/GATE_8_4_OPERATOR_CHECKLIST.md` (phones, tablets, Chromebook, controller) |
| Screen-reader pass | Human reviewer | `docs/GATE_8_5_SR_OPERATOR.md` |
| Spanish fluency review | Human reviewer | `docs/GATE_8_5_SPANISH_INVENTORY.md` |
| Legal / privacy sign-off | Human reviewer | `docs/GATE_8_5_LEGAL_CLAUSE_MAP.md` |
| Production domain, HTTPS, support contact | Steve | `docs/GATE_8_6_OPERATOR_CHECKLIST.md` |
| Production Firebase delete/export | Steve | Needs a signed-in production session |
| Store packaging and signing | Steve | The current installer is unsigned |

---

## 4. Repository map

**Runtime package** (what ships; staged by `scripts/stage-site.mjs`, verified by
`npm run check:stage`): `index.html`, `app.js`, `styles.css`, `brainbite-core.mjs`,
`sw-register.js`, `service-worker.js`, `manifest.webmanifest`, `fonts.css`,
`privacy.html`, `terms.html`, `support.html`, `content/`, `presentation/`, `vendor/three/`,
`assets/`, `icons/`, `audio/`.

**Content review**: `content/content-review-manifest.js` (105 records; generated rows plus
two hand-maintained data blocks, `EDUCATOR_APPROVALS` and `REVIEWER_FINDINGS`).

**Tooling** in `scripts/`: nine `check-*.mjs` static validators, `validate-*.mjs` gates,
`smoke-runner.mjs`, `probe-performance.mjs`, `certify-local-release.mjs`, `review-content.mjs`,
`gen-review-packet.mjs`, `package-manifest.mjs`, `measure-payload.mjs`, `serve.mjs`,
`stage-site.mjs`, and `scripts/blender/` for the authored 3D kit.

**Tests** in `tests/`: 26 unit files plus 8 Playwright specs.

---

## 5. Working the educator review

The gate is a **reviewer's judgement recorded as data**, tied to an exact source digest.

```powershell
npm run review:packet                     # writes the printable sheet + JSON
npm run review:list                       # pending identities, one per line
npm run review:approve -- --reviewer <id> --role <role> --ids <file|id,id> [--dry-run]
npm run review:reject  -- --reason "<finding>" --reviewer <id> --role <role> --ids <file> [--dry-run]
```

- `release-evidence/content-review-packet.html` carries the content plus a **seven-point
  rubric**: correctness, age-appropriateness, clarity, distractor quality, feedback,
  alignment, bias and safety.
- An **approval** is recorded against the source digest shown. Editing the content afterwards
  invalidates it automatically — the gate then fails and the record returns to pending.
- A **rejection** quarantines the record: it can never be approved, never becomes
  production-eligible, and any earlier approval is cleared. It stays visible in the packet
  with the finding.
- Both outcomes are written as data and the validator runs immediately afterwards, so an
  inconsistent manifest fails the gate rather than being written.

Current state: **105 records, 30 production-eligible registry missions, 75 pending, 0
approved, 0 rejected** (0 digest mismatches).

---

## 6. Architecture notes that matter when changing things

- **Presentation is a swap layer.** `presentation/presentation-adapter.mjs` chooses `dom`,
  `webgl`, or `match`. `capability.mjs` resolves `?presentation=`, `?webgl=`, `?match=`, then
  `localStorage['bb-presentation']`, defaulting to `webgl` **only if** `canUseWebgl()`.
  MATCH mode renders DOM/CSS reference plates and does **not** need WebGL — that is why
  `shouldEnableMatch()` intentionally skips the capability check.
- **A lost WebGL context must never render.** Both scenes route every render through
  `renderFrame()`, which checks `renderer.getContext().isContextLost()` as well as the
  event flag, because the context reports lost synchronously and the event arrives later.
  On loss the app keeps 3D for a 1.5 s restore window, then falls back to the classic DOM
  presentation without losing the mission.
- **Content is fail-closed by digest.** `content/content-review-manifest.js` records a source
  digest per record; `brainbite-core.mjs` gates production content on it. Registry missions
  are production-eligible; everything else needs an approval.
- **Saves use three generations.** `bb-core-v3`, `-back`, `-recovery`, plus a
  `-pre-operation-rollback` written before destructive parent actions. The generation policy
  lives in `content/storage-copies.js` and is unit-tested.
- **The service worker precache is a fixed list.** Adding a runtime asset means updating
  `service-worker.js` *and* the stage allowlist, then bumping the cache name
  (`brainbite-v2.0-shell-v39-mobile-blockers`) so clients re-precache.
- **Fonts are self-hosted and the CSP is strict** (`script-src 'self'`, `worker-src 'self'`,
  no `unsafe-eval`, no wasm compilation). Any new dependency must fit inside that; Draco did
  not (§7).

---

## 7. What this cycle changed, and why

The repository was in a state where several gates were green **for the wrong reasons**. The
recurring pattern: a test or check existed, but it never exercised the thing it named.

| Defect | Why it survived | Fix |
|---|---|---|
| Package manifest digests differed on Linux | The manifest hashed raw working-copy bytes; the Windows checkout had mixed CRLF/LF | `.gitattributes` normalises text to LF; text hashing is line-ending independent, binaries are byte-exact |
| `smoke-pwa-installability` failed only in CI | It hardcoded `D:/Codex/Brainbite` | Derives its root from the module; `check:host-paths` prevents recurrence |
| `certify:local` started a server on port 4317 | Nothing ever connected — Playwright and the smoke runner each serve 4318 | The runner starts no server; `check:test-ports` no longer exempts it |
| Certification ran 159 of 161 browser tests | `bubble-reef-preview.spec.js` was in no group | It joins the activity group; `check:certification-coverage` prevents recurrence |
| The first approval would have corrupted the manifest | A body regex cannot match an empty block, so it ran on to the next `};`, deleting every line in between | Line-based `replaceDataBlock` with a regression test |
| No approval could ever have validated | `getReviewManifest()` never exposed `approvals` or `reviewerFindings` | Both are part of the manifest object |
| The review could only approve | No rejection command existed | `review:reject` quarantines through the existing automated-reason path |
| A lost WebGL context threw in front of a child | Tests dispatched `webglcontextlost` by hand, so the real race never ran | One `renderFrame()` guard; tests use a real loss and a real restore |
| Save latency was reported as "p95" | It was the median of three samples, gated against the p95 budget | 20 samples, real median/p95/max, p95 and max gated separately |
| The native shell had no gate at all | `native:verify` existed and passed in one second, but nothing ran it, so its "no loopback URL, no dev URL, no listener, no native permissions" property could regress silently | Added to `release:check` and to CI |

Two things were measured and deliberately **rejected**:

- **Draco compression.** It works (693 KB vs 3,087 KB, Blender-verified) but reading it needs
  a 245–500 KB decoder, making the total a wash against 374 KB brotli — and it would cost
  `'wasm-unsafe-eval'` plus blob workers under a CSP that deliberately allows neither.
- **Blender-side mesh sharing.** `export_apply` must stay on for the bevel and armature
  modifiers, and it makes the exporter evaluate every object separately, so sharing a mesh
  datablock deduplicates nothing in the exported GLB.

---

## 8. Operational gotchas

- **`check:evidence` needs a clean tree.** Commit before running it, or it fails by design.
- **Run long suites in the foreground.** Backgrounded browser runs get interrupted on this
  host and record no verdict.
- **Under machine load, WebGL mount and `page.reload` timeouts appear.** Every instance
  observed passed in isolation. Treat one as inconclusive, re-run the spec, and only then
  call it a defect. The certification's browser groups retry once, matching CI, and record
  flaky counts so a retry stays visible.
- **Test port is 4318**, overridable with `BRAINBITE_TEST_PORT`. `check:test-ports` fails any
  harness that hardcodes a different loopback port.
- **Headless WebGL is software-rasterised** (~600 ms of frame time), which is why save
  latency is gated on the DOM path (`?match=0&webgl=0`). Do not "fix" that by measuring 3D.
- **Rebuilding the Blender kit is not byte-reproducible.** Same Blender 5.2.40 and the same
  committed script: three of five GLBs rebuild identically, the kraken differs by one
  accessor and 4,456 bytes, the mascot by 4 bytes. Verify assets against the committed
  manifest (`--verify-only`), do not expect a rebuild to match.
- **Not every test file runs in `test:unit`, by design.**
  `tests/firebase-security-rules.test.mjs` needs `FIRESTORE_EMULATOR_HOST` and is run
  manually; `tests/native-packaging.test.mjs` runs inside `npm run native:verify`, which
  needs the native staging step first.
- **Line endings.** `.gitattributes` stores and checks out LF for text files. A file written
  with CRLF will show as modified.
- **New file types** need adding to the allowlist in `scripts/stage-site.mjs`, then
  `npm run package:manifest`.
- **After changing any packaged file**, run `npm run package:manifest`; `check:stage` will
  tell you, and it now names the right command for a stale digest.

---

## 9. Next moves, in order

1. **Enable GitHub Pages** (Steve, one setting). Then confirm the `pages` workflow goes green
   on `main` and the app is reachable.
2. **Circulate the review packet** and run `review:approve` / `review:reject` for the 75
   pending records. This is the only gate that changes what content ships.
3. **Device matrix** on real hardware (`docs/GATE_8_4_OPERATOR_CHECKLIST.md`), which is also
   what converts the device-only performance budgets from unverified to measured.
4. **Accessibility, Spanish, and legal review** by their owners.
5. **Production domain, HTTPS, support contact, and live Firebase delete/export**.
6. **Store packaging and signing** if a native distribution is wanted.

Engineering work that is *not* blocked but is also not required: `app.js` is still a large
classic script (measured `render()` at 5–6 ms, so not a current bottleneck), and the 3D
payload could be revisited only if a decoder arrives for another reason.

---

## 10. Rollback

`docs/CLOSED_BETA_READINESS.md` §7 has the full procedure. The short version:

- **Code**: the package is staged from one revision; rebuild from the previous revision.
  Nothing in the package mutates the repository. Reverting the merge on `main` is safe and
  reversible.
- **Learner data**: three generations plus a pre-operation rollback snapshot; a corrupt
  primary recovers automatically from a distinct known-good snapshot.
- **Content**: removing an approval returns that record to non-production immediately,
  without touching the content itself.
- **Service worker**: bump the cache name to force every client to re-precache.
- **Native shell**: export progress from Parent → Recovery before uninstalling, because
  uninstalling removes local storage.
