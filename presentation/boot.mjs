import { PresentationAdapter } from './presentation-adapter.mjs';

async function boot() {
  window.BrainBitePresentation = PresentationAdapter;
  window.BrainBiteWorldPreview = Object.freeze({
    setProfile: (profileId) => PresentationAdapter.setWorldProfile(profileId),
    getProfile: () => document.documentElement.dataset.worldProfile || 'jungle-circuit',
  });
  await PresentationAdapter.init();
  // The scene selector is a device setting, not a child control: it lives in the
  // parent-authorized Advanced screen only.
  const badge = document.getElementById('parentPresentationControl');
  if (badge) {
    badge.hidden = true;
    badge.replaceChildren();
    const label = document.createElement('label');
    label.textContent = 'Scene presentation';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Scene presentation');
    for (const [value, text] of [['webgl', 'Live 3D'], ['dom', 'Classic'], ['match', 'Reference preview']]) {
      const option = document.createElement('option');
      option.value = value; option.textContent = text; select.append(option);
    }
    select.value = PresentationAdapter.mode;
    select.addEventListener('change', () => {
      try { localStorage.setItem('bb-presentation', select.value); } catch {}
      const url = new URL(location.href);
      url.searchParams.delete('match'); url.searchParams.delete('webgl');
      url.searchParams.set('presentation', select.value);
      location.assign(url.href);
    });
    label.append(select); badge.append(label);
    window.addEventListener('bb:presentation-fallback', () => {
      select.value = 'dom';
      const status = document.createElement('span'); status.setAttribute('role', 'status');
      status.textContent = '3D unavailable. Classic play is ready.';
      badge.append(status);
    });
  }
  const sync = () => PresentationAdapter.syncFromScreen();
  const obs = new MutationObserver(() => {
    void sync();
  });
  for (const screen of document.querySelectorAll('.screen')) {
    obs.observe(screen, { attributes: true, attributeFilter: ['class'] });
  }

  await sync();
  PresentationAdapter.markReady();

  window.addEventListener('bb:game-draw', () => {
    if (PresentationAdapter.mode === 'dom') return;
    const choices = window.BrainBiteGame?.pillarChoices?.() || [];
    PresentationAdapter.setBattleChoices(choices);
    PresentationAdapter.setBattleNibbler(window.BrainBiteGame?.nibblerState?.() || null);
    PresentationAdapter.setBattleBossState(window.BrainBiteGame?.bossState?.() || null);
    PresentationAdapter.setBattleRescue(window.BrainBiteGame?.rescueValue?.() ?? null);
    PresentationAdapter.syncBattleHud();
  });

  // When entering game via normal UI in match mode, ensure plate mounts
  const origContinue = document.getElementById('continueBtn');
  if (origContinue && PresentationAdapter.mode === 'match') {
    origContinue.addEventListener('click', () => {
      setTimeout(sync, 50);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
