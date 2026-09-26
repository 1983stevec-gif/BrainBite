# Phase 3 — Child/Parent Architecture, Battle Composition, And Accessibility

Date: 2026-09-20
Branch: `batch-9-webgl-spike`
Repository: `D:\Codex\Brainbite`
Authority: implements Batches 3.1–3.3 of `docs/BRAINBITE_PRODUCTION_GOAL.md`

This report records what was implemented, what was verified, and what remains open.
It is an implementation record, not a certification. Physical-device, educator,
legal, cloud, and store gates remain external and are not claimed here.

## 1. Starting reality

The repository was red before this work. The 2026-09-20 home-markup revision
(six hub tiles plus three utility controls, a five-target child dock, and a separate
parent shell) had landed without updating the tests that still targeted the superseded
single-nav layout, and two startup errors were live.

Measured before the fix:

- `npm run test:unit` → `182/183` with `tests/accessibility-contract.test.mjs` timing
  out on `nav button[data-screen="settings"]`.
- `npx playwright test release.spec.js` → `beforeEach` timed out on
  `getByRole('button', { name: 'Parent', exact: true })`.
- Two startup page errors: `Cannot set properties of null (setting 'onclick')` from the
  missing `#installBtn`, and `Cannot set properties of null (setting 'textContent')`
  from the missing `#updateStatus`.
- `tests/webgl.spec.js` dock assertions passed vacuously: `Math.min(...[])` is
  `Infinity` and `[].every(...)` is `true`, so `#home .home-dock` and
  `#game .battle-dock` (which exist nowhere in the app) asserted nothing.

## 2. Batch 3.1 — Child/parent information architecture

### Defect fixed: the parent shell leaked onto the child hub

`syncNavigationState()` set `#parentShellNav.hidden`, but `styles.css` declared
`nav{display:flex}`, and an author `display` beats the user-agent `[hidden]` rule.
The result was that Progress, Limits, Profiles, Account & Sync, Recovery, and Advanced
were permanently visible to a child on the home screen. `[hidden]{display:none!important}`
now makes the attribute authoritative, and the MATCH passthrough rule was narrowed to
`nav:not([hidden])` so it cannot resurrect a hidden navigation.

### Implemented

| Change | File |
|---|---|
| `[hidden]` made authoritative | `styles.css` |
| Single styled child dock (five targets, no wrap, large-text safe) | `styles.css` |
| Child hub tiles carry stable accessible names; decorative glyphs `aria-hidden` | `index.html` |
| Scene selector moved out of the child view into parent-only Advanced | `index.html`, `presentation/boot.mjs`, `app.js` |
| Placeholder cards removed (news, promo, carousel dots, reward hat) | `index.html` |
| Fake energy counter (`homeEnergy`, hardcoded `5`) removed | `index.html`, `app.js` |
| `#webglBadge` debug badge removed | `index.html` |
| Battle minimap bound to real world/mission data | `index.html`, `app.js`, `styles.css` |
| `Back to kid hub` control added so the parent shell has a real exit | `index.html`, `app.js`, `styles.css` |
| Real PWA install control added (`#installBtn`) | `index.html`, `app.js` |
| Real service-worker update notice added (`#updateStatus`, `#applyUpdate`) | `index.html`, `app.js` |
| Parent shell nav narrowed to its six destinations | `index.html` |

`renderMinimap()` now derives the title from `worldMeta(mission.world)` and one node per
mission in that world from `REGISTRY.getWorld(world).missionIds`, marking completed and
current nodes and publishing a descriptive `aria-label`. The static decorative gradient
spots that implied a fixed fake layout were removed.

### Exit evidence

- Child hub: six primary tiles, three utility controls, one five-target dock.
- `#parentShellNav` is hidden on the child hub and visible only in an unlocked parent
  context; parent destinations do not exist anywhere on the child hub.
- Zero startup page errors on the happy path (`pageerror` collected by
  `release.spec.js` is asserted `toEqual([])`).

## 3. Batch 3.2 — Battle composition

### One answer surface

`draw()` now marks the battle shell `data-answer-surface="dom"` when an
activity/typing challenge renders into `#board`, and `"three-d"` otherwise. In that DOM
case the 3D answer controls are cleared and hidden; otherwise the DOM board is hidden.
The two surfaces can no longer be visible at once, which also fixes a correctness bug
where 3D pillars were being filled from mission data during an activity-family
challenge.

### 3D pillar taps are live

`.webgl-canvas` had `pointer-events:none`, so the battle raycaster in
`presentation/webgl-battle.mjs` could never receive a pointer event. The canvas now
accepts pointer input while the DOM answer controls keep their higher stacking
(`z-index:5`), so both a pillar tap and a control tap resolve through the same
`onSelect` path.

### One-screen battle

The battle shell is now bounded by `100dvh`, the page footer is hidden during play, the
arena owns the leftover height, and the board is sized by height (square) instead of
width. On phones the D-pad and live info move beside the arena and the redundant battle
toast is dropped because the prompt card already reports correct/incorrect.

Measured `document.documentElement.scrollHeight` against the viewport, all six
combinations fit exactly:

| Viewport | DOM | Live 3D |
|---|---|---|
| 390x844 | 844 | 844 |
| 768x1024 | 1024 | 1024 |
| 1280x800 | 800 | 800 |

Board geometry is square at every size (302x302 phone, 325x325 tablet, 316x316
desktop), and DOM mode reports `boardCells=25` while live 3D reports
`webglAnswers=4` with `boardVisible=false`.

## 4. Batch 3.3 — Accessibility (partial)

- The three unlabeled form controls now have labels: `#newProfile`, `#importFile`,
  `#codeLabImportFile`.
- `#prompt` sets `lang="es"` for Spanish missions so assistive technology switches
  language.
- Focus visibility was already global (`button:focus-visible,input:focus-visible,
  select:focus-visible,textarea:focus-visible,a:focus-visible`), so audit item 15 needed
  no change.
- Every `<img>` in `index.html` already carries `alt`.

Still open: first-run choreography (name to world to guided mission with disappearing
prompts), self-hosted fonts, and a restrictive content security policy.

## 5. Related correctness fixes

- `SCHEMA_VERSION = 9` replaces three magic numbers; `mergeStores()` previously wrote
  `schemaVersion: 8` before `migrateStore()` corrected it to 9, which read as a downgrade.
- A missing `#updateStatus` reference is now a real update affordance rather than an
  uncaught error.
- In MATCH mode, the plate layer covered every non-hub screen (`position:fixed;inset:0;
  z-index:5`), so Settings and the parent screens were unusable behind an opaque
  overlay. `presentation-match-passthrough` now hides the plate layer.
- Service-worker cache version bumped to `brainbite-v2.0-shell-v36-ia-cleanup` so
  returning installs receive the changed shell assets.

## 6. Verification

| Command | Result |
|---|---|
| `npm run test:unit` | `183/183` pass, `0` fail |
| `node --test tests/accessibility-contract.test.mjs` | `6/6` pass |
| `npx playwright test` (full browser suite) | **`150/150` pass**, `6.5m`, exit 0 |
| Persistence and cross-tab family | `12/12` pass |
| `npx playwright test webgl.spec.js webgl-accessibility.spec.js` | `23/23` pass |
| `npx playwright test webgl-assets.spec.js` | `7/7` pass |
| `npm run check:content` | PASS — registry plus 29 packs, 70 question sets |
| `npm run check:content-review` | PASS — 105 records, 17 non-production, 23 quarantined |
| `npm run check:runtime` | PASS |
| `npm run check:release` | PASS |
| `npm run check:firebase` | PASS |
| `npm run check:launch` | PASS |
| `npm run check:final` | PASS |
| `npm run check:firebase:security` | PASS |

For comparison, the same browser suite could not run at all before this work: its
`beforeEach` gate timed out, so every release test failed.

### Measurement note

The browser suites in this environment are sensitive to machine load. Earlier full-suite
runs in the same session alternated between `149/150`, `147/150`, and one run that was
truncated at `137/150`. Every non-deterministic failure was a WebGL mount timeout
(`#home canvas.webgl-canvas` count 0 within 5 s) or a `page.reload` timeout, and each of
them passed when re-run in isolation. The final run recorded above is a complete
`150/150` with exit code 0.

`npm run check:evidence` remains blocked by the dirty working tree, which is the
outstanding Phase 0 blocker.

## 7. Cross-tab evidence reconciliation (fixed)

**Symptom.** Two tabs that each recorded one attempt for the same skill kept both
attempt records after a simultaneous reload, but the evidence total stayed at one
attempt and only one writer's provenance source survived. `tests/release.spec.js`
"concurrent tabs reconcile distinct attempts into memory and every recovery copy"
failed in all three lock modes, and "localStorage fallback keeps tombstones and queue
IDs while defeating a stale tab" failed intermittently.

**Root cause.** `app.js` is a classic script, so it runs before `brainbite-core.mjs`
(a deferred module). The initial canonical load therefore merged the stored generations
with the degraded fallback in `mergeLearningCore`, which unions `recentPerformance` and
`reviewHistory` but keeps `evidence` and `evidenceProvenance` from one side only. The
attempt record from the other tab survived while its per-writer evidence source was
dropped, so `evidence.attempts` under-counted the real history. A probe confirmed the
merge itself (`BrainBiteCore.mergeSkillStates`) is correct and idempotent when
LearningCore is present, which isolated the fault to load ordering.

**Fix.**

- `reconcileCanonicalStateWithCore()` runs once, on the first `render()` after
  LearningCore is available. It unions every readable generation
  (`readEveryStoredCopy()`), so per-writer provenance is merged with the real
  implementation instead of the fallback.
- The reconciled result is constrained to the profiles the installation still has, in
  the existing order, so a stale generation can never resurrect a profile or move the
  active index.
- All three slots are converged to the reconciled state
  (`convergeStoreCopiesUnlocked`), and other tabs are notified.
- Ordinary autosaves still rotate distinct generations through
  `writeStoreCopiesUnlocked()`, so Batch 1.3's distinct known-good snapshots are
  preserved. `readAllStoredStores()` and the initial load path keep their original
  first-valid semantics.

Verified: the two-tab probe now reports `attempts: 2` with both writer sources in all
three copies after a simultaneous reload, and the three lock-mode variants plus the
stale-tab test pass.

## 8. Open work

1. Phase 3.3 first-run choreography, self-hosted fonts, and CSP.
2. Phase 3.4 parsed-glTF caching behind an explicit clone/dispose ownership model, and
   WebGL context restore rather than fallback-only.
3. Phase 3.2 landscape prompt for phones that cannot support battle safely.
4. Phase 4.1–4.3 closed-beta instrumentation, budgets, and package evidence.
5. Phase 0 clean-checkout reproducibility and remote workflow proof.

### Also fixed while verifying

`tests/webgl-accessibility.spec.js` defaulted its app origin to port `4317` while the
Playwright global setup serves on `4318`, so all four of its tests failed with
`ERR_CONNECTION_REFUSED` regardless of application behaviour. The origin now derives
from `BRAINBITE_TEST_PORT`/`PLAYWRIGHT_BASE_URL`, matching the config.

### Writer identity check

`pageWriterId()` stores the per-tab writer id in `sessionStorage`, and
`originId` is `${installationId}:${writerId}`. A direct probe with two tabs in one
browser context confirmed independent `sessionStorage`, distinct writer ids, and
distinct `originId`s, so the app-level contract holds in this environment. The
same-installation writer test now clears `sessionStorage` in the second tab before its
first load so a browser that clones tab storage cannot create a false failure.

## 8. Non-claims

- No physical device, educator, legal, screen-reader, cloud, or store certification was
  performed or is implied.
- The performance probe remains diagnostic; headless frame/long-task violations are not
  device evidence.
- Production content remains fail-closed pending formal educator approval.
