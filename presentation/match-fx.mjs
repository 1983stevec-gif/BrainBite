/** Lightweight FX overlays for MATCH plates */

export function mountMatchFx(stage, kind = 'home') {
  const fx = document.createElement('div');
  fx.className = `match-fx match-fx-${kind}`;
  fx.setAttribute('aria-hidden', 'true');

  const sheen = document.createElement('div');
  sheen.className = 'match-sheen';
  fx.appendChild(sheen);

  if (kind === 'home') {
    const portal = document.createElement('div');
    portal.className = 'match-portal-glow';
    fx.appendChild(portal);
    const dust = document.createElement('div');
    dust.className = 'match-dust';
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.style.setProperty('--i', String(i));
      p.style.setProperty('--x', `${8 + Math.random() * 84}%`);
      p.style.setProperty('--d', `${6 + Math.random() * 10}s`);
      p.style.setProperty('--delay', `${-Math.random() * 8}s`);
      dust.appendChild(p);
    }
    fx.appendChild(dust);
  }

  if (kind === 'battle') {
    const shafts = document.createElement('div');
    shafts.className = 'match-shafts';
    fx.appendChild(shafts);

    const mist = document.createElement('div');
    mist.className = 'match-mist';
    fx.appendChild(mist);

    const falls = document.createElement('div');
    falls.className = 'match-falls';
    for (const pos of [
      [22, 18, 4, 28],
      [48, 12, 5, 32],
      [71, 16, 3.5, 26],
    ]) {
      const f = document.createElement('span');
      f.style.setProperty('--fx', String(pos[0]));
      f.style.setProperty('--fy', String(pos[1]));
      f.style.setProperty('--fw', String(pos[2]));
      f.style.setProperty('--fh', String(pos[3]));
      falls.appendChild(f);
    }
    fx.appendChild(falls);

    const water = document.createElement('div');
    water.className = 'match-water';
    fx.appendChild(water);

    const caustic = document.createElement('div');
    caustic.className = 'match-caustic';
    fx.appendChild(caustic);

    const dust = document.createElement('div');
    dust.className = 'match-dust match-battle-dust';
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('span');
      p.style.setProperty('--i', String(i));
      p.style.setProperty('--x', `${10 + Math.random() * 80}%`);
      p.style.setProperty('--d', `${7 + Math.random() * 11}s`);
      p.style.setProperty('--delay', `${-Math.random() * 9}s`);
      dust.appendChild(p);
    }
    fx.appendChild(dust);

    // Default highlight sits on pillar 2 (matches plate art)
    stage.style.setProperty('--hl-x', '56');
    stage.style.setProperty('--hl-y', '64');

    const ring = document.createElement('div');
    ring.className = 'match-select-ring';
    fx.appendChild(ring);

    const sparks = document.createElement('div');
    sparks.className = 'match-sparks';
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('span');
      s.style.setProperty('--i', String(i));
      sparks.appendChild(s);
    }
    fx.appendChild(sparks);

    const flash = document.createElement('div');
    flash.className = 'match-flash';
    fx.appendChild(flash);

    const toast = document.createElement('div');
    toast.className = 'match-toast';
    toast.hidden = true;
    fx.appendChild(toast);

    const combo = document.createElement('div');
    combo.className = 'match-live-combo';
    fx.appendChild(combo);

    const goal = document.createElement('div');
    goal.className = 'match-live-goal';
    goal.setAttribute('aria-live', 'polite');
    goal.innerHTML = '<small>CURRENT GOAL</small><strong class="match-goal-title"></strong><div class="match-goal-bar"><span></span></div><p class="match-goal-text"></p>';
    fx.appendChild(goal);

    const health = document.createElement('div');
    health.className = 'match-live-health';
    health.innerHTML = '<span class="match-health-heart" aria-hidden="true">❤</span><div class="match-health-track"><span class="match-health-fill"></span></div><strong class="match-health-text"></strong>';
    fx.appendChild(health);

    const boss = document.createElement('div');
    boss.className = 'match-live-boss';
    boss.setAttribute('aria-live', 'polite');
    boss.innerHTML = '<strong class="match-boss-name"></strong><div class="match-boss-track"><span class="match-boss-fill"></span></div><p class="match-boss-phase"></p>';
    fx.appendChild(boss);

    const targets = document.createElement('div');
    targets.className = 'match-live-targets';
    targets.setAttribute('aria-live', 'polite');
    fx.appendChild(targets);
  }

  stage.appendChild(fx);
  return fx;
}

export function moveMatchHighlight(stage, box) {
  if (!stage || !box) return;
  const [x, y, w, h] = box;
  // Aim ring at lower third of pillar (waterline / base glow)
  stage.style.setProperty('--hl-x', String(x + w / 2));
  stage.style.setProperty('--hl-y', String(y + h * 0.62));
}

export function pulseMatchResult(stage, ok) {
  if (!stage) return;
  const flash = stage.querySelector('.match-flash');
  const ring = stage.querySelector('.match-select-ring');
  const sparks = stage.querySelector('.match-sparks');
  stage.classList.remove('match-ok', 'match-miss');
  void stage.offsetWidth;
  stage.classList.add(ok ? 'match-ok' : 'match-miss');
  flash?.classList.remove('on');
  void flash?.offsetWidth;
  flash?.classList.add('on');
  if (ok) {
    ring?.classList.add('match-ring-burst');
    sparks?.classList.add('match-sparks-burst');
    window.setTimeout(() => {
      ring?.classList.remove('match-ring-burst');
      sparks?.classList.remove('match-sparks-burst');
    }, 900);
  }
  window.setTimeout(() => {
    stage.classList.remove('match-ok', 'match-miss');
    flash?.classList.remove('on');
  }, 700);
}

export function showMatchToast(stage, text, ok = true) {
  const toast = stage?.querySelector('.match-toast');
  if (!toast || !text) return;
  toast.hidden = false;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = text;
  toast.classList.toggle('is-ok', ok);
  toast.classList.toggle('is-miss', !ok);
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 1600);
}

export function syncMatchLiveHud(stage) {
  if (!stage) return;
  const comboEl = stage.querySelector('.match-live-combo');
  const combo = document.getElementById('combo')?.textContent?.trim();
  if (comboEl) {
    const n = Number(combo) || 0;
    comboEl.textContent = n > 0 ? `Combo x${n}` : '';
    comboEl.classList.toggle('on', n > 0);
  }

  const goalTitle = document.getElementById('battleGoalTitle')?.textContent?.trim() || '';
  const goalText = document.getElementById('battleGoalText')?.textContent?.trim() || '';
  const eaten = document.getElementById('targets')?.textContent?.trim() || '';
  const goalRoot = stage.querySelector('.match-live-goal');
  if (goalRoot) {
    const t = goalRoot.querySelector('.match-goal-title');
    const p = goalRoot.querySelector('.match-goal-text');
    const fill = goalRoot.querySelector('.match-goal-bar span');
    if (t) t.textContent = goalTitle;
    if (p) p.textContent = goalText;
    const m = /^(\d+)\s*\/\s*(\d+)/.exec(eaten || '');
    const pct = m && Number(m[2]) ? Math.max(0, Math.min(100, (Number(m[1]) / Number(m[2])) * 100)) : 0;
    if (fill) fill.style.width = `${pct}%`;
    goalRoot.classList.toggle('on', !!(goalTitle || goalText));
  }

  const lives = Number(document.getElementById('lives')?.textContent) || 0;
  const healthRoot = stage.querySelector('.match-live-health');
  if (healthRoot) {
    const fill = healthRoot.querySelector('.match-health-fill');
    const text = healthRoot.querySelector('.match-health-text');
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, (lives / 3) * 100))}%`;
    if (text) text.textContent = `${lives} / 3`;
    healthRoot.classList.add('on');
  }

  const bossRoot = stage.querySelector('.match-live-boss');
  if (bossRoot) {
    const name = document.getElementById('bossName')?.textContent?.trim() || 'Boss';
    const phase = document.getElementById('bossPhase')?.textContent?.trim() || '';
    const bar = document.getElementById('bossHealth');
    const pct = bar ? Math.max(0, Math.min(100, (Number(bar.value) / Number(bar.max || 100)) * 100)) : 100;
    const n = bossRoot.querySelector('.match-boss-name');
    const f = bossRoot.querySelector('.match-boss-fill');
    const p = bossRoot.querySelector('.match-boss-phase');
    if (n) n.textContent = name;
    if (f) f.style.width = `${pct}%`;
    if (p) p.textContent = phase;
    bossRoot.classList.add('on');
  }

  const targetsEl = stage.querySelector('.match-live-targets');
  if (targetsEl) {
    targetsEl.textContent = eaten ? `Targets ${eaten}` : '';
    targetsEl.classList.toggle('on', !!eaten);
  }
}

export function pulseHotspot(btn) {
  if (!btn) return;
  btn.classList.remove('match-tap');
  void btn.offsetWidth;
  btn.classList.add('match-tap');
  window.setTimeout(() => btn.classList.remove('match-tap'), 450);
}
