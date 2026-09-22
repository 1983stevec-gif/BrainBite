export function graphicsProfile(classes, dpr = 1) {
  const names = new Set(classes);
  const tier = ['mobile', 'performance', 'ultra', 'high', 'balanced']
    .find(value => names.has(`quality-${value}`)) || 'balanced';
  const constrained = names.has('low-end-device') || ['mobile', 'performance'].includes(tier);
  const shadowSize = constrained ? 0 : ['ultra', 'high'].includes(tier) ? 2048 : 1024;
  const cap = constrained ? 1 : tier === 'ultra' ? 2 : tier === 'high' ? 1.75 : 1.5;
  return { tier, shadowSize, pixelRatio: Math.min(Math.max(Number(dpr) || 1, 1), cap) };
}

export function createQualityController(renderer, scene, sun, host) {
  let key = '';
  return () => {
    const profile = graphicsProfile(document.documentElement.classList, devicePixelRatio);
    const next = JSON.stringify(profile);
    if (next === key) return;
    key = next;
    renderer.setPixelRatio(profile.pixelRatio);
    renderer.shadowMap.enabled = Boolean(profile.shadowSize);
    sun.castShadow = Boolean(profile.shadowSize);
    if (!profile.shadowSize || sun.shadow.mapSize.x !== profile.shadowSize) {
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      if (profile.shadowSize) sun.shadow.mapSize.set(profile.shadowSize, profile.shadowSize);
    }
    scene.traverse(child => {
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        if (material) material.needsUpdate = true;
      }
    });
    host.dataset.graphicsTier = profile.tier;
    host.dataset.shadowSize = String(profile.shadowSize);
    host.dataset.pixelRatio = String(renderer.getPixelRatio());
  };
}
