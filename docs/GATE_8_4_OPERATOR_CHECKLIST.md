# Gate 8.4 Device Matrix — Operator Checklist

Date: 2026-09-02  
App under test: shipping **2D PWA** — open with `?match=0&webgl=0`
Live 3D (WebGL) is the default presentation on `main` since PR #1; test the 2D path above and, on each device, also open the default URL once to confirm the 3D scene loads or falls back cleanly.

## URL

- Local: `http://127.0.0.1:4317/?match=0&webgl=0` (`npm run serve` from repo root)
- Optional visual check: `http://127.0.0.1:4317/?match=1` (approved screenshot plates)

## Per device (fill tracker table)

For each device in `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.4:

1. **First load** — Home renders; top nav buttons visible (Number Nebula, Parent, Account & Sync, BrainBite Lab, Settings).
2. **PWA install** — Install prompt or Add to Home Screen where supported; launch installed icon.
3. **Offline reload** — Load once online, go offline, reload; shell still opens.
4. **Touch / keyboard** — Start a mission; move with on-screen pad or arrows; bite correct tile; exit to Home.
5. **Persistence** — Earn score/stars, reload, same profile progress remains.
6. **Accessibility** — Toggle Reduced motion + Large targets; still playable.
7. **Audio** — Correct/wrong cues with Sound on (optional fail note if blocked by autoplay).

Mark PASS/FAIL + short notes in the tracker.

## Windows smoke (agent / Steve)

- [x] Windows Chrome — first load + mission + reload persistence + a11y prefs + audio cue + offline (`scripts/smoke-gate84-windows.mjs` + completion-pusher)
- [x] Windows Edge — same matrix via Playwright `channel:'msedge'` (`scripts/smoke-gate84-windows.mjs`)

## Phones / tablets (Steve)

- [ ] Android Chrome phone
- [ ] Android Chrome tablet
- [ ] iPhone Safari
- [ ] iPad Safari
- [ ] Chromebook Chrome

## Do not block 8.4 on

- Pixel-perfect match to 3D reference JPGs (Batch 9 MATCH mode covers visual parity)
- WebGL procedural spike (`?webgl=1`) — optional extra only
