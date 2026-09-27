# Live Jungle Visual Update

Repository: `D:\Codex\Brainbite`
Branch: `batch-9-webgl-spike`
Base HEAD: `96d3bb75069e7baa61a3ecf657d0df572e16f2bf`
Scope: first live-3D visual pass in Internal Phase 9.5. Existing dirty work preserved; no commit or push.

## Implemented

- Full-shell desktop home and battle worlds with floating dark/gold HUD panels and a cream question panel.
- Scrollable small-screen and short-laptop fallback, with all three subject-world links retained.
- Cyan animated portal material, warmer jungle lighting/fog, moss-toned portal stone, textured water, and wood/gold world signs.
- Reduced-motion compatibility, original asset-load fallback, and material disposal retained.
- Seven instanced tree batches preserve the original nine trees, every branch/frond, material, and world transform while reducing render calls.
- Shader-console error capture and four new browser regressions covering portal compilation and real HUD/navigation clicks at desktop, short-laptop, and phone sizes.
- A new unit regression verifies tree batching against the original geometry, materials, instance count, and transforms.

No learning, rewards, save, account, or mission logic changed. No new third-party art or reference-image background was introduced. MATCH remains separate from the live scene. The shipped legacy math boss remains Astro Muncher; this visual pass does not claim that it implements the Fraction Kraken learning flow.

## Files Changed This Batch

- `styles.css`
- `presentation/webgl-home.mjs`
- `presentation/webgl-battle.mjs`
- `presentation/props.mjs`
- `presentation/jungle-environment.mjs`
- `presentation/surface-textures.mjs`
- `scripts/capture-live-3d.mjs`
- `tests/webgl.spec.js`
- `tests/presentation.test.mjs`
- This report and `docs/BRAINBITE_ORCHESTRATOR.md`

## Verification Record

- Initial scene unit run: 40/40 passed.
- First combined screenshots exposed canvas-over-HUD layering and subject-link overlap. Both were corrected, not accepted as final output.
- Initial new browser regressions: 3/4 passed; desktop Spanish link was blocked by the bottom HUD. Corrected pointer ownership and spacing; worker rerun passed all three viewport cases.
- First full release run: structure/content validators and 40/40 unit tests passed; browser result 61/62. The wider home view exceeded the unchanged 200-call rendering budget (217 calls). Tree instancing fixes that cause without removing scenery or increasing the budget.
- Post-instancing unit run: 41/41 passed. The next full browser run passed 60/62, including the unchanged draw-call budget, but exposed scroll/reflow timing in the new short-screen hit tests. The hit test now rechecks scrolling as scene installation reflows the layout; its visibility/coverage assertion is unchanged. Focused rerun passed all three viewports (3/3).
- Final live captures completed for desktop (1280x853) and phone (390x844), home and boss arena. All required scene assets loaded; no page or shader compilation errors were recorded. Screenshots were visually inspected. Top HUD and all subject links are present; phone retains a long scrollable layout.
- Capture render calls: desktop home 110 / battle 165; phone home 110 / battle 139. These snapshots are not physical-device performance certification.
- Final combined `npm run release:check`: PASS, exit 0. All structure/content/security/evidence validators passed, 41/41 unit tests passed, and 62/62 browser tests passed in 2.3 minutes. Output directory: `playwright-output-visual-release-final-20260912`.
- Syntax checks passed for the shader helper, browser tests, and capture script. Whitespace checks passed for the changed tracked presentation/CSS files.
- A locked test-output directory was bypassed with a fresh repository-root output directory. A Windows wildcard search command was corrected. No project files were deleted or reverted.

Commands used:

```powershell
$env:PLAYWRIGHT_OUTPUT_DIR='playwright-output-visual-release-final-20260912'
npm run release:check
$env:BB_CAPTURE_DIR='release-evidence/visual-update-final'
node scripts/capture-live-3d.mjs
```

## Review And Delegation

- Orchestrator: scene/material implementation, integration, test additions, regression fixes, final verification and status ownership. Current model/reasoning and exact token telemetry are not exposed in tool results.
- Arendt: `gpt-5.6-sol`, medium. CSS-only implementation and viewport checks. Completed and returned file ownership. Initial integration findings were fixed before acceptance.
- Confucius: `gpt-5.6-sol`, medium. Independent read-only scene, CSS, and tree-batching review. No remaining credible finding after fixes. Follow-up syntax checks and all 10 presentation tests passed; parent owns final browser verification.
- Agent token usage and cumulative tool-error counts are not exposed. Do not invent them or interpret unavailable telemetry as zero.

## Open Gates

- Final character modeling, facial appeal, architectural forms, foliage silhouettes, and richer environment art still differ substantially from the approved images.
- Desktop landmark signs and outer scenery are partly behind the side HUD; refine world/camera composition in the next art pass without hiding navigation. Phone layout remains too long for final production polish.
- This is a desktop-led composition update, not a final mobile game layout or AAA art certification.
- Physical-device frame pacing, low-end performance, and production cloud certification remain open. Headless capture timings are diagnostics only.
- Existing performance telemetry samples too close to asset completion and can include buffered page-history long tasks. Do not use a one-frame capture tier recommendation as evidence of stable Ultra performance.
- Next visual batch: focused Bite and jungle asset refinement through the existing Blender pipeline, followed by the same live screenshot, accessibility, rendering-budget, and release gates. Use Sol/medium for bounded implementation and an independent Sol/medium reviewer; retain orchestration of shared art direction.
