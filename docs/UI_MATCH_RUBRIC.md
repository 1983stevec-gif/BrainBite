# UI match rubric

This is the **only** UI-match figure anyone should report. It compares live captures with the
approved art-direction targets:

- Home: `docs/references/home-dashboard-target.jpg`
- Battle: `docs/references/battle-hud-target.jpg`

Both targets are painted concept art. Real-time 3D in this payload and CSP budget will not
match them 1:1; the realistic ceiling without commissioned art is about 17/20 per screen.

## How to score

1. `npm run capture:ui` (or `-- --size 1280x800 --mode webgl`). Captures and side-by-side
   images go to the git-ignored `.ui-captures/`.
2. Score each item **0** (absent or wrong), **1** (partial), **2** (matches the intent of the
   target) at **1280x800**, and check **1024x682** for item 10 on each screen.
3. Record the scores below with the date, the commit, and who scored. Score = points / 20.

Honesty overrides the target: the target shows "Phase 3 of 6", "100 / 100" health and a
"Great job! +25" toast before an answer. BrainBite deliberately shows only what the game
state backs (3 boss phases, hearts out of 3, a toast after an earned answer). Those items are
scored on layout and styling, not on copying the numbers. The target's energy tile, friends,
leaderboards and promo offers were removed on purpose (no energy mechanic; child privacy;
no fake offers) and are not scored.

### Home (max 20)

| # | Item | What "2" looks like |
|---|---|---|
| H1 | Top bar | Avatar ring, name, level, XP bar, currency tiles with icons |
| H2 | Main menu | Six glossy colour tiles with large illustrated icons; PLAY shows a world thumbnail |
| H3 | Right rail | Goal / reward / streak cards with icons and progress |
| H4 | Utility orbs | Profile / Settings / Parents orbs top right, illustrated |
| H5 | Bite | Appealing pose and expression, scale and centring as target |
| H6 | Set dressing | Bite House, Play Portal, signboards, stone platform |
| H7 | Environment | Dense foliage, ruins, water or waterfall, flowers, depth |
| H8 | Lighting and colour | Warm key, rim light, fog, saturation |
| H9 | Typography and panels | Display font, gold/green labels, rounded glassy panels |
| H10 | Composition at 1024x682 | Landscape layout, scene visible, nothing overlapping |

### Battle (max 20)

| # | Item | What "2" looks like |
|---|---|---|
| B1 | Prompt card | One line, centred, speaker icon, at most 90 px tall |
| B2 | Answer discs | Wooden medallions on the pillars, stacked fractions |
| B3 | Answer feedback | Green glow and sparkles on correct; toast only after an answer |
| B4 | Profile and goal card | Avatar, name, level, goal with progress |
| B5 | Combo, stars, pause | Combo counter, honest stars, round pause button |
| B6 | Boss panel | Portrait, HP bar, phase (boss missions) |
| B7 | Minimap | Illustrated route with path, nodes, boss and chest |
| B8 | Bottom dock and health | Dock tiles bottom left, hearts bar |
| B9 | Environment and lighting | Jungle ruins, waterfalls, water, warm light |
| B10 | Bite and camera | Bite from behind on the dock, pillars framed |

## Scores

### 2026-09-25 — baseline (Phase 0), commit `488551d` (after M1 mobile blockers and G3), scored by Claude

Captures: `home-webgl-1280.png`, `battle-webgl-1280.png`, `home-webgl-1024.png`,
`battle-webgl-1024.png`, `boss-webgl-1280.png`.

| Home | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Score | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 0 | **8/20** |

Home notes: layout skeleton matches; icons are small glyphs; right rail is text only;
environment is sparse low-poly with no ruins, waterfall or flowers; at 1024x682 the page
stacks vertically and the scene starts below the fold.

| Battle | B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Score | 2 | 0 | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 1 | **10/20** |

Battle notes: the prompt card, honest HUD and earned toast were fixed in M1 (the 2026-09-24
estimate before M1 was about 5–7/20). Answers are flat cream labels, not discs; no glow or
sparkles; minimap is abstract dots; no dock; flat sky and no shadows; at 1024x682 the HUD
stacks above a letterboxed scene.

### 2026-09-25 — after UI Phases 1–3 (branch `ui/match-targets`), scored by Claude

Captures: `home-webgl-1280.png`, `home-webgl-1024.png`, `battle-webgl-1280.png`,
`battle-webgl-1024.png`, `battle-correct-webgl-1280.png`, `boss-webgl-1280.png`.

| Home | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Score | 1 | 1 | 1 | 2 | 1 | 1 | 0 | 1 | 1 | 2 | **11/20** |

Home notes: 1024x682 now gets the floating landscape HUD (H10 0→2); menu and orbs use the
illustrated icon sprite (H4 1→2; H2 stays 1 because PLAY has no world thumbnail); copy no
longer uses system language. Environment and lighting (H7, H8) wait for the art pass.

| Battle | B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Score | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 0 | 1 | **16/20** |

Battle notes: wooden answer discs with stacked fractions (B2 0→2); glow, sparkles, hop and
chomp, toast only after an earned answer (B3 1→2); illustrated boss portraits (B6 1→2);
illustrated route map with path, pin, checks, boss badge and chest (B7 0→2). B8 stays 1 on
purpose: the child dock is not shown over the battle (it duplicates the exit and would pull
a child out mid-question) nor over home (it duplicates the main menu). B9 waits for the art
pass (ruins, waterfalls, painted backdrop).
