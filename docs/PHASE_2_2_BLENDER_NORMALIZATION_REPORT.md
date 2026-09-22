# Phase 2.2 Blender Normalization Tooling Report

Date: 2026-09-12
Status: PARTIAL. Nonvisual normalization tooling is verified; the three-prop
visual pilot and art acceptance remain open.

## Implemented

- Blender 5.2.1 static-prop normalizer run with factory settings and imported-file
  auto-execution disabled.
- Separate approved, normalized and staging areas under Git-ignored asset intake.
- Source provenance/promotion identity and SHA-256 are rechecked before Blender.
- Static-only contract rejects rigs and animation actions.
- Independent GLB geometry decoding rejects malformed accessors, invalid indices,
  non-finite positions, degenerate triangles, bad material references and malformed
  nested scene structures before Blender.
- Lazy accessor readers plus declared/hard triangle and scene-instance scan ceilings
  bound memory and CPU work for untrusted files.
- Metric units, stable BrainBite material names, one canonical empty root and
  bottom-center pivot metadata.
- GLB plus inspectable compressed `.blend` output.
- Fresh Blender re-import verifies canonical root identity/origin/scale/metadata,
  mesh/triangle/material counts and bounds within tolerance.
- A pre-existing canonical root plus a sibling mesh is consolidated without losing
  geometry; shared meshes are made single-user before transform application.
- Colliding material names receive deterministic indexed names that remain stable
  through another genuine normalization pass.
- Node validation rechecks self-contained GLB structure, output hash and all
  configured bytes/triangle/material/texture/dimension budgets.
- Node independently checks decoded GLB material names and Y-up world bounds against
  Blender's Z-up re-import report rather than trusting report claims alone.
- Whole-directory staging prevents failed runs from publishing partial output.
- Blender failure diagnostics survive wrapper cleanup, and timeout cleanup waits for
  process closure before removing staging output.
- Cached normalization revalidates report identity/status, hashes, `.blend`, GLB
  structure and current budgets before returning idempotently.
- A genuine second Blender normalization pass proves root names, material names
  and bounds remain stable.

No runtime or shipping asset was replaced. No new art was designed, generated or
published. The original portal was used only as a licensed temporary fixture and
test outputs were written under ignored/temp directories.

## Files

- `scripts/blender/normalize_intake.py`
- `scripts/intake-glb.mjs`
- `tests/glb-intake.test.mjs`
- `tests/blender-normalize.integration.mjs`
- `package.json`
- `docs/ASSET_INTAKE.md`
- this report, roadmap and control-plane updates

## Evidence

```powershell
node --check scripts/intake-glb.mjs
node --test tests/glb-intake.test.mjs
$env:BRAINBITE_BLENDER='D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe'
npm run test:blender-normalize
$env:PLAYWRIGHT_OUTPUT_DIR='playwright-output-blender-normalize-phase22-final'
npm run release:check
```

- Focused intake/normalization tests: 14/14 PASS.
- Real Blender 5.2.1 integration: 3/3 PASS. Coverage includes positive and repeated
  normalization, canonical-root sibling retention, material collision stability,
  early quarantine of the real malformed mascot fixture, and dimension rejection.
- Final release state: all validators, 55/55 unit tests and 66/66 browser tests PASS
  (browser suite 2.9 minutes). Output:
  `playwright-output-blender-geometry-phase22-final`.
- Initial manual portal proof revealed stale pre-export world-matrix metrics; a
  Blender dependency-graph update and bounds comparison fixed it before acceptance.
- An earlier full gate passed 50/50 unit and 66/66 browser tests before the review
  corrections; it is retained as intermediate evidence, not the final result.

## Independent Review

- Tesla, Luna/xhigh: read-only inventory of reusable Blender seams and three
  original fixture candidates. COMPLETE; no edits or visual generation.
- Averroes, Sol/medium: initially CHANGES REQUESTED for under-validated cached
  output, weak promotion-manifest identity, second-pass root/material drift and
  missing root metadata checks. All four were corrected with direct tests.
  Follow-up PASS: 10/10 focused and 1/1 real Blender integration.
- Mencius, Luna/xhigh: read-only real-fixture inventory. Confirmed portal budgets,
  mascot rig/animation plus degenerate geometry, and the absence of isolated
  shear/non-finite fixtures. COMPLETE; no edits.
- Gibbs, Sol/medium: independent final hardening review. Successive reviews found
  canonical-root sibling loss, report trust, incomplete equivalence, material-name
  collisions, timeout cleanup, accessor/bounds/texture gaps, malformed nested input,
  unbounded decode allocation and repeated-instance CPU amplification. Every finding
  received a direct correction and regression; final verdict PASS with no remaining
  actionable findings.
- Orchestrator: interface, implementation, stale-matrix correction, integration,
  full release gate and acceptance. Exact model/reasoning/token telemetry unavailable.
- Per-agent token and cumulative error telemetry is not exposed. No agent task
  execution error occurred in this phase; review findings were expected quality
  gates rather than agent failures.

## Remaining Visual Pilot

Existing original candidates identified without altering them:

- `JungleRock_A`: single-mesh baseline.
- `Fern_01` through `Fern_05`: repeated rotated parts.
- Reward chest: multi-part baseline, but its lid lacks an authored hinge.

The requested ruin column does not exist in the starter kit. Creating that column,
choosing final silhouettes/materials, extracting the three candidates, rendering
comparisons and approving their visual quality are actual visual work and remain
open. UV repair, retopology, LODs, collision meshes and device performance also
remain outside the completed tooling boundary.
