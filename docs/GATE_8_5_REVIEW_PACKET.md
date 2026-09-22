# Gate 8.5 External Review Packet

Date: 2026-09-02  
Status: Ready for human reviewers (agent-prepared)  
App under test: shipping PWA `?match=0&webgl=0` (not MATCH plates)

## How to run the app

```text
npm run serve
http://127.0.0.1:4317/?match=0&webgl=0
```

Production Firebase project: `brainbite-prod`

Record results in `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.5.

---

## A) Educator review (mission correctness + age fit)

Reviewer: _________________ Date: ________

Play at least:
1. Number Nebula mission 1 (even numbers)
2. Fractions mission (id 8)
3. One Words world mission
4. One Spanish world mission
5. One boss mission

Check:
- [ ] Prompts match intended skill
- [ ] Correct/wrong sets are age-appropriate (approx grades covered by product)
- [ ] Feedback language is clear for kids
- [ ] No unsafe or confusing content in mission titles/prompts
- [ ] Practice Lab / Snap-to-Game do not contradict core missions

Blockers (P0/P1):  
Notes:

Result: PASS / FAIL

---

## B) Fluent Spanish review

Reviewer: _________________ Date: ________

Focus screens/content:
- Spanish world missions (ids 21–30) in `app.js` MISSIONS
- Any Spanish UI strings visible in-app

Check:
- [ ] Meaning correct for learners
- [ ] Age-appropriate vocabulary
- [ ] Diacritics / spelling acceptable for product level
- [ ] No offensive or awkward phrasing

Blockers:  
Result: PASS / FAIL

---

## C) Legal / privacy review

Reviewer: _________________ Date: ________

Read:
- `privacy.html`
- `terms.html`
- `support.html`
- In-app Account & Sync: export + delete controls

Check:
- [ ] Privacy covers child data, parental role, retention
- [ ] Terms cover acceptable use
- [ ] Consent / parent PIN model is described accurately
- [ ] Export path documented (`Export Versioned Progress`, `Export Account Data`)
- [ ] Deletion path documented (`Delete Cloud Data & Account`, profile delete)
- [ ] Support contact is production-ready (not a placeholder)

Blockers:  
Result: PASS / FAIL

---

## D) Screen-reader QA

Reviewer + AT: _________________ Date: ________  
Suggested AT: NVDA (Windows), VoiceOver (iOS/macOS), TalkBack (Android)

Path:
1. Home → Number Nebula → Play mission
2. Answer with keyboard if possible
3. Open Settings / Parent / Account

Check:
- [ ] Landmarks / headings make sense
- [ ] Primary buttons have accessible names
- [ ] Prompt + feedback announced (`aria-live` where present)
- [ ] Can complete one mission without pointer-only traps
- [ ] No critical unlabeled controls on launch path

Agent pre-smoke (2026-09-02): keyboard Tab reaches focusable `Home` button on shipping path — not a substitute for real SR QA.

Blockers:  
Result: PASS / FAIL

---

## Pass gate

Gate 8.5 passes only when A–D are PASS with no unresolved critical blockers.
