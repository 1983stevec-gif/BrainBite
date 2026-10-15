# BrainBite 3D visual delivery — October 6, 2026

## Repo state

Branch `audit/verified-build-plan`, PR #3. Starting revision:
`1d1ee3a867e7c9a6398b8f648817c3f62966d4e4`. This continues the Oct4 public UI,
currency-integrity and Windows delivery. The user explicitly chose “Keep 3D and
polish it further,” then requested MCP and assets.

## Changes

- Rounded, curved foliage with a smooth core and sparse leaf clusters; isolated
  per-mount GLB materials/geometry and explicit disposal.
- Layered jungle silhouettes and atmospheric gradients, open sky, irregular cool
  rocks, softer waterfalls/contact ripples, warmer stone and varied wood.
- Generated stone and jungle-ground materials applied to live 3D surfaces, with
  procedural loading fallbacks, disposed-texture guards and reduced-motion refresh.
- Two 512 × 512 PNGs bundled for offline use. See
  [asset provenance and exact prompts](ASSET_PROVENANCE_2026_10_06.md).
  Runway MCP was authenticated but had zero credits; generation used the built-in
  image tool. No purchase, plan change or runtime external service was introduced.
- Jungle-depth decoration is restricted to Jungle Circuit. Existing camera,
  gameplay, live answer values, save/profile logic and Bubble Reef remain supported.
- Offline cache and package manifest regenerated: 102 runtime files,
  7,252,093 bytes and 99 precached assets.
  Cache: `brainbite-v2.0-shell-runtime-3b79ac34ed3faf2c5418872bf3cd38e9e2ef50a141ea3c2441e21a92b7895c48`.

## Visual acceptance

Astra reviewed the initial desktop/phone direction. The implementation owner corrected
pointed foliage and a flat backdrop. The final read-only SOL verifier and coordinator
inspected the actual asset-integrated home and battle at 1280 and 390 pixels.
All four final captures have zero page/console errors, both texture requests returned
200, and canvas instrumentation confirmed artwork uploads. Three GLBs mounted per
scene; fonts settled. Phone answers remain labelled and there is no horizontal overflow.
The phone home clips the far-right scenery sign; the Play control remains visible.

| Scene | Draw calls | Triangles |
|---|---:|---:|
| Home, desktop | 174 | 87,670 |
| Home, phone | 172 | 87,466 |
| Battle, desktop/phone | 132 | 70,606 |

The first art candidate used 212,422 home triangles. The final foliage reduces this
cost while retaining its rounded silhouette. Counts meet configured budgets; they
are not physical-device frame-rate measurements.

Ignored evidence: `.ui-captures/polish-2026-10-06/final-public-*.png`,
`final-public-visual-observations.json`, `final-cold-timing*.json` and local gate logs.

## Commands and results

- `npm run check:static`: passed; complete stage/cache/manifest validation.
- `npm run test:unit`: 291/291 passed on final runtime source.
- `node --test tests/presentation.test.mjs`: 11/11 passed after the foliage correction.
- `npm run test:e2e`: final full run 249/252 passed. Three failures were a mascot-load
  wait, browser page-fixture setup and the laptop layout test's overall time budget.
  The three cases subsequently passed twice each (6/6, zero retries).
  **All 252 cases are covered, but this is not one clean full-suite invocation.**
- New material offline/cache and late-load/disposal checks: 2/2 passed separately,
  and included in the full suite.
- `npm run smoke`: 11/11 passed, including Chrome/Edge, offline reload and WebGL boot.
- `npm run native:verify`: passed, including the native packaging test.
- `npm run native:build`: executable and NSIS installer built successfully.
- `npm run native:verify:runtime`: final executable opened the expected BrainBite
  window and its process tree opened no TCP listener.

The static laptop geometry test now uses the existing reduced-motion setting to
avoid continuous software rendering competing with repeated geometry reads.
Every visibility, enabled-state, bounds assertion and timeout remains unchanged;
separate tests continue to cover motion and character reactions. No production
behavior was changed to satisfy these timeouts.

## Failed-run disposition

The first full run passed 248/251; its unchanged focused repeat passed 3/12. Foliage
cost reductions improved intermediate repeats to 10/12 and 11/12. A shader-warmup
experiment worsened end-to-end behavior and was removed; no custom shader polling
ships. Later same-browser baseline/current comparisons passed all six assertions:
arrival clear times at 360/390/1280 were 2833/2123/3212 ms before and
1936/2127/2894 ms after. The unchanged arrival timer is 1500 ms; software-rendering
long tasks delay both versions. An independent repeat passed 11/12 and the isolated
desktop case then passed. This evidence does not establish a current-only timing
regression. A separate TWYST automated Chrome process was identified and left alone.

Required Chromium 1234 was absent from the shared cache. Standard installation hit
a stale directory-lock error; the exact official headless-shell archive was installed
in ignored `.tmp-playwright-browsers`. Launch reported Chrome 151.0.7922.34. Shared
locks and project dependencies were not changed. Browser-backed commands used
`PLAYWRIGHT_BROWSERS_PATH=D:/Codex/Brainbite/.tmp-playwright-browsers`.

## Final native artifacts

Output folder:
`C:/Users/djste/Documents/Codex/2026-08-24/files-pasted-by-the-user-you/outputs/BrainBite-3D-Polish-2026-10-06/`.

| File | Bytes | SHA256 |
|---|---:|---|
| BrainBite-3D-Polish.exe | 10,820,608 | 1890228D21E92561FA7D895CF92B4107B433D2D800C7B04F6C0E6D0121069A4A |
| BrainBite-3D-Polish-Setup.exe | 4,269,756 | E0AB9081552E5EFFA140412E96D8E6F6136674AE1990CF9F9490D340ECAB006F |

The folder includes play/install instructions, SHA256 hashes, source-revision metadata,
and final home/battle previews. These replace the earlier Oct6 candidate binaries.

## Unverified and next step

The installer is unsigned. Physical-device FPS, human accessibility/educator/legal
certification and production cloud rollout remain external. The Oct4 30/30 Firestore
emulator run is prior evidence; no currency or cloud-rule source changed in this pass.
No production deployment, publication or merge is claimed. Steve owns merge and
production rollout. The local executable is the playable delivery.

## Push state

This delivery is committed on `audit/verified-build-plan` and submitted through the
existing PR #3. The output `SOURCE-COMMIT.txt` records the exact revision. No merge
or production rollout is performed by this task.
