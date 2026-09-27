# BrainBite Batch And Phase Plan

> Superseded on 2026-09-19 by `docs/BRAINBITE_PRODUCTION_GOAL.md`.
> This file is retained as historical planning context only. Do not use it to
> advance Bubble Reef, new modes, visual production, or certification work.

Updated: 2026-09-14

This is the active implementation plan for the BrainBite repository. It is an
engineering roadmap, not a certification record. External device, educator,
legal, production-cloud, and release certification work is intentionally not an
active deliverable unless separately requested.

## Routing

- Luna: bounded content, tests, documentation, validators, and low-risk fixes.
- Sol: cross-cutting learning, progression, sync, security, and difficult logic.
- Astra: visual design, Three.js presentation, Blender, materials, VFX, camera,
  and screenshot-match work when visual routing is available.
- Orchestrator: architecture, integration, acceptance, conflict resolution, and
  truth of status.

## Batch 0: Repository Truth And Control Plane

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 0.1 | Framework, assets, runtime, persistence, tests, and build audit | Complete | Architecture and command inventory |
| 0.2 | Orchestrator, worker ownership, and evidence rules | Complete | Durable control-plane docs |
| 0.3 | Approved visual reference archive | Complete | Reference files and hashes |
| 0.4 | Scope reconciliation and completion baseline | Complete | Roadmap and estimates |

## Batch 1: Functional Learning Foundation

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 1.1 | Profiles, BrainBase, portal, world flow | Implemented | Profile and navigation tests |
| 1.2 | LearningCore evidence, mastery, adaptation | Implemented | Weighting, random-resistance, and remediation tests |
| 1.3 | Spaced review and stale scheduling | Implemented | Review interval tests |
| 1.4 | Target Smash, Letter Trail, Knowledge Platforms | Implemented/polish open | Activity contract and runtime tests |
| 1.5 | Fraction Kraken, rewards, BrainBase upgrade | Implemented/presentation open | Idempotency and persistence tests |
| 1.6 | Save, recovery, offline queue, profile isolation | Implemented | Recovery, replay, and isolation tests |
| 1.7 | Content validation, quarantine, internal Lab | Implemented/release exclusion open | Fail-closed validator tests |

## Batch 2: 3D Presentation And Asset Pipeline

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 2.1 | Asset intake, provenance, quarantine, Blender automation | Implemented | Intake and normalization tests |
| 2.2 | Bite, props, Jungle kit, shared materials | Partial | Promoted assets and visual/runtime comparison |
| 2.3 | Kraken model, VFX, audio, camera, personality | Partial | Semantic presentation events and resource disposal |
| 2.4 | HUD, quality tiers, responsive framing | Partial | Desktop/mobile screenshot checks |
| 2.5 | Performance instrumentation and tuning | Open | Frame, memory, load, and save metrics |

## Batch 3: Curriculum And Product Expansion

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 3.1 | Canonical registry and activity mapping | Complete | Registry and content validators |
| 3.2 | K-6 taxonomy, generators, QA, content control | Implemented/approval open | Deterministic generator and quarantine tests |
| 3.3 | Typing progression and runtime encounters | Foundation verified | Typing activity tests |
| 3.4 | Coding Bridge | Foundation verified/expansion open | Safe DSL and lesson tests |
| 3.5 | Code Lab and programmable Bits | Foundation verified/editor open | Safe behavior and persistence tests |
| 3.6 | Create mode | Open | Local safe project lifecycle |
| 3.7 | Unified progression and navigation | Open | No dead or falsely unlocked controls |

## Batch 4: Resilience And Accessibility

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 4.1 | Text scaling, read-aloud, captions, contrast, reduced motion | Partial | Per-profile settings and interaction tests |
| 4.2 | Offline packs and startup without network | Partial | Offline reload and cached-content tests; queued content events now retain normalized profile ownership |
| 4.3 | Save/sync conflict and partial-write hardening | Partial | Exactly-once reconciliation, recovery, and cross-profile event-ownership tests |
| 4.4 | Low-end scaling and performance budgets | Open | Tiered runtime measurements |
| 4.5 | Privacy and profile-boundary audit | Automated foundation | No leakage and minimum-data tests |

## Batch 5: Strong Functional Beta Polish

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 5.1 | First 10-15 minute flow | Open | New learner end-to-end browser path |
| 5.2 | Tutorial choreography and recovery | Open | Prompt removal and struggle-path tests |
| 5.3 | UI, transitions, feedback, error states | Partial | Responsive and empty-state coverage |
| 5.4 | P0/P1 defect burn-down | Open | Current defect ledger with no unresolved reproducible P0 |

## Batch 6: Local Release Evidence Only

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 6.1 | Local validators and automated release gate | Complete locally | `certify:local`, validators, unit/browser runs |
| 6.2 | Clean-install and package checks | Open | Local package evidence |
| 6.3 | External/device/human certification | Skipped by user | Not an active task and must not be claimed complete |

## Batch 7: World Pipeline Proof

| Phase | Work | Status | Exit evidence |
|---|---|---|---|
| 7.1 | Reusable world profiles and shared seam | Implemented | `world-profiles.mjs`, deterministic validation tests, fail-closed id/version/name validation |
| 7.2 | Bubble Reef 3D kit and route interaction | Internal preview route and live BrainBase gateway verified; production route open | `bubble-reef-kit.mjs`, `bubble-reef-route-kit.mjs`, Bubble Current route, `BrainBiteWorldPreview.setProfile()`, preview browser test, accessible BrainBase gateway, live 3D preview action, and focused tests; full in-game route UI remains |
| 7.3 | Bubble Reef unlock, rewards, and base contribution | Internal integration implemented | App reward path is profile-scoped and exactly-once in internal preview; broader world unlock and BrainBase presentation remain |
| 7.4 | Reuse, regression, and production-time audit | Implemented for static/local evidence; device gate open | `audit-world-pipeline.mjs`, 168 serialized unit tests, retained local regression artifact; physical-device and sustained performance evidence remain unverified |

## Current Execution Queue

1. Phase 7.2E: exercise the live BrainBase gateway in the browser under the
   internal-review runtime and verify return-to-Home behavior.
2. Phase 7.3C: broaden the route from preview to a reviewed production unlock,
   only after its canonical content and reward policy are approved.
3. Phase 8.1: continue accessibility, content expansion, parent intelligence,
   first-10-minute polish, and device resilience in disjoint lanes.
4. Keep certification excluded and report unverified external gates honestly.

## Batch 7 Exit Checklist

- [x] `BrainBiteWorldPreview.setProfile('bubble-reef')` mounts the Bubble Reef kit.
- [x] Browser test enters preview and preserves one live home canvas.
- [x] Invalid preview input falls back to Jungle Circuit.
- [x] Contribution/reward contract is exactly once and profile-scoped.
- [x] Existing 30-mission registry and Jungle flow remain unchanged by the world-profile seam.
- [x] Full unit and focused browser suites pass.
- [x] Reuse and performance results are recorded without certification claims.

## Completion Rule

A phase is complete only when its implementation exists, focused tests pass,
integration is reviewed, and the exit evidence is recorded. Roadmap text alone
never increases completion.
