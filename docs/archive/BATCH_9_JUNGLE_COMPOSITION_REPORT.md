# Batch 9: Jungle Composition and Responsive Hardening

Date: 2026-09-09
Checkout: `D:\Codex\Brainbite`
Branch: `batch-9-webgl-spike` (base HEAD `96d3bb7`; uncommitted work retained)

## Scope and Reality

This batch improves the existing Three.js PWA presentation. It is not a Unity
rewrite, a new mastery system, or certification of the original seven-batch roadmap.
The live scenes still use fixed-camera answer selection, not free-roaming 3D
locomotion. Production art, rigged animation, real-device performance, educator
review, and production-service certification remain incomplete.

## Implemented

- Shared deterministic jungle banks: 168 stone blocks, 48 moss clusters, and 168
  leaves in three instanced draw batches rather than one draw per object.
- Original procedural water texture, subdued movement, and planked battle pier.
- Responsive camera fitting and ResizeObserver cleanup on both scenes.
- World-projected, accessible PLAY portal instead of fixed percentage positioning.
- Removed duplicate kit labels while retaining readable world destination signs.
- Kept jungle trees when loading the prop kit instead of replacing the entire forest.
- Answer kit slots align with live choices; unused slots and decorative gems are
  hidden, hidden geometry cannot receive pointer picks, and labels remain readable.
- Ordinary missions no longer show the Fraction Kraken model. Legacy bosses keep
  their actual HUD identity; dedicated visual models for them are still pending.
- Shared-resource disposal releases textures/materials/geometries once, including
  instanced GPU buffers.
- Desktop dashboard and battle layout tightened; phone grids no longer overflow.
- Repaired currency glyph encoding, overlapping profile avatar, and hidden Install
  button rules. Preserved Memory Drop access and per-profile accessibility settings.
- Service-worker cache v26 includes the shared scene module and props for offline use.
- Repeatable desktop/mobile captures wait for GLB installation, not arbitrary sleeps.

## Verification

Final integrated `npm run release:check`: PASS (exit 0).

- Content: 29 packs / 40 question sets validated.
- Runtime, release, Firebase rules structure, launch, final-hardening, Firebase
  ownership/default-deny, and evidence validators: PASS. These are automated
  checks, not production-service or privacy/legal certification.
- Unit tests: 19/19 PASS, including new camera-fit, deterministic scenery, and
  shared-resource / instance-buffer disposal tests.
- Browser suite: 51/51 PASS in 1.8 minutes, including the new ordinary-mission
  encounter, responsive portal bounds, and cached offline 3D reload tests.
- Final screenshot follow-up restored the desktop minimap minimum height and moved
  the renderer selector below the home shell so it cannot cover touch controls.
  `npm run test:e2e -- tests/webgl.spec.js tests/webgl-assets.spec.js tests/webgl-accessibility.spec.js`
  then passed 16/16 in 43.9 seconds on the final code tree.
- Desktop 1280x853 and mobile 390x844 captures: both scenes load their GLBs with
  zero observed page JavaScript errors. Inspected images show the composition and
  responsive fixes; they remain stylized starter geometry, not AAA-final art.
- Targeted `git diff --check`: PASS; Git reports ordinary LF/CRLF conversion
  warnings. Node reports a non-failing module-type warning for vendored Three.js.
- P0: no new reproducible blocker in this tested scope; not a whole-product audit.
- P1: final character/environment fidelity, unified boss presentation, real graphics
  tier scaling, physical-device performance, and external reviews remain open.

Commands:

```powershell
Set-Location D:\Codex\Brainbite
npm run release:check
node scripts/capture-live-3d.mjs
```

The capture command expects the local server on port 4317 (`npm run serve`). It
produces `release-evidence/visual/desktop-home.png`, `desktop-battle.png`,
`mobile-home.png`, and `mobile-battle.png`. These are inspection captures, not a
pixel-diff certification against approved art. Playwright cleans test-results at
suite startup, so capture after the suite.

The initial new resize assertion failed because it compared border-box width to
canvas content width. It now compares the host client width and separately checks
portal bounds and document overflow. Initial screenshots also exposed actual
mobile intrinsic-grid overflow; that was fixed rather than hidden with clipping.

## Files in This Batch

- `presentation/jungle-environment.mjs`
- `presentation/boot.mjs`
- `presentation/webgl-home.mjs`
- `presentation/webgl-battle.mjs`
- `presentation/presentation-adapter.mjs`
- `presentation/props.mjs`
- `styles.css`
- `service-worker.js`
- `tests/presentation.test.mjs`
- `tests/webgl-assets.spec.js`
- `scripts/capture-live-3d.mjs`
- `package.json`
- `AGENTS.md`
- This report and `docs/BATCH_9_3D_PRESENTATION_PLAN.md`

Existing unrelated and staged edits were retained. No commit or push in this batch.

## Orchestration

- Parent: scene implementation, integration, screenshot audit, regression tests.
- Bounded worker Gauss: desktop CSS only; parent corrected mobile and cascade issues
  revealed by browser verification. Worker changes were not accepted untested.
- Configured parent model: GPT-6 Astra / high reasoning.
- Worker preset: default_executor, GPT-5.6 Luna / xhigh reasoning.
- Recommended next: GPT-6 Astra / high for integration and visual audit; Luna /
  xhigh for bounded asset-script or regression-test work.

## Next Safe Batch

Continue 9.4 production-art refinement: replace the starter mascot with a stronger
approved-reference silhouette and rig, upgrade Bite House and cliff/tree shapes,
then tune lighting and materials. Preserve the fixed-camera interaction contract
until a separately tested locomotion/controller batch is implemented. Wire graphics
tiers to actual renderer costs and measure frame pacing on available hardware before
claiming low-end readiness. Do not advance to second-world production or AAA
certification based only on these screenshots or passing structure validators.

Blender CLI is available; persistent third-party Blender MCP registration remains
disabled pending explicit informed approval. Do not retry that rejected registration
as part of an ordinary "next" request.
