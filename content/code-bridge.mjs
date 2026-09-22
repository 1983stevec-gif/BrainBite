const COMMANDS = Object.freeze(Object.assign(Object.create(null), {
  'bridge.open()': Object.freeze({ type: 'bridge.open' }),
  'bridge.close()': Object.freeze({ type: 'bridge.close' }),
  'player.move()': Object.freeze({ type: 'player.move' }),
  'player.jump()': Object.freeze({ type: 'player.jump' }),
  'gate.unlock()': Object.freeze({ type: 'gate.unlock' }),
  'light.on()': Object.freeze({ type: 'light.on' }),
}));

function parseCommand(line) {
  if (typeof line !== 'string') throw new TypeError('Command must be text.');
  const source = line.trim();
  if (!source || source.startsWith('#')) return null;
  if (Object.hasOwn(COMMANDS, source)) return COMMANDS[source];
  const match = /^platform\.move\(([1-5])\)$/.exec(source);
  if (match) return Object.freeze({ type: 'platform.move', amount: Number(match[1]) });
  throw new Error(`Unsupported command: ${source}`);
}

function parseProgram(program) {
  if (typeof program !== 'string') throw new TypeError('Program must be text.');
  return program.split(/\r?\n/).map(parseCommand).filter(Boolean);
}

function createCodeBridge() {
  let commands = [];
  let cursor = 0;
  let state = { bridgeOpen: false, moved: 0, jumped: false, gateUnlocked: false, lightOn: false, platformOffset: 0 };
  let trace = [];
  const reset = () => { cursor = 0; state = { bridgeOpen: false, moved: 0, jumped: false, gateUnlocked: false, lightOn: false, platformOffset: 0 }; trace = []; return snapshot(); };
  const snapshot = () => Object.freeze({ state: Object.freeze({ ...state }), cursor, total: commands.length, done: cursor >= commands.length, trace: Object.freeze(trace.map(entry => Object.freeze({ ...entry }))) });
  const execute = command => {
    if (command.type === 'bridge.open') state.bridgeOpen = true;
    if (command.type === 'bridge.close') state.bridgeOpen = false;
    if (command.type === 'player.move') state.moved += 1;
    if (command.type === 'player.jump') state.jumped = true;
    if (command.type === 'gate.unlock') state.gateUnlocked = true;
    if (command.type === 'light.on') state.lightOn = true;
    if (command.type === 'platform.move') state.platformOffset += command.amount;
    trace.push({ index: cursor, command: command.type, amount: command.amount ?? null });
  };
  const load = program => { commands = parseProgram(program); return reset(); };
  const step = () => { if (cursor >= commands.length) return snapshot(); const command = commands[cursor]; execute(command); cursor += 1; return snapshot(); };
  const run = program => { load(program); while (cursor < commands.length) { execute(commands[cursor]); cursor += 1; } return snapshot(); };
  return Object.freeze({ load, reset, step, run, getState: snapshot });
}

export { COMMANDS, parseCommand, parseProgram, createCodeBridge };

if (typeof window !== 'undefined') {
  window.BrainBiteCodeBridge = Object.freeze({ COMMANDS, parseCommand, parseProgram, createCodeBridge });
}
