# Phase 2.1 Asset Intake Report

Date: 2026-09-12
Status: COMPLETE for the offline intake/approval boundary. Blender artistic
normalization and runtime asset replacement remain Phase 2.2.

## Implemented

- Strict GLB 2.0 header, declared length, chunk order/type/alignment and JSON checks.
- Embedded-only buffers/images, buffer bounds, triangle-only geometry and runtime
  extension allowlist checks.
- Exact SHA-256, source provenance, input-rights, commercial/redistribution,
  terms-capture, attribution and explicit no-child-data requirements.
- Configurable bytes, triangle, material and texture limits plus a 64 MiB hard cap.
- Immutable hash-addressed quarantine and reports, including rejected candidates.
- Strict asset ID/hash types and lexical containment below the configured intake root.
- Separate local approval records. Intake cannot self-promote a candidate.
- Hash recheck immediately before promotion, idempotent repeat promotion and
  rollback of both asset and manifest after simulated interruptions.
- Intake directory excluded from Git and absent from runtime/service-worker assets.
- Operator documentation and canonical seven-batch/43-phase execution roadmap.

Promotion deliberately preserves candidate bytes and stays isolated under
`assets/intake/`. It is not Blender cleanup, runtime approval, legal clearance or
a cryptographic signature. No vendor calls, credentials, paid jobs, uploads,
shipping asset replacements or visual/runtime changes occurred.

## Files

- `scripts/intake-glb.mjs`
- `tests/glb-intake.test.mjs`
- `package.json`
- `.gitignore`
- `docs/ASSET_INTAKE.md`
- `docs/COMPLETE_BUILD_ROADMAP.md`
- `docs/HYBRID_ASSET_PRODUCTION_PLAN.md`
- `docs/BLENDER_PIPELINE.md`
- `docs/BRAINBITE_ORCHESTRATOR.md`
- `AGENTS.md`

## Verification

```powershell
node --check scripts/intake-glb.mjs
node --test tests/glb-intake.test.mjs
npm run test:unit
$env:PLAYWRIGHT_OUTPUT_DIR='playwright-output-asset-intake-a1-final'
npm run release:check
```

- Focused intake tests: 8/8 PASS.
- Final unit suite: 49/49 PASS.
- Final full release gate: all content/runtime/release/Firebase/launch/final/security/
  evidence validators PASS; 49/49 unit and 66/66 browser tests PASS (2.8 minutes).
- `git diff --check` reports no whitespace errors in the bounded changes; existing
  Windows line-ending notices remain informational.

## Review And Corrections

- Harvey, Luna/xhigh investigator: COMPLETE read-only inventory of existing builder,
  manifest, loader and test seams. No edits. Exact token/error telemetry unavailable.
- Newton, Sol/medium reviewer: blocked by an automated classifier before review;
  one agent error, no edits or findings.
- Ampere, Luna/xhigh independent tester: initially CHANGES REQUESTED. A numeric
  `assetId` was regex-coerced and could fail before quarantine. Strict string checks
  and a regression were added. Follow-up PASS, focused 8/8. No reviewer edits.
- Orchestrator: contract, implementation, correction, integration, full gate and
  acceptance. Current model/reasoning/token telemetry not exposed.

## Remaining Risks / Next Phase

- The containment guarantee assumes the app-owned intake root is not pre-seeded
  with hostile filesystem links; Phase 2.2 should use a controlled workspace and
  add platform-specific real-path checks if intake becomes multi-user or remote.
- Local approval identifies an operator but is not signed identity.
- GLB structural acceptance does not establish good topology, UVs, scale, pivots,
  appearance, animation quality or device performance.
- Next: Phase 2.2 three-prop Blender pilot, after selecting an authorized source.
  Start with generated fixtures or manually supplied licensed candidates; do not
  bulk-generate or replace the hero/boss.
