# Phase 7.4 World Pipeline Audit

Status: bounded repository audit implemented; no certification claimed.

## Scope and method

`node scripts/audit-world-pipeline.mjs` reads presentation source and retained
local evidence without launching the app or changing repository state. Its JSON
contract is `brainbite.world-pipeline-audit.v1`.

The metrics are intentionally narrow and use the fixed 13-module direct
world-pipeline inventory rooted at `presentation/webgl-home.mjs`. A module is
integrated only when its source is present and the entry module imports it.
Origin records 10 modules reused from the existing presentation pipeline and 3
Batch 7 additions: the reusable world-profile seam and 2 Bubble Reef-specific
modules. A separate design classification records 11 reusable modules and 2
world-specific modules. These are module ratios, not source-line reuse, code
ownership, completion, or quality.

## Repository result

Run on 2026-09-14:

- Integrated modules: 13/13.
- Existing-module reuse: 10/13, or 76.9%.
- Batch 7 additive/new-system share: 3/13, or 23.1%.
- Reusable-design coverage: 11/13, or 84.6%.
- World-specific share: 2/13, or 15.4%.
- Static WebGL signals: 6/6 observed: renderer construction, instancing,
  profile selection, performance-budget wiring, reduced motion, and disposal.
- Static performance instrumentation signals: 5/5 observed: frame-tail
  percentiles, renderer statistics, asset timing, long-task observation, and
  device-tier recommendation.

These percentages are reproducible inventory ratios. They do not establish
equivalent visuals, runtime correctness, or the cost of creating Bubble Reef.

## Retained evidence

The audit reads `release-evidence/local-certification.json` when present. The
retained 2026-09-13 artifact reports 24/24 local commands passing, a passing
WebGL browser command, and a completed desktop/mobile headless probe command.
It predates this audit and is not current-checkout regression proof. The probe
is explicitly labeled `diagnostic-only` and records 20 budget violations. Its note
requires real-device confirmation and rejects a release-performance claim.

The static source audit also confirms that the current scene host wires a
WebGL renderer, instanced meshes, reduced-motion handling, renderer sampling,
frame recording, and teardown hooks. Static tokens prove wiring only; they do
not prove those paths executed in a particular build.

## Unknown and unverified fields

- Production time: `UNKNOWN`. No authoritative time-tracking artifact was in
  scope, so no hours are estimated.
- Physical-device performance: `UNVERIFIED`. The retained Gate 8.4 mobile item
  requires real phone, tablet, or Chromebook evidence.
- Sustained FPS, thermals, battery, production hosting, and visual fidelity:
  not measured by this package.
- A passing headless command is not promoted to a performance pass when the
  artifact classifies its measurements as diagnostic-only.

## Verification

Focused deterministic test:

```text
node --test tests/world-pipeline-audit.test.mjs
```

Repository audit:

```text
node scripts/audit-world-pipeline.mjs
```

The CLI exits nonzero if any declared module is missing or no longer directly
integrated. Missing or malformed retained evidence remains visible in JSON but
does not create synthetic measurements or a certification claim.
