/* BrainBite boss phases (gameplay G5, decision D13: three phases).
 *
 * Bosses used to lose 25 HP per correct answer, so a boss was four ordinary answers. Each
 * boss now has three phases that play differently. The rules are data here and enforced
 * in app.js; the phases never change how an answer is judged or recorded as evidence.
 *
 *   1 Tentacle block  one wrong pillar is wrapped and cannot be picked; 3 hits
 *   2 Ink cloud       the discs go dark after 2 s; the speaker reads the choices aloud,
 *                     or "Peek" shows them for 2 s but makes the next answer assisted; 3 hits
 *   3 Two in a row    only two correct answers in a row land a hit; 2 hits
 */
(function (root) {
  'use strict';

  const PHASES = Object.freeze([
    Object.freeze({ id: 'tentacle-block', title: 'Tentacle Block', rule: 'One pillar is wrapped up. Find another answer!', hits: 3 }),
    Object.freeze({ id: 'ink-cloud', title: 'Ink Cloud', rule: 'The answers hide! Tap the speaker to hear them, or Peek.', hits: 3, inkAfterMs: 2000, peekMs: 2000 }),
    Object.freeze({ id: 'two-in-a-row', title: 'Two in a Row', rule: 'Bite two right answers in a row to land a hit!', hits: 2, streak: 2 }),
  ]);
  const TOTAL_HITS = PHASES.reduce((sum, phase) => sum + phase.hits, 0);

  function createRun() {
    return { phase: 0, hitsInPhase: 0, hits: 0, streak: 0, won: false };
  }

  function currentPhase(run) {
    return PHASES[Math.min(PHASES.length - 1, Math.max(0, Number(run?.phase) || 0))];
  }

  /** Boss health 0-100, falling per hit. */
  function health(run) {
    return Math.max(0, Math.round(100 * (1 - (Number(run?.hits) || 0) / TOTAL_HITS)));
  }

  /**
   * Apply one judged answer to the boss run. Returns the next run and what happened.
   * @returns {{run: object, hit: boolean, phaseChanged: boolean, won: boolean}}
   */
  function applyAnswer(run, correct) {
    const next = { ...run };
    const phase = currentPhase(next);
    let hit = false;
    if (!correct) {
      next.streak = 0;
    } else if (phase.streak) {
      next.streak += 1;
      if (next.streak >= phase.streak) { hit = true; next.streak = 0; }
    } else {
      hit = true;
    }
    let phaseChanged = false;
    if (hit) {
      next.hits += 1;
      next.hitsInPhase += 1;
      if (next.hitsInPhase >= phase.hits) {
        if (next.phase + 1 >= PHASES.length) next.won = true;
        else { next.phase += 1; next.hitsInPhase = 0; next.streak = 0; phaseChanged = true; }
      }
    }
    return { run: next, hit, phaseChanged, won: next.won };
  }

  /** The wrong choice wrapped by the tentacle in phase 1 (never a correct one). */
  function blockedChoice(choices = [], targets = [], seed = 0) {
    const open = choices.map(String).filter((value) => !targets.map(String).includes(value));
    return open.length ? open[Math.abs(Number(seed) || 0) % open.length] : null;
  }

  const api = Object.freeze({ PHASES, TOTAL_HITS, createRun, currentPhase, health, applyAnswer, blockedChoice });
  root.BrainBiteBossPhases = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
