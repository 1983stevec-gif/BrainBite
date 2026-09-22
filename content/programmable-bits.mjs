const MAX_BEHAVIOR_STEPS = 12;
const EVENTS = Object.freeze(['correct', 'mistake', 'collect', 'reset']);
const ACTIONS = Object.freeze({
  glow: Object.freeze({ type: 'glow' }),
  cheer: Object.freeze({ type: 'cheer' }),
  move: Object.freeze({ type: 'move', amount: 1 }),
  collect: Object.freeze({ type: 'collect' }),
});

function parseAction(value) {
  if (typeof value === 'string' && Object.hasOwn(ACTIONS, value)) return ACTIONS[value];
  if (value && typeof value === 'object' && value.type === 'glow') return ACTIONS.glow;
  if (value && typeof value === 'object' && value.type === 'cheer') return ACTIONS.cheer;
  if (value && typeof value === 'object' && value.type === 'collect') return ACTIONS.collect;
  if (value && typeof value === 'object' && value.type === 'move' && Number.isInteger(value.amount) && value.amount >= 1 && value.amount <= 3) return Object.freeze({ type: 'move', amount: value.amount });
  const match = typeof value === 'string' && /^move\(([1-3])\)$/.exec(value);
  if (match) return Object.freeze({ type: 'move', amount: Number(match[1]) });
  throw new Error(`Unsupported Bit action: ${String(value)}`);
}

function normalizeBehavior(behavior = {}) {
  if (!behavior || typeof behavior !== 'object' || Array.isArray(behavior)) throw new TypeError('Bit behavior must be an object.');
  const result = {};
  for (const event of EVENTS) {
    const values = !Object.hasOwn(behavior, event) || behavior[event] == null ? [] : Array.isArray(behavior[event]) ? Array.from(behavior[event]) : [behavior[event]];
    if (values.length > MAX_BEHAVIOR_STEPS) throw new Error(`Bit behavior exceeds ${MAX_BEHAVIOR_STEPS} steps.`);
    result[event] = Object.freeze(values.map(parseAction));
  }
  return Object.freeze(result);
}

function createBit({ id, name = 'Bit', behavior = {} } = {}) {
  const normalizedId = String(id || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(normalizedId)) throw new Error('Bit id is invalid.');
  if (String(id || '').trim() !== normalizedId) throw new Error('Bit id must use lowercase letters, numbers, and hyphens.');
  return Object.freeze({ id: normalizedId, name: String(name).trim().slice(0, 40) || 'Bit', behavior: normalizeBehavior(behavior) });
}

function createBitRuntime(bit) {
  const definition = createBit(bit);
  let state = { x: 0, glow: false, cheers: 0, collected: 0, lastEvent: null };
  const reset = () => { state = { x: 0, glow: false, cheers: 0, collected: 0, lastEvent: 'reset' }; return snapshot(); };
  const snapshot = () => Object.freeze({ bit: definition, state: Object.freeze({ ...state }) });
  const trigger = event => {
    if (!EVENTS.includes(event)) throw new Error(`Unsupported Bit event: ${String(event)}`);
    if (event === 'reset') return reset();
    for (const action of definition.behavior[event]) {
      if (action.type === 'glow') state.glow = true;
      if (action.type === 'cheer') state.cheers += 1;
      if (action.type === 'move') state.x += action.amount;
      if (action.type === 'collect') state.collected += 1;
    }
    state.lastEvent = event;
    return snapshot();
  };
  return Object.freeze({ trigger, reset, getState: snapshot });
}

export { ACTIONS, EVENTS, MAX_BEHAVIOR_STEPS, createBit, createBitRuntime, normalizeBehavior, parseAction };
if (typeof window !== 'undefined') window.BrainBiteBits = Object.freeze({ ACTIONS, EVENTS, MAX_BEHAVIOR_STEPS, createBit, createBitRuntime, normalizeBehavior, parseAction });
