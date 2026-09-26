import { shouldEnableWebgl, shouldEnableMatch } from './capability.mjs';

import { createPerformanceBudget } from './performance-budget.mjs';

let homeView = null;
let battleView = null;
let mode = 'dom'; // dom | webgl | match
let webglHomeFactory = null;
let webglBattleFactory = null;
let matchHomeFactory = null;
let matchBattleFactory = null;
let homeGeneration = 0;
let battleGeneration = 0;
let homePending = false;
let battlePending = false;
let lastBattleEvidence = { correct: 0, wrong: 0 };
let screenSyncPromise = null;
let screenSyncQueued = false;
const runtimePerformanceBudget = createPerformanceBudget();
const MAX_NAVIGATION_SAMPLES = 50;

export function createPresentationTelemetry({
  clock = globalThis.performance,
  performanceBudget = createPerformanceBudget({ clock }),
} = {}) {
  const startupStartedAt = clock.now();
  const navigationSamples = [];
  let activeScreen = null;
  let readiness = null;

  async function syncScreen(screen, synchronize) {
    const from = activeScreen;
    const changed = from !== null && screen !== from;
    const startedAt = changed ? clock.now() : null;
    activeScreen = screen;
    await synchronize();
    if (!changed) return null;

    const completedAt = clock.now();
    const sample = {
      from,
      to: screen,
      startedAtMs: startedAt,
      completedAtMs: completedAt,
      durationMs: Math.max(0, completedAt - startedAt),
    };
    performanceBudget.recordSceneLoad(sample.durationMs);
    navigationSamples.push(sample);
    if (navigationSamples.length > MAX_NAVIGATION_SAMPLES) navigationSamples.shift();
    return { ...sample };
  }

  function markReady(screen = activeScreen) {
    if (readiness) return { ...readiness };
    const readyAt = clock.now();
    readiness = {
      screen,
      startedAtMs: startupStartedAt,
      readyAtMs: readyAt,
      durationMs: Math.max(0, readyAt - startupStartedAt),
    };
    performanceBudget.recordStartup(readiness.durationMs);
    return { ...readiness };
  }

  function report() {
    const budgetReport = performanceBudget.report();
    const screenNavigation = {
      count: navigationSamples.length,
      last: navigationSamples.length ? { ...navigationSamples.at(-1) } : null,
      samples: navigationSamples.map(sample => ({ ...sample })),
    };
    const readinessReport = readiness ? { ...readiness } : null;
    return {
      ...budgetReport,
      readiness: readinessReport,
      screenNavigation,
      telemetry: {
        readiness: readinessReport,
        screenNavigation,
      },
    };
  }

  return Object.freeze({ markReady, report, syncScreen });
}

const runtimeTelemetry = createPresentationTelemetry({
  performanceBudget: runtimePerformanceBudget,
});

function setModeClass() {
  document.documentElement.classList.toggle('presentation-webgl', mode === 'webgl');
  document.documentElement.classList.toggle('presentation-match', mode === 'match');
}

async function loadWebglFactories() {
  if (webglHomeFactory && webglBattleFactory) return;
  const [{ createHomeScene }, { createBattleScene }] = await Promise.all([
    import('./webgl-home.mjs'),
    import('./webgl-battle.mjs'),
  ]);
  webglHomeFactory = createHomeScene;
  webglBattleFactory = createBattleScene;
}

async function loadMatchFactories() {
  if (matchHomeFactory && matchBattleFactory) return;
  const { mountHomeMatch, mountBattleMatch } = await import('./match-plates.mjs');
  matchHomeFactory = mountHomeMatch;
  matchBattleFactory = mountBattleMatch;
}

export const PresentationAdapter = {
  get enabled() { return mode !== 'dom'; },
  get mode() { return mode; },
  async init() {
    if (shouldEnableMatch()) mode = 'match';
    else if (shouldEnableWebgl()) mode = 'webgl';
    else mode = 'dom';
    setModeClass();
    console.info(`[BrainBite] presentation mode: ${mode}`);
    return mode !== 'dom';
  },
  async setWorldProfile(profileId = 'jungle-circuit') {
    const next = profileId === 'bubble-reef' ? 'bubble-reef' : 'jungle-circuit';
    document.documentElement.dataset.worldProfile = next;
    if (document.getElementById('home')?.classList.contains('show') && mode !== 'dom') {
      this.disposeHome();
      await this.mountHome();
    }
    return next;
  },
  async mountHome() {
    this.disposeHome();
    if (mode === 'match') {
      const generation = homeGeneration;
      homePending = true;
      try {
        await loadMatchFactories();
        if (generation !== homeGeneration || mode !== 'match' || !document.getElementById('home')?.classList.contains('show')) return;
        homeView = matchHomeFactory(document.getElementById('home'));
      } catch (error) {
        if (generation === homeGeneration) this.fallbackToDom(error);
      } finally {
        if (generation === homeGeneration) homePending = false;
      }
      return;
    }
    if (mode !== 'webgl') return;
    const host = document.querySelector('#home .home-stage');
    if (!host) return;
    const generation = homeGeneration;
    homePending = true;
    try {
      await loadWebglFactories();
      if (generation !== homeGeneration || mode !== 'webgl' || !document.getElementById('home')?.classList.contains('show')) return;
      homeView = webglHomeFactory(host, {
        worldProfile: document.documentElement.dataset.worldProfile || 'jungle-circuit',
        onContextLost: () => this.fallbackToDom(),
        onContextRestored: () => this.announceContextRestored(),
        onPlay: () => document.getElementById('continueBtn')?.click(),
      });
    } catch (error) {
      if (generation === homeGeneration) this.fallbackToDom(error);
    } finally {
      if (generation === homeGeneration) homePending = false;
    }
  },
  disposeHome() {
    homeGeneration++;
    homePending = false;
    homeView?.dispose?.();
    homeView = null;
  },
  async mountBattle(handlers = {}) {
    this.disposeBattle();
    document.documentElement.classList.remove('presentation-match-game-dom');
    if (mode === 'match') {
      const skill = window.BrainBiteGame?.getState?.()?.m?.skill;
      // Fraction plate is mission-art specific; other skills use the real battle shell.
      if (skill && skill !== 'fractions') {
        document.documentElement.classList.add('presentation-match-game-dom');
        battleView = {
          kind: 'battle-dom-under-match',
          setChoices() {},
          highlight() {},
          syncHud() {},
          dispose() {
            document.documentElement.classList.remove('presentation-match-game-dom');
          },
        };
        return;
      }
      const generation = battleGeneration;
      battlePending = true;
      try {
        await loadMatchFactories();
        if (generation !== battleGeneration || mode !== 'match' || !document.getElementById('game')?.classList.contains('show')) return;
        battleView = matchBattleFactory(document.getElementById('game'), handlers);
      } catch (error) {
        if (generation === battleGeneration) this.fallbackToDom(error);
      } finally {
        if (generation === battleGeneration) battlePending = false;
      }
      return;
    }
    if (mode !== 'webgl') return;
    const host = document.querySelector('#game .battle-frame');
    if (!host) return;
    const generation = battleGeneration;
    battlePending = true;
    try {
      await loadWebglFactories();
      if (generation !== battleGeneration || mode !== 'webgl' || !document.getElementById('game')?.classList.contains('show')) return;
      battleView = webglBattleFactory(host, { ...handlers, onContextLost: () => this.fallbackToDom(), onContextRestored: () => this.announceContextRestored() });
    } catch (error) {
      if (generation === battleGeneration) this.fallbackToDom(error);
    } finally {
      if (generation === battleGeneration) battlePending = false;
    }
  },
  disposeBattle() {
    battleGeneration++;
    battlePending = false;
    battleView?.dispose?.();
    battleView = null;
    document.documentElement.classList.remove('presentation-match-game-dom');
  },
  setBattleChoices(choices) {
    battleView?.setChoices?.(choices);
  },
  setBattleRescue(value) {
    battleView?.setRescue?.(value);
  },
  setBattleBossState(state) {
    battleView?.setBossState?.(state);
  },
  setBattleNibbler(state) {
    battleView?.setNibbler?.(state);
  },
  highlightBattle(value) {
    battleView?.highlight?.(value);
  },
  getPerformanceReport() {
    return {
      runtime: runtimeTelemetry.report(),
      home: homeView?.getPerformanceReport?.() || null,
      battle: battleView?.getPerformanceReport?.() || null,
    };
  },
  markReady() {
    return runtimeTelemetry.markReady();
  },
  recordSave(durationMs) {
    runtimePerformanceBudget.recordSave(durationMs);
  },
  syncBattleHud() {
    const state = window.BrainBiteGame?.getState?.();
    const view = battleView;
    if (!view) return;
    view.setEncounter?.(state?.m);
    if (state) {
      if (state.correct > lastBattleEvidence.correct) battleView?.react?.('success');
      else if (state.wrong > lastBattleEvidence.wrong) battleView?.react?.('mistake');
      lastBattleEvidence = { correct: state.correct || 0, wrong: state.wrong || 0 };
    }
    view.syncHud?.();
  },
  // A restored context keeps the child in the same scene, so only a quiet status note
  // is needed; the mission, answers, and evidence never change.
  announceContextRestored() {
    const status = document.getElementById('feedback');
    if (status) status.textContent = 'The 3D scene reconnected. Keep playing.';
    window.dispatchEvent(new Event('bb:presentation-restored'));
  },
  fallbackToDom(error) {
    if (mode === 'dom') return;
    mode = 'dom';
    this.disposeHome(); this.disposeBattle(); setModeClass();
    document.documentElement.classList.remove('presentation-match-passthrough');
    if (error) console.warn('[BrainBite] 3D unavailable; keeping classic gameplay.', error.message);
    window.dispatchEvent(new Event('bb:presentation-fallback'));
  },
  syncFromScreen() {
    screenSyncQueued = true;
    if (screenSyncPromise) return screenSyncPromise;
    screenSyncPromise = (async () => {
      while (screenSyncQueued) {
        screenSyncQueued = false;
        const activeScreen = document.querySelector('.screen.show')?.id || null;
        await runtimeTelemetry.syncScreen(activeScreen, async () => {
          if (mode === 'dom') return;
          const homeOn = document.getElementById('home')?.classList.contains('show');
          const gameOn = document.getElementById('game')?.classList.contains('show');
          const hub = homeOn || gameOn;
          document.documentElement.classList.toggle('presentation-match-passthrough', mode === 'match' && !hub);
          if (homeOn) {
            this.disposeBattle();
            if (!homeView && !homePending) await this.mountHome();
          } else {
            this.disposeHome();
          }
          if (gameOn) {
            if (!battleView && !battlePending) {
              lastBattleEvidence = { correct: 0, wrong: 0 };
              await this.mountBattle({
                onSelect: (value) => window.BrainBiteGame?.tryAnswer?.(value),
              });
              const choices = window.BrainBiteGame?.pillarChoices?.() || [];
              this.setBattleChoices(choices);
              this.setBattleNibbler(window.BrainBiteGame?.nibblerState?.() || null);
              this.setBattleBossState(window.BrainBiteGame?.bossState?.() || null);
              this.setBattleRescue(window.BrainBiteGame?.rescueValue?.() ?? null);
              this.syncBattleHud();
            } else {
              const choices = window.BrainBiteGame?.pillarChoices?.() || [];
              this.setBattleChoices(choices);
              this.syncBattleHud();
            }
          } else if (!homeOn) {
            this.disposeBattle();
          }
        });
      }
    })().finally(() => {
      screenSyncPromise = null;
    });
    return screenSyncPromise;
  },
};
