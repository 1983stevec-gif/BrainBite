# BrainBite Batch 6 External Certification Runbook

Status: local automation complete; external execution required
Repository: `D:\Codex\Brainbite`

## Already Verified Locally

- `npm run release:check` — PASS; 123 unit tests and 118 browser tests
- `npm run certify:local` — PASS; 24/24 local certification steps
- Accessibility preflight — zero serious or critical violations
- Offline, MATCH, export, PWA, Windows Chrome/Edge — PASS
- `release-evidence/local-certification.json` records the current branch and HEAD

The performance probe is diagnostic only. Its headless frame and long-task budget
violations must not be marked as device certification.

## Gate 8.4: Devices

Open the shipping path:

`http://127.0.0.1:4317/?match=0&webgl=0`

For each real device, record PASS only after completing first load, install, offline
reload, touch/keyboard input, persistence, accessibility settings, and audio.

| Device | Browser/OS | First load | Install | Offline | Input | Persistence | A11y | Audio | Owner/date/notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android phone |  |  |  |  |  |  |  |  |  |
| Android tablet |  |  |  |  |  |  |  |  |  |
| iPhone |  |  |  |  |  |  |  |  |  |
| iPad |  |  |  |  |  |  |  |  |  |
| Chromebook |  |  |  |  |  |  |  |  |  |

Attach screenshots or screen recordings for any failure. Do not reuse desktop smoke
results as phone/tablet evidence.

## Gate 8.5: Human Review

Use the prepared packet [`GATE_8_5_REVIEW_PACKET.md`](GATE_8_5_REVIEW_PACKET.md).

- Educator: review all 30 missions and remediation language.
- Fluent Spanish reviewer: review the Spanish inventory and accents.
- Legal/privacy reviewer: review privacy, terms, deletion, export, and child-data flows.
- Screen-reader reviewer: complete the NVDA/VoiceOver operator path.

Record reviewer name, date, scope, findings, and signature in the packet. Internal
automated Axe results are pre-evidence, not a substitute for screen-reader review.

## Gate 8.6: Production

1. Publish the selected commit to the approved host.
2. Record the canonical HTTPS URL and confirm HTTP redirect behavior.
3. Replace the interim GitHub Issues contact in `support.html` with the real support channel.
4. Verify footer links on the production URL.
5. Export account data and confirm expected progress fields.
6. Delete a test account and verify Auth plus Firestore family data are removed.
7. Record the production Firebase project, timestamp, operator, and evidence links.

Never mark local export or local profile deletion as proof of live account deletion.

## Closeout Decision

Batch 6 may be marked certified only when Gates 8.4, 8.5, and 8.6 contain evidence.
Until then, keep the project classification at **strong functional beta candidate** and
do not call the product production-ready or 100% functional.

After closeout, run `npm run release:check` again, update
`docs/BATCH_8_STATUS_TRACKER.md`, and begin Batch 7 Bubble Reef with a new report.
