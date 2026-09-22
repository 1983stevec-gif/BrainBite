import test from 'node:test';
import assert from 'node:assert/strict';
import { createBit, createBitRuntime, MAX_BEHAVIOR_STEPS, parseAction } from '../content/programmable-bits.mjs';

test('programmable Bits execute only declarative bounded actions', () => {
  const bit = createBit({ id: 'spark-bit', behavior: { correct: ['glow', 'cheer', 'move(2)'], collect: 'collect' } });
  const runtime = createBitRuntime(bit);
  const state = runtime.trigger('correct').state;
  assert.deepEqual({ x: state.x, glow: state.glow, cheers: state.cheers }, { x: 2, glow: true, cheers: 1 });
  assert.equal(runtime.trigger('collect').state.collected, 1);
  assert.throws(() => parseAction('globalThis.alert(1)'), /Unsupported/);
});

test('programmable Bits reset deterministically and reject oversized behavior', () => {
  const runtime = createBitRuntime({ id: 'reset-bit', behavior: { correct: ['move(3)'] } });
  runtime.trigger('correct');
  assert.equal(runtime.trigger('reset').state.x, 0);
  assert.throws(() => createBit({ id: 'too-many', behavior: { correct: Array(MAX_BEHAVIOR_STEPS + 1).fill('glow') } }), /exceeds/);
  assert.throws(() => runtime.trigger('unknown'), /Unsupported/);
});

test('programmable Bits reject ambiguous IDs and inherited or sparse behavior', () => {
  assert.throws(() => createBit({ id: 'My Bit' }), /lowercase/);
  const inherited = Object.create({ correct: ['glow'] });
  const bit = createBit({ id: 'safe-bit', behavior: inherited });
  assert.deepEqual(bit.behavior.correct, []);
  const sparse = []; sparse.length = 2; sparse[1] = 'glow';
  assert.throws(() => createBit({ id: 'sparse-bit', behavior: { correct: sparse } }), /Unsupported/);
});
