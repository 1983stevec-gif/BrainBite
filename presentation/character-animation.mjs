import * as THREE from '../vendor/three/three.module.js';

export const CHARACTER_STATES = Object.freeze([
  'idle',
  'success',
  'mistake',
  'recovery',
  'discovery',
  'celebrate',
]);

const STATE_ALIASES = Object.freeze({
  'discovery/celebrate': 'celebrate',
});

const CLIP_OFFSETS = Object.freeze({
  idle: 0,
  success: 0.35,
  mistake: 0.85,
  recovery: 1.15,
  discovery: 1.45,
  celebrate: 1.7,
});

function resolveState(value) {
  const state = STATE_ALIASES[value] || value;
  if (!CHARACTER_STATES.includes(state)) {
    throw new RangeError(`Unknown Bite character state: ${value}`);
  }
  return state;
}

function reactionPose(state, elapsed, reducedMotion) {
  if (state === 'idle') return { y: 0, pitch: 0, yaw: 0, roll: 0, scale: 1 };

  if (reducedMotion) {
    const poses = {
      success: { y: 0.04, pitch: -0.025, yaw: 0, roll: 0, scale: 1.025 },
      mistake: { y: -0.025, pitch: 0.035, yaw: 0, roll: -0.045, scale: 0.985 },
      recovery: { y: 0, pitch: -0.015, yaw: 0, roll: 0.025, scale: 1 },
      discovery: { y: 0.045, pitch: -0.035, yaw: 0.04, roll: 0, scale: 1.02 },
      celebrate: { y: 0.06, pitch: -0.045, yaw: 0, roll: 0.035, scale: 1.035 },
    };
    return poses[state];
  }

  const wave = Math.sin(elapsed * Math.PI * 2.4);
  const quickWave = Math.sin(elapsed * Math.PI * 5.2);
  const pulse = Math.sin(elapsed * Math.PI * 3.2);
  const poses = {
    success: { y: 0.08 + wave * 0.045, pitch: -0.04, yaw: 0, roll: wave * 0.025, scale: 1.035 + pulse * 0.012 },
    mistake: { y: -0.035, pitch: 0.045, yaw: 0, roll: quickWave * 0.075, scale: 0.985 },
    recovery: { y: Math.max(0, wave) * 0.025, pitch: -wave * 0.025, yaw: 0, roll: wave * 0.035, scale: 1 },
    discovery: { y: 0.06 + wave * 0.025, pitch: -0.045, yaw: wave * 0.07, roll: 0, scale: 1.025 + pulse * 0.01 },
    celebrate: { y: 0.1 + Math.abs(wave) * 0.07, pitch: -0.055, yaw: quickWave * 0.08, roll: wave * 0.08, scale: 1.045 + pulse * 0.018 },
  };
  return poses[state];
}

export function createCharacterAnimation(root) {
  const clip = root.animations?.find(animation => animation.name.includes('Bite_Idle'));
  const mixer = clip ? new THREE.AnimationMixer(root) : null;
  mixer?.clipAction(clip).play();
  const basePosition = root.position.clone();
  const baseRotation = root.rotation.clone();
  const baseScale = root.scale.clone();
  let disposed = false;
  let state = 'idle';
  let stateStartedAt = null;
  let appliedPose = reactionPose('idle', 0, false);

  function removePose() {
    root.position.y = basePosition.y;
    root.rotation.copy(baseRotation);
    root.scale.copy(baseScale);
    appliedPose = reactionPose('idle', 0, false);
  }

  function changeState(nextState, restart) {
    if (disposed) return state;
    const resolved = resolveState(nextState);
    if (resolved !== state || restart) {
      removePose();
      state = resolved;
      stateStartedAt = null;
    }
    return state;
  }

  return {
    animated: Boolean(clip),
    get state() { return state; },
    setState(nextState) { return changeState(nextState, false); },
    react(nextState) { return changeState(nextState, true); },
    update(elapsed, reducedMotion = false) {
      if (disposed) return;
      removePose();
      if (stateStartedAt === null) stateStartedAt = elapsed;
      const stateElapsed = Math.max(0, elapsed - stateStartedAt);
      const clipTime = reducedMotion ? CLIP_OFFSETS[state] : elapsed + CLIP_OFFSETS[state];
      mixer?.setTime(clipTime);
      appliedPose = reactionPose(state, stateElapsed, reducedMotion);
      root.position.y = basePosition.y + appliedPose.y;
      root.rotation.x = baseRotation.x + appliedPose.pitch;
      root.rotation.y = baseRotation.y + appliedPose.yaw;
      root.rotation.z = baseRotation.z + appliedPose.roll;
      root.scale.copy(baseScale).multiplyScalar(appliedPose.scale);
    },
    dispose() {
      if (disposed) return;
      removePose();
      disposed = true;
      mixer?.stopAllAction();
      mixer?.uncacheRoot(root);
    },
  };
}
