/** Batch 9 — visual match mode uses approved reference plates + hotspots */

export function requestedPresentation() {
  const params = new URLSearchParams(location.search);
  const explicit = params.get('presentation');
  if (['dom', 'webgl', 'match'].includes(explicit)) return explicit;
  if (params.get('webgl') === '1') return 'webgl';
  if (params.get('match') === '1') return 'match';
  if (params.get('webgl') === '0' || params.get('match') === '0') return 'dom';
  try {
    const stored = localStorage.getItem('bb-presentation');
    if (['dom', 'webgl', 'match'].includes(stored)) return stored;
  } catch {}
  // No explicit or remembered choice: constrained devices start on the DOM path.
  // The 3D hub stays one tap away in Settings, and any explicit query or stored
  // choice above still wins, so tests and parents can force WebGL.
  if (constrainedDevice()) return 'dom';
  return 'webgl';
}
/**
 * True when the device asked for less data or reports very little memory/CPU.
 * Thresholds are deliberately conservative (2 GB / 2 cores) so ordinary phones
 * keep the 3D default; app.js's broader low-end heuristic (4 GB / 4 cores) only
 * trims effects, it does not change the presentation path.
 */
export function constrainedDevice(nav = globalThis.navigator) {
  try {
    if (!nav) return false;
    if (nav.connection?.saveData === true) return true;
    const memory = Number(nav.deviceMemory || 0);
    const cores = Number(nav.hardwareConcurrency || 0);
    return (memory > 0 && memory <= 2) || (cores > 0 && cores <= 2);
  } catch { return false; }
}
export function wantsMatch() { return requestedPresentation() === 'match'; }
export function wantsWebgl() { return requestedPresentation() === 'webgl'; }
export function shouldReduceMotion() {
  const root = document.documentElement;
  const profileReduction = root.classList.contains('reduced-motion') || root.classList.contains('camera-motion-reduction');
  try {
    return profileReduction || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return profileReduction;
  }
}
export function canUseWebgl() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  } catch { return false; }
}
export function shouldEnableWebgl() { return wantsWebgl() && canUseWebgl(); }
export function shouldEnableMatch() { return wantsMatch(); }
