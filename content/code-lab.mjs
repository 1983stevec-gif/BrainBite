import { createCodeBridge, parseProgram } from './code-bridge.mjs';

const CODE_LAB_SCHEMA_VERSION = 1;
const PROJECT_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

function normalizeProjectId(value) {
  const id = String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!PROJECT_ID.test(id)) throw new Error('Project id must use letters, numbers, or hyphens.');
  return id;
}

function validateProgram(program) {
  const commands = parseProgram(program);
  if (!commands.length) throw new Error('Project needs at least one safe command.');
  return commands;
}

function createProject({ id, name = 'Untitled Project', program = '# Start here\nbridge.open()', lastRun = null } = {}) {
  const commands = validateProgram(program);
  const normalizedRun = lastRun && typeof lastRun === 'object' ? Object.freeze({ success: !!lastRun.success, at: Number(lastRun.at) || 0, traceLength: Number(lastRun.traceLength) || 0 }) : null;
  return Object.freeze({ schemaVersion: CODE_LAB_SCHEMA_VERSION, id: normalizeProjectId(id || name), name: String(name).trim().slice(0, 80) || 'Untitled Project', program: String(program), commandCount: commands.length, updatedAt: Date.now(), lastRun: normalizedRun });
}

function runProject(project) {
  const normalized = createProject(project);
  const bridge = createCodeBridge();
  const result = bridge.run(normalized.program);
  const success = !!(result.done && result.state.bridgeOpen && result.state.gateUnlocked);
  return Object.freeze({ project: Object.freeze({ ...normalized, lastRun: Object.freeze({ success, at: Date.now(), traceLength: result.trace.length }) }), result, success });
}

function resetProject(project) {
  return createProject({ ...project, lastRun: null });
}

function serializeProject(project) {
  return JSON.stringify(createProject(project));
}

function deserializeProject(serialized) {
  let value;
  try { value = typeof serialized === 'string' ? JSON.parse(serialized) : serialized; } catch { throw new Error('Project data is not valid JSON.'); }
  if (!value || value.schemaVersion !== CODE_LAB_SCHEMA_VERSION) throw new Error('Unsupported Code Lab project version.');
  return createProject(value);
}

export { CODE_LAB_SCHEMA_VERSION, createProject, runProject, resetProject, serializeProject, deserializeProject };

if (typeof window !== 'undefined') window.BrainBiteCodeLab = Object.freeze({ CODE_LAB_SCHEMA_VERSION, createProject, runProject, resetProject, serializeProject, deserializeProject });
