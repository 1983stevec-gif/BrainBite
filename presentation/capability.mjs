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
  return 'webgl';
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
