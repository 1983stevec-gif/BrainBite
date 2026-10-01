# Gate 8.4 Device Matrix — Operator Checklist

Date: 2026-09-02 · Checklist updated: 2026-09-27
App under test: shipping **2D PWA** — open with `?match=0&webgl=0`
Live 3D (WebGL) is the default presentation on `main` since PR #1; test the 2D path above and, on each device, also open the default URL once to confirm the 3D scene loads or falls back cleanly.

## URL

- Local: `http://127.0.0.1:4317/?match=0&webgl=0` (`npm run serve` from repo root)
- Optional visual check: `http://127.0.0.1:4317/?match=1` (approved screenshot plates)

## Per device (fill tracker table)

For each device in `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.4:

1. **First load** — Home renders; top nav buttons visible (Number Nebula, Parent, Account & Sync, BrainBite Lab, Settings).
2. **PWA install** — Install prompt or Add to Home Screen where supported; launch installed icon.
3. **Offline reload** — Load once online, go offline, reload; Home is visible and Continue Adventure launches a mission (cached HTML alone is not a runtime boot).
4. **Touch / keyboard** — Start a mission; move with on-screen pad or arrows; bite correct tile; exit to Home.
5. **Persistence** — Earn score/stars, reload, same profile progress remains.
6. **Accessibility** — Toggle Reduced motion + Large targets; still playable.
7. **Audio (manual, unverified)** — Listen for correct/wrong cues with Sound on; record audible results or autoplay blocking separately. Automated audio observations are diagnostic only and do not prove a cue played.

Mark PASS/FAIL + short notes in the tracker.

## Windows smoke evidence and manual certification

Automated local audit evidence (not physical-device certification): **PASS** for Chrome
and Edge via `scripts/smoke-gate84-windows.mjs`, including mission screen, accessibility
preferences, storage-marker persistence, offline JavaScript runtime boot, and visible Home.
Only a missing Edge executable is skippable; launch, navigation, and runtime failures fail.

The following remain manual operator work and must be recorded in the tracker:

- [ ] Windows Chrome physical-device certification
- [ ] Windows Edge physical-device certification

`scripts/smoke-pwa-installability.mjs` checks the manifest, icons, service worker, and install-button hook with the same Edge skip policy. These automated checks do not verify an installed-icon launch or earned-progress persistence. The `audioPlayDiagnostic` field only observes an `Audio.play()` call; audible correct/wrong cues remain **unverified** until a manual pass is recorded.

## Phones / tablets (Steve)

- [ ] Android Chrome phone
- [ ] Android Chrome tablet
- [ ] iPhone Safari
- [ ] iPad Safari
- [ ] Chromebook Chrome

## Do not block 8.4 on

- Pixel-perfect match to 3D reference JPGs (Batch 9 MATCH mode covers visual parity)
- WebGL procedural spike (`?webgl=1`) — optional extra only
