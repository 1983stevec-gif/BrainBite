# Bite, Hub Framing, And Mobile HUD

Repo: `D:\Codex\Brainbite`, branch `batch-9-webgl-spike`.
This follows the verified first visual pass in `VISUAL_UPDATE_2026-09-12.md`.
No commits, pushes, learning-data migrations, or cloud changes are part of this batch.

## Scope

- Move the house and portal into the visible center of the desktop hub; resize their signs so the side HUD no longer cuts off their names.
- Keep procedural fallback, loaded GLB, portal shader, and clickable Play anchor on shared placement/scale values.
- Refine Bite through the original Blender source: shorter crest, less-open smile, broader shoes, navy chest, and softer material highlights. Preserve the six-bone rig, idle/blink animation, and socket names.
- Compact the phone home and battle HUD without hiding navigation or shrinking secondary action text below 11px. Preserve at least 44px answer targets and readable prompts.
- Bump the cache key to `brainbite-v2.0-shell-v28-framing-mobile` so existing cache-first installs can receive updated assets and styles.

## Files

- `presentation/webgl-home.mjs`
- `presentation/webgl-battle.mjs` (actual host-size rendering, no scene redesign)
- `styles.css`
- `scripts/blender/mascot_v2.py`
- `scripts/blender/build_brainbite_kit.py`
- `assets/generated/blender/manifest.json`, five named GLBs, and the generated source `.blend`
- `service-worker.js`
- `scripts/capture-live-3d.mjs`
- `tests/webgl.spec.js`
- `docs/BLENDER_PIPELINE.md`, this report, and `docs/BRAINBITE_ORCHESTRATOR.md`

The Blender pipeline regenerates all five named outputs together; only the mascot geometry/material design changes in this batch. New pipeline provenance metadata appears on all outputs. No unknown-provenance art is introduced.

## Evidence

- Blender 5.2.1 headless builder: `BUILD PASS brainbite-starter-kit-v1.2.0-seed-9021`; all five exported GLBs passed re-import validation. The mascot is 1,314,936 bytes, below its existing 2 MiB budget.
- `npm run test:unit`: 41/41 passed after the asset rebuild, including rig, clip, and asset-size checks.
- Focused desktop portal regression: 1/1 passed across 1280x853, 1100x700, and 1920x1080. It checks clearance from both side panels and actual Play interaction.
- Framing-progress desktop capture inspected: both signs and the portal are visible between the side panels.
- Combined mascot/mobile captures inspected: phone home height 1,532px versus 2,764px in the prior pass; boss page 1,055px versus 1,748px. Both at 390x844, with all subject links and actions retained. Desktop remains 1280x853. No captured page/shader errors.
- Integration capture exposed a pre-existing minimum renderer-height assumption (home 320px) incompatible with the new compact scene (230px). Both renderers now size to the actual host instead of silently enlarging the drawing surface. Mobile regression checks exact rendered dimensions, not just CSS bounds.
- Post-sizing focused tests: 2/2 passed, including desktop portal clearance/interaction and phone height, subject links, minimum dock-label size, 44px answers, render dimensions, and no horizontal overflow.
- Independent review confirmed source/rig/cache/resize compatibility, but flagged fixed-width mobile dock labels at enlarged text. Dock buttons now wrap, grow with text, and break long words when needed; the 360/390px double-text regression passed with text at least 22px, no clipped button contents, and no page overflow.
- Focused layout/accessibility group: 6/6 passed after the dock correction. Three existing hit-test cases now use reduced motion to isolate layout from animation (separate animation tests are retained).
- Initial full release run: all validators and 41/41 unit tests passed, 62/64 browser tests passed. Two layout checks timed out (prompt hit test and portal before scene mount). New layout cases now await the existing runtime readiness signal; no production behavior or correctness assertion was relaxed.
- Next combined run: all validators and 41/41 unit tests passed; 64/65 browser tests passed (13.9 minutes). The only failure was the double-text test timing out on its second page navigation, not a content-boundary assertion. It was split into independent 360px and 390px tests with DOMContentLoaded plus app readiness; 2/2 passed afterward. This is separate evidence, NOT a claim that a combined 66-test run passed.
- One exploratory file read used a nonexistent builder filename; the actual existing `build_brainbite_kit.py` was then located and used successfully. No source was recreated or deleted to address it.
- Post-sizing captures completed without page/shader errors: 1280x853 desktop pages; phone home 1532px and boss 1115px at390x844. Desktop and phone home both sampled110 draw calls. Captures remain diagnostics, not physical-device performance certification.
- Final dock refinement prevents a wrapped button stretching into a full-width ellipse and gives Leaderboards more normal-scale width. All 3 focused phone/double-text checks passed (21.2 seconds), and refreshed captures completed with zero page/shader errors. Final phone heights remain 1532px home / 1115px boss.
- Final combined release check on the completed source state: PASS, exit 0. All validators, 41/41 unit tests, and 66/66 browser tests passed (browser suite 3.2 minutes). Output: `playwright-output-framing-mobile-verified`. This closes the combined verification follow-up; earlier failures remain documented above.
- Capture output now includes measured page width/height and viewport dimensions, alongside the existing graphics/runtime diagnostics.

Commands:

```powershell
& 'D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe' --background --python 'D:\Codex\Brainbite\scripts\blender\build_brainbite_kit.py' -- --output 'D:\Codex\Brainbite\assets\generated\blender'
$env:PLAYWRIGHT_OUTPUT_DIR='playwright-output-framing-mobile-verified'
npm run release:check
$env:BB_CAPTURE_DIR='release-evidence/visual-framing-mobile-final'
node scripts/capture-live-3d.mjs
```

## Ownership

- Orchestrator: art direction, home framing, Blender source/build, test design, integration, documentation, final acceptance. Model/reasoning and token telemetry are not exposed in tool results.
- Arendt: Sol/medium; completed the CSS-only mobile layout and returned ownership. Reported normal-scale measurements at 390x844 (1532/1055px home/battle) and 360x844 (1551/1043px), zero horizontal overflow, 11.2px dock labels, all world links, and 44px answers/read-aloud controls. Final enlarged text was explicitly unverified by the worker; parent owns that correction/check.
- Confucius: Sol/medium; completed independent read-only review of alignment, fallback, resize, rig compatibility, cache update, and mobile readability/control risks. No release-blocking source findings; the narrow dock-label risk was acted on by the parent.
- Per-agent tokens and cumulative error counters are unavailable. Do not substitute invented zeros.

## Remaining Gates

This is an incremental art/composition pass, not a claim of AAA-ready art. Jungle architectural depth, richer foliage, facial expression/locomotion clips, boss art, and physical-device performance remain incomplete. No new world is certified by this batch. Production cloud, educator, accessibility-device and release-operation gates remain open.

The combined automated gate is now closed by the final 66/66 browser pass. This does not certify physical-device performance, commercial art quality, production cloud behavior, or completion of the broader product roadmap.
