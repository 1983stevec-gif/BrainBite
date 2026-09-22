# BrainBite Batch 9 — 3D Presentation Layer

Date: 2026-09-02  
Status: Functional live-3D alpha on `batch-9-webgl-spike`; Blender-authored GLBs load by default with DOM and procedural fallbacks. Visual production and real-device certification remain open.
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
| 2026-09-02 | 9.0 spike scaffold started on branch batch-9-webgl-spike: Three r170 via node_modules, home+battle procedural scenes, ?webgl=1 flag, DOM fallback default. |
| 2026-09-02 | Visual **MATCH mode** added as spike default: approved JPG plates (`home-dashboard-target.jpg`, `battle-hud-target.jpg`) full-bleed with hotspots wired to LearningCore / mission start. Procedural WebGL via `?webgl=1`. 2D DOM via `?match=0`. |
| 2026-09-02 | MATCH pillar answers now resolve through `BrainBiteGame.tryAnswer` using LearningCore correct/wrong sets (presentation path), so plate picks no longer depend on a random 5×5 cell. Smoke: `scripts/smoke-completion-pusher.mjs` PASS. |
| 2026-09-09 | Blender 5.2.1 LTS portable installed and SHA-256 verified. Deterministic source pipeline now produces mascot, jungle, portal, pillar, and Kraken GLBs plus an editable `.blend` and provenance manifest. |
| 2026-09-09 | Live 3D is the default presentation with an explicit Live 3D / Classic / Reference preview selector. WebGL context loss falls back without losing the active mission. |
| 2026-09-09 | WebGL answer targets are consumed uniquely, fraction choices rotate through all correct evidence, and non-boss missions no longer expose false boss state. |
| 2026-09-09 | Full Playwright gate: 48/48 PASS, including classic release, MATCH, live 3D, accessibility, GLB loading/failure fallback, profile isolation, recovery, offline/PWA, and all 30 missions. |

## 2026-09-09 Verified Evidence

Newest graphics follow-up: [Bite and Jungle refinement](BATCH_9_GRAPHICS_REFINEMENT_REPORT.md).
Pipeline v1.1.0 exports the crested six-bone Bite with an idle/blink clip; runtime
animation, layered house/trees, and real shadow/pixel-ratio quality controls are
integrated. Release check: 22 unit tests and 52 browser tests PASS (2.6m), all five
GLBs re-imported. Batch 9.4 remains in progress, not AAA-certified.

Latest follow-up: [Jungle composition and responsive hardening](BATCH_9_JUNGLE_COMPOSITION_REPORT.md).
The integrated release check now passes 19 unit tests and 51 browser tests (1.8m),
including offline 3D reload, responsive portal bounds, and shared GPU-resource cleanup.
Shared instanced scenery, camera fitting, readable answer slots, and mobile overflow
fixes are implemented. This does not close production-art or real-device gates.

- Blender: `D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe --version` reports 5.2.1 LTS.
- Blender archive SHA-256: `0e631dad7d0cad6d5d18abdd2e2550f6c0213215334eda00ddbd3d22b96ecb2c`.
- Asset verification: five GLBs re-import successfully in headless Blender; see `assets/generated/blender/manifest.json`.
- Unit tests: 16/16 PASS.
- Content validation: 29 packs and 40 question sets PASS.
- Browser tests: 48/48 PASS in 2.4 minutes.
- Release structure, Firebase ownership/default-deny, launch, final-hardening, and evidence validators PASS.

Remaining production gates:

- Approved-reference visual fidelity is not complete. Current GLBs improve silhouette and hierarchy, but materials, environment density, lighting, animation, and camera composition still need production art direction.
- Android, iOS, tablet, Chromebook, controller, and low-end WebGL performance remain UNVERIFIED on physical hardware.
- External educator, Spanish, legal/privacy, and screen-reader reviews remain human gates.
- Production domain, HTTPS, support contact, deletion, and export require production-environment certification.
- Blender MCP add-on is installed in safe-mode-capable portable Blender, but persistent Codex MCP registration is intentionally not enabled without explicit informed approval because it can execute Blender-side Python.
