# Gate 8.5 — Agent pre-evidence (not a human sign-off)

Date: 2026-09-02  
Purpose: Give reviewers a head start. **Does not replace** educator / Spanish / legal / SR signatures in `GATE_8_5_REVIEW_PACKET.md`.

## Automated accessibility

- Playwright release suite includes `@axe-core/playwright` WCAG 2 A/AA scan — **no serious/critical** on last green run (29 tests PASS including axe).
- Keyboard: Tab reaches focusable Home / nav on shipping `?match=0&webgl=0`.
- Captions + repeat-prompt controls covered by release a11y tests.
- Live regions: `#feedback` and account status use `role="status"` / `aria-live="polite"`.

## Functional coverage (agent)

- `npm run release:check` PASS
- MATCH presentation 7 Playwright tests PASS (home/battle plates, hit/miss, pause, settings, complete, multiworld DOM)
- Parent PIN gates admin screens; Practice/Snap paths smoke PASS
- Offline reload smoke PASS (shipping path)

## Reviewer start packs (agent-generated)

- Educator: `docs/GATE_8_5_EDUCATOR_INVENTORY.md` (30 missions; regenerate via `node scripts/gen-educator-inventory.mjs`)
- Spanish: `docs/GATE_8_5_SPANISH_INVENTORY.md`
- Legal: `docs/GATE_8_5_LEGAL_CLAUSE_MAP.md`
- Screen-reader: `docs/GATE_8_5_SR_OPERATOR.md`

## Still requires humans

| Review | Why agent cannot close |
| --- | --- |
| Educator | Age-fit / curriculum judgment |
| Fluent Spanish | Native/fluent meaning check |
| Legal | Privacy/terms counsel |
| Screen-reader | Real NVDA/VoiceOver/TalkBack session |

Fill results into `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.5 when done.
