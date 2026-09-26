/* BrainBite run builder (gameplay G4).
 *
 * Pure, deterministic helpers that shape a 3D mission into a short arc without inventing
 * content: every value shown comes from the mission's own reviewed `correct` / `wrong`
 * sets. The same game state always yields the same choices, so a redraw never reshuffles
 * the pillars under a child's finger.
 *
 *   warm-up  first two targets: one correct disc among four
 *   core     two correct discs among four, so each prompt is a real decision
 *   twist    once per run, only for skills with a well-defined opposite (even/odd):
 *            "Twist! Now bite an ODD number!" (one odd among three evens)
 *   finale   the last target: double points
 *
 * The Nibbler moves one pillar toward the pillar Bite chose last, and its next position
 * is always shown. Landing on its pillar costs the combo, never a heart.
 */
(function (root) {
  'use strict';

  const TWISTS = Object.freeze({
    'even-numbers': Object.freeze({ prompt: 'Twist! Now bite an ODD number!', label: 'odd' }),
    'odd-numbers': Object.freeze({ prompt: 'Twist! Now bite an EVEN number!', label: 'even' }),
  });

  function unique(values) {
    const seen = new Set();
    const out = [];
    for (const value of values) {
      const key = String(value);
      if (value === undefined || value === null || key === '' || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
    return out;
  }

  function rotate(list, by) {
    if (!list.length) return [];
    const k = ((by % list.length) + list.length) % list.length;
    return [...list.slice(k), ...list.slice(0, k)];
  }

  // Small deterministic PRNG (mulberry32) so a seed always gives the same permutation.
  function random(seed) {
    let t = (Number(seed) >>> 0) + 0x6d2b79f5;
    return () => {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function permute(list, seed) {
    const out = [...list];
    const next = random(seed);
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Which part of the arc a 3D mission is in. */
  function stageFor({ eaten = 0, total = 0, remaining = 0 } = {}) {
    if (total > 2 && remaining === 1) return 'finale';
    if (eaten < 2) return 'warmup';
    return 'core';
  }

  function twistFor(skill) {
    return TWISTS[String(skill || '')] || null;
  }

  /** The eaten count at which the twist appears, or -1 when the skill has none. */
  function twistAt({ skill, total = 0 } = {}) {
    return twistFor(skill) && total >= 6 ? Math.floor(total / 2) : -1;
  }

  /**
   * Choices for one prompt.
   * @returns {{choices: string[], targets: string[], stage: string}}
   */
  function choicesFor({ remaining = [], wrong = [], eaten = 0, total = 0, seed = 0, twist = false, correctPool = [] } = {}) {
    const targets = unique(remaining);
    const fillers = rotate(unique(wrong).filter((value) => !targets.includes(value)), eaten);
    if (twist) {
      // One value from the opposite set is the target; three from the mission's own set
      // (already-eaten ones included) are the distractors.
      const odd = fillers.slice(0, 1);
      const distractors = rotate(unique([...targets, ...correctPool]), eaten).slice(0, 3);
      return { choices: permute(unique([...odd, ...distractors]), seed), targets: odd, stage: 'twist' };
    }
    const stage = stageFor({ eaten, total, remaining: targets.length });
    const wanted = stage === 'core' && targets.length >= 2 ? targets.slice(0, 2) : targets.slice(0, 1);
    const list = unique([...wanted, ...fillers]).slice(0, 4);
    return { choices: permute(list, seed), targets: wanted, stage };
  }

  /** One step of the Nibbler toward the pillar Bite chose last. */
  function nibblerNext(slot, towards, count) {
    const size = Math.max(1, Number(count) || 1);
    const from = Math.min(size - 1, Math.max(0, Number(slot) || 0));
    if (towards === null || towards === undefined || Number(towards) === from) return from === size - 1 ? from - 1 < 0 ? 0 : from - 1 : from + 1;
    return from + Math.sign(Number(towards) - from);
  }

  /** Predictable clockwise ring for the Spanish-world grid enemy (was a random teleport). */
  const RING = Object.freeze([[0, 0], [2, 0], [4, 0], [4, 2], [4, 4], [2, 4], [0, 4], [0, 2]]);
  function ringPosition(step) {
    const [x, y] = RING[((Number(step) || 0) % RING.length + RING.length) % RING.length];
    return { x, y };
  }

  const api = Object.freeze({ stageFor, twistFor, twistAt, choicesFor, nibblerNext, ringPosition, permute });
  root.BrainBiteRunBuilder = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
