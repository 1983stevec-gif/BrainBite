/** Batch 9.0 — WebGL capability + feature flag */

export function wantsWebgl() {
  const params = new URLSearchParams(location.search);
  if (params.get('webgl') === '0' || params.get('presentation') === 'dom') return false;
  if (params.get('webgl') === '1' || params.get('presentation') === 'webgl') return true;
  try {
    return localStorage.getItem('bb-presentation') === 'webgl';
  } catch {
    return false;
  }
}

export function canUseWebgl() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function shouldEnableWebgl() {
  if (!wantsWebgl()) return false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return canUseWebgl();
}
