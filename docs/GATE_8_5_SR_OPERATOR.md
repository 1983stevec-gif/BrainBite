# Gate 8.5 — Screen-reader operator path

Suggested AT: NVDA (Windows), VoiceOver (iOS/macOS), or TalkBack (Android).  
Shipping URL: `http://127.0.0.1:4317/?match=0&webgl=0` (or production once live).

Record PASS/FAIL in `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.5.

## Path (15–20 min)

1. Land on Home — hear page title / BrainBite branding.
2. Tab to **Number Nebula** (`nav button[data-screen="math"]`) → Enter.
3. Tab to first mission **Play** in `#mathList` → Enter.
4. Confirm `#prompt` and `#feedback` (`role="status"`, `aria-live="polite"`) are announced.
5. Move with arrow keys / WASD or on-screen D-pad; bite a tile.
6. Hear correct/wrong feedback update.
7. **Exit** (`#exitBtn`) → Home.
8. Open **Settings** — toggle Captions + Reduced motion; confirm state persists after reload.
9. Open **Parent** — confirm PIN gate; do **not** need to finish admin screens for this gate.
10. Optional: open Achievements (`aria-label="Home Achievements"`) without PIN — should reach Diagnostics, not Parent gate.

## Pass criteria

- [ ] No pointer-only trap on Home → mission → answer → Exit
- [ ] Prompt + feedback announced
- [ ] Primary controls have accessible names
- [ ] No critical unlabeled controls on the launch path

Agent pre-evidence (not a substitute): axe in Playwright release suite + `scripts/smoke-export-a11y.mjs`.
