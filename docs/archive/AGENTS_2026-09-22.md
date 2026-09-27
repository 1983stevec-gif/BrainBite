# BrainBite Agent Fleet

Persistent multi-agent operating model for finishing launch batches, full UI match, and 100% functional gameplay.

## Roles

| Agent | Job | Primary docs |
| --- | --- | --- |
| **Orchestrator** | Prioritize next gate, assign workers, block thrash, report status | `docs/BATCH_8_STATUS_TRACKER.md`, `docs/BATCH_9_3D_PRESENTATION_PLAN.md` |
| **Worker: Batch 8 Launch** | Drive Gates 8.4–8.6 to PASS with evidence | `docs/GATE_8_4_OPERATOR_CHECKLIST.md`, `docs/BATCH_8_EXTERNAL_LAUNCH_PLAN.md` |
| **Worker: UI Match** | Home + battle MATCH/WebGL parity vs approved plates | `docs/references/home-dashboard-target.jpg`, `docs/references/battle-hud-target.jpg`, `presentation/` |
| **Worker: Functional QA** | Missions, answers, sync, a11y, PWA offline, no regressions | `app.js`, Playwright tests, `?match=0&webgl=0` shipping path |
| **Completion Pusher** | Recurring force-progress agent: always take the next unambiguous step | This file + status trackers |

## Source of truth

- **Current control plane:** `docs/BRAINBITE_ORCHESTRATOR.md`. Read this first; it records verified, partial, unverified, and external status, the worker contract, and the chat-end report format.
- **Canonical execution order:** `docs/COMPLETE_BUILD_ROADMAP.md`. It lists all 49 active phases across Batches 0-7. Advance only with exit evidence.
- Checkout: `D:\Codex\Brainbite` → `https://github.com/1983stevec-gif/BrainBite`
- Shipping / Gate 8.4 path: `?match=0&webgl=0`
- Current visual branch: `batch-9-webgl-spike`, default live WebGL; explicit `?presentation=webgl|dom|match` override. MATCH is a reference preview, not the production 3D result.
- Do not invent “done”: update trackers with evidence (commands, URLs, screenshots)

## Orchestrator loop

1. Read `docs/BRAINBITE_ORCHESTRATOR.md`, then `docs/BATCH_8_STATUS_TRACKER.md` and the Batch 9 plan status.
2. Pick **one** highest-priority incomplete outcome:
   - Human-blocked device/review items → prepare checklists + smoke evidence for Steve
   - Agent-executable UI/functional gaps → assign the matching worker
3. Spawn at most 2–3 workers in parallel; avoid overlapping file ownership. Use Luna for bounded easy inventories, extraction, and pattern-following changes. The user requested Astra visual workers, but the active deployment policy does not permit Astra workers; keep visual direction with the orchestrator and use only policy-permitted bounded specialists. Keep one independent reviewer read-only for substantive batches.
4. After workers return: verify, update trackers, commit only if Steve asked.
5. Leave a crisp **Next unambiguous action** for Steve or the Completion Pusher.

## Priority order (default)

1. Gate 8.4 remaining devices (Edge + phones/tablets) — operator matrix
2. Batch 9 MATCH: home + battle graphical parity + animated/reactive play
3. Functional QA: PLAY → answer pillars → progress/combo/toast; DOM path still green
4. Gate 8.5 review packets (educator / Spanish / legal / SR)
5. Gate 8.6 production domain / HTTPS / support / deletion / export
6. Batch 9.4+ real glTF art refinement. The user approved live 3D and Blender on 2026-09-09; the generated GLB kit is integrated, but approved-image parity is not yet achieved.

## Hard rules

- LearningCore / Firebase sync / PWA offline stay intact — presentation is a swap layer
- Never force-push `main`; never commit secrets; commit only on request
- Gate 8.4 validates **2D shipping**, not MATCH plates
- Prefer smallest safe edit that moves a gate or visual bar

## How to invoke in chat

- `@AGENTS.md` then: `Act as Orchestrator` / `Act as Worker: UI Match` / `Act as Completion Pusher`
- Or start a Cursor Automation from the drafts in `docs/AGENT_FLEET_AUTOMATIONS.md`
