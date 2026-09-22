# BrainBite Hybrid Asset Production Plan

Recorded: 2026-09-12. Status: approved direction translated into a staged plan,
NOT a completed vendor integration or an engine migration.

## Production Decision

Concept/reference -> optional 3D AI Studio candidate -> local quarantine ->
Blender cleanup and standardization -> validated GLB -> existing Three.js/WebGL
BrainBite -> visual, learning, offline, and device acceptance.

Blender remains the master source workshop. AI generation is an optional
accelerator, not a gameplay dependency. Preserve the current original procedural
kit as the reproducible fallback. Do not replace the working web game with Unity
as an incidental art change. Unity import validation is a deferred adapter workstream
only if a native-client migration is explicitly chosen, scoped, and funded.

No account connection, credentials, purchases, reference uploads, generation jobs,
vendor downloads, new runtime models, or Unity integration were performed in this
planning update. Never put vendor credentials or generation calls in the child app.

## Verified Starting Point

- Existing builder: `scripts/blender/build_brainbite_kit.py` and `mascot_v2.py`.
- Existing outputs: mascot, jungle props, portal, answer pillars, Kraken, source
  `.blend`, and SHA-256/provenance manifest under `assets/generated/blender/`.
- Pipeline 1.2.0 rebuilds and re-imports its own five exports. This is NOT yet a
  general-purpose cleanup/import validator for arbitrary third-party assets.
- Current Bite has a six-bone rig, idle/blink animation and reference sockets.
  This is not the full hero locomotion/facial production rig.
- Prior unchanged runtime baseline: all validators, 41 unit and 66 browser tests
  passed. See `VISUAL_FRAMING_MOBILE_2026-09-12.md`; not rerun for this document.
- No Unity project is present in the audited architecture. Production-device,
  content-expert, cloud and release-operation gates remain open.

## Vendor Evidence And Limits

Checked the official [3D AI Studio API FAQ](https://www.3daistudio.com/Platform/API/Documentation/faq)
and [product page](https://www.3daistudio.com/) on 2026-09-12. They describe
text/image generation, texturing, remeshing/processing, and standard 3D interchange.
The API FAQ identifies GLB as the usual generation output and lists FBX among its
supported conversion formats. It describes asynchronous jobs and credit-based API
billing. Those documents do not establish BLEND output or an animation/rigging API
contract for this integration; verify the selected endpoint before promising either.

Keep the canonical `.blend` locally in Blender regardless of vendor export options.
The vendor's commercial-use statement does not replace an input-rights check,
applicable plan/engine terms, attribution review, or an asset-specific record.
Capture terms and engine/version at acquisition time; do not treat this document
as legal clearance. Full UI screenshots are art-direction references, not suitable
single-object image-to-3D inputs. Create clean object turnarounds first.

## Durable Visual References

User-supplied images are archived verbatim under `docs/references/expanded-vision/`.
They are concept targets, not screenshots of implemented features, release assets,
performance evidence, or permission to publish third-party content.

| File | SHA-256 | Target |
|---|---|---|
| `coding-bridge-target.png` | `48165faa156876fa8d1b39d284f4f9dac2ddeec6c3b0bd47544dc3430811ce6f` | Side-view world, code editor, Run/Step/Reset, visible bridge reaction |
| `typing-runner-target.png` | `747ebbf1fdcbcff6107299b9b00e309faca03e10a78eb5be17252727cad5111e` | Readable moving word encounters, key guidance, accuracy/speed feedback |
| `jungle-world-select-target.png` | `f7d80960003c2876aed274aad265612c16784b65f29e0138f1e9791acc84be42` | World showcase, activity navigation, locked future worlds |

Retain earlier home/battle references too. New images expand the desired feature
scope; the previous 79% functionality / 52% visual-match / 84% phase estimates
apply only to the prior scoped baseline. Expanded-scope percentages are UNASSESSED
until the feature inventory is reconciled. Do not increase completion for planning.

## Shared Art Contract

- Blue Bite, rounded readable silhouette, large expressive eyes, green backpack,
  gold accents. Preserve identity and attachment/animation contracts across assets.
- Jungle: warm sandstone ruins, emerald foliage, cyan energy and water, warm key
  light, distant layered architecture, clear playable foreground. Avoid noisy
  silhouettes that obscure targets or tiny labels baked into textures.
- Keep prompts, answers, code and accessibility labels in live UI. Do not encode
  educational correctness, currency, progress or navigation inside generated art.
- Build repeatable modules rather than one giant scene mesh. Use common material
  families, instancing, consistent scale, stable names, documented pivots and sockets.
- Author source in Blender coordinates; export through one tested GLB conversion.
  Document one Blender unit as one meter and validate known-size test objects and
  transformed bounds in the actual runtime. Never apply axis conversion twice.
- Ground props use a base pivot; rotating bridge parts use hinge pivots. Separate
  render meshes, collision proxies and interaction anchors.
- Budgets must be explicit per asset and per scene: triangles, materials/draw calls,
  texture dimensions/decoded memory, file bytes, bones, clips and LOD behavior.
  Start from measured current budgets; the existing mascot's 2 MiB test remains a
  gate unless a measured, reviewed budget change is accepted. No guessed AAA budget
  is a substitute for device measurements.

## Ownership By Asset

| Asset family | Candidate source | Final owner | Release prerequisite |
|---|---|---|---|
| Rocks, foliage, pots, ruins, decorations | AI or existing procedural kit | Blender cleanup | Style, scale, material, mobile budget |
| Chest, collectibles, gate, bridge modules | AI blockout or authored | Blender cleanup | Pivots, separable parts, gameplay anchors |
| Bite | Approved turnaround and authored source; AI only as exploratory input | Hero artist/Blender rig pipeline | Identity, skinning, facial/locomotion clips, sockets |
| Fraction Kraken | AI concept or authored source | Blender boss pipeline | Phase silhouettes, tentacle rig, honest challenge mapping |
| Bits/robots and Code Lab equipment | AI concept/candidate | Blender rig/interaction owner | Deterministic articulation and safe command semantics |

## Intake And Promotion Contract (To Implement)

Lifecycle: REQUESTED -> GENERATED -> QUARANTINED -> NORMALIZED -> VALIDATED ->
APPROVED -> PROMOTED. Rejects stay quarantined with reasons. Never auto-promote a
file solely because the vendor viewer displays it.

Proposed source record: schemaVersion, assetId, revision, vendor, engine/version,
taskId, source-input hashes/rights, prompt, generation settings, acquisition date,
license/terms evidence, attribution/distribution decision, original SHA-256,
cleanup tool/version, output hash, units/pivot/sockets, resource budgets,
validation report and reviewer approval. Do not record secrets or child data.

Intake operates outside public assets and the service-worker manifest. Reject
unsupported formats, oversized files, broken containers, unsafe archive paths,
external resource URLs, missing provenance and unapproved runtime extensions.
Process untrusted files with a bounded local worker, timeout and resource limits;
never execute imported scripts. Pin tool versions and keep originals immutable.

Blender normalization must report, not silently conceal, missing textures,
degenerate geometry, transform/normal issues, invalid UVs and rig defects. Shared
materials, manual retopology and LOD authoring remain art tasks where automation
cannot safely infer intent. Avoid blind decimation of face or joint topology.

Validation layers: file/schema/hash -> Blender re-import -> geometry/material/rig
checks -> actual runtime loader/render -> interaction/offline/recovery -> visual
approval and sustained device performance. Keep the previous known-good revision
available. Promotion updates only the explicitly approved manifest entries and
cache version; failed promotion must not leave a half-updated live asset set.

## Ordered Batches And Acceptance

| Phase | Work and concrete exit gate | Owner / recommended setting | Status |
|---|---|---|---|
| A0: Scope and art bible | Archive references; distinguish desired screens from implemented features; record runtime decision | Orchestrator | Reference/decision record COMPLETE; detailed feature reconciliation pending |
| A1: General asset intake | Extend, not duplicate, builder/manifest conventions; local intake, provenance schema, quarantine, approval-gated isolated promotion and GLB validator | Orchestrator with independent review | COMPLETE; see `PHASE_2_1_ASSET_INTAKE_REPORT.md` |
| A2: Small prop pilot | One rock cluster, one ruin column, one fern; preserve originals; clean/export/re-import; integrate in a test scene; compare against current kit | Visual owner plus independent review | IN PROGRESS: hardened intake/normalization tooling verified; visual creation/acceptance waiting |
| A3: Jungle modular kit | Expand only the accepted pilot style into bridge, gate, ledge, ruin, vegetation and treasure; reuse instancing/materials; retain interactions | Sol / medium bounded owners | PLANNED |
| A4: Hero and boss | Bite turnarounds, production rig/clips and Kraken phase art; preserve evidence-based mastery and existing fallback | Orchestrator direction; Sol / medium tooling/reviewer | PARTIAL existing starter assets, production work pending |
| A5: Expanded activities | Reconcile and implement typing, safe coding bridge, Code Lab/Bits/Create in separate feature batches below | Orchestrator contracts; bounded Sol / medium workers | UNVERIFIED/PLANNED, not implied by images |
| A6: Acceptance | Full learning/save/profile/offline gate, production debug exclusion, art comparison and sustained low-end/touch/keyboard checks | Independent reviewer and device operator | OPEN |
| U1: Optional Unity adapter | Only after explicit engine decision: version/pipeline, native parity plan, importer, fixtures, CI/editor verification and migration rollback | Orchestrator architecture decision first | DEFERRED; no Unity project |

A1 tests must include valid intake, malformed/oversized GLB, missing license or
hash mismatch, external textures, invalid transforms, material/triangle budget,
missing socket/clip, failed Blender invocation, quarantine persistence, denied
promotion without approval, and safe rollback after interrupted promotion.
Vendor credentials and paid jobs are NOT needed to build these offline fixtures.
Reuse existing GLB tests and named outputs; avoid replacing the procedural builder.

A2 requires a manually supplied licensed candidate or an authenticated vendor
workflow. Before paid submission, verify the exact engine/endpoint, available
credits, per-job and total approved spend limits, allowed inputs and storage terms.
Do not retry a timed-out submission blindly: recover its task ID/status to avoid
duplicate charges. No arbitrary bulk generation. A failed or unavailable vendor
must not block gameplay or the local authored fallback.

Record active human cleanup time, orchestration time, generation waiting time,
credits, accepted/rejected count, triangle/material/texture budgets and device
frame costs for each pilot. Estimate future-world effort from those results, not
from vendor generation-time marketing.

## Expanded Feature Batches (After Inventory, Not Art-Only Changes)

1. Typing: keys -> words -> sentences, accurate WPM/accuracy definitions, adaptive
   focus keys, hints distinct from independent evidence, pause/restart, optional
   untimed mode, keyboard-layout/IME/touch behavior, local persistence and tests.
2. Coding Bridge: approved commands, blocks/text/split view, Run/Step/Reset and
   trace, deterministic bridge/player/gate/light actions, bounded execution and
   testable learning evidence. Do not use eval or claim a command DSL is Python.
   If actual Python is chosen, separately design an isolated runtime with no
   host/network/filesystem access and hard time/instruction/resource limits.
3. Code Lab, Bits and Create: scoped editable projects and robot behaviors,
   validated local save/import/export, safe limits and reset/recovery. No public
   child sharing, arbitrary plugin execution or new cloud data flows by default.
4. World selection: accessible functional tabs and locked previews backed by real
   state; no dead buttons advertised as finished modes. Seven concept world cards
   are not seven production worlds. Preserve Jungle-before-second-world gates.

Each activity needs its own acceptance run, skill taxonomy/content approval,
assistance evidence, rewards/idempotency, profile isolation, offline recovery and
parent-report checks. Inventory existing code before creating duplicate modules.

## Next Dispatch

Complete A1 offline intake/validation with existing local fixtures; keep learning,
sync and UI unchanged. The isolated approval promotion preserves source bytes; it
does not claim Blender cleanup. A separate read-only reviewer checks untrusted-file
handling, provenance, promotion isolation and rollback. Orchestrator owns budgets,
art contract and final acceptance. Actual Blender normalization begins with the
three-prop A2 pilot, where artistic scale/pivot/topology choices can be reviewed.

Unity migration, paid generation and new feature implementation are not hidden
dependencies of this first tooling batch. No new completion percentage is earned
by writing this plan.

## Planning Update Verification

- Three archived image SHA-256 values checked against their source-copy hashes.
- Three documentation files checked for conflict markers; documentation diff
  whitespace check passed. No runtime source changed or runtime tests rerun.
- Confucius, Sol/medium: independent read-only review found no issues within the
  named risks of false completion claims, unsafe intake/promotion requirements,
  or accidental Unity/paid-vendor commitments. This reviews the plan, not an
  implemented intake system. Agent token and cumulative error telemetry unavailable.
- Orchestrator retained scope/architecture decisions, wrote the plan, preserved
  references and verified documentation. Current session model/reasoning telemetry
  unavailable. One optional docs/AGENTS.md lookup was absent; repo AGENTS.md was
  read. Blender website fetches failed; no vendor capability was inferred from them.
