# Batch 9.4 Graphics Refinement

Date: 2026-09-09. Checkout: `D:\Codex\Brainbite`.

## Implemented

- Replaced the starter hat mascot with original crested Bite: oversized eyes,
  iris highlights, compact explorer body, hands, shoes, straps, belt, and backpack.
- Built a six-bone rigid-part Blender rig and exported the `Bite_Idle` animation
  with head/arm motion and blinking. One skin, 56 meshes, 1,319,384-byte GLB.
- Integrated Three.js animation playback in both scenes. Reduced motion renders
  the rest pose and retains the existing stopped animation-loop behavior.
- Layered-roof Bite House with arched door, lit window, timber trim, steps, vines.
- Shared layered tropical trees, stepped temple stonework, faceted rock ridges,
  procedural grass surface, adjusted hub atmosphere, and battle shadows.
- Connected profile graphics classes to actual renderer settings: Ultra/High
  2048px shadows, Balanced 1024px shadows, Performance/Mobile no shadow pass.
  Pixel-ratio caps are 2 / 1.75 / 1.5 / 1 / 1 respectively; low-end detection
  caps shadow and resolution costs regardless of decorative preference.
- Disabling shadows releases the old shadow render target. Scene disposal also
  releases animation actions, bone textures, and instance resources.
- Service-worker cache v27 includes animation, quality, and procedural-surface
  modules; normal gameplay remains local-first and has no live AI dependency.

## Verification

```powershell
Set-Location D:\Codex\Brainbite
& 'D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe' --background --factory-startup --python scripts/blender/build_brainbite_kit.py
npm run release:check
node scripts/capture-live-3d.mjs
```

- Blender 5.2.1 LTS: build PASS, all five GLBs re-imported successfully.
- Unit tests: 22/22 PASS, including rig/clip/asset-budget checks, reduced-motion
  animation freeze, real quality policies, camera fitting, and resource disposal.
- Captures at 1280x853 and 390x844: both scenes loaded GLBs, zero observed page
  JavaScript errors. The captures are inspection evidence, not pixel-diff parity.
- Targeted `git diff --check`: PASS (ordinary LF/CRLF conversion warnings).
- Full `npm run release:check`: PASS, exit 0. Browser suite 52/52 PASS in 2.6m;
  29 content packs / 40 question sets and all runtime/release/Firebase-structure/
  launch/final/security-structure/evidence validators passed. These validators
  do not certify live cloud deployment, legal compliance, or final art quality.

Latest images: `release-evidence/visual/desktop-home.png`, `desktop-battle.png`,
`mobile-home.png`, `mobile-battle.png`. Run captures after tests because Playwright
cleans that output folder on suite startup. Capture requires `npm run serve` on
port 4317. The existing installed Playwright browser was used for verification.

## Files

- `scripts/blender/build_brainbite_kit.py`, `scripts/blender/mascot_v2.py`
- Generated GLBs, source blend and manifest under `assets/generated/blender/`
- `presentation/character-animation.mjs`, `graphics-quality.mjs`, `surface-textures.mjs`
- `presentation/gltf-assets.mjs`, `jungle-environment.mjs`, `props.mjs`
- `presentation/webgl-home.mjs`, `webgl-battle.mjs`
- `service-worker.js`, `styles.css`
- `tests/presentation.test.mjs`, `tests/webgl-assets.spec.js`
- Pipeline, phase-plan and graphics-report documentation

## Limits and Next Batch

This is a visual refinement pass, not completion of Batch 9.4 or AAA certification.
Remaining: final character topology and art direction, walk/run/jump/interact and
emotion animations, animated cosmetic sockets, integrated Kraken visual phases,
more natural terrain/water/foliage, UI/avatar art consistency, and actual frame-time
profiling. Graphics-tier policy is tested; physical-device FPS, thermals, memory,
touch/controller certification, educator and production-service gates are not.
The home still uses a fixed camera and battle uses existing answer selection;
there is no new free-roaming locomotion or mastery implementation in this pass.

Next safe graphics batch: consolidate character materials/draw calls, refine facial
expression and selected animation clips, then tune water/portal/boss effects against
measured frame budgets. Do not add another world before the Jungle looks and runs
right. No persistent Blender MCP registration, commit, or push was performed.

## Orchestration

Parent handled Blender Bite, animation/quality integration, screenshots and tests.
Franklin handled only the house/tree/temple module pass and skin-resource disposal;
the parent reviewed and integrated it. Parent configuration: Astra/high. Worker:
Luna/xhigh. Recommend the same split for bounded asset/test work with parent visual
audit. Whole-product planning percentages are estimates, not test coverage or
certification; functionality and overall phase estimates were not recalculated.
