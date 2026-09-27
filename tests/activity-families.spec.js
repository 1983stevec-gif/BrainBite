import { test, expect } from '@playwright/test';

async function boot(page) {
  await page.goto('/?webgl=0&match=0');
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame);
}

async function openCodeBridge(page) {
  await page.getByRole('button', { name: 'Code', exact: true }).click();
  await page.getByRole('button', { name: 'Code Bridge', exact: true }).click();
}

test('Target Smash exposes bounded physical choices and records one attempt per choice', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { family: 'Target Smash', seed: 1 });
    const started = route.approved && window.BrainBiteGame.startCurriculumChallenge(route.challenge);
    const before = P().learningCore.skills['math-1-addition']?.evidence?.attempts || 0;
    const board = document.querySelector('[data-activity-family="Target Smash"]');
    const choices = [...board.querySelectorAll('[data-activity-choice]')].map(node => node.dataset.activityChoice);
    const correct = choices.find(value => ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'].includes(value));
    const accepted = window.BrainBiteGame.tryAnswer(correct);
    const after = P().learningCore.skills['math-1-addition'].evidence.attempts;
    return { started, family: board?.dataset.activityFamily, choices, accepted, delta: after - before };
  });
  expect(result.started).toBe(true);
  expect(result.family).toBe('Target Smash');
  expect(result.choices.length).toBeGreaterThanOrEqual(2);
  expect(result.choices.length).toBeLessThanOrEqual(6);
  expect(result.accepted).toBe(true);
  expect(result.delta).toBe(1);
});

test('Letter Trail enforces sequence order and records mistakes once', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('reading-4-inference', { family: 'Letter Trail', seed: 2 });
    const started = route.approved && window.BrainBiteGame.startCurriculumChallenge(route.challenge);
    const activity = window.BrainBiteGame.getState().activity;
    const sequence = activity.challenge.targetSequence.map(String);
    const choices = activity.challenge.choices.map(String);
    const wrongOrder = sequence[1] || String(activity.challenge.distractors[0]);
    const before = P().learningCore.skills['reading-4-inference']?.evidence?.attempts || 0;
    const wrong = window.BrainBiteGame.tryAnswer(wrongOrder);
    const afterWrong = P().learningCore.skills['reading-4-inference']?.evidence?.attempts || 0;
    const right = window.BrainBiteGame.tryAnswer(sequence[0]);
    const afterRight = P().learningCore.skills['reading-4-inference']?.evidence?.attempts || 0;
    return { started, family: activity.family, sequence, choices, wrong, right, wrongDelta: afterWrong - before, rightDelta: afterRight - afterWrong, revealed: window.BrainBiteGame.getState().activity.challenge.revealed };
  });
  expect(result.started).toBe(true);
  expect(result.family).toBe('Letter Trail');
  expect(result.choices).toEqual(expect.arrayContaining(result.sequence));
  expect(result.wrong).toBeDefined();
  expect(result.right).toBe(true);
  expect(result.wrongDelta).toBe(1);
  expect(result.rightDelta).toBe(1);
  expect(result.revealed).toEqual([result.sequence[0]]);
});

test('a wrong answer explains why using the reviewed explanation', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { family: 'Target Smash', seed: 1 });
    window.BrainBiteGame.startCurriculumChallenge(route.challenge);
    const board = document.querySelector('[data-activity-family="Target Smash"]');
    const choices = [...board.querySelectorAll('[data-activity-choice]')].map(node => node.dataset.activityChoice);
    const answers = (route.challenge.answers || []).map(String);
    const wrong = choices.find(value => !answers.includes(value));
    window.BrainBiteGame.tryAnswer(wrong);
    return {
      explanation: route.challenge.explanation,
      feedback: document.querySelector('#feedback').textContent,
      guidedHint: window.BrainBiteGame.getState().guidedHint,
    };
  });
  expect(result.explanation).toBeTruthy();
  expect(result.guidedHint).toBeFalsy();
  expect(result.feedback).toContain(result.explanation);
});

test('assisted play keeps the guided hint ahead of the explanation', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { family: 'Target Smash', seed: 1 });
    window.BrainBiteGame.startCurriculumChallenge(route.challenge, { assisted: true });
    const board = document.querySelector('[data-activity-family="Target Smash"]');
    const choices = [...board.querySelectorAll('[data-activity-choice]')].map(node => node.dataset.activityChoice);
    const answers = (route.challenge.answers || []).map(String);
    const wrong = choices.find(value => !answers.includes(value));
    window.BrainBiteGame.tryAnswer(wrong);
    return {
      explanation: route.challenge.explanation,
      feedback: document.querySelector('#feedback').textContent,
      guidedHint: window.BrainBiteGame.getState().guidedHint,
    };
  });
  expect(result.guidedHint).toBeTruthy();
  expect(result.feedback).toContain(result.guidedHint);
  expect(result.feedback).not.toContain(result.explanation);
});

test('the wrong-answer explanation can be read aloud', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const spoken = [];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel() {}, speak(utterance) { spoken.push({ text: utterance.text, lang: utterance.lang }); } },
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: function StubUtterance(text) { this.text = text; this.lang = ''; },
    });
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { family: 'Target Smash', seed: 1 });
    window.BrainBiteGame.startCurriculumChallenge(route.challenge);
    const board = document.querySelector('[data-activity-family="Target Smash"]');
    const choices = [...board.querySelectorAll('[data-activity-choice]')].map(node => node.dataset.activityChoice);
    const answers = (route.challenge.answers || []).map(String);
    window.BrainBiteGame.tryAnswer(choices.find(value => !answers.includes(value)));
    document.querySelector('#speakFeedback').click();
    return { explanation: route.challenge.explanation, spoken };
  });
  expect(result.explanation).toBeTruthy();
  expect(result.spoken).toHaveLength(1);
  expect(result.spoken[0].text).toContain(result.explanation);
  expect(result.spoken[0].lang).toBe('en-US');
});

test('Knowledge Platforms enforces platform order and records one attempt per interaction', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-4-fractions', { family: 'Knowledge Platforms', seed: 3 });
    const started = route.approved && window.BrainBiteGame.startCurriculumChallenge(route.challenge);
    const activity = window.BrainBiteGame.getState().activity;
    const order = activity.challenge.platformOrder.map(String);
    const wrong = String(activity.challenge.distractors[0]);
    const before = P().learningCore.skills['math-4-fractions']?.evidence?.attempts || 0;
    const wrongResult = window.BrainBiteGame.tryAnswer(wrong);
    const afterWrong = P().learningCore.skills['math-4-fractions']?.evidence?.attempts || 0;
    const rightResult = window.BrainBiteGame.tryAnswer(order[0]);
    const afterRight = P().learningCore.skills['math-4-fractions']?.evidence?.attempts || 0;
    return { started, family: activity.family, order, wrongResult, rightResult, wrongDelta: afterWrong - before, rightDelta: afterRight - afterWrong, visited: window.BrainBiteGame.getState().activity.challenge.visited };
  });
  expect(result.started).toBe(true);
  expect(result.family).toBe('Knowledge Platforms');
  expect(result.order.length).toBeGreaterThan(0);
  expect(result.wrongResult).toBe(true);
  expect(result.rightResult).toBe(true);
  expect(result.wrongDelta).toBe(1);
  expect(result.rightDelta).toBe(1);
  expect(result.visited).toEqual([result.order[0]]);
});

test('completed family activities reject stale replay interactions', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { family: 'Target Smash', seed: 4 });
    window.BrainBiteGame.startCurriculumChallenge(route.challenge);
    const activity = window.BrainBiteGame.getState().activity;
    activity.challenge.completed = true;
    const before = P().learningCore.skills['math-1-addition']?.evidence?.attempts || 0;
    const replay = window.BrainBiteGame.tryAnswer(String(activity.challenge.answers[0]));
    const after = P().learningCore.skills['math-1-addition']?.evidence?.attempts || 0;
    return { replay, delta: after - before };
  });
  expect(result.replay).toBe(false);
  expect(result.delta).toBe(0);
});

test('typing encounter renders, submits through the runtime bridge, and records evidence', async ({ page }) => {
  await boot(page);
  const route = await page.evaluate(() => window.BrainBiteCore.createApprovedCurriculumChallenge('reading-4-inference', { family: 'Letter Trail', seed: 8 }));
  expect(route.approved).toBe(true);
  const started = await page.evaluate(challenge => window.BrainBiteGame.startTypingChallenge(challenge), route.challenge);
  expect(started).toBe(true);
  await expect(page.locator('[data-typing-encounter="true"]')).toBeVisible();
  const target = String(route.challenge.targetSequence[0]);
  await page.locator('#typingInput').fill(target);
  await page.locator('#typingSubmit').click();
  await expect(page.locator('#feedback')).toContainText('Practice complete');
  const state = await page.evaluate(() => ({ attempts: P().learningCore.skills['reading-4-inference'].evidence.attempts, independent: P().learningCore.skills['reading-4-inference'].evidence.independentSuccesses }));
  expect(state.attempts).toBe(1);
  expect(state.independent).toBe(1);
});

test('typing assisted launches and completion are idempotent', async ({ page }) => {
  await boot(page);
  const route = await page.evaluate(() => window.BrainBiteCore.createApprovedCurriculumChallenge('reading-4-inference', { family: 'Letter Trail', seed: 9 }));
  await page.evaluate(challenge => window.BrainBiteGame.startTypingChallenge(challenge, { assisted: true }), route.challenge);
  const target = String(route.challenge.targetSequence[0]);
  const result = await page.evaluate(value => {
    const first = window.BrainBiteGame.submitTypedAnswer(value, { attemptId: 'typing-assisted-1', elapsedMs: 30000 });
    const second = window.BrainBiteGame.submitTypedAnswer(value, { attemptId: 'typing-assisted-2', elapsedMs: 30000 });
    const skill = P().learningCore.skills['reading-4-inference'];
    return { first: first.accepted, second: second.accepted, attempts: skill.evidence.attempts, independent: skill.evidence.independentSuccesses, assisted: skill.evidence.assistedSuccesses };
  }, target);
  expect(result.first).toBe(true);
  expect(result.second).toBe(false);
  expect(result.attempts).toBe(1);
  expect(result.independent).toBe(0);
  expect(result.assisted).toBe(1);
});

test('typing encounter refills hearts and keeps typing mode after zero lives', async ({ page }) => {
  await boot(page);
  const route = await page.evaluate(() => window.BrainBiteCore.createApprovedCurriculumChallenge('reading-4-inference', { family: 'Letter Trail', seed: 10 }));
  await page.evaluate(challenge => window.BrainBiteGame.startTypingChallenge(challenge), route.challenge);
  const result = await page.evaluate(async () => {
    for (const value of ['wrong-a', 'wrong-b', 'wrong-c']) window.BrainBiteGame.submitTypedAnswer(value, { attemptId: value, elapsedMs: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2300));
    return { typing: window.BrainBiteGame.getState().typingMode, marker: document.querySelector('[data-typing-encounter="true"]') !== null, lives: window.BrainBiteGame.getState().lives };
  });
  expect(result.typing).toBeTruthy();
  expect(result.typing.completed).toBeFalsy();
  // Hearts refill in place (decision D11): the three typed attempts are kept, not wiped.
  expect(result.typing.attempts).toHaveLength(3);
  expect(result.marker).toBe(true);
  expect(result.lives).toBe(3);
});

test('Code Bridge runs an allowlisted program and records one coding attempt', async ({ page }) => {
  await boot(page);
  await openCodeBridge(page);
  await page.locator('#codeProgram').fill('bridge.open()\nplayer.move()\ngate.unlock()');
  await page.locator('#codeRun').click();
  await expect(page.locator('#codeBridgeFeedback')).toContainText('Coding evidence recorded');
  const result = await page.evaluate(() => ({
    state: JSON.parse(document.querySelector('#codeBridgeState').textContent),
    trace: document.querySelector('#codeBridgeTrace').textContent,
    skill: P().learningCore.skills['coding-bridge'],
  }));
  expect(result.state.bridgeOpen).toBe(true);
  expect(result.state.gateUnlocked).toBe(true);
  expect(result.trace).toContain('bridge.open');
  expect(result.skill.evidence.attempts).toBe(1);
  expect(result.skill.evidence.independentSuccesses).toBe(1);
});

test('Code Bridge rejects unsupported commands without awarding evidence', async ({ page }) => {
  await boot(page);
  await openCodeBridge(page);
  await page.locator('#codeProgram').fill('fetch("https://example.com")');
  await page.locator('#codeRun').click();
  await expect(page.locator('#codeBridgeFeedback')).toContainText('stopped safely');
  const result = await page.evaluate(() => ({ skill: P().learningCore.skills['coding-bridge'] || null }));
  expect(result.skill).toBeNull();
});

test('Code Bridge suggests the next prerequisite-aware lesson', async ({ page }) => {
  await page.goto('/?webgl=0&match=0&contentMode=internal-review');
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame && !!window.BrainBiteCodeCurriculum);
  await openCodeBridge(page);
  await page.locator('#codeSuggest').click();
  const result = await page.evaluate(() => ({
    label: document.querySelector('#codeLessonLabel').textContent,
    program: document.querySelector('#codeProgram').value,
  }));
  expect(result.label).toContain('Open the Bridge');
  expect(result.program).toContain('bridge.open()');
});

test('Code Bridge hides unreviewed lesson suggestions in production mode', async ({ page }) => {
  await page.goto('/?webgl=0&match=0&contentMode=production');
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame && !!window.BrainBiteCodeCurriculum);
  await page.getByRole('button', { name: 'Code', exact: true }).click();
  await page.getByRole('button', { name: 'Code Bridge', exact: true }).click();
  await page.locator('#codeSuggest').click();
  await expect(page.locator('#codeLessonLabel')).toContainText('awaiting educator review');
  await expect(page.locator('#codeBridgeFeedback')).toContainText('unavailable in production');
});

test('Code Lab runs and persists a safe profile-local project', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Code', exact: true }).click();
  await page.getByRole('button', { name: 'Code Lab', exact: true }).click();
  await page.locator('#codeLabName').fill('jungle-route');
  await page.locator('#codeLabProgram').fill('bridge.open()\ngate.unlock()');
  await page.locator('#codeLabRun').click();
  await expect(page.locator('#codeLabFeedback')).toContainText('successfully');
  const result = await page.evaluate(() => ({
    state: JSON.parse(document.querySelector('#codeLabState').textContent),
    saved: P().codeLabProjects['jungle-route'],
  }));
  expect(result.state.success).toBe(true);
  expect(result.saved.lastRun.success).toBe(true);
  expect(result.saved.program).toContain('bridge.open()');
});

test('Programmable Bit editor saves profile-local behavior and simulates it', async ({ page }) => {
  await boot(page);
  await page.waitForFunction(() => !!window.BrainBiteBits);
  await page.getByRole('button', { name: 'My Bites', exact: true }).click();
  await page.locator('#bitEditorId').fill('reef-helper');
  await page.locator('#bitAction-correct').fill('glow, cheer, move(2)');
  await page.locator('#saveBit').click();
  await expect(page.locator('#bitEditorFeedback')).toContainText('saved');
  await page.locator('#runBitEvent').click();
  const result = await page.evaluate(() => ({
    saved: P().programmableBits['reef-helper'],
    state: JSON.parse(document.querySelector('#bitEditorState').textContent).state,
  }));
  expect(result.saved.id).toBe('reef-helper');
  expect(result.state.glow).toBe(true);
  expect(result.state.cheers).toBe(1);
  expect(result.state.x).toBe(2);
});

test('Programmable Bit editor fails safely on malformed persisted behavior', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { P().programmableBits = { broken: { id: 'broken', behavior: { correct: 'move(3)' } } }; render(); });
  await page.getByRole('button', { name: 'My Bites', exact: true }).click();
  await expect(page.locator('#bitEditorPanel')).toBeVisible();
  await expect(page.locator('#bitEditorFeedback')).toContainText('Ready');
});

test('Programmable Bit profile merges preserve both device-local definitions', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => mergeProfiles(
    { id: 'profile-a', updatedAt: 1, programmableBits: { first: { id: 'first', behavior: { correct: ['glow'] } } } },
    { id: 'profile-a', updatedAt: 2, programmableBits: { second: { id: 'second', behavior: { correct: ['cheer'] } } } },
  ).programmableBits);
  expect(Object.keys(result).sort()).toEqual(['first', 'second']);
});

test('Programmable Bit editor persists an explicit active Bit selection', async ({ page }) => {
  await boot(page);
  await page.waitForFunction(() => !!window.BrainBiteBits);
  await page.getByRole('button', { name: 'My Bites', exact: true }).click();
  await page.locator('#bitEditorId').fill('first-bit');
  await page.locator('#bitAction-correct').fill('glow');
  await page.locator('#saveBit').click();
  await page.locator('#bitEditorId').fill('second-bit');
  await page.locator('#bitAction-correct').fill('cheer');
  await page.locator('#saveBit').click();
  await page.locator('#bitActiveId').selectOption('first-bit');
  await expect.poll(() => page.evaluate(() => P().activeProgrammableBitId)).toBe('first-bit');
});

test('Programmable Bit lessons load reviewed behavior without awarding mastery', async ({ page }) => {
  await boot(page);
  await page.waitForFunction(() => !!window.BrainBiteProgrammableBitCurriculum);
  await page.getByRole('button', { name: 'My Bites', exact: true }).click();
  await expect(page.locator('#bitLessonSelect')).toBeVisible();
  await page.locator('#loadBitLesson').click();
  await expect(page.locator('#bitLessonFeedback')).toContainText('Loaded');
  const result = await page.evaluate(() => ({ field: document.querySelector('#bitAction-correct').value, mastery: P().learningCore?.skills?.['bit-first-spark'] || null }));
  expect(result.field).toContain('glow');
  expect(result.mastery).toBeNull();
});

test('Programmable Bit lessons remain hidden behind production review gate', async ({ page }) => {
  await page.goto('/?webgl=0&match=0&contentMode=production');
  await page.waitForFunction(() => !!window.BrainBiteProgrammableBitCurriculum);
  await page.getByRole('button', { name: 'My Bites', exact: true }).click();
  await expect(page.locator('#bitLessonPanel')).toContainText('awaiting educator review');
  await expect(page.locator('#bitLessonSelect')).toHaveCount(0);
});
