# BrainBite — Next / Roadblocks

Agent rule: **do not stop** on human blockers. Skip them, log here, keep making the app fully functional.

## Done (agent)

- 2026-09-02 Orchestrator: created this file; logged R1–R6 roadblocks; launched Functional QA + UI Match + Completion Pusher workers.
- 2026-09-02 Orchestrator: MATCH mission complete now returns to **home hub** (not world list with hidden nav). Passthrough chrome for non-hub screens. MATCH test: pause→home. SW `v13-match-hub`.
- 2026-09-02 Orchestrator (UI Match takeover): verified home FX (ken/portal/dust18) + battle FX (falls/shafts/mist/ring/water) + pause→home; refreshed `docs/references/spike/home-live.png` + `battle-live.png`. Logged R7 usage-limit fail.
- 2026-09-02 Completion Pusher: lazy-load WebGL/Three so shipping DOM offline does not need `node_modules/three`. SW bump `v14-offline-dom`. Added `scripts/smoke-offline-reload.mjs` (**PASS**) + `scripts/smoke-match-lifecycle.mjs` (**PASS**: exit→home, settings passthrough+nav, complete→home). MATCH Playwright **5/5**. Re-ran `smoke-completion-pusher.mjs` **PASS**.
- 2026-09-02 Orchestrator follow-up: Playwright **27/27** PASS; offline + MATCH lifecycle reconfirmed; `scripts/smoke-parent-practice-snap.mjs` **PASS** (PIN 1234, Practice→Fractions, Snap validate/save).
- 2026-09-02 Functional QA: `npx playwright test` **27/27** PASS after raising the 30-mission suite timeout to 90s (was flaking at 30s on mission 24). `smoke-completion-pusher.mjs` **PASS**. Shipping `?match=0&webgl=0` parent/settings/practice smoke **PASS** (settings persist, Practice→Fractions→Play now, PIN reject/unlock, gated Practice after reload). No SW bump (test-only). Did not mark Gate 8.4 phones PASS.
- 2026-09-02 Orchestrator follow-up (Functional QA gaps): Parent Controls / Account / Integrations / Diagnostics / Lab / Release now **PIN-gated**. Non-fractions missions under MATCH use **DOM battle shell** (`presentation-match-game-dom`) so Wordwood/Spanish stay playable; fractions keep plate. MATCH suite +1 test.
- 2026-09-02 Orchestrator: release suite adapted to PIN gate (`unlockParent` after reloads + Firebase `configure`). Lab + Firebase tests **PASS**. SW `v15-pin-match-dom`.
- 2026-09-02 evening: Playwright **28/28** + `release:check` **PASS**. `scripts/smoke-match-multiworld.mjs` **PASS** (math/words/spanish under MATCH DOM). Added `docs/STEVE_FINISH_NOW.md` for human closeout only.
- 2026-09-02 late: MATCH CI **7/7** (words+spanish DOM battle). `tryAnswer` LearningCore path only for fraction plates/WebGL — board play restored for MATCH game-dom. SW `v16-match-board`.
- 2026-09-02 late+: Spanish mission accents fixed (`adiós`, `buenos días`, `pájaro`, `pequeño`). Inventory `docs/GATE_8_5_SPANISH_INVENTORY.md`. CI workflow adds unit + smokes. SW `v17-spanish-accents`.
- 2026-09-02 late++: Educator inventory `docs/GATE_8_5_EDUCATOR_INVENTORY.md` (30 missions). `release:check` **PASS** (29 Playwright).
- 2026-09-02 night: Kid hub unblocked — PIN no longer gates Diagnostics/Release (Achievements / What's New). MATCH pillars accept keys `1–4` + arrows/Enter. Legal clause map + SR operator path added. SW `v18-kid-hub-keys`. MATCH Playwright **9/9**.
- 2026-09-02 night+: MATCH hub parity — WORLDS/NEWS/dock hotspots; PLAY → Continue/lastMission; portal keeps fractions plate; battle prompt/caption strip; reduced-motion setting kills MATCH FX. Gate 8.4 Windows a11y/audio/offline filled via `scripts/smoke-gate84-windows.mjs` (Chrome+Edge PASS). SW `v19-match-hub-a11y`. MATCH **11/11**.
- 2026-09-02 night++: MATCH battle live HUD (goal/health/boss/targets) + battle dock hotspots; reduced-motion covers toast/flash/combo. PWA installability smoke PASS (Chrome+Edge). WebGL online boot smoke PASS. SW `v20-match-live-hud`. MATCH **13/13**.
- 2026-09-02 night+++: WebGL uses `vendor/three` + SW precache (offline WebGL PASS). MATCH Ken Burns removed so live HUD/hotspots stay locked to plates. Export smoke unlocks PIN + local profile delete. CI smokes add export/offline/webgl. SW `v21-vendor-three`.
- 2026-09-02 close: Refreshed MATCH proofs; `release:check` **35/35 PASS**. Clipped duplicate live HUD overlays so plate chrome stays clean (toast/FX remain). SW `v22-plate-hud`.
- 2026-09-12 Phase 3.2 live family-aware activity resolver: **IMPLEMENTED/VERIFIED** with independent reviewer **PASS**. Ordered-family exact-template, taxonomy, and difficulty support bindings are verified. Focused **14/14**; unit **102/102**; full browser **102/103** due one known same-installation tab-writer flake; isolated repeat **3/3** **PASS**; all validators pass.
- 2026-09-12 Phase 3.3 typing foundation and child-facing encounter verified; focused `5/5`, typing/activity browser `7/7`, and `test:unit` `107/107` pass. Multi-target progression, adaptive support, and device coverage remain OPEN.
- 2026-09-13 Phase 3.4 Coding Bridge lesson catalog, child-facing UI, and LearningCore evidence verified; focused activity browser `11/11`, full unit `113/113`, full browser run `108/109` with the known intermittent local-storage concurrency case, then isolated retry `2/2` PASS. Four prerequisite-aware deterministic lessons are available; production mode hides unreviewed suggestions, unsupported commands fail closed, and successful programs are idempotent. Formal educator approval and richer progression remain OPEN.
- 2026-09-13 Phase 3.5 Code Lab foundation verified; `content/code-lab.mjs` supports bounded profile-local projects, safe execution through the Coding Bridge DSL, reset, versioned serialization, and safe import/export. Focused browser `12/12`, full unit `115/115`; programmable Bits and richer coding curriculum remain OPEN.
- 2026-09-13 Phase 3.5 programmable Bit editor slice verified; `content/programmable-bits.mjs` supports bounded declarative actions, event triggers, deterministic reset, strict IDs, inherited/sparse-input rejection, and `app.js` provides a profile-local child-facing editor. Bit tests `3/3`, focused Bit browser `2/2`, full activity-family browser `14/14`, full unit `117/117`; 3D presentation, reviewed behavior lessons, and richer curriculum remain OPEN.
- 2026-09-13 Phase 3.5 visual integration: `presentation/programmable-bit.mjs` adds a reusable reduced-motion-safe Three.js Bit companion to BrainBase; learning events drive correct/mistake reactions, scene disposal is covered, and the exact offline cache/reopen regression passes after SW `v33-bit-companion`. Unit `119/119`; activity browser `15/15`; targeted cached WebGL test `1/1`.
- 2026-09-13 Phase 3.5 Bit curriculum integration: `content/programmable-bit-curriculum.mjs` adds four deterministic internal-review lessons; My Bites can load behavior into the safe editor, production hides the catalog until educator approval, and the active Bit remains profile-local. Unit `123/123`; focused Bit browser `6/6`.
- 2026-09-13 Batch 6 certification precursor: JSON-reporter runs completed with release browser `56/56`, WebGL/accessibility/assets browser `30/30`, and activity-family browser `18/18`; all had zero unexpected, flaky, or skipped tests. Content review, release structure, evidence, syntax, and diff gates also pass.
- 2026-09-13 Batch 6 browser certification partition closed: BrainBase + MATCH `14/14` also passed. The current browser matrix is therefore `118/118` across independently captured partitions, with zero unexpected, flaky, or skipped tests; unit remains `123/123`.

- 2026-09-20 Phase 3.1 child/parent information architecture IMPLEMENTED/VERIFIED: `[hidden]` is authoritative so the parent shell no longer leaks onto the child hub; the child dock is one styled five-target dock; the scene selector is a parent-only Advanced device setting; the fake news/promo/energy/reward-hat/carousel placeholders and the `#webglBadge` debug badge are removed; the battle minimap is bound to real world/mission progress; missing `#installBtn` and `#updateStatus` elements were added with a real PWA install control and update notice; `Back to kid hub` gives the parent shell an explicit exit. Startup `null`-element errors are gone.
- 2026-09-20 Phase 3.2 battle composition IMPLEMENTED/VERIFIED for single-answer-surface and one-screen fit: the DOM board and 3D answer controls are mutually exclusive, `.webgl-canvas` accepts pointer input so 3D pillar taps work, and the battle fits `100dvh` exactly at 390x844, 768x1024, and 1280x800 in both presentations. Phase 3.2 exit evidence also confirmed `boardCells=25` in DOM and `webglAnswers=4` with no DOM board in live 3D.
- 2026-09-20 Phase 0.1 baseline repair: the pre-session repository was red. Stale selectors targeting the superseded single-nav markup, two vacuous `Math.min(...[])` dock assertions, a stale `schemaVersion: 8` expectation, and a `webgl-accessibility.spec.js` port drift (`4317` vs the served `4318`) were corrected, and the app schema version now comes from one `SCHEMA_VERSION` constant. Verified: unit `183/183`, `node --test tests/accessibility-contract.test.mjs` `6/6`, full browser `149/150`, `webgl.spec.js` + `webgl-accessibility.spec.js` `23/23`, and all repository validators pass.
- 2026-09-20 P1 fixed: cross-tab evidence reconciliation. The initial canonical load ran before `brainbite-core.mjs` (a deferred module), so `mergeLearningCore` used its degraded fallback, which unions attempt records but keeps `evidence`/`evidenceProvenance` from one side only. Two tabs each recording an attempt kept both records while counting one attempt, and dropped the other writer's provenance source. `reconcileCanonicalStateWithCore()` now runs once on the first render after LearningCore is available: it unions every readable generation, constrains the result to the profiles the installation still has (no resurrection, stable active index), converges all three slots, and notifies other tabs. Ordinary autosaves keep rotating distinct generations. Verified by a two-tab probe (`attempts: 2` with both writer sources in all three copies after a simultaneous reload) and by the three lock-mode reconciliation tests plus the stale-tab test.
- 2026-09-20 Phase 3.3 partial: the three unlabeled form controls (`#newProfile`, `#importFile`, `#codeLabImportFile`) now have labels and the battle prompt sets `lang="es"` for Spanish missions. First-run choreography, self-hosted fonts, and CSP remain open.
- 2026-09-20 Phase 0.2/gitignore: `.tmp-*` output is ignored; `release-evidence/` is not ignored. The dirty working tree remains the blocker for `check:evidence` and clean-checkout reproducibility.

## Roadblocks (Steve / humans — skipped by agents)

| ID | Blocker | Needed from Steve | Why skipped |
| --- | --- | --- | --- |
| R1 | Gate 8.4 real phones/tablets/iOS | Run `docs/GATE_8_4_OPERATOR_CHECKLIST.md` on device | Needs physical hardware |
| R2 | Gate 8.5 educator / Spanish / legal / SR reviews | Sign `docs/GATE_8_5_REVIEW_PACKET.md` | Needs human reviewers |
| R3 | Gate 8.6 production domain + HTTPS | Canonical URL + cert **or** say **enable pages** | Needs hosting/DNS; Pages workflow drafted locally (not published) |
| R8 | GitHub Pages publish | Explicit **enable pages** + commit/push | Auto-review blocks unsolicited public deploy |
| R4 | Final support email (not GitHub Issues interim) | Email or form URL for `support.html` | Product decision |
| R5 | Production Firebase delete/export verification | Live delete on `brainbite-prod` | Needs signed-in prod session + care |
| R6 | Batch 9.4 real glTF jungle art | Art pipeline | Not required for plate MATCH + LearningCore |
| R7 | UI Match subagent usage-limit fail | N/A — orchestrator continues UI Match | 2026-09-02 worker `90dcbecf` failed; work continued in main session |

## Agent backlog (do next — executable)

- [ ] **3D payload reduction**: the mascot GLB is 1,284 KB of geometry with no embedded
  textures (56 meshes, 326 accessors) and is the slowest asset at ~3.9 s cold; total 3D
  payload is 3,154 KB against a 4,096 KB ceiling. Blender 5.2.1 is available locally for a
  decimated or merged re-export, and `npm run probe:performance` measures the result.
- [ ] **Educator review**: run `npm run review:packet`, circulate the generated sheet, then
  `npm run review:approve --reviewer <id> --role <role> --ids <file>`. 75 records are
  pending; production currently ships only the 30 reviewed registry missions.
- [ ] Phase 4.1–4.3: closed-beta instrumentation, budgets, and package evidence
- [ ] Phase 0.2–0.3: clean-checkout reproducibility and remote workflow proof
- [ ] Retire the remaining ad-hoc smoke scripts into one reported runner
- [x] **Cross-tab evidence reconciliation (P1)** — fixed 2026-09-20. The initial canonical load ran before `brainbite-core.mjs` (a deferred module), so it merged generations with the degraded fallback that keeps `evidence`/`evidenceProvenance` from one side only; two tabs each recording an attempt kept both records but counted one attempt. `reconcileCanonicalStateWithCore()` now unions every readable generation once LearningCore is available, constrained to the profiles the installation still has, and converges all three slots. Rotation on ordinary autosaves is preserved.
- [ ] Expand Phase 3.3 beyond the verified single-target typing encounter: multi-target progression, adaptive support, and input/device coverage
- [ ] Expand Phase 3.4 Coding Bridge with formal reviewed content records, adaptive support, and richer production-safe lesson progression
- [x] Expand Phase 3.5 with programmable Bit behavior models, bounded commands, reset/recovery, and child-facing curriculum integration → declarative runtime + editor slice verified 2026-09-13
- [x] Add reusable reduced-motion-safe 3D Bit presentation to the live WebGL home scene; reviewed behavior lessons remain open
- [x] Add internal-review Bit lesson catalog and safe editor loading; educator approval and evidence-backed lesson completion remain open
- [x] Add explicit merge/profile-isolation regression coverage for programmable Bit inventories
- [x] Include programmable Bit curriculum in the release content-review validator
- [x] Keep Playwright green after lifecycle work → **28/28** + `npm run release:check` **PASS** (2026-09-02 evening)
- [x] Expand MATCH beyond fractions mission 8 → non-fractions use DOM battle under MATCH (2026-09-02)
- [x] Offline PWA smoke on shipping path after SW bump → `scripts/smoke-offline-reload.mjs`
- [x] Parent PIN / practice / snap path smoke → `scripts/smoke-parent-practice-snap.mjs`
- [ ] Commit Batch 9 spike when Steve says **commit**
- [ ] Open Cursor Automations (Completion Pusher) when Steve approves draft
- [ ] Pixel-diff home/battle live vs targets if visual drift appears
- [ ] Chromebook / additional viewport notes when hardware available (→ R1)

- 2026-09-13 Batch 6 local certification artifact: added `npm run certify:local`, which captures current branch/HEAD/dirty state and runs validators, unit tests, all browser partitions, shipping/MATCH/offline/export/accessibility/PWA/Windows smokes, and desktop/mobile performance evidence. Final report: `release-evidence/local-certification.json` with **24/24 PASS**; the performance probe records **20 headless budget violations as diagnostic-only**, requiring real-device confirmation. Mobile hardware, external reviews, production domain, support contact, and live account deletion/export remain UNVERIFIED.
- 2026-09-13 canonical release gate: `npm run release:check` **PASS** with all validators, `123/123` unit tests, and `118/118` browser tests. Playwright now defaults to ignored `.playwright-results/` so the gate is reproducible in the managed worktree.
- 2026-09-13 CI hardening: pull requests now run runtime, release-structure, Firebase, launch, final-hardening, and Firebase ownership validators in addition to content and test coverage; strict checkout-bound evidence remains a local certification step.
- 2026-09-13 external closeout runbook: added `docs/BATCH_6_EXTERNAL_CERTIFICATION_RUNBOOK.md` consolidating verified local evidence and exact Gate 8.4-8.6 operator evidence requirements; no external gate was claimed complete.
- 2026-09-13 evidence/CI split: local `check:evidence` remains checkout-strict; CI uses explicit `check:evidence:ci` to validate the evidence schema while allowing the CI checkout commit to differ.

## Definition: fully functional (agent target)

1. Shipping `?match=0&webgl=0`: boot, all worlds navigable, missions playable, save/export, no release regressions  
2. MATCH `?match=1`: home + battle plates, PLAY + pillar answers, pause/exit  
3. No P0 console errors on happy paths  
4. Roadblocks above logged, not silent  

Update this file whenever a new blocker appears or an backlog item ships.
