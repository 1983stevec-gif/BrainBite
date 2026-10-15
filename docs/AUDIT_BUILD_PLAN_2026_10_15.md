# Audit and build triage — 2026-10-15

Baseline: `audit/verified-build-plan` at `e2e2d37`, with concurrent round work present in the
tree. This is the triage record for roughly 25 parallel audits, not a claim that every finding
fits in one build or that the branch is release-ready.

This record continues `AUDIT_BUILD_PLAN_2026_10_01.md` and
`ENHANCEMENT_PLAN_2026_10_15.md`. It does not reschedule work recorded as completed below.
Every open item is limited to the supplied source trace or inline experiment.

## Triage key

- `ready-to-build`: the defect and required correction are sufficiently bounded to implement.
- `needs-decision`: product, pedagogy, retention, or release policy must be chosen first.
- `owner`: human/external ownership is required rather than an autonomous engineering choice.
- **CI-blocking now** means a green CI/certification result must not be accepted until the
  named evidence defect is repaired. A product defect marked “No” can still block release.

**CI-blocking now:** findings **28, 30, 31, and 32**. All High product defects below are
release-blocking even where the current CI does not detect them.

## Product defects — High (18)

1. **MATCH plates are absent from the package** — `ready-to-build`; **CI-blocking now: No**.
   Package the referenced images or move references into staged assets; `presentation/match-plates.mjs:12-15`, `scripts/stage-site.mjs:49`.

2. **MATCH answers are never consumed** — `ready-to-build`; **CI-blocking now: No**.
   Consume a selected answer so duplicate `2/4` pillars cannot supply repeated evidence or finish five targets; `app.js:166-170,197-203`.

3. **MATCH hotspots miss the painted controls** — `ready-to-build`; **CI-blocking now: No**.
   Align Shop (~y365–416 vs ~422–483) and pillar hits (~y314–518 vs ~250–321) with their painted controls.

4. **BrainBase progression is internally broken** — `ready-to-build`; **CI-blocking now: No**.
   Add unlock enforcement, stop pre-completing destinations, prevent Continue regression, and wire fresh-profile Advance; `brainbite-core.mjs:2996-3001,3061-3067,3094-3109,3250-3255,3260-3384,3272-3275`.

5. **BrainBase copy and hub state contradict progression** — `ready-to-build`; **CI-blocking now: No**.
   Reconcile “World Gate: Sealed” with first-mission unlocks and refresh the hub after completion; `brainbite-core.mjs:2914-2934`, `content/experience-registry.js:89-90`, `app.js:2906`.

6. **Code Bridge ignores declared success criteria** — `ready-to-build`; **CI-blocking now: No**.
   Evaluate lesson criteria rather than accepting only `done && bridgeOpen`; `app.js:1822-1828`.

7. **Code Bridge can record stale coding evidence** — `ready-to-build`; **CI-blocking now: No**.
   Prevent an invalid program from inheriting “Coding evidence recorded” from prior completion; `content/code-bridge.mjs:42-44`, `app.js:3042-3045`.

8. **Programmable Bit lessons cannot progress through the UI** — `ready-to-build`; **CI-blocking now: No**.
   Save `programmableBitLessons`, not only `programmableBits`; the browser test currently requires mastery to remain null; `app.js:2054-2072`.

9. **Saved Bit behaviours do not control the companion** — `ready-to-build`; **CI-blocking now: No**.
   Make `react()` consume the saved definition; `presentation/programmable-bit.mjs:44-50`.

10. **WebGL/Expedition first-run never retires** — `ready-to-build`; **CI-blocking now: No**.
    Persist `done` on that answer path so the guided hint does not recur; `app.js:180-214,2894`.

11. **Guided first-run work counts as independent mastery** — `needs-decision`; **CI-blocking now: No**.
    Decide and encode the assistance classification before recording evidence; `app.js:2669-2671,2812-2816`.

12. **Typing read-aloud is recorded as independent** — `ready-to-build`; **CI-blocking now: No**.
    Make the shipped handler preserve the module’s assisted classification; `content/typing-progression.mjs:25-28`, `app.js:2852,3031`.

13. **Full Backup omits the authoritative time ledger** — `ready-to-build`; **CI-blocking now: No**.
    Include the ledger so restore cannot reset consumed daily/session time; existing coverage requires its exclusion; `app.js:1312,1357-1360,3166`.

14. **Active Profile export cannot be imported** — `ready-to-build`; **CI-blocking now: No**.
    Make the bare profile export and importer contract agree; `app.js:985-990,2946`.

15. **Two lifetime mistakes can make Mastered impossible forever** — `needs-decision`; **CI-blocking now: No**.
    Choose a recoverable mastery rule, including merged Mastered branches; `brainbite-core.mjs:1362-1368`.

16. **Service-worker updates can mix revisions mid-mission** — `needs-decision`; **CI-blocking now: No**.
    Choose reload versus deferred activation before replacing the old cache; `service-worker.js:113-126`, `app.js:3147-3149`.

17. **Precache failures are silent or leave an incomplete shell** — `needs-decision`; **CI-blocking now: No**.
    Classify mandatory/optional assets and fail or degrade explicitly; `service-worker.js:92,117,124`, `presentation/presentation-adapter.mjs:3`.

18. **Production mission content violates the review rubric** — `owner`; **CI-blocking now: No**.
    Human review must correct the listed rhyme, synonym, context, and Spanish defects and address all 70 explanation-free sets; `content/experience-registry.js:38,40,45-47`, `scripts/gen-review-packet.mjs:109-114`.

## Product defects — Medium/Low (8)

19. **Expedition has keyboard and dialog accessibility defects** — `ready-to-build`; **CI-blocking now: No**.
    Stop hidden classic input/focus, duplicate announcements, background interaction, failed focus restoration, and the focusable transparent portal; `app.js:1779-1785,3089`, `presentation/expedition-ui.mjs:147-180`.

20. **Storage can approach or exceed origin quota without truthful failure UI** — `needs-decision`; **CI-blocking now: No**.
    Bound Code Lab projects, reward ledger, tombstones, quarantine, and rollback (~3.2 MiB profile; ~14 MiB worst case), and fix the false saved message; `app.js:7-9,778-788`, `index.html:412`.

21. **Export redaction both over-redacts and misses PIN synonyms** — `ready-to-build`; **CI-blocking now: No**.
    Preserve benign `pin`, `completionToken`, `teacherCredential`, `rewardSecret`, and `contentVerifier` fields while catching nested `guardianPIN`/`familyPin`; `app.js:21-22,1651-1654`.

22. **Adaptive selection and parent mastery reporting are unsound** — `needs-decision`; **CI-blocking now: No**.
    Choose fairness/prerequisite policy, then stop treating Strong as mastered or raw score as the percentage; `brainbite-core.mjs:1113-1115`, `app.js:2283-2286`.

23. **Low graphics tiers still build and load the full scene** — `ready-to-build`; **CI-blocking now: No**.
    Apply the tier before constructing/loading scene resources; `presentation/graphics-quality.mjs:5-30`.

24. **Mascot clone-owned skeleton textures leak** — `ready-to-build`; **CI-blocking now: No**.
    Dispose clone-owned textures during scene teardown; `presentation/gltf-assets.mjs:48,68-71`, `presentation/props.mjs:533`.

25. **Advanced actions lack live gates and limit scope is undisclosed** — `ready-to-build`; **CI-blocking now: No**.
    Gate the presentation selector and install prompt, and disclose per-profile limits; `presentation/boot.mjs:30-35`, `app.js:3094`.

26. **First-run state is not isolated across cloud/device/profile boundaries** — `ready-to-build`; **CI-blocking now: No**.
    Preserve `firstRun` in cloud projection and clear the name input on profile switch; `app.js:1331-1344`.

## Harness / evidence gaps (7)

27. **Adaptive smoke budgets are absent from committed evidence** — `ready-to-build`; **CI-blocking now: No**.
    Update the 2026-09-27 evidence and remove `smoke-gate84-viewports`’ 103-second false-timeout risk against the observed 119.976-second pass.

28. **Smoke and PWA names overstate their assertions** — `ready-to-build`; **CI-blocking now: Yes**.
    Assert completion, distinct worlds, the viewport prompt, `start_url`, icon fetch, and service-worker control before retaining those claims.

29. **Capture scripts are not gates and one writes a tracked path** — `ready-to-build`; **CI-blocking now: No**.
    Separate evidence refresh from ordinary capture and stop default writes to `scripts/docs/references/spike`; `scripts/capture-webgl-spike.mjs:5-6`.

30. **Firebase rule mutation checks can false-pass** — `ready-to-build`; **CI-blocking now: Yes**.
    Catch substring-preserving widening such as `|| true`, require the intended failure rather than any digest error, and include emulator checks in release/certification.

31. **The release declaration is stale and unsupported** — `ready-to-build`; **CI-blocking now: Yes**.
    Correct `main`/`6b43a59`, 291→293 units, 260→264 Playwright cases, unsupported PASS/budget claims, and the stale Batch 6 next phase.

32. **Certification status and evidence validation can overclaim** — `needs-decision`; **CI-blocking now: Yes**.
    Decide the release effect of `passed-with-retries`; replace string/presence proof with behaviour and restore provenance in the CI evidence variant.

33. **Native claims exceed the evidence** — `needs-decision`; **CI-blocking now: No**.
    Add reproducibility and more than one 10-second listener snapshot or narrow the claims; two named presentation files differ on raw bytes despite normalized hashes.

## Completed this round (6)

1. **Done — review CLI atomicity:** exclusive lock, temp+rename, ten-minute stale rule, and counterfactual tests in `scripts/review-content.mjs` and `tests/content-approval.test.mjs`.

2. **Done — CI coverage check:** wired into `check:static` through `scripts/check-ci-coverage.mjs` and `package.json`.

3. **Done — durable smoke/probe evidence mirror:** both harnesses now mirror into `.ui-captures/release-evidence/`, with the readiness document updated.

4. **Done — mobile/CSS verification:** stronger layout assertions, removed rail `!important` shadows, cleared allowlist, and zero-pixel-diff rail crop; `docs/CSS_CASCADE_REVIEW_2026_10_15.md` records 126 intentional, 7 dead, and 1 decision.

5. **Done — provenance check independently verified:** cooperative guard confirmed, with the recorded TOCTOU window, CWD-dependent root, and no cryptographic server authentication.

6. **Done — shard balance analysed:** shard 3 is 76–77% WebGL; a second worker may reduce it to about 6–7.5 minutes, pending two green confirmation runs.

## Deferred recommendation

- `owner`: give shard 3 a second worker only after the requested two green runs confirm the estimate.

## Not claimed

No implementation beyond the completed items, passing suite, release readiness, publication,
production Firebase result, native reproducibility, physical-device result, or human approval is
claimed. Open findings remain unverified until their build, decision, owner action, and applicable
gate supply evidence.
