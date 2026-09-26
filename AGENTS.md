# BrainBite — agent instructions

**Start here, and only here: [`docs/HANDOFF.md`](docs/HANDOFF.md).** It is the single entry
point: what is verified, what is open, who owns it, decisions already made, and the
operational details that are easy to get wrong. Everything in `docs/archive/` is history;
do not act on it.

## Session start

```powershell
git status -sb; git fetch --prune; git log --oneline -3
```

- Checkout: `D:\Codex\Brainbite` → `https://github.com/1983stevec-gif/BrainBite`, branch `main`.
  Never reinitialise, re-clone over, or "reconstruct" it.
- Work on a branch; open a PR; Steve merges (decision D6). No force-push to `main`, no secrets.

## Hard rules

- LearningCore, saves, Firebase sync and PWA offline stay intact; presentation is a swap layer.
- Assisted work never counts as independent mastery. Profile isolation is P0.
- New runtime asset → `service-worker.js` precache + `scripts/stage-site.mjs` allowlist + cache
  name bump + `npm run package:manifest`.
- Gates: `npm run check:static`, `npm run test:unit`, `npm run test:e2e`, `npm run smoke`.
  Test runs write only to git-ignored folders; `npm run evidence:refresh` updates tracked
  evidence on purpose.
- Never report a percentage that is not derived from a gate or from the UI rubric (`docs/UI_MATCH_RUBRIC.md`).

## Report format

Repo state · Commands run · Results · Changes · Unverified · Next step · Push state.
