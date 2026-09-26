# Expanded Scope Reconciliation

Date: 2026-09-12
Status: COMPLETE repository inventory; implementation remains planned/partial.

The supplied typing, coding and world-selection screenshots are product targets,
not evidence of current behavior. A Luna read-only inventory searched the full
repository and separated functional code from static copy and roadmap mentions.

| Capability | Evidence status | Repository truth | Required completion work |
|---|---|---|---|
| Typing / keyboard mastery / WPM | PARTIAL | Keyboard movement and generic response-time evidence exist; no typed-input or WPM activity | Keys-to-sentences runner, defined WPM/accuracy, adaptive keys, pause/restart, persistence and device tests |
| Coding Bridge / commands / blocks | ABSENT | Roadmap/reference only | Deterministic bounded DSL, text/blocks/split views, Run/Step/Reset/trace and learning evidence |
| Learner Code Lab | ABSENT | BrainBite Lab is a development QA harness, not a child coding activity | Learner projects, safe execution, progressive curriculum, persistence and production UI |
| Programmable Bits / robots | ABSENT | Planned/static reference only | Behavior model, commands, reset/recovery, profile/offline/reward integration |
| Create / projects | PARTIAL | Profile/practice progress import/export exists; no editable project model | Project CRUD, validated format, isolated local save/reset/import/export and child-safety review |
| World selection / locks | PARTIAL | Live app has 3 worlds, 30 missions and 3 bosses with locks; seven-world concept is not implemented | Unified registry, accessible tabs, honest previews, unlock persistence and tests |

Evidence locations include `app.js`, `brainbite-core.mjs`, `index.html`,
`tests/release.spec.js` and `tests/core.test.mjs`. Exact inventory line references
are retained in the agent completion record for this orchestration turn.

## Architecture Gate

The live app and LearningCore expose different content/progression inventories:
the live app reports 3 worlds / 30 missions / 3 bosses, while the vertical-slice
LearningCore defines 1 world / 3 activities / 1 boss. This may be intentional
presentation/content layering, but adding new modes without a canonical registry
would create a high duplicate-state risk.

Before Batch 3 adds typing or coding, document and implement one authoritative
world/activity/progression contract. Presentation can adapt it; it must not create
a second mastery, reward, unlock or profile ledger.

## Rebaselined Estimates

These planning estimates use the expanded product goal and must not be compared
directly with the previous smaller-scope percentages:

| Measure | Expanded estimate | Rationale |
|---|---:|---|
| Existing core automated functionality | 92% | Existing learning/profile/reward/save contracts remain strongly automated |
| Expanded full product functionality | 63% | Coding, learner Code Lab/Bits and full Create are absent; typing/world selection partial; external gates open |
| Match to all approved visual targets | 38% | Live 3D/HUD exists, but production environment, typing/coding screens and final hero/boss art remain |
| Roadmap phase progress, weighted | 39% | 49 phases now include partial credit only for verified partial systems |
| Strong-beta readiness for expanded goal | 55% | Existing beta foundation is strong; expanded modes and real-device/external gates remain |
| AAA Jungle readiness | 45% | Current WebGL slice is functional; authored art, animation, audio/camera and sustained device evidence remain |

Strictly completed phases are a smaller subset than weighted progress. Percentages
are prioritization estimates, not certification results. They rise only after
implementation and evidence, never from adding roadmap text.

## Next Engineering Dependency

Batch 2 Phase 2.2 may continue using the isolated asset pipeline. Before Batch 3
Phase 3.3 starts, complete the canonical progression/activity registry phase and
regression-test legacy save migration. Coding must not use `eval`; Code Lab must
not be confused with the existing development-only BrainBite Lab.
