# Independent audit and build plan — 2026-09-27

## Baseline and scope

Baseline: `39e6cdb`, clean `mobile/runtime-readiness`; implementation branch:
`audit/verified-build-plan`. Read `HANDOFF.md`, `CLOSED_BETA_READINESS.md`, the
package gates, review CLI, validator and approval tests. Independently ran static
checks: all ten passed (100 staged files, 94 precached URLs). The initial unit
run timed out after 200 seconds; this is inconclusive, not a passing gate.
PR #2 is still open against main. This is a targeted engineering audit, not a
new claim of device, production, security or visual certification.

## Findings

1. **P1 — mixed review batches partially write despite reporting no write.**
   `scripts/review-content.mjs` sets exitCode when any record is refused but
   continues into the write path if any other record is accepted. Existing tests
   cover planners, not the CLI's orchestration. Both approve and reject modes
   need a no-write regression test with mixed identities.
2. **P2 — failed post-write validation leaves the manifest changed.** The CLI
   catches validator failure but does not restore the original bytes. This
   contradicts the handoff's assertion that inconsistent data is not written.
3. **Documentation drift.** Readiness says 90 precached assets; the current
   checker reports 94. Historical test counts are evidence for their recorded
   revisions, not proof of the current branch.
4. **P1 — valid approvals still fail the real validator.** The runtime API
   exports approvals/findings beside `manifest`, but `getReviewManifest()`
   returns a manifest without either field. Real CLI fixture coverage reproduced
   this previously claimed fix as still missing. Add both fields to the manifest.
5. **P2 — review metadata only checked for equality.** Once the omitted fields
   are restored, blank reviewer metadata can agree with itself and pass. Require
   non-empty reviewer id/role, a parseable timestamp and a non-empty finding.
6. **P2 — Windows smoke races worker installation and leaks browsers on error.**
   Offline navigation swallowed its error, then accessed storage on an error
   document. A later Edge error left its browser open until the runner timed out.
   Wait for worker control and cached index, assert the actual home screen, do
   not swallow navigation failure, and close the browser in `finally`.

## Build plan and acceptance

- [x] Add isolated real-CLI tests for mixed approval/rejection, dry runs,
  successful review fixtures, and validator failure. Never mutate live reviews.
- [x] Stop immediately when any requested record is refused.
- [x] Restore the original manifest on validator failure and report the rollback.
  This handles synchronous validation failure, not process-crash transactions or
  concurrent reviewers; those are outside this bounded fix.
- [x] Restore the manifest review-data contract, validate metadata, bump the
  service-worker cache and regenerate package hashes (no new runtime assets).
- [x] Fix the independently observed Windows smoke lifecycle defects.
- [x] Run focused tests, static, unit, browser and smoke gates; preserve exact
  failures or timeouts instead of describing incomplete runs as green.
- [ ] Update audit/handoff, commit and open a stacked PR against the existing
  implementation branch; Steve retains merge authority.

## External gates remain open

Educator judgments, device/screen-reader/Spanish/legal reviews, production
Firebase checks, signing, Pages settings and publishing are not automated by
this plan. LearningCore, saves and profile isolation are unchanged; runtime changes
are limited to exposing existing review data and refreshing the cache version.

## Verification results (including orchestrated follow-up)

- Regression tests initially reproduced mixed-batch writes and failed rollback;
  the positive control also exposed the missing manifest contract.
- Final `npm run test:unit`: **255/255**, zero failed/skipped, after the final
  reviewed-digest acceptance fix.
- `npm run check:static`: **10/10**; `npm run check:content-review`: PASS,
  105 records, no live approvals or findings added.
- `npm run package:manifest`: 100 runtime files; verified by the stage gate.
- Final `npm run smoke`: **11/11**, including Chrome+Edge Windows matrix.
  Earlier runs were 10/11 (offline storage error, then leaked-browser timeout).
- First `npm run test:e2e`: **209/211**, failures in accessibility-settings
  reload and transient arrival status; focused rerun **2/2** passed.
- Second full browser run: **208/211**, failures in parent unlock in the PWA
  test, restored-context timeout, and reduced-motion answer state. Focused rerun
  **3/3** passed. These reruns do not turn either full run into a pass.
- After the reviewed harness fixes, the final full browser run passed **211/211**
  with one worker and **zero retries** (8.7 minutes). The five affected cases also
  passed **15/15** across three repetitions, zero retries. No assertion or timeout
  was weakened to mask failures. Historical failures remain part of this record.
- Final smoke rerun after tightening Edge failure handling: **11/11**.
  Historical CI evidence remains historical; tracked certification/smoke evidence
  was not promoted. Remote CI and native builds are not claimed for this branch.
- Final scoped content-review acceptance recheck: `node --test tests/content-review.test.mjs`
  **25/25** and `npm run check:content-review` PASS for 105 records with zero digest
  mismatches. No remote CI, native, device, educator, or external certification is claimed.

Earlier logs placed inside `.playwright-results/` were removed by Playwright's
output cleanup; their tool receipts informed the historical counts above. Final
logs are preserved outside that cleaned directory in git-ignored
`test-results/audit-followup/`: `integrated-unit.log`, `repeated.log`, `full.log`,
`smoke.log`, and per-run browser output directories. They are not committed
evidence. No production data, credentials, approvals, publishing settings or
external sign-offs were changed.

## Completion reviews and improvement plans

Two independent subagents reviewed disjoint scopes, then implemented bounded
improvements in their owned files. The orchestrator reviewed the actual diffs and
ran the integrated checks above; completion messages alone were not acceptance.

| Completion | Review finding | Improvement plan and outcome |
|---|---|---|
| Review-tool audit | Linked JSON rejection changed fixed source-coverage counts, so approved content could not be rejected | Separate source linkage from reviewer quarantine; real CLI tests now cover pending and approved linked JSON rejection and fail-closed reapproval |
| Review-tool audit | Missing flag values became reviewer identities; orphan review entries escaped validation | Validate arguments before dry runs and writes, validate every map entry and identity; regression coverage added |
| Review-tool audit | Planner promised stale-content rejection although validator forbids it | Retain strict digest policy; refuse stale rejection before writing and explain repair/regeneration prerequisite |
| Review-tool implementation | Owner reported 23 focused tests passing | Orchestrator inspected changes, confirmed 255 integrated unit tests and content validator pass; accepted |
| Browser audit | Persistence, transient text, and real context restoration lacked reliable synchronization | Wait for successful storage writes; capture initial text in-page; restore after the real loss event; preserve mission, event and runtime-error assertions |
| Browser audit | Parent/PWA readiness and reduced-motion failures needed evidence | Add unlock and worker/cache postconditions; await presentation readiness and attach reduced-motion failure diagnostics, without claiming an unproven app defect |
| Browser audit | Any Edge error was treated as a skip; logs disappeared on reruns | Fail installed Edge regressions and runtime errors; skip missing executables only; preserve logs outside Playwright cleanup |
| Browser implementation | Owner reported 5 targeted cases passing | Orchestrator ran 15 repeated cases, all 211 browser cases and all 11 smokes successfully; accepted |
| Final acceptance review | Runtime gate did not enforce reviewed-digest binding; docs mixed historical/current counts; cache guidance named an old version | Runtime gate now enforces a valid matching digest; focused tests cover absent/malformed/mismatched/valid approvals; docs and cache guidance corrected. Final 255/255, 211/211, 11/11 rerun passed |

### Remaining improvement backlog (not release claims)

- Review writes assume a single operator and synchronous validation. Atomic
  replacement/crash recovery and reviewer locking are a separate future task.
- The reduced-motion test proves answer state, not physical-device motion or
  particle absence; hardware/accessibility certification remains external.
- Preserve the new evidence-directory convention in future runs; do not store
  logs in the directory Playwright clears.
- Steve reviews/merges the stacked PR; remote CI and the external gates above
  remain separately owned checks, not automated approvals.
