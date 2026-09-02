# BrainBite Batch 9 — 3D Presentation Layer

Date: 2026-09-02  
Status: Planned (not started)  
Depends on: Batch 8 launch path can continue in parallel on the current 2D PWA shell

## Purpose

Match the approved home-dashboard and battle-HUD visual targets (high-fidelity jungle hub + Kraken pillar arena) without replacing BrainBite’s learning, save, sync, or accessibility architecture.

Approved references:

- `docs/references/home-dashboard-target.jpg`
- `docs/references/battle-hud-target.jpg`

## Decision: WebGL in the PWA — not Unity rewrite

| Option | Verdict | Why |
| --- | --- | --- |
| **A. Three.js (or Babylon) presentation layer inside current PWA** | **Chosen** | Keeps `brainbite-core.mjs`, Firebase sync, PWA offline, Playwright, and a11y shell. Presentation-only swap. |
| B. Unity WebGL embed as the whole game | Rejected for Batch 9 | Duplicates save/learning loops, breaks offline/PWA contract, forces a second content/runtime stack. |
| C. Stay 2D CSS/SVG forever | Insufficient for these art targets | Can approximate HUD chrome only; cannot deliver pier/pillars/Kraken fidelity. |
| D. Full native Unity/mobile rewrite | Out of scope | Separate product; defer to a post-launch “BrainBite Native” exploration if needed. |

Performance doc already allows migrating the gameplay surface while preserving learning/content APIs. Batch 9 executes that path with WebGL instead of Phaser if art targets require 3D.

## Non-negotiables

1. Do **not** fork LearningCore, mastery, remediation, or challenge generation.
2. Do **not** add a second save/sync stack.
3. Keep profile isolation and parent/lab admin surfaces.
4. Keep a **DOM/fallback mode** for low-end / reduced-motion / WebGL-fail devices.
5. Accessibility: prompts, answers, and feedback must remain available to screen readers (HUD DOM overlay + live regions), not canvas-only.
6. Playwright release gates must still pass (adapt selectors; do not delete coverage).

## Architecture

```
┌─────────────────────────────────────────────┐
│  index.html HUD (DOM overlays)              │
│  profile, currencies, prompt, dock, a11y    │
└───────────────┬─────────────────────────────┘
                │ events / state bind
┌───────────────▼─────────────────────────────┐
│  PresentationAdapter (new)                  │
│  - home.scene / battle.scene                │
│  - input → same move/bite/select APIs       │
│  - capability detect → WebGL | DOM fallback │
└───────────────┬─────────────────────────────┘
                │
     ┌──────────┴──────────┐
     ▼                     ▼
 WebGLView (Three.js)   DomGridView (current)
     │                     │
     └──────────┬──────────┘
                ▼
     app.js game loop + STORE + SYNC
                ▼
     brainbite-core.mjs (unchanged contract)
```

`app.js` continues to own mission start/complete, lives/combo/boss HP, and LearningCore calls. The 3D layer only **renders and reports input**.

## Scope (Batch 9 only)

### In scope

- **Home hub scene:** Bite Village with Bite House, Play Portal, central mascot, jungle backdrop quality matching the home reference as closely as art budget allows.
- **Boss battle scene:** Jungle pier/water, answer pillars (or platforms), boss avatar (Fraction Kraken / world boss skin), selection glow, combo/feedback FX.
- **HUD chrome:** Keep/improve DOM HUD to match reference layout (currencies, goal, dock orbs, boss panel, toast, minimap, health bar).
- **Mascot:** Blue explorer Bite as hero model (or high-quality glTF) replacing flat SVG as primary in-scene actor.
- **Input mapping:**
  - Hub: click portal / menu orbs → existing navigation.
  - Battle: select answer pillar / tile → map to current correct/wrong evaluation (start with boss mode; keep 5×5 DOM for non-boss if needed).
- **Capability gate + fallback** to current board.
- **Art pipeline docs:** export sizes, LODs, license, PWA cache strategy.
- **Tests:** visual smoke + updated Playwright for battle/home entry; unit tests untouched.

### Out of scope (later batches)

- Full open-world Jungle Circuit exploration map as gameplay (minimap can be illustrative).
- All three worlds fully 3D (Batch 9 ships hub + one boss arena template; other worlds get skinned reuse).
- Unity native clients, App Store packaging, or realtime multiplayer.
- Replacing LearningCore challenge families.

## Sub-batches

### 9.0 Spike (3–5 days)

Pass gate:

- Three.js (or Babylon) canvas behind existing home + game screens
- One glTF mascot + one jungle plane/HDRI or stylized mesh
- Click → existing `start()` / answer handler
- FPS ≥ 30 on mid Android Chrome; graceful fallback when WebGL unavailable
- Bundle strategy decided (import map / esm.sh / vendored build) without breaking offline SW

Deliverable: spike branch + short ADR in this doc’s Decision Log.

### 9.1 PresentationAdapter + HUD contract

- Define `PresentationAdapter` interface: `mountHome`, `mountBattle`, `setState`, `dispose`
- Bind HUD DOM to game state (already largely present)
- Feature flag: `presentation=webgl|dom` (query + settings + auto)

### 9.2 Home hub fidelity

- Scene composition matching home reference hierarchy
- Main menu actions still drive real screens (Play, Quests, BrainBase, Shop stubs as today)
- Low-end: static framed render or existing SVG village

### 9.3 Boss arena + answer pillars

- Pillar/platform answer presentation for boss missions
- Map pillar tap → current bite/select correctness rules (no new scoring math)
- Keep keyboard equivalents (1–4 / arrows) for a11y and Playwright
- Non-boss missions may remain DomGrid until Batch 10

### 9.4 Art production pass

- Commission or produce: mascot glTF, Bite House, Play Portal, Kraken (or boss kit), 4 pillar props, jungle kitbash
- Style: stylized mobile-game (Clash/Animal Crossing adjacent), **original** IP — no MECC/Munchers copies
- Targets: mobile LODs; total first-load 3D budget documented (aim &lt; 8–12 MB incremental compressed, lazy per scene)

### 9.5 Hardening

- Service worker precache/lazy cache for glTF/bin/textures
- Reduced motion / low-end tier disables shadows/post
- Update `docs/ART_DIRECTION_v1.8.md` → v1.9 3D addendum
- Update release Playwright for WebGL path + DOM fallback path
- Device matrix sample (reuse Gate 8.4 devices) for WebGL path

## Answer UX note (important)

The approved battle shot uses **4 fraction pillars**, not a 5×5 eat-grid. Batch 9 may introduce a **boss presentation mode**:

- LearningCore / mission still supplies correct + distractors
- Presentation shows 3–4 pillars
- Selection resolves through the same success/fail path as today’s correct/wrong cell

Do **not** invent a parallel mastery system for pillars.

## Parallel with Batch 8

| Track | Action |
| --- | --- |
| Batch 8.4–8.6 | Continue on **current 2D shell** (ship-ready product) |
| Batch 9 | Separate branch/workstream for 3D presentation |
| Screenshot match | Success criterion of Batch 9, **not** a Blocker for Gate 8.4 |

Gate 8.4 UI pause can end: device matrix validates the shipping 2D PWA; Batch 9 is the fidelity upgrade.

## Effort estimate (order of magnitude)

| Phase | Calendar (1 designer+1 eng part-time) |
| --- | --- |
| 9.0 Spike | ~1 week |
| 9.1–9.3 Vertical slice | ~2–3 weeks |
| 9.4 Art production | ~2–4 weeks (can overlap) |
| 9.5 Hardening | ~1 week |

Total: roughly **5–8 weeks** to “looks like the references in-browser,” not a Unity rewrite.

## Go / No-Go after spike (9.0)

**Go** if:

- Mid-phone maintains playable FPS with fallback
- Input → LearningCore path unchanged
- Offline + SW story is clear
- Art pipeline can hit the two reference shots with a small prop set

**No-Go / revise** if:

- Bundle size or thermal kills low-end Chromebooks that Batch 8 must support
- Accessibility cannot keep DOM-equivalent answers
- Art cost exceeds budget → fall back to enhanced 2D + filmed/cinematic stills for marketing only

## Decision Log

| Date | Decision |
| --- | --- |
| 2026-09-02 | User chose Option 3: separate 3D fidelity batch. Engine preference: **WebGL presentation in PWA (Three.js preferred for ecosystem/size); Unity rejected as primary path.** |
