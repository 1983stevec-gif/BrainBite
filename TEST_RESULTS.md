# BrainBite test results

This file no longer carries its own numbers; hand-copied counts went stale (it said 22
Playwright tests when the suite had 161). The sources of truth are:

| What | Where |
|---|---|
| Declared gate counts (unit, browser, smoke, package files) | `release/v14-evidence.json` → `automatedGate` (cross-checked by `npm run check:evidence`) |
| Latest smoke run | `release-evidence/smoke-report.json` (refreshed with `npm run evidence:refresh`) |
| Local certification | `release-evidence/local-certification.json` (`npm run certify:local`) |
| What is verified vs. open | `docs/HANDOFF.md` §2–§3 |

The 2026-09-02 version is in `docs/archive/TEST_RESULTS_2026-09-02.md`.
