# Audit and build plan — 2026-10-01

Baseline: `audit/verified-build-plan` at `6c630f6`, clean tree. Read `docs/HANDOFF.md`,
`docs/CLOSED_BETA_READINESS.md` and the two earlier plan documents first.

This is a targeted engineering audit run as four independent, read-only assignments: evidence
verification, service-worker deployment, local save integrity, and cloud erasure. It is **not**
a device, production, security, or visual certification. Production Firebase was not
contacted. GitHub Pages is still not enabled. No educator decision was made or fabricated.

## Findings that matter

### P0 — evidence can be lost, and one claim is untrue

1. **Two tabs can share an attempt origin and lose evidence.** `pageWriterId()` reuses a value
   from session storage instead of creating a document-unique id (`app.js:308-315`), and
   attempt-origin allocation runs outside the persistence lock. Two documents can read the
   same floor, allocate the same `(originId, originSequence)`, record different attempts, and
   merge per-field maxima rather than adding (`brainbite-core.mjs:1596-1608`). Reproduced: two
   successful attempts merged to evidence of **one**. The recent sequence-floor refresh
   narrows this window but does not close it.
2. **The client cannot delete cloud data, but the product says it can.** Under the shipped
   rules every physical document delete is denied (`firebase/firestore.rules:217-219`), so
   `deleteFamily()` aborts before Auth deletion and leaves live documents, tombstones and the
   Auth account. Yet `index.html:183`, `app.js:3036`, `app.js:3042` and `README.md:58` all
   describe deletion as working. The privileged backend does not exist (Phase 1).
3. **If every stored generation is invalid, a blank learner replaces all three.** Invalid
   generations are correctly rejected (`app.js:736-757`), but with no valid copy the app
   initialises a default learner and rotates it into every slot, overwriting the evidence it
   just refused to trust.

### P1 — checks that cannot fail

4. `tests/content-review.test.mjs:346-352` matches workflow command text anywhere in the file,
   so a commented-out `npm run check:content-review` still passes (demonstrated in memory).
5. `scripts/check-precache.mjs` extracts `'./…'` strings from the whole service worker and never
   checks that `cache.addAll` consumes them; `cache.addAll([])` would still pass (demonstrated).
6. `scripts/check-certification-coverage.mjs` treats a spec filename appearing in a **comment**
   as execution coverage (demonstrated).
7. `scripts/check-test-ports.mjs` reads the source default, not the effective environment, so
   with `BRAINBITE_TEST_PORT=4320` a test hardcoding 4318 still passes (demonstrated).
8. Nothing enforces the "bump the cache name when runtime assets change" rule, which is how
   the v46/v47 mismatch shipped. The audit supplied a content-addressed guard design.

### P2 — weaker tests, and decisions that are not mine

9. `tests/webgl-assets.spec.js:131,143` assert `toBeDefined()` on objects that `report()` always
   creates, so losing long-task instrumentation would not fail the suite.
10. `tests/bubble-reef-app-integration.test.mjs` extracts the function from `app.js` and calls it
    directly, so breaking the real `complete()` trigger (`app.js:2807`) leaves the tests green.
11. The Firebase browser tests intercept all HTTPS and serve an in-memory double
    (`tests/release.spec.js:765,908`). They are useful client-contract tests but are not
    Firebase evidence; the emulator test is the real check.
12. `skipWaiting()` plus `clients.claim()` means an update can claim a tab that is mid-mission.
    The audit found no blank-screen evidence for the current revision, but session coherence is
    not guaranteed. **Owner decision**: wait for tabs/mission completion, or force a reload.
13. Optional precache failures silently discard previously cached 3D availability rather than
    degrading. **Owner decision** on which presentation modules are truly optional.

## Improvements selected for this round

Bounded, disjoint, and safe to land together. Each worker owns its files; the package manifest
is reserved for the orchestrator and is regenerated only after every worker stops.

| # | Improvement | Files | Acceptance |
|---|---|---|---|
| 1 | Document-unique page-writer ids so two tabs cannot share an attempt origin | `app.js` + core tests | Two same-floor writers both count; the new test fails against the old id source |
| 2 | Truthful deletion copy (no claim the client cannot honour) | `app.js`, `index.html`, `README.md` | No user-facing text promises completed cloud deletion |
| 3 | Quarantine invalid generations instead of overwriting all three with blank | `app.js` + storage tests | Evidence bytes survive a total-validation failure |
| 4 | Port guard uses the effective port and rejects port literals | `scripts/check-test-ports.mjs` | Fails under `BRAINBITE_TEST_PORT=4320` with a hardcoded 4318 |
| 5 | Certification coverage parses real group arrays | `scripts/check-certification-coverage.mjs` | A name in a comment no longer counts as coverage |
| 6 | Precache guard proves the URL lists reach `cache.addAll` and enforces a minimum | `scripts/check-precache.mjs` | `cache.addAll([])` fails the check |
| 7 | Workflow-command assertions ignore comments | `tests/content-review.test.mjs` | A commented-out gate command fails the test |
| 8 | Content-addressed cache key derived from the packaged runtime | `scripts/check-stage.mjs`, `service-worker.js`, package-manifest test | Changing a packaged file without updating `CACHE` fails with a named message |
| 9 | Long-task assertions that can fail; Bubble Reef completion through the real trigger; Firebase browser tests labelled as client-contract | `tests/webgl-assets.spec.js`, `tests/bubble-reef-app-integration.test.mjs`, `tests/release.spec.js` | The instrumentation assertion fails when the observer is never registered |

Deferred with reasons: the two owner decisions (12, 13), the privileged erasure backend
(Phase 1, its own build plan), and the broader rollback/update-lifecycle redesign.

## Not claimed

Device, screen-reader, Spanish, legal, production Firebase, publishing, signing, and educator
review remain open and are owned by people, not by this plan. No approval or finding was
fabricated, and no live review data was touched.
