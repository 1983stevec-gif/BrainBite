import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const RB = require('../content/run-builder.js');
const BP = require('../content/boss-phases.js');

const EVENS = ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
const ODDS = ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19'];

test('run builder is deterministic for a seed and only uses the mission content', () => {
  const input = { remaining: EVENS.slice(3), wrong: ODDS, eaten: 3, total: 10, seed: 42 };
  const a = RB.choicesFor(input);
  const b = RB.choicesFor(input);
  assert.deepEqual(a, b);
  for (const value of a.choices) assert.ok(EVENS.includes(value) || ODDS.includes(value));
});

test('warm-up shows one target, core shows two, finale is the last target', () => {
  assert.equal(RB.choicesFor({ remaining: EVENS, wrong: ODDS, eaten: 0, total: 10 }).targets.length, 1);
  const core = RB.choicesFor({ remaining: EVENS.slice(2), wrong: ODDS, eaten: 2, total: 10 });
  assert.equal(core.stage, 'core');
  assert.equal(core.targets.length, 2);
  assert.equal(core.choices.filter((v) => EVENS.includes(v)).length, 2);
  const finale = RB.choicesFor({ remaining: ['20'], wrong: ODDS, eaten: 9, total: 10 });
  assert.equal(finale.stage, 'finale');
  assert.deepEqual(finale.targets, ['20']);
});

test('the correct disc is not always in the same position', () => {
  const positions = new Set();
  for (let eaten = 0; eaten < 8; eaten += 1) {
    const { choices, targets } = RB.choicesFor({ remaining: EVENS.slice(eaten), wrong: ODDS, eaten, total: 10, seed: 97 + eaten * 13 });
    positions.add(choices.indexOf(targets[0]));
  }
  assert.ok(positions.size >= 3, `targets landed only in positions ${[...positions]}`);
});

test('multi-target refills never show an already-eaten value', () => {
  const eatenValues = new Set();
  let remaining = [...EVENS];
  for (let eaten = 0; eaten < 9; eaten += 1) {
    const { choices, targets } = RB.choicesFor({ remaining, wrong: ODDS, eaten, total: 10, seed: eaten });
    for (const value of choices) assert.ok(!eatenValues.has(value), `${value} was already eaten`);
    eatenValues.add(targets[0]);
    remaining = remaining.filter((value) => value !== targets[0]);
  }
});

test('the twist exists only for skills with a clear opposite, and inverts the target', () => {
  assert.equal(RB.twistFor('even-numbers').label, 'odd');
  assert.equal(RB.twistFor('nouns'), null);
  assert.equal(RB.twistAt({ skill: 'nouns', total: 10 }), -1);
  assert.equal(RB.twistAt({ skill: 'even-numbers', total: 10 }), 5);
  const twist = RB.choicesFor({ remaining: EVENS.slice(5), wrong: ODDS, eaten: 5, total: 10, twist: true, correctPool: EVENS });
  assert.equal(twist.stage, 'twist');
  assert.equal(twist.targets.length, 1);
  assert.ok(ODDS.includes(twist.targets[0]));
  assert.equal(twist.choices.filter((v) => EVENS.includes(v)).length, 3);
});

test('the Nibbler steps one pillar toward the last choice and its next move is predictable', () => {
  assert.equal(RB.nibblerNext(3, 0, 4), 2);
  assert.equal(RB.nibblerNext(0, 3, 4), 1);
  assert.equal(RB.nibblerNext(2, 2, 4), 3);
  assert.equal(RB.nibblerNext(3, 3, 4), 2);
  assert.equal(RB.nibblerNext(1, null, 4), 2);
  for (let slot = 0; slot < 4; slot += 1) for (let target = 0; target < 4; target += 1) {
    const next = RB.nibblerNext(slot, target, 4);
    assert.ok(next >= 0 && next < 4 && Math.abs(next - slot) === 1);
  }
});

test('the Spanish grid enemy follows a fixed clockwise ring instead of teleporting', () => {
  const path = Array.from({ length: 9 }, (_, i) => RB.ringPosition(i));
  assert.deepEqual(path[0], path[8]);
  for (const { x, y } of path) assert.ok([0, 2, 4].includes(x) && [0, 2, 4].includes(y));
});

test('boss phases: three phases, eight hits, and phase 3 needs two in a row', () => {
  assert.equal(BP.PHASES.length, 3);
  assert.equal(BP.TOTAL_HITS, 8);
  let run = BP.createRun();
  for (let i = 0; i < 3; i += 1) run = BP.applyAnswer(run, true).run;
  assert.equal(run.phase, 1);
  run = BP.applyAnswer(run, false).run;
  assert.equal(run.hits, 3);
  for (let i = 0; i < 3; i += 1) run = BP.applyAnswer(run, true).run;
  assert.equal(BP.currentPhase(run).id, 'two-in-a-row');
  let step = BP.applyAnswer(run, true);
  assert.equal(step.hit, false);
  step = BP.applyAnswer(step.run, false);
  assert.equal(step.run.streak, 0);
  step = BP.applyAnswer(step.run, true); step = BP.applyAnswer(step.run, true);
  assert.equal(step.hit, true);
  assert.equal(step.won, false);
  step = BP.applyAnswer(step.run, true); step = BP.applyAnswer(step.run, true);
  assert.equal(step.won, true);
  assert.equal(BP.health(step.run), 0);
});

test('the boss cannot be beaten while skipping a phase, and wrong answers never add hits', () => {
  let run = BP.createRun();
  for (let i = 0; i < 20; i += 1) run = BP.applyAnswer(run, false).run;
  assert.equal(run.hits, 0);
  assert.equal(run.won, false);
});

test('the tentacle never wraps a correct answer', () => {
  for (let seed = 0; seed < 20; seed += 1) {
    const blocked = BP.blockedChoice(['2', '3', '4', '5'], ['3', '5'], seed);
    assert.ok(['2', '4'].includes(blocked));
  }
  assert.equal(BP.blockedChoice(['3'], ['3'], 0), null);
});
