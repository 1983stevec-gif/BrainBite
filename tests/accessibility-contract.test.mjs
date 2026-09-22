import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configuredBase = process.env.BB_ACCESSIBILITY_BASE_URL || process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.BB_ACCESSIBILITY_PORT || 8098);
const baseUrl = configuredBase || `http://127.0.0.1:${port}`;

let browser;
let server;

const wait = ms => new Promise(resolveWait => setTimeout(resolveWait, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html?accessibility-health=${Date.now()}`);
      if (response.ok) return;
    } catch {
      // The server may need another turn to bind its port.
    }
    await wait(100);
  }
  throw new Error(`Accessibility contract server did not become ready at ${baseUrl}`);
}

async function openPage(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/?match=0&webgl=0&accessibility-bust=${Date.now()}`, { waitUntil: 'load' });
  await page.waitForFunction(() => Boolean(window.BrainBiteGame?.getState));
  return { context, page };
}

async function closePage(context) {
  await context.close();
}

async function openSettings(page) {
  await page.locator('.dash-quick-actions button[data-screen="settings"]').click();
  await page.locator('#settings.show').waitFor();
}

async function setChecked(page, selector, checked) {
  await page.locator(selector).setChecked(checked);
  await page.waitForTimeout(40);
}

async function unlockParent(page) {
  await page.locator('#childDock button[data-screen="home"]').click();
  await page.locator('#parentNav').click();
  await page.locator('#parentPinInput').fill('654321');
  if (await page.locator('#confirmParentPin').isVisible()) await page.locator('#confirmParentPin').fill('654321');
  await page.locator('#unlockParent').click();
  await page.locator('#parentContent').waitFor({ state: 'visible' });
}

async function startPractice(page, missionId = 1) {
  await page.evaluate(id => window.BrainBiteGame.startPracticeMission(id), missionId);
  await page.locator('#game.show').waitFor();
  await page.locator('#board [role="gridcell"]').first().waitFor();
}

test.before(async () => {
  browser = await chromium.launch({ headless: true });
  if (!configuredBase) {
    server = spawn(process.execPath, ['scripts/serve.mjs'], {
      cwd: repoRoot,
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    await waitForServer();
  } else {
    await waitForServer();
  }
});

test.after(async () => {
  await browser?.close();
  if (server && !server.killed) server.kill();
});

test('accessibility settings stay isolated per learner profile', async () => {
  const { context, page } = await openPage();
  try {
    await openSettings(page);
    await setChecked(page, '#reducedMotion', true);
    await setChecked(page, '#highContrast', true);
    await page.locator('#textScale').selectOption('1.25');
    await page.waitForTimeout(40);

    await unlockParent(page);
    await page.locator('nav button[data-screen="profiles"]').click();
    await page.locator('#newProfile').fill('Kid 2');
    await page.locator('#addProfile').click();
    await page.waitForTimeout(60);

    await unlockParent(page);
    await page.locator('nav button[data-screen="profiles"]').click();
    const kidOne = page.locator('#profileList .profile-row').filter({ hasText: 'Kid 1' });
    await kidOne.getByRole('button', { name: 'Switch' }).click();
    await openSettings(page);
    assert.equal(await page.locator('#reducedMotion').isChecked(), true);
    assert.equal(await page.locator('#highContrast').isChecked(), true);
    assert.equal(await page.locator('#textScale').inputValue(), '1.25');

    await unlockParent(page);
    await page.locator('nav button[data-screen="profiles"]').click();
    const kidTwo = page.locator('#profileList .profile-row').filter({ hasText: 'Kid 2' });
    await kidTwo.getByRole('button', { name: 'Switch' }).click();
    await openSettings(page);
    assert.equal(await page.locator('#reducedMotion').isChecked(), false);
    assert.equal(await page.locator('#highContrast').isChecked(), false);
    assert.equal(await page.locator('#textScale').inputValue(), '1');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
    const profiles = Object.fromEntries(stored.profiles.map(profile => [profile.name, profile.settings]));
    assert.deepEqual(
      {
        'Kid 1': {
          reducedMotion: profiles['Kid 1'].reducedMotion,
          highContrast: profiles['Kid 1'].highContrast,
          textScale: profiles['Kid 1'].textScale,
        },
        'Kid 2': {
          reducedMotion: profiles['Kid 2'].reducedMotion,
          highContrast: profiles['Kid 2'].highContrast,
          textScale: profiles['Kid 2'].textScale,
        },
      },
      {
        'Kid 1': { reducedMotion: true, highContrast: true, textScale: '1.25' },
        'Kid 2': { reducedMotion: false, highContrast: false, textScale: '1' },
      },
    );
  } finally {
    await closePage(context);
  }
});

test('reduced motion honors both the profile setting and prefers-reduced-motion', async () => {
  const { context, page } = await openPage();
  try {
    await openSettings(page);
    await setChecked(page, '#reducedMotion', true);

    const profileMode = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'boss-danger';
      probe.style.animation = 'probe 1s';
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const result = {
        rootClass: document.documentElement.classList.contains('reduced-motion'),
        animationName: style.animationName,
        animationDuration: style.animationDuration,
      };
      probe.remove();
      return result;
    });
    assert.equal(profileMode.rootClass, true);
    assert.equal(profileMode.animationName, 'none');
    assert.equal(profileMode.animationDuration, '0s');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'load' });
    const mediaMode = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.animation = 'probe 1s';
      probe.style.transition = 'opacity 1s';
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const result = {
        mediaMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        animationName: style.animationName,
        transitionDuration: style.transitionDuration,
      };
      probe.remove();
      return result;
    });
    assert.equal(mediaMode.mediaMatches, true);
    assert.equal(mediaMode.animationName, 'none');
    assert.equal(mediaMode.transitionDuration, '0s');
  } finally {
    await closePage(context);
  }
});

test('captions and repeat-prompt read-aloud retain accessible semantics', async () => {
  const { context, page } = await openPage();
  try {
    await openSettings(page);
    await setChecked(page, '#captions', true);
    await startPractice(page);

    const captionContract = await page.evaluate(() => ({
      prompt: document.querySelector('#prompt')?.textContent,
      caption: document.querySelector('#captionText')?.textContent,
      captionHidden: document.querySelector('#captionText')?.hidden,
      promptRole: document.querySelector('#prompt')?.tagName,
      feedbackRole: document.querySelector('#feedback')?.getAttribute('role'),
      feedbackLive: document.querySelector('#feedback')?.getAttribute('aria-live'),
      speakLabel: document.querySelector('#speakPrompt')?.getAttribute('aria-label'),
      speakTitle: document.querySelector('#speakPrompt')?.getAttribute('title'),
    }));
    assert.equal(captionContract.captionHidden, false);
    assert.equal(captionContract.caption, captionContract.prompt);
    assert.equal(captionContract.promptRole, 'H2');
    assert.equal(captionContract.feedbackRole, 'status');
    assert.equal(captionContract.feedbackLive, 'polite');
    assert.equal(captionContract.speakLabel, 'Repeat prompt');
    assert.equal(captionContract.speakTitle, 'Repeat prompt');

    await page.evaluate(() => {
      const calls = [];
      window.__bbSpeechCalls = calls;
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          cancel: () => calls.push({ type: 'cancel' }),
          speak: utterance => calls.push({ type: 'speak', text: utterance.text, lang: utterance.lang }),
        },
      });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        configurable: true,
        writable: true,
        value: function SpeechSynthesisUtterance(text) {
          this.text = text;
          this.lang = '';
        },
      });
    });
    await page.locator('#speakPrompt').click();
    const speechCalls = await page.evaluate(() => window.__bbSpeechCalls);
    assert.deepEqual(speechCalls, [
      { type: 'cancel' },
      { type: 'speak', text: captionContract.prompt, lang: 'en-US' },
    ]);
  } finally {
    await closePage(context);
  }
});

test('high contrast applies an explicit high-contrast surface and border treatment', async () => {
  const { context, page } = await openPage();
  try {
    await openSettings(page);
    await setChecked(page, '#highContrast', true);
    const colors = await page.evaluate(() => {
      const panel = document.querySelector('#settings .panel');
      const panelStyle = getComputedStyle(panel);
      return {
        rootClass: document.documentElement.classList.contains('high-contrast'),
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        panelBackground: panelStyle.backgroundColor,
        panelBorderWidth: panelStyle.borderTopWidth,
        panelBorderColor: panelStyle.borderTopColor,
      };
    });
    assert.deepEqual(colors, {
      rootClass: true,
      bodyBackground: 'rgb(0, 0, 0)',
      panelBackground: 'rgb(0, 0, 0)',
      panelBorderWidth: '2px',
      panelBorderColor: 'rgb(255, 255, 255)',
    });
  } finally {
    await closePage(context);
  }
});

test('text scaling reaches the document root and survives reload', async () => {
  const { context, page } = await openPage();
  try {
    await openSettings(page);
    await page.locator('#textScale').selectOption('1.25');
    await page.waitForTimeout(40);
    const beforeReload = await page.evaluate(() => ({
      selected: document.querySelector('#textScale')?.value,
      variable: document.documentElement.style.getPropertyValue('--bb-text-scale'),
      fontSize: getComputedStyle(document.documentElement).fontSize,
    }));
    assert.deepEqual(beforeReload, { selected: '1.25', variable: '1.25', fontSize: '20px' });

    await page.reload({ waitUntil: 'load' });
    await openSettings(page);
    const afterReload = await page.evaluate(() => ({
      selected: document.querySelector('#textScale')?.value,
      variable: document.documentElement.style.getPropertyValue('--bb-text-scale'),
    }));
    assert.deepEqual(afterReload, { selected: '1.25', variable: '1.25' });
  } finally {
    await closePage(context);
  }
});

test('correct and incorrect outcomes announce text without color-only feedback', async () => {
  const { context, page } = await openPage();
  try {
    await startPractice(page);
    const choices = await page.evaluate(() => {
      const state = window.BrainBiteGame.getState();
      const challenge = state.activity?.challenge;
      const answers = challenge?.answers || challenge?.targetSequence || challenge?.platformOrder || state.m.correct;
      const answerSet = new Set(answers.map(value => String(value)));
      const visibleChoices = window.BrainBiteGame.pillarChoices();
      return {
        correct: visibleChoices.find(value => answerSet.has(String(value))),
        incorrect: visibleChoices.find(value => !answerSet.has(String(value))),
      };
    });
    assert.notEqual(choices.correct, undefined);
    assert.notEqual(choices.incorrect, undefined);

    const outcomes = await page.evaluate(({ correct, incorrect }) => {
      const feedback = document.querySelector('#feedback');
      const incorrectHandled = window.BrainBiteGame.tryAnswer(incorrect);
      const incorrectState = {
        handled: incorrectHandled,
        text: feedback.textContent,
        className: feedback.className,
        role: feedback.getAttribute('role'),
        live: feedback.getAttribute('aria-live'),
      };
      const correctHandled = window.BrainBiteGame.tryAnswer(correct);
      return {
        incorrect: incorrectState,
        correct: {
          handled: correctHandled,
          text: feedback.textContent,
          className: feedback.className,
          role: feedback.getAttribute('role'),
          live: feedback.getAttribute('aria-live'),
        },
      };
    }, choices);

    assert.equal(outcomes.incorrect.handled, true);
    assert.match(outcomes.incorrect.text, /^Not .+ Try another\.$/);
    assert.equal(outcomes.incorrect.className, '');
    assert.equal(outcomes.incorrect.role, 'status');
    assert.equal(outcomes.incorrect.live, 'polite');
    assert.equal(outcomes.correct.handled, true);
    assert.match(outcomes.correct.text, /Correct\./);
    assert.equal(outcomes.correct.className, '');
    assert.equal(outcomes.correct.role, 'status');
    assert.equal(outcomes.correct.live, 'polite');
  } finally {
    await closePage(context);
  }
});
