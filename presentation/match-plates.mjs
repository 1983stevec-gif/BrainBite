/** Full-bleed approved plates + hotspots + motion FX */

import {
  mountMatchFx,
  pulseHotspot,
  moveMatchHighlight,
  pulseMatchResult,
  showMatchToast,
  syncMatchLiveHud,
} from './match-fx.mjs';

const HOME_PLATE = 'docs/references/home-dashboard-target.jpg';
const BATTLE_PLATE = 'docs/references/battle-hud-target.jpg';
const PLATE_VER = 'v=12';

const PILLAR_BOXES = [
  [18, 46, 14, 30],
  [34, 46, 14, 30],
  [49, 46, 14, 30],
  [64, 46, 14, 30],
];

export function preloadMatchPlates() {
  for (const src of [HOME_PLATE, BATTLE_PLATE]) {
    const img = new Image();
    img.src = `${src}?${PLATE_VER}`;
  }
}

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function layoutHotspots(stage, img) {
  const nw = img.naturalWidth || 1;
  const nh = img.naturalHeight || 1;
  const cw = stage.clientWidth || window.innerWidth;
  const ch = stage.clientHeight || window.innerHeight;
  const scale = Math.max(cw / nw, ch / nh);
  const rw = nw * scale;
  const rh = nh * scale;
  const left = (cw - rw) / 2;
  const top = (ch - rh) / 2;
  stage.style.setProperty('--plate-left', `${left}px`);
  stage.style.setProperty('--plate-top', `${top}px`);
  stage.style.setProperty('--plate-w', `${rw}px`);
  stage.style.setProperty('--plate-h', `${rh}px`);
}

function bindLayout(stage, img) {
  const run = () => layoutHotspots(stage, img);
  if (img.complete) run();
  else img.addEventListener('load', run, { once: true });
  window.addEventListener('resize', run);
  return () => window.removeEventListener('resize', run);
}

function spot(stage, cls, label, action, box) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `match-hotspot ${cls}`;
  b.setAttribute('aria-label', label);
  const [x, y, w, h] = box;
  b.style.left = `calc(var(--plate-left) + var(--plate-w) * ${x / 100})`;
  b.style.top = `calc(var(--plate-top) + var(--plate-h) * ${y / 100})`;
  b.style.width = `calc(var(--plate-w) * ${w / 100})`;
  b.style.height = `calc(var(--plate-h) * ${h / 100})`;
  b.addEventListener('click', (e) => {
    e.preventDefault();
    pulseHotspot(b);
    action();
  });
  stage.appendChild(b);
  return b;
}

function buildStage(layer, plateSrc, alt, kind) {
  const stage = document.createElement('div');
  stage.className = `match-stage match-stage-${kind}`;
  layer.appendChild(stage);

  const wrap = document.createElement('div');
  wrap.className = 'match-plate-wrap';
  stage.appendChild(wrap);

  const img = document.createElement('img');
  img.className = 'match-plate';
  img.src = `${plateSrc}?${PLATE_VER}`;
  img.alt = alt;
  img.draggable = false;
  wrap.appendChild(img);

  mountMatchFx(stage, kind);
  const unbind = bindLayout(stage, img);
  return { stage, img, unbind };
}

export function mountHomeMatch(root) {
  const host = root || document.getElementById('home');
  if (!host) return { dispose() {} };

  preloadMatchPlates();

  let layer = host.querySelector('.match-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'match-layer match-home';
    host.appendChild(layer);
  }
  clear(layer);

  const { stage, unbind } = buildStage(layer, HOME_PLATE, 'BrainBite home hub', 'home');

  const goContinue = () => document.getElementById('continueBtn')?.click();
  spot(stage, 'hs-play', 'Play Jungle Circuit', goContinue, [2.5, 17, 23, 8.5]);
  spot(stage, 'hs-brain', 'Brain Bite practice', () => document.querySelector('[data-screen="practice"]')?.click(), [2.5, 26.5, 23, 7.5]);
  spot(stage, 'hs-quests', 'Quests', () => document.querySelector('[data-screen="math"]')?.click(), [2.5, 35.5, 23, 7.5]);
  spot(stage, 'hs-base', 'BrainBase', () => document.querySelector('[data-screen="brainbase"]')?.click(), [2.5, 44.5, 23, 7.5]);
  spot(stage, 'hs-shop', 'Shop', () => document.querySelector('[data-screen="bites"]')?.click(), [2.5, 53.5, 23, 7.5]);
  spot(stage, 'hs-worlds', 'Worlds adventure map', () => document.querySelector('[data-screen="math"]')?.click(), [2.5, 62.5, 23, 7.5]);
  spot(stage, 'hs-achieve', 'Achievements', () => document.querySelector('[data-screen="diagnostics"]')?.click(), [82.5, 3.5, 4.5, 7]);
  spot(stage, 'hs-settings', 'Settings', () => document.querySelector('[data-screen="settings"]')?.click(), [87.5, 3.5, 4.5, 7]);
  spot(stage, 'hs-parents', 'Parents', () => document.getElementById('parentNav')?.click(), [92.5, 3.5, 4.5, 7]);
  spot(stage, 'hs-news', 'News and events', () => document.querySelector('[data-screen="release"]')?.click(), [3, 82, 36, 14]);
  spot(stage, 'hs-dock-profile', 'Profile', () => document.querySelector('[data-screen="profiles"]')?.click(), [28, 89, 6.5, 8]);
  spot(stage, 'hs-dock-friends', 'Friends', () => document.querySelector('[data-screen="profiles"]')?.click(), [35.5, 89, 6.5, 8]);
  spot(stage, 'hs-dock-collection', 'Collection', () => document.querySelector('[data-screen="bites"]')?.click(), [43, 89, 6.5, 8]);
  spot(stage, 'hs-dock-badges', 'Badges', () => document.querySelector('[data-screen="diagnostics"]')?.click(), [50.5, 89, 6.5, 8]);
  spot(stage, 'hs-dock-boards', 'Leaderboards', () => document.querySelector('[data-screen="release"]')?.click(), [58, 89, 6.5, 8]);
  spot(stage, 'hs-whatsnew', "See what's new", () => document.querySelector('[data-screen="release"]')?.click(), [71, 84, 18, 8]);
  // Portal keeps the approved fractions plate demo; PLAY uses Continue / lastMission.
  spot(stage, 'hs-portal', 'Enter Play Portal', () => window.BrainBiteGame?.startPracticeMission?.(8), [58, 42, 14, 22]);

  return {
    kind: 'home-match',
    dispose() { unbind(); layer?.remove(); },
  };
}

export function mountBattleMatch(root, { onSelect } = {}) {
  const host = root || document.getElementById('game');
  if (!host) return { dispose() {} };

  let layer = host.querySelector('.match-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'match-layer match-battle';
    host.appendChild(layer);
  }
  clear(layer);

  const { stage, unbind } = buildStage(layer, BATTLE_PLATE, 'BrainBite battle arena', 'battle');

  let answers = ['1/3', '2/4', '2/4', '3/4'];
  const pillarBtns = [];

  answers.forEach((value, i) => {
    const btn = spot(stage, `hs-pillar hs-pillar-${i}`, `Choose ${value}`, () => {
      moveMatchHighlight(stage, PILLAR_BOXES[i]);
      const before = window.BrainBiteGame?.getState?.()?.correct ?? 0;
      onSelect?.(answers[i]);
      const after = window.BrainBiteGame?.getState?.()?.correct ?? 0;
      const ok = after > before;
      pulseMatchResult(stage, ok);
      showMatchToast(
        stage,
        ok ? 'Great job! +25 BrainBites' : `Not ${answers[i]}. Try another.`,
        ok
      );
      syncMatchLiveHud(stage);
    }, PILLAR_BOXES[i]);
    pillarBtns.push(btn);
  });

  // Start with plate-accurate highlight on pillar 2
  moveMatchHighlight(stage, PILLAR_BOXES[2]);
  syncMatchLiveHud(stage);

  const a11y = document.createElement('div');
  a11y.className = 'match-a11y-strip';
  const promptLive = document.createElement('p');
  promptLive.className = 'match-prompt-live';
  promptLive.setAttribute('aria-live', 'polite');
  const captionLive = document.createElement('p');
  captionLive.className = 'match-caption-live';
  captionLive.hidden = true;
  a11y.appendChild(promptLive);
  a11y.appendChild(captionLive);
  stage.appendChild(a11y);

  const syncA11y = () => {
    const prompt = document.getElementById('prompt')?.textContent?.trim() || '';
    const feedback = document.getElementById('feedback')?.textContent?.trim() || '';
    promptLive.textContent = prompt || feedback;
    const captionsOn = document.documentElement.classList.contains('captions-on');
    const captionSrc = document.getElementById('captionText')?.textContent?.trim() || prompt;
    captionLive.textContent = captionSrc;
    captionLive.hidden = !captionsOn || !captionSrc;
  };
  syncA11y();
  const onDraw = () => syncA11y();
  window.addEventListener('bb:game-draw', onDraw);

  spot(stage, 'hs-pause', 'Exit', () => document.getElementById('exitBtn')?.click(), [92, 3.5, 5, 7]);
  spot(stage, 'hs-speak', 'Repeat prompt', () => document.getElementById('speakPrompt')?.click(), [26, 4, 5, 7]);
  spot(stage, 'hs-battle-base', 'BrainBase', () => document.querySelector('#game [data-screen="brainbase"]')?.click() || document.querySelector('[data-screen="brainbase"]')?.click(), [4, 90, 8, 8]);
  spot(stage, 'hs-battle-quests', 'Quests', () => document.querySelector('#game [data-screen="math"]')?.click() || document.querySelector('[data-screen="math"]')?.click(), [12, 90, 8, 8]);
  spot(stage, 'hs-battle-inv', 'Inventory', () => document.querySelector('#game [data-screen="bites"]')?.click() || document.querySelector('[data-screen="bites"]')?.click(), [20, 90, 8, 8]);
  spot(stage, 'hs-battle-stats', 'Stats', () => document.querySelector('#game [data-screen="diagnostics"]')?.click() || document.querySelector('[data-screen="diagnostics"]')?.click(), [28, 90, 8, 8]);
  spot(stage, 'hs-battle-settings', 'Settings', () => document.querySelector('#game [data-screen="settings"]')?.click() || document.querySelector('[data-screen="settings"]')?.click(), [36, 90, 8, 8]);

  let highlightIdx = 2;
  const onKey = (e) => {
    if (!document.getElementById('game')?.classList.contains('show')) return;
    if (document.documentElement.classList.contains('presentation-match-game-dom')) return;
    const k = e.key;
    if (k >= '1' && k <= '4') {
      const i = Number(k) - 1;
      if (!pillarBtns[i]) return;
      e.preventDefault();
      highlightIdx = i;
      pillarBtns[i].click();
      return;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      e.preventDefault();
      highlightIdx = (highlightIdx + 3) % 4;
      moveMatchHighlight(stage, PILLAR_BOXES[highlightIdx]);
      return;
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault();
      highlightIdx = (highlightIdx + 1) % 4;
      moveMatchHighlight(stage, PILLAR_BOXES[highlightIdx]);
      return;
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      pillarBtns[highlightIdx]?.click();
    }
  };
  document.addEventListener('keydown', onKey);

  return {
    kind: 'battle-match',
    setChoices(choices = []) {
      const next = choices.filter(Boolean).slice(0, 4);
      if (!next.length) return;
      answers = next;
      pillarBtns.forEach((btn, i) => {
        if (!answers[i]) return;
        btn.setAttribute('aria-label', `Choose ${answers[i]}`);
      });
      syncMatchLiveHud(stage);
    },
    highlight(value) {
      const idx = answers.findIndex((v) => String(v) === String(value));
      if (idx >= 0) {
        highlightIdx = idx;
        moveMatchHighlight(stage, PILLAR_BOXES[idx]);
      }
      syncMatchLiveHud(stage);
    },
    syncHud() {
      syncMatchLiveHud(stage);
      syncA11y();
    },
    dispose() {
      window.removeEventListener('bb:game-draw', onDraw);
      document.removeEventListener('keydown', onKey);
      unbind();
      layer?.remove();
    },
  };
}
