# Playful Expedition — playable direction prototype

The user selected concept 01 on 2026-10-07. This opt-in prototype connects a new home, live 3D game scene, answer controls and results treatment to the existing BrainBite engine.

Launch the repository server with `npm run serve`, then visit `http://127.0.0.1:4318/?ui=expedition&presentation=webgl`.

The ordinary URL retains the previous interface. This is a direction review, not a claim that all secondary screens or the Windows release have been redesigned. Explore, Collection and My space use the existing destinations; learning, saved progress, rewards and parental controls continue through the existing application.

**Owner decision:** Whether Expedition should become the Windows default remains undecided.

The new visual layer uses real Three.js geometry and the existing authored mascot model. No concept-board image is presented as gameplay. New preview assets are covered by the existing presentation staging allowlist and explicit service-worker precaching.

The results banner stays visible in this preview until the learner chooses another action. Its reward and stars still come from the actual mission result.

## Verification

Use this bounded verification record for the integration handoff:

| Check | Status | Evidence / owner |
|---|---|---|
| `node --check tests/expedition.spec.js` | **PASS** | Exited successfully; no output |
| `npm run check:test-selectors` | **PASS** | `44 test files checked against 342 known targets`; every target resolved |
| `npm run check:vacuous-assertions` | **PASS** | `12 browser test files`; no unguarded DOM aggregate assertions |
| Focused browser run for `tests/expedition.spec.js` | **UNVERIFIED** | Coordinator to run; this pass intentionally does not run browsers |
| Header profile/settings, More menu, and existing destination wiring | **COVERED BY SPEC; UNVERIFIED AT RUNTIME** | Assertions are in `tests/expedition.spec.js`; coordinator owns browser execution |
| Expedition screenshots | **PENDING** | Coordinator to produce `.ui-captures/expedition/` screenshots |

The prototype claims Explore, Collection and My space use existing destinations; the focused
spec now checks those real `worlds`, `bites` and `brainbase` screens, while the Parents check
expects the existing parent gate instead of bypassing it. The concept board remains in the task
output folder `BrainBite-UI-Rethink`.
