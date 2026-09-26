# BrainBite Agent Fleet — Cursor Automation Drafts

Use these as Automations in Cursor. Create each from chat handoff or paste into Automations editor.

Repo: `1983stevec-gif/BrainBite`  
Preferred branch for visual work: `batch-9-webgl-spike`  
Default branch: `main`

## 1) Orchestrator

**Trigger:** Every weekday 9:00 (local cron `0 9 * * 1-5`)  
**Tools:** Cloud agent on this repo (no Slack required)

**Instructions (summary):**  
Read `AGENTS.md` and `docs/BATCH_8_STATUS_TRACKER.md`. Act as Orchestrator. Choose the single highest-priority incomplete gate or UI/functional gap. File concrete next steps in the tracker Notes. If agent-executable work exists, implement the smallest safe slice on the correct branch, verify with smoke tests, and summarize what Steve must do for human-only gates (devices, reviews, domain).

## 2) Worker: UI Match

**Trigger:** On demand / when Orchestrator assigns (or daily 10:00 cron `0 10 * * *`)  
**Branch:** `batch-9-webgl-spike`

**Instructions:**  
Act as Worker: UI Match. Compare live MATCH home/battle to `docs/references/home-dashboard-target.jpg` and `battle-hud-target.jpg`. Improve `presentation/` + MATCH FX until home and battle feel equal quality. Keep hotspots wired to real `BrainBiteGame` actions. Capture proof under `docs/references/spike/`. Do not break `?match=0&webgl=0`.

## 3) Worker: Functional QA

**Trigger:** On demand / after UI Match changes (or daily 11:00 cron `0 11 * * *`)

**Instructions:**  
Act as Worker: Functional QA. Run shipping path `?match=0&webgl=0` and MATCH `?match=1`. Verify mission start, pillar answers, combo/toast, pause/exit, persistence, and service worker boot. Fix regressions with minimal diffs. Prefer Playwright smoke when available.

## 4) Completion Pusher (always advance)

**Trigger:** Every 2 hours (`0 */2 * * *`)  
**Purpose:** Never stall — keep pushing toward all batches complete, full UI match, 100% functional

**Instructions:**  
Act as Completion Pusher per `AGENTS.md`. Ignore nice-to-haves. Find the next unfinished item that an agent can move without Steve’s physical device. Do that work now. Update the status tracker Next action. If blocked on humans, write an exact operator checklist snippet Steve can finish in one sitting. Stop only when Batch 8 closeout is checked and Batch 9 plate parity is verified with proof shots.

## Create order

1. Completion Pusher (keeps momentum)  
2. Orchestrator (daily prioritization)  
3. UI Match worker  
4. Functional QA worker  
