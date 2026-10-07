# BrainBite current-build audit and implementation plan — 2026-10-02

Status: **complete for the bounded local audit described below**. This is an audit of the actual working tree, not a certification or a claim that every route has been tested. Findings are separated from optional work. Prepared by the requested Astra audit lane; implementation is handed to GPT-6.1 Sol workers and the coordinator.

## Repo state

- Checkout: `D:\Codex\Brainbite`; branch `audit/verified-build-plan`; starting HEAD `e59bc11`.
- Existing changes at audit start: `app.js`, `brainbite-core.mjs`, `docs/AUDIT_BUILD_PLAN_2026_10_01.md`, `service-worker.js`, `tests/core.test.mjs`, `tests/release.spec.js`, `tests/webgl-assets.spec.js`. All were preserved and included in inspection.
- Read `AGENTS.md`, `docs/HANDOFF.md`, the current UI rubric, current source and tests. No nested AGENTS files were found. No archive plan was used as an implementation authority.
- Coordinator reports existing PR #3: https://github.com/1983stevec-gif/BrainBite/pull/3 . This audit did not push, publish, merge, modify review approvals, or use production learner data.
- Changes begun by implementation workers after the initial capture are **not** represented as audited final implementation. The coordinator must append its final verification separately.

## Commands run and evidence

`git status -sb`, `git fetch --prune`, `git log --oneline -3`; targeted source reads and searches; `npm run check:static`; `npm run test:unit`; `npm run capture:ui -- --size 390x844`; `npm run capture:ui -- --size 1280x800`; isolated Playwright observation scripts; and:

```text
npx playwright test tests/release.spec.js tests/webgl-assets.spec.js tests/match.spec.js --grep 'first-time learner|profiles are isolated|canonical profile ledger|corrupt and legacy|parent exit locks|quota failure|storage reads|every localStorage read|persistent storage|PWA manifest|cold|precache|home plate mounts|pillar answers score|pause returns|review schedule' --reporter=line
```

Evidence is local, git-ignored, and intentionally not promoted to historical release evidence:

- `.ui-captures/home-{dom,webgl}-{390,1280}.png`, matching `battle-*`, `battle-correct-*`, `boss-*`, and `*-vs-target.png`: existing capture harness outputs, inspected directly with the image viewer.
- `.ui-captures/audit-2026-10-02/observations.json`: fresh DOM first-run, practice and parent UI text, visible button rectangles, errors, document width and relock results at 390×844 and 1280×800.
- `.ui-captures/audit-2026-10-02/followup-observations.json`: settled MATCH control geometry at both sizes and explicit production-mode practice reproduction.
- `.ui-captures/audit-2026-10-02/match-{home,battle}-settled-{390,1280}.png`: captured after image mount and a further two seconds. These supersede immediate MATCH screenshots for conclusions.
- `.ui-captures/audit-2026-10-02/parent-{setup,progress,profiles,recovery,accountsync}-{390,1280}.png` and `dom-first-run-*`, `reading-practice-*`: full-page route captures. The audit directly viewed representative parent progress/recovery images, all main DOM/WebGL home/battle views, and settled MATCH images.
- `.ui-captures/audit-2026-10-02/production-reading-practice-390.png`: explicit release-mode failure message.
- `.ui-captures/audit-2026-10-02/targeted-tests.log`: complete bounded browser run, **14 passed**.
- `.ui-captures/audit-probe.mjs` and `audit-followup.mjs`: reproduction helpers. They use throwaway browser contexts, only write ignored evidence, and close their browser/server.

Tooling: default Windows shell startup was already known to fail with a sandbox helper error. Purpose-specific escalated exec commands succeeded. The agent-browser skill was read; its executable was not available, so the installed repository Playwright harness was used. One observation run reused the capture harness server, which exited before the final desktop MATCH navigation. The resulting `ERR_CONNECTION_REFUSED` was a harness lifecycle error, not an app defect. The separate follow-up owned its server and successfully repeated both settled MATCH sizes and production practice.

## Results

- Static: encoding, CSS consumers, element IDs, test selectors, vacuous assertions, precache inventory, ports, host paths and certification coverage passed. `check:stage` failed on the cache fingerprint and three manifest digests (F1).
- Full unit run: **278 passed / 279 total**, one fixture failure (F2); no skipped/cancelled tests. Runtime duration approximately 229 seconds.
- Targeted browser run: **14/14 passed**, no retries. Coverage includes MATCH portal/answer/pause, profile isolation, canonical LearningCore profile evidence, parent exit/expiry gate, corrupt/legacy recovery, denied localStorage reads, persistent-storage API behavior, first-run play, durable-save warning, local fonts/CSP, and PWA/offline reload. The matching subset did not exercise every test file listed in the command.
- Fresh parent flows: PIN setup, progress, profiles, recovery, account/sync, exit and return-to-parent gate worked at both inspected sizes. No page errors and no document horizontal overflow were recorded for those routes. These were navigation checks, not destructive-action or live-cloud exercises.
- Visually: WebGL home and battle have a coherent layout on desktop and mobile. The mobile battle fits its answer controls and health display in the inspected viewport. DOM battle is playable with a large board and direction controls. DOM home and MATCH portrait need the changes below.
- No UI-match score is assigned: the rubric also requires 1024×682 composition evidence, which this timebox did not capture. Do not convert these observations into a percentage.

## Confirmed findings and build steps

### F1 — P1: current package metadata does not describe current runtime

**Location:** `service-worker.js:1`, package manifest, current modified runtime files.

**Trigger / observed:** `npm run check:static` reaches `check:stage`, which reports a CACHE mismatch and digest mismatches for `app.js`, `brainbite-core.mjs`, and `service-worker.js`. At audit start expected fingerprint was `brainbite-v2.0-shell-runtime-7c7c3ec27c0f7dde4fbcb2e62027462b23aa10759fd03b379c24627a340fcd18`; the file contained `...c05689d1ed207d76c2c0abec487524840f34bee84654bff742dccea68ff75de9`.

**Expected / impact:** staged release must exactly describe the runtime and force updated clients to fetch changed assets. This is a release blocker, not evidence that the source dev server cannot run.

**Implementation:** coordinator updates the cache using the final calculated fingerprint and regenerates `npm run package:manifest` only after all runtime workers finish. Do not reuse the audit fingerprint after further edits.

**Acceptance:** `npm run check:static` fully passes; staged runtime and manifest agree; offline checks rerun against final runtime.

### F2 — P1 gate failure: extracted storage test omitted its new helper dependency

**Location:** `tests/storage-copies.test.mjs:193`, fixture at approximately line 207.

**Trigger / observed:** full unit run fails `total validation failure quarantines every raw generation before blank rotation` with `ReferenceError: readLocalStorage is not defined`. The test constructs a function from extracted `preserveUnreadableStoreCopies`; the working-tree implementation now calls `readLocalStorage`.

**Expected / impact:** this regression fixture must exercise the actual function with its actual read helper, rather than fail before its assertions. Browser storage-denial cases passed, so this is not a confirmed runtime boot failure.

**Implementation / current disposition:** the coordinator repaired the fixture during audit by adding the actual `appFunctionSource('readLocalStorage')` to the extraction environment, and reported **18/18 focused storage tests passed**. That result belongs to the coordinator; the audit's original full-run result remains 278/279.

**Acceptance:** full unit suite passes after integration, and quarantine-before-blank assertions remain active.

### F3 — P2: home gives contradictory XP and unsupported goal-reward promises

**Location:** `app.js` `profileLevel()` / `profileXp()` around 1882–1888; `nextRewardState()` around 1903–1907; home text around 2472–2475; `complete()` around 2883.

**Trigger / observed:** zero-score WebGL home shows `0 / 300 XP` while the next-reward card says `Gain 500 more XP` and explains this is for reaching the next level. Source uses 300 for actual level calculation and 500 for that card. The same home promises `Reward: 125 Star` for five missions; its renderer multiplies remaining missions by 25, while canonical mission completion grants three stars once per mission. The alleged goal reward shrinks as progress increases and no corresponding goal-award path was identified.

**Expected / impact:** child-facing reward expectations must agree with actual progression. These contradictions weaken the reward loop even when saving and scoring work.

**Implementation:** derive next-level text/bar from the existing canonical XP state; remove or replace the unsupported star promise with factual mission progress. Do not add a new currency mechanic just to justify a label.

**Acceptance:** at scores 0, 299, 300, 499 and 600, level, XP bar and next-level amount agree; completing a mission gives only canonical earned rewards; no arbitrary goal bonus is promised. Capture before/after home.

**Evidence:** `home-webgl-1280.png`, source trace above.

### F4 — P2 visual usability: DOM mobile home buries its primary action

**Location:** `styles.css` home shell/rail rules around 291–328, 502–515 and subsequent `.home-target` overrides; WebGL-only compact rules around 1795 and 2143; `index.html` home hierarchy.

**Trigger / observed:** 390×844 DOM home displays a large brand header, five-item dock, profile panel, two stacked currency panels, utility controls and welcome card before the main Play tile. In the named-profile capture the Play tile starts near y=750 and continues below the first viewport. Fresh first-run adds its name form. WebGL home uses much more compact profile/currency/menu treatment.

**Expected / impact:** the fallback chosen for constrained devices should provide an immediately discoverable primary action and legible onboarding. This is confirmed crowding, not horizontal overflow or a claim that the button cannot be scrolled to.

**Implementation:** compact DOM mobile header and account summary, place currencies side by side, reduce duplicate chrome on home, and keep Play visible with useful context. Retain accessible labels, readable text and adequately sized touch targets. Avoid hiding parent access or first-run name entry to gain space.

**Acceptance:** fresh and named profiles at 390×844 (plus 320px regression) show a discoverable primary play action; one tap starts a real mission; no clipping/overlap; keyboard and enlarged-text access remain usable. Verify desktop DOM and WebGL are preserved.

**Evidence:** `home-dom-390.png`, `audit-2026-10-02/dom-first-run-390.png`, comparison `home-webgl-390.png`.

### F5 — P1 within MATCH mode: portrait cropping hides essential controls

**Location:** `presentation/match-plates.mjs` `layoutHotspots()` around 61–75; `styles.css:764` onward (MATCH overflow and full-viewport presentation); presentation adapter mode selection.

**Trigger / observed:** open `?presentation=match` at 390×844, wait for loaded image and two further seconds. Cover scaling uses `Math.max(cw/nw,ch/nh)`, cropping both edges of the wide reference plate. Observed primary Play rectangle x=-406.9..-115.5; Parents starts x=733.6. In battle first answer x=-210.5..-33.1; Exit starts x=727.2. Body overflow is hidden, so these essential controls are unreachable by ordinary portrait touch. One partially visible portal can still launch the demo, leaving no visible exit. Desktop controls fit much better.

**Expected / impact:** every necessary answer and exit must remain touch-accessible. This is a functional responsive defect in the explicitly selected/stored MATCH mode, not the default WebGL path.

**Implementation:** least invasive immediate correction is DOM fallback on narrow portrait through the adapter/capability layer, including resize/rotation handling and proper disposal. Preserve saved presentation preference, active profile and current mission. A fully redesigned responsive plate would be larger work. Merely changing cover to contain can make controls too small, so it is not a sufficient acceptance criterion.

**Acceptance:** 390×844 and 320px initial loads and desktop-to-portrait resize provide usable Home/Parents/play and all battle answers/exit, without mission loss or duplicate render loops. Existing desktop MATCH tests continue to pass. Assert rectangles/interactability, not only DOM visibility.

**Evidence:** settled MATCH screenshots and numeric `followup-observations.json`.

### F6 — P2: production Practice Lab mislabels pending content as rejected/quarantined

**Location:** `app.js:2962` buildPractice handler, especially generated branch near 2982–2983; subject choices in `index.html:173`.

**Trigger / observed:** `/?presentation=dom&release=1` → Practice Lab → Reading (default grade 3) → Build Practice. The app confirms production mode but offers a normal build form and returns `This practice item did not pass content review and was quarantined.` The shipped manifest has pending generated content and zero reviewer rejections. Gate refusal is correct; the user-facing diagnosis is not.

**Expected / impact:** a child should see an accurate pending/unavailable explanation with an available next action, instead of technical quarantine language or an implied failed educator judgment.

**Implementation:** distinguish pending availability from invalid/rejected content; explain before or at submission and point to available reviewed mission practice. Keep the actual gate fail-closed. Preserve true invalid-content telemetry/quarantine semantics; do not approve content or expose internal-review bypasses.

**Acceptance:** release-mode Reading/Spelling/Vocabulary/Grammar and homework combinations with pending content show truthful availability text and no playable unapproved challenge. Reviewed Math/Words/Spanish practice remains usable; real invalid/rejected payloads remain blocked.

**Evidence:** `production-reading-practice-390.png`, `followup-observations.json`.

## Confirmed but separate follow-up work

These are not required to close the bounded implementation scopes above; report them explicitly if left open.

- **MATCH plate honesty (P2):** the settled desktop screenshot still displays embedded `Alex`, `Level 12`, `3,450`, `100 / 100`, `Phase 3 of 6`, and an already-earned-looking `Great job! +25` on a fresh practice run. Home also shows energy/friends/leaderboard art. These are pixels in the reference JPEG, not truthful fresh-profile state. A translucent live prompt does not mask the original question. The UI rubric explicitly rejects copying unsupported concept numbers. Mask/replace baked UI with state-backed overlays or limit this reference/demo mode outside the shipping chooser. Full-screen image editing/redesign is a separate scope; do not pretend the current desktop snapshot is live fidelity.
- **Concurrent currency merge (P1 data semantics, source-confirmed):** `mergeProfiles()` still max-merges score/stars/spark even though completion IDs and mission ratings are unioned. Independent offline completion on two replicas can retain both completed missions without both rewards. The current missionStars repair does not solve currency. Existing test intentionally names max merging. A correct solution needs an idempotent earned/spent ledger, legacy baseline migration, replay/deletion/import rules and multi-replica tests; do not replace max with addition, which duplicates shared history. This was already documented as deferred; no independent live cloud reproduction was attempted here.
- Parent mobile nav is horizontally scrollable and its later destinations/return control are offscreen initially. It operated in automation, and no page overflow occurred; a persistent visible back-to-child control would improve discoverability. This is enhancement work, not a newly proven authorization defect.
- The art remains visibly low-poly compared with painted targets, but it is coherent and usable. Further foliage/material/lighting work is optional and should respect payload and device budgets. No fabricated UI-fidelity percentage is appropriate.

## Separate Sol scopes and dependency order

| Worker | Exclusive ownership | Scope | Dependency / acceptance |
|---|---|---|---|
| Functional UX | `app.js`, `tests/release.spec.js` | F3; F6 if accepted | Preserve all existing user changes, core contracts and gates. App file has one owner because its handlers are tightly coupled. |
| Mobile layout | `styles.css`, dedicated mobile visual/layout spec | F4 | Avoid changing MATCH shared CSS while another worker runs. Coordinator adds new spec to Playwright/certification inventories if needed. |
| MATCH fallback | `presentation/presentation-adapter.mjs`, `presentation/capability.mjs`, `tests/match.spec.js` and capability test if needed | F5 | Prefer no shared stylesheet edit. Test initial portrait and runtime resize without resetting game/profile. |
| Coordinator/integration | `tests/storage-copies.test.mjs`, final `service-worker.js`, package manifest, harness registration and final docs | F1/F2 and final gates | Repair fixture; integrate runtime changes first; compute final cache fingerprint/manifest last. |

Do not ask workers to rewrite shared app.js or styles.css in parallel. Add any runtime asset to precache and staging allowlist and regenerate metadata. Do not turn a visual change into LearningCore/save/sync refactoring.

## Changes made by audit

Only this new report plus git-ignored capture scripts, logs and screenshots. No runtime, existing document, review data or test source was changed by the audit lane. Coordinator and Sol changes are tracked separately.

## Unverified

Full browser suite and smoke inventory were not rerun by this lane. Current 14-case subset is not a replacement for final required gates. Cold offline world art was added in the starting diff and static precache inspection passed, but this audit's test grep did not run every added webgl-assets regression. No real GPU/phone/tablet, touch hardware, native shell, screen reader, Spanish fluency, educator review, production Firebase session, cloud deletion, store signature, legal review, remote CI, publishing or site availability certification is claimed. Browser screenshots use local Chromium/software WebGL. Keyboard/zoom coverage beyond the targeted existing cases remains an integration verification task. App behavior after total browser origin eviction cannot be fully solved by requesting persistent storage; no survival claim is made.

## Next step and push state

Finish selected Sol changes, review their diffs against these acceptance checks, then run repository-required static, unit, full e2e and smoke gates on the final integrated tree. Capture changed mobile and MATCH views again. Record final pass/fail results separately from the audit baseline, and disclose remaining MATCH-honesty/currency-ledger work. Package only after runtime settles. The audit itself made no commit, push, PR update, merge or external publication.

## Visual upgrade implementation and final director review — 2026-10-04

**Disposition: the requested substantial visual upgrade is accepted for the reviewed desktop and phone views.** This section records the later implementation and does not replace the original audit baseline above. The source is now ready for the coordinator's final native build and integrated release checks. It is a visible redesign of the running DOM/WebGL interface and scene, not a claim of one-to-one painted-reference fidelity.

### Implemented presentation

- Home now uses a compact live profile/currency/utility bar, a dominant adventure hero, the single existing Continue/Play control, five secondary activity tiles, three illustrated world destinations, and live goal/level/streak cards. Warm parchment panels, gold edges, readable dark text and a green primary Play button replace the earlier large dark panel stack.
- Gameplay shares that visual language: a compact profile and combo strip, prominent prompt/read-aloud controls, clear answer surfaces, matching minimap and reward cards, and a visible health bar. Existing gameplay/learning/security selectors and handlers remain the functional contract.
- The public WebGL scenes gained warmer lighting, stronger portal color, stone/plaza/wood material detail, visible water/waterfall treatment and layered vegetation. Home camera framing was corrected after review: Bite is approximately 245 pixels tall in the reviewed desktop hero, with the house and portal still legible. Natural far-rock treatment was restored after an intermediate masonry treatment looked like oversized brick domes.
- The DOM fallback received the same interface redesign. It is not left with the earlier 438-pixel desktop chrome stack before the main scene.
- The first-run WebGL canvas interception was repaired: the functional worker exercised ordinary pointer confirmation after canvas mount, followed by Play, a real answer, Exit and Parents. The director reviewed the resulting captures; no force-click workaround is being accepted as a fix.

### Visual defects found during implementation and resolved

1. The first new wide hero shrank Bite to roughly 120 pixels. Final scene framing restores a large center-right character and readable portal/house.
2. An intermediate phone DOM board clipped its fourth and fifth columns despite no document overflow. The final 390-pixel screenshot displays all 25 cells. The layout worker also checked each cell rectangle at 390 and 375 pixels; at 390, the first cell spans x=44..98.797 and the last x=291.188..345.984, inside the visible frame.
3. A leftover navy minimap wrapper and dark reward toast conflicted with the new cream panels. Final screenshots show the corrected shared treatment.
4. The phone WebGL combo label, value and stars overlapped. The final battle screenshot has distinct readable rows, with all four answer buttons, Exit and health visible.
5. Enlarged home text caused utility labels to overlap and destination words to break awkwardly. The final 200% home layout has wider utility controls, fewer destination columns and progress cards below the main content.

### Evidence reviewed directly

All files below are git-ignored local evidence, not a promoted release certification:

| Evidence | What the director verified |
|---|---|
| `.ui-captures/visual-now/before/home-webgl-1280.png`, `battle-webgl-1280.png` | Preserved pre-redesign public WebGL baseline |
| `.ui-captures/visual-now/home-dom-1280.png` | Original oversized desktop DOM chrome and small scene |
| `.ui-captures/adventure-flow-2026-10-03/dom-home.png`, `dom-battle.png`, `webgl-home.png`, `webgl-battle.png` | Substantial shared interface composition and live functional flow captures |
| `.ui-captures/audit-2026-10-03/public-home-after-1280.png`, `public-battle-after-1280.png` | Final home hero framing, scene material/lighting changes, natural far rocks, continuous water and readable live desktop HUD |
| `.ui-captures/audit-2026-10-03/public-home-after-390.png`, `public-battle-after-390.png` | Final phone home at its initial scroll position; readable combo; four answer controls, Exit and health in battle |
| `.ui-captures/adventure-layout-verify-2026-10-03/dom-battle-390-text1.png` | Repaired five-column, 25-cell phone board |
| `.ui-captures/adventure-layout-verify-2026-10-03/dom-home-1280-text2.png` and `report.json` | Enlarged home text and reflow; recorded computed root font 32px, no page overflow, ordinary first-run/Profile/Parents/Play/Exit checks and no page errors |
| `.ui-captures/audit-2026-10-03/public-visual-after-observations.json` | Current scene probe record; software-rendered local evidence, not a physical-device performance certification |

The functional worker reported both ordinary DOM and WebGL flows passed, with fresh name confirmation, six activity controls/three worlds, real gameplay input, Exit and parent PIN flow; its capture/result files are under `.ui-captures/adventure-flow-2026-10-03/`. The scene worker reported four final capture cases without page errors and geometry/draw counts of 169 calls / 58,134 triangles for home and 127 calls / 52,906 triangles for battle. These counts are bounded scene measurements, not device frame-rate claims.

**Enlarged-text limit:** the final home is verified at a computed 32px root font. The file named `dom-battle-1280-text2.png` appears to have normal-size text after entering gameplay; applying profile settings may reset the probe's manual root override. It therefore does **not** establish a 200% gameplay pass. No such claim is made, and no additional runtime change was required for this bounded visual acceptance. Native WebView rendering and final packaging are still coordinator verification at this checkpoint.

### Integrated verification checkpoint supplied by the coordinator

At source freeze the coordinator reported:

- Unit suite: **291/291 passed**.
- Mobile layout suite: **7/7 passed**, 9.4 seconds.
- Windows Chrome/Edge check: **passed**.
- Actual Firestore emulator security suite: **30/30 passed**, zero failed or skipped.

The director independently read `.tmp-currency-security-final.log` and confirmed the emulator's 30-pass/0-fail/0-skip verdict and successful exit. The checked `firebase/firestore.rules` SHA-256 is `f1e7100fc1447090773fef624ce0f3b05b682fc425b544c83a447cb17d3ab075`. This is local emulator evidence, including currency/ownership/schema/tombstone enforcement, not a production rules deployment or live cloud certification. The coordinator's unit/mobile/browser counts are recorded as its checkpoint; this director did not rerun those suites.

**Still pending at this append:** the final full browser run, full smoke run, refreshed package/cache/native build, and launch of the exact rebuilt executable. These must be reported by the coordinator before delivery. The older installed executable cannot demonstrate new source until rebuilt/replaced. No clean full-E2E, final native-binary, publication, merge, educator approval or production-cloud result is implied by the visual acceptance.

### Ownership and freeze

GPT-6.1 Sol implementation ownership stayed separated: presentation markup in `index.html` / the presentation parts of `app.js`; shared interface styling in `styles.css`; public WebGL scene and shared environment/material modules in the scene lane. The coordinator owns final packaging and release verification. Astra performed read-only runtime/source review, reviewed screenshots, requested bounded corrections, and appended this verified record. No UI-match percentage is assigned, and the original audit's broader unverified external gates remain open.

## Coordinator delivery verification — 2026-10-04

The final Windows build contains the accepted public DOM/WebGL visual upgrade. A final browser check exposed hidden policy links on the redesigned home; the coordinator restored the visible footer, verified ordinary web navigation and native PIN gating, regenerated the runtime cache/manifest, and rebuilt both binaries. This is a stylized real-time scene upgrade, not a claim of one-to-one painted reference fidelity.

- `npm run check:static`: PASS. Final cache `brainbite-v2.0-shell-runtime-b842bab31ff121fc3ba46981368dfbd2b8c57ff6b38bfbbc3efeafc5c2068be5`; 100 staged files, 5,813,394 bytes, 97 precached URLs.
- `npm run test:unit`: 291/291 PASS, zero failures/skips.
- Full visual browser run: 245/251 PASS initially. Three failures exposed the hidden footer; the other three were obsolete menu/1024 HUD fixture placement and a hardcoded production-test port. All six were corrected and then passed with zero retries: five focused cases in 38.9s plus the remaining icon case in 7.4s. This is complete case coverage with focused reruns, not one clean 251-case invocation. Logs: `.tmp-visual-final-e2e.log`, `.tmp-visual-final-focused.log`.
- `npm run smoke`: 11/11 PASS after adapting checks to the real desktop home controls. Chrome and Edge both ran; offline runtime and persistence checks remained mandatory. Log: `.tmp-visual-final-smoke.log`.
- Actual Firestore emulator: 30/30 PASS, zero failures/skips. No production rules deployment occurred.
- `npm run native:verify`: PASS. `npm run native:build`: PASS, rebuilt after footer restoration. `native:verify:runtime` checks the exact final executable's window and process tree for zero TCP listeners.

Delivery files are under `C:/Users/djste/Documents/Codex/2026-08-24/files-pasted-by-the-user-you/outputs/BrainBite-Visual-Upgrade-2026-10-04/`: `BrainBite-Visual-Upgrade.exe`, `BrainBite-Visual-Upgrade-Setup.exe`, previews and `SHA256.json`. The native shell bundles its assets and skips service-worker caching; the rebuilt executable must be launched to see this update.

The receipt ledger preserves independent device earnings and idempotent mission/purchase credits; modern ledger saves reject ambiguous old-client cloud progress rather than partially applying it. Deploy the reviewed Firestore rules together with updated cloud clients before treating production sync as verified. Existing optional cloud sync, educator/content approval, physical-device FPS/accessibility and legal certification remain external gates. The installer is unsigned. Steve owns PR merge and production rollout.
