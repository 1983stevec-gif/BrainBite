import { test, expect } from '@playwright/test';

const waitForPresentationReady = page => page.waitForFunction(() =>
  Boolean(window.BrainBitePresentation?.getPerformanceReport?.().runtime?.readiness));

test('fresh BrainBite launch renders live 3D, with explicit classic override', async ({page}) => {
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  // Phase 3.1: the scene selector is a parent-only device setting, never a child control.
  await expect(page.getByRole('combobox',{name:'Scene presentation'})).toBeHidden();
  await page.getByRole('button',{name:'Parents',exact:true}).click();
  await page.locator('#parentPinInput').fill('654321');
  await page.locator('#confirmParentPin').fill('654321');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentContent')).toBeVisible();
  await page.locator('nav button[data-screen="advanced"]').click();
  await expect(page.getByRole('combobox',{name:'Scene presentation'})).toHaveValue('webgl');
  await page.getByRole('combobox',{name:'Scene presentation'}).selectOption('dom');
  await expect(page.locator('html')).not.toHaveClass(/presentation-webgl/);
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(0);
});

test('live 3D scenes mount the reusable programmable Bit companion', async ({page}) => {
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await expect(page.locator('#home .home-stage')).toHaveAttribute('data-programmable-bit', 'true');
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport?.().home ? true : false)).toBe(true);
  await page.evaluate(() => window.BrainBiteGame.startMission(1));
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-programmable-bit', 'true');
  await page.evaluate(() => document.querySelector('nav button[data-screen="home"]')?.click());
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
});

test('3D battle keyboard answers update existing gameplay and keep one scene',async({page},testInfo)=>{
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  await expect(page.locator('.webgl-answer-controls button')).toHaveCount(4);
  const choice=await page.evaluate(()=>String(window.BrainBiteGame.getState().m.correct[0]));
  await page.getByRole('group',{name:'Choose an answer'}).getByRole('button',{name:choice,exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.BrainBiteGame.getState().correct)).toBe(1);
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath('brainbite-live-3d-battle.png'),fullPage:true});
});

test('3D battle consumes a correct target and resists repeated answers',async({page})=>{
  await page.goto('/?presentation=webgl');
  const state=await page.evaluate(()=>{
    document.documentElement.classList.add('presentation-webgl');
    window.BrainBiteGame.startMission(1);
    const first=window.BrainBiteGame.pillarChoices()[0];
    const accepted=window.BrainBiteGame.tryAnswer(first);
    const repeated=window.BrainBiteGame.tryAnswer(first);
    const game=window.BrainBiteGame.getState();
    return {first,accepted,repeated,eaten:game.eaten,correct:game.correct,lives:game.lives,choices:window.BrainBiteGame.pillarChoices()};
  });
  expect(state).toMatchObject({accepted:true,repeated:false,eaten:1,correct:1,lives:2});
  expect(state.choices).not.toContain(state.first);
});

test('3D Bite reacts to correct and incorrect answer evidence',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  const first=await page.evaluate(()=>({correct:String(window.BrainBiteGame.getState().m.correct[0]),wrong:String(window.BrainBiteGame.getState().m.wrong[0])}));
  await page.evaluate(value=>window.BrainBiteGame.tryAnswer(value),first.correct);
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-character-state','success');
  await page.evaluate(value=>window.BrainBiteGame.tryAnswer(value),first.wrong);
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-character-state','mistake');
});

test('reduced-motion Bite reactions apply a visible deterministic pose',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-character-animated','true');
  const correct=await page.evaluate(()=>String(window.BrainBiteGame.getState().m.correct[0]));
  await page.evaluate(value=>window.BrainBiteGame.tryAnswer(value),correct);
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-character-state','success');
  const poseY=Number(await page.locator('#game .battle-frame').getAttribute('data-character-pose-y'));
  expect(poseY).toBeGreaterThan(0.42);
});

test('runtime answer classes do not overlap for Homophone Hollow',async({page})=>{
  await page.goto('/?presentation=webgl');
  const overlap=await page.evaluate(()=>{
    window.BrainBiteGame.startPracticeMission(18);
    const correct=new Set(window.BrainBiteGame.getState().m.correct.map(String));
    return window.BrainBiteGame.getState().m.wrong.map(String).filter(value=>correct.has(value));
  });
  expect(overlap).toEqual([]);
});

test('3D fraction choices rotate through every unique correct target',async({page})=>{
  await page.goto('/?presentation=webgl');
  const result=await page.evaluate(()=>{
    document.documentElement.classList.add('presentation-webgl');
    window.BrainBiteGame.startPracticeMission(8);
    const expected=[...new Set(window.BrainBiteGame.getState().m.correct.map(String))];
    const consumed=[];
    while(window.BrainBiteGame.getState().webglRemaining.length){
      const choices=window.BrainBiteGame.pillarChoices();
      const current=choices.find(value=>expected.includes(value)&&!consumed.includes(value));
      consumed.push(current);
      window.BrainBiteGame.tryAnswer(current);
    }
    return {expected,consumed,eaten:window.BrainBiteGame.getState().eaten};
  });
  expect(new Set(result.consumed)).toEqual(new Set(result.expected));
  expect(result.eaten).toBe(result.expected.length);
  await expect(page.locator('#feedback')).toHaveText('Practice complete!');
});

test('3D boss HUD is hidden for regular missions and preserves real boss state',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>{document.documentElement.classList.add('presentation-webgl');window.BrainBiteGame.startPracticeMission(8)});
  await expect(page.locator('#bossBox')).toBeHidden();
  await expect(page.locator('#bossName')).toHaveText('Boss');

  await page.evaluate(()=>window.BrainBiteGame.startPracticeMission(10));
  await expect(page.locator('#bossBox')).toBeVisible();
  await expect(page.locator('#bossName')).toHaveText('Astro Muncher');
  await expect(page.locator('#bossPhase')).toContainText('Astro Muncher');
  await expect(page.locator('#bossHealth')).toHaveJSProperty('value',100);

  await page.evaluate(()=>window.BrainBiteGame.tryAnswer(window.BrainBiteGame.pillarChoices()[0]));
  await expect(page.locator('#bossHealth')).toHaveJSProperty('value',75);
  expect(await page.evaluate(()=>window.BrainBiteGame.getState().m.boss)).toBe(true);
});

test('a real context loss falls back to classic gameplay without an unhandled error',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  // Lose the context for real instead of dispatching the event by hand. loseContext() marks
  // the context lost synchronously and dispatches webglcontextlost afterwards, so a frame can
  // run against a dead context in between; rendering there made three.js read a null uniform
  // name and throw, and the hand-dispatched event could never reproduce it.
  const lostImmediately=await page.locator('#game canvas.webgl-canvas').evaluate(canvas=>{
    const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
    gl.getExtension('WEBGL_lose_context').loseContext();
    return gl.isContextLost();
  });
  expect(lostImmediately).toBe(true);
  await expect(page.locator('html')).not.toHaveClass(/presentation-webgl/);
  await expect(page.locator('#game .board')).toBeVisible();
  expect(await page.evaluate(()=>window.BrainBiteGame.getState().m.id)).toBe(1);
  expect(errors).toEqual([]);
});

test('a restored WebGL context keeps the live 3D scene and the active mission',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  const canvas=page.locator('#game canvas.webgl-canvas');
  await expect(canvas).toHaveCount(1);
  // A real loss and a real restore, rather than synthetic events: this proves the renderer
  // recovers from the browser's own restore, and that the 1.5s fallback window is cancelled.
  const lost=await canvas.evaluate(node=>{
    const gl=node.getContext('webgl2')||node.getContext('webgl');
    window.__bbLoseContext=gl.getExtension('WEBGL_lose_context');
    window.__bbLoseContext.loseContext();
    return gl.isContextLost();
  });
  expect(lost).toBe(true);
  await canvas.evaluate(()=>window.__bbLoseContext.restoreContext());
  await expect(page.locator('html')).toHaveClass(/presentation-webgl/);
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  await expect(page.locator('#feedback')).toContainText('reconnected');
  expect(await page.evaluate(()=>window.BrainBiteGame.getState().m.id)).toBe(1);
  // Wait past the fallback window to prove restoration cancelled it.
  await page.waitForTimeout(1800);
  await expect(page.locator('html')).toHaveClass(/presentation-webgl/);
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('repeated screen transitions dispose stale 3D canvases',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  for(let i=0;i<3;i++){
    await page.evaluate(()=>window.BrainBiteGame.startMission(1));
    await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
    await page.evaluate(()=>document.querySelector('nav button[data-screen="home"]')?.click());
    await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
    await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(0);
  }
  await page.screenshot({path:testInfo.outputPath('brainbite-live-3d-home.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('live portal shader compiles after the authored asset is installed',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error' && /THREE\.WebGLProgram|VALIDATE_STATUS|shader error|Error compiling/i.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(()=>{
    document.addEventListener('bb:webgl-asset-loaded',event=>{
      if(event.detail.asset==='portal')window.portalAssetInstalled=true;
    },true);
  });
  await page.goto('/?presentation=webgl');
  await page.waitForFunction(()=>window.portalAssetInstalled===true);
  // Shader compilation is lazy, so wait for rendering after asset installation.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await expect(page.locator('#home canvas.webgl-canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

for(const [layout,width,height] of [['desktop',1280,853],['short laptop',1280,600],['phone',390,844]]){
  test(`live HUD stays above the scene and subject navigation works on ${layout}`,async({page})=>{
    // These checks target layout/hit testing; animation is covered separately.
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setViewportSize({width,height});
    await page.goto('/?presentation=webgl');
    await waitForPresentationReady(page);
    await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
    const assertUncovered=async locator=>{
      await expect.poll(async()=>{
        // Scene installation can reflow a stacked screen after its initial scroll.
        await locator.scrollIntoViewIfNeeded();
        return locator.evaluate(element=>{
          const rect=element.getBoundingClientRect();
          const top=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
          return top===element || element.contains(top);
        });
      }).toBe(true);
    };
    await assertUncovered(page.locator('#home .dash-profile'));
    await page.locator('#worldShowcase button[data-screen="spanish"]').click();
    await expect(page.locator('#spanish')).toHaveClass(/show/);
    await page.evaluate(()=>window.BrainBiteGame.startMission(1));
    await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
    await assertUncovered(page.locator('#game .battle-prompt'));
    const correct=await page.evaluate(()=>String(window.BrainBiteGame.getState().m.correct[0]));
    await page.getByRole('group',{name:'Choose an answer'}).getByRole('button',{name:correct,exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>window.BrainBiteGame.getState().correct)).toBe(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  });
}

test('desktop portal stays clear of side HUD panels after resize',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:1280,height:853});
  await page.goto('/?presentation=webgl');
  await waitForPresentationReady(page);
  const portal=page.getByRole('button',{name:/enter the 3d play portal/i});
  await expect(portal).toBeVisible();
  for(const [width,height] of [[1280,853],[1100,700],[1920,1080]]){
    await page.setViewportSize({width,height});
    await expect.poll(()=>page.evaluate(()=>{
      const button=document.querySelector('.webgl-home-portal').getBoundingClientRect();
      const rail=document.querySelector('#home .home-rail').getBoundingClientRect();
      const sidebar=document.querySelector('#home .home-right').getBoundingClientRect();
      const hit=document.elementFromPoint(button.x+button.width/2,button.y+button.height/2);
      return button.left>rail.right && button.right<sidebar.left && Boolean(hit?.closest('.webgl-home-portal'));
    })).toBe(true);
  }
  await portal.click();
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
});

test('phone HUD stays compact without hiding subject navigation or answer controls',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?presentation=webgl');
  await waitForPresentationReady(page);
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  const assertRenderSize=async selector=>{
    await expect.poll(()=>page.locator(selector).evaluate(host=>{
      const canvas=host.querySelector('canvas.webgl-canvas');
      return parseFloat(canvas.style.width)===host.clientWidth && parseFloat(canvas.style.height)===host.clientHeight;
    })).toBe(true);
  };
  await assertRenderSize('#home .home-stage');
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(1800);
  for(const subject of ['math','words','spanish']){
    await expect(page.locator(`#worldShowcase button[data-screen="${subject}"]`)).toBeVisible();
  }
  expect(await page.locator('#childDock button').evaluateAll(buttons=>
    buttons.length>0 && Math.min(...buttons.map(button=>parseFloat(getComputedStyle(button).fontSize))))).toBeGreaterThanOrEqual(11);
  await page.getByRole('button',{name:'Continue Adventure',exact:true}).click();
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  await assertRenderSize('#game .battle-frame');
  await expect(page.locator('#game .battle-prompt')).toBeVisible();
  await expect(page.locator('.webgl-answer-controls button')).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(1150);
  const button=page.locator('.webgl-answer-controls button').first();
  expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await page.locator('#childDock button').evaluateAll(buttons=>
    buttons.length>0 && Math.min(...buttons.map(button=>parseFloat(getComputedStyle(button).fontSize))))).toBeGreaterThanOrEqual(11);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

for(const width of [360,390]){
  test(`phone dock labels remain inside their buttons at double text scale (${width}px)`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setViewportSize({width,height:844});
    await page.goto('/?presentation=webgl',{waitUntil:'domcontentloaded'});
    await waitForPresentationReady(page);
    for(const screen of ['home','game']){
      if(screen==='game')await page.evaluate(()=>window.BrainBiteGame.startMission(1));
      await expect(page.locator(`#${screen} canvas.webgl-canvas`)).toHaveCount(1);
      await page.evaluate(()=>document.documentElement.style.setProperty('--bb-text-scale','2'));
      const buttons=page.locator('#childDock button');
      await expect(buttons).toHaveCount(5);
      await expect.poll(()=>buttons.evaluateAll(elements=>elements.every(element=>
        parseFloat(getComputedStyle(element).fontSize)>=22 &&
        element.scrollWidth<=element.clientWidth+1 && element.scrollHeight<=element.clientHeight+1
      ))).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}

// ---- M1 mobile blockers ------------------------------------------------------------
const answerCorrect=page=>page.evaluate(()=>window.BrainBiteGame.tryAnswer(window.BrainBiteGame.getState().webglRemaining[0]));
const answerWrong=page=>page.evaluate(()=>window.BrainBiteGame.tryAnswer(window.BrainBiteGame.getState().m.wrong[0]));

for(const [width,height] of [[360,740],[390,844],[1024,682],[1280,800]]){
  test(`battle prompt reads on at most two lines and stays compact at ${width}x${height}`,async({page})=>{
    await page.setViewportSize({width,height});
    await page.goto('/?presentation=webgl');
    await page.evaluate(()=>window.BrainBiteGame.startMission(1));
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('#feedback')).toHaveText('',{timeout:3000});
    const metrics=await page.locator('#prompt').evaluate(el=>{
      const lineHeight=parseFloat(getComputedStyle(el).lineHeight)||parseFloat(getComputedStyle(el).fontSize)*1.1;
      return {lines:Math.round(el.getBoundingClientRect().height/lineHeight),width:el.getBoundingClientRect().width};
    });
    expect(metrics.lines).toBeLessThanOrEqual(2);
    expect(metrics.width).toBeGreaterThan(120);
    const card=await page.locator('#game .battle-prompt').boundingBox();
    expect(card.height).toBeLessThanOrEqual(width>=1024?90:110);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('the arrival status clears so the prompt card shows only the prompt',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  await expect(page.locator('#feedback')).toContainText('Entering');
  await expect(page.locator('#feedback')).toHaveText('',{timeout:3000});
  await expect(page.locator('#feedback')).toHaveAttribute('role','status');
});

test('the reward toast is hidden until earned and reports the points actually awarded',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  const toast=page.locator('#game .battle-toast');
  await expect(toast).toBeHidden();
  await answerWrong(page);
  await expect(toast).toBeHidden();
  const before=await page.evaluate(()=>window.BrainBiteGame.getState().combo);
  expect(before).toBe(0);
  await answerCorrect(page);
  await expect(toast).toBeVisible();
  await expect(page.locator('#battleRewardText')).toHaveText('+100 BrainBites');
  await expect(toast).toBeHidden({timeout:4000});
  await answerCorrect(page);
  await expect(page.locator('#battleRewardText')).toHaveText('+200 BrainBites');
});

test('practice runs never claim BrainBites in the toast',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startPracticeMission(8));
  await answerCorrect(page);
  await expect(page.locator('#battleRewardText')).toHaveText('Nice bite!');
});

test('combo stars start empty and light one star per three-answer streak',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  const lit=()=>page.locator('#game .battle-stars span').evaluateAll(spans=>spans.filter(s=>s.textContent==='★').length);
  expect(await lit()).toBe(0);
  await answerCorrect(page);await answerCorrect(page);
  expect(await lit()).toBe(0);
  await answerCorrect(page);
  expect(await lit()).toBe(1);
  await answerWrong(page);
  expect(await lit()).toBe(0);
});

test('lives read as hearts out of three, never as a percentage',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  await expect(page.locator('#healthText')).toHaveText('3 / 3');
  await expect(page.locator('#game .battle-health')).toHaveAttribute('aria-label','Lives: 3 of 3');
  await answerWrong(page);
  await expect(page.locator('#healthText')).toHaveText('2 / 3');
  await expect(page.locator('#game .battle-health')).toHaveAttribute('aria-label','Lives: 2 of 3');
});

test('boss phase never exceeds the total the child is told about',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startPracticeMission(10));
  for(let i=0;i<3;i++){
    await expect(page.locator('#bossPhase')).toHaveText(/Phase [1-3] of 3$/);
    await answerCorrect(page);
  }
});

test('phones hide the route map, float the toast, and respect safe-area insets',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  await expect(page.locator('#game .minimap-card')).toBeHidden();
  await answerCorrect(page);
  expect(await page.locator('#game .battle-toast').evaluate(el=>getComputedStyle(el).position)).toBe('fixed');
  await page.evaluate(()=>document.documentElement.style.setProperty('--bb-safe-top','30px'));
  expect(await page.evaluate(()=>getComputedStyle(document.body).paddingTop)).toBe('30px');
  const frame=await page.locator('#game .battle-frame').boundingBox();
  expect(frame.height).toBeGreaterThan(300);
});

test('backgrounding the app suspends audio and resumes it on return',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>{audioContext();});
  const setVisibility=state=>page.evaluate(value=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>value});
    document.dispatchEvent(new Event('visibilitychange'));
  },state);
  await setVisibility('hidden');
  await expect.poll(()=>page.evaluate(()=>audioCtx?.state)).toBe('suspended');
  await setVisibility('visible');
  await expect.poll(()=>page.evaluate(()=>audioCtx?.state)).not.toBe('suspended');
});

// ---- G3 kind failure ---------------------------------------------------------------
test('running out of hearts refills them and keeps mission progress',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  await answerCorrect(page);
  for(let i=0;i<3;i++)await answerWrong(page);
  await expect(page.locator('#snackCard')).toBeVisible();
  await expect(page.locator('#snackTitle')).toHaveText('Bite needs a snack!');
  await expect(page.locator('#snackActions')).toBeHidden();
  expect(await page.evaluate(()=>window.BrainBiteGame.tryAnswer(window.BrainBiteGame.getState().webglRemaining[0]))).toBe(false);
  await expect(page.locator('#snackCard')).toBeHidden({timeout:4000});
  const state=await page.evaluate(()=>{const g=window.BrainBiteGame.getState();return {lives:g.lives,eaten:g.eaten,refills:g.refills,paused:g.paused,prompt:document.getElementById('prompt').textContent}});
  expect(state).toMatchObject({lives:3,eaten:1,refills:1,paused:false,prompt:'Bite all even numbers.'});
  await expect(page.locator('#healthText')).toHaveText('3 / 3');
});

test('a third wipe-out offers practice or the map instead of another refill',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  for(let round=0;round<3;round++){
    for(let i=0;i<3;i++)await answerWrong(page);
    if(round<2)await expect(page.locator('#snackCard')).toBeHidden({timeout:4000});
  }
  await expect(page.locator('#snackTitle')).toHaveText('Bite is tired!');
  await expect(page.locator('#snackActions')).toBeVisible();
  await expect(page.locator('#snackPractice')).toBeFocused();
  await page.locator('#snackPractice').click();
  const state=await page.evaluate(()=>{const g=window.BrainBiteGame.getState();return {lives:g.lives,eligible:g.progressionEligible,paused:g.paused}});
  expect(state).toEqual({lives:3,eligible:false,paused:false});
  const before=await page.evaluate(()=>P().score);
  await answerCorrect(page);
  expect(await page.evaluate(()=>P().score)).toBe(before);
});

test('back to map from the tired card leaves the battle',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>{window.BrainBiteGame.startMission(1);const g=window.BrainBiteGame.getState();g.refills=2;});
  for(let i=0;i<3;i++)await answerWrong(page);
  await page.locator('#snackMap').click();
  await expect(page.locator('#home')).toHaveClass(/show/);
});

test('a wrong answer shows a visual explanation and the retry counts as assisted, never independent',async({page})=>{
  await page.goto('/?presentation=webgl');
  await page.evaluate(()=>window.BrainBiteGame.startMission(1));
  const evidence=()=>page.evaluate(()=>{const e=P().learningCore.skills['even-numbers']?.evidence||{};return {independent:e.independentSuccesses||0,assisted:e.assistedSuccesses||0}});
  await page.evaluate(()=>window.BrainBiteGame.tryAnswer('3'));
  await expect(page.locator('#explainer svg')).toBeVisible();
  await expect(page.locator('#feedback')).toContainText('odd');
  const before=await evidence();
  await answerCorrect(page);
  const afterRetry=await evidence();
  expect(afterRetry.independent).toBe(before.independent);
  expect(afterRetry.assisted).toBe(before.assisted+1);
  await page.waitForTimeout(500);
  await answerCorrect(page);
  const afterNext=await evidence();
  expect(afterNext.independent).toBe(before.independent+1);
});
