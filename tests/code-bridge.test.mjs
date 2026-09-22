import test from 'node:test';
import assert from 'node:assert/strict';
import { createCodeBridge, parseCommand, parseProgram } from '../content/code-bridge.mjs';

test('Coding Bridge parses only the allowlisted DSL', () => {
  assert.deepEqual(parseCommand('bridge.open()'), { type: 'bridge.open' });
  assert.deepEqual(parseCommand('platform.move(3)'), { type: 'platform.move', amount: 3 });
  assert.throws(() => parseCommand('bridge.open(unsafe)'), /Unsupported command/);
  assert.throws(() => parseCommand('globalThis.alert(1)'), /Unsupported command/);
  assert.throws(() => parseCommand('toString'), /Unsupported command/);
  assert.throws(() => parseCommand({ toString: () => 'bridge.open()' }), /Command must be text/);
  assert.throws(() => parseProgram('player.move()\nplatform.move(9)'), /Unsupported command/);
});

test('Coding Bridge supports Run, Step, Reset, and an execution trace', () => {
  const bridge = createCodeBridge();
  bridge.load('# lower bridge\nbridge.open()\nplayer.move()\nplatform.move(3)');
  assert.equal(bridge.getState().done, false);
  assert.equal(bridge.step().cursor, 1);
  const result = bridge.run('bridge.open()\nplayer.jump()\ngate.unlock()\nlight.on()\nplatform.move(2)');
  assert.equal(result.done, true);
  assert.deepEqual(result.state, { bridgeOpen: true, moved: 0, jumped: true, gateUnlocked: true, lightOn: true, platformOffset: 2 });
  assert.equal(result.trace.length, 5);
  assert.deepEqual(result.trace.map(entry => entry.command), ['bridge.open', 'player.jump', 'gate.unlock', 'light.on', 'platform.move']);
  const reset = bridge.reset();
  assert.deepEqual(reset.state, { bridgeOpen: false, moved: 0, jumped: false, gateUnlocked: false, lightOn: false, platformOffset: 0 });
  assert.equal(reset.cursor, 0);
});

test('Coding Bridge does not execute commands while parsing', () => {
  const bridge = createCodeBridge();
  assert.throws(() => bridge.run('player.move(); globalThis.process.exit()'), /Unsupported command/);
  assert.equal(bridge.getState().state.moved, 0);
});
