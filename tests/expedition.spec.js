import {test,expect} from '@playwright/test';

const preview='/?ui=expedition&presentation=webgl';
async function ready(page) {
  // The expedition boot mounts its presentation after the document response. Waiting for
  // the full load event can hang while the live 3D asset settles; the assertions below are
  // the actual readiness contract and produce a useful failure if boot never completes.
  await page.goto(preview,{waitUntil:'commit'});
  await expect(page.locator('html')).toHaveAttribute('data-ui','expedition',{timeout:15000});
 await expect(page.locator('#home canvas.webgl-canvas')).toBeVisible({timeout:15000});
 const welcome=page.locator('#firstRunConfirm');
 if(await welcome.isVisible()) {await page.locator('#firstRunName').fill('Explorer');await welcome.click();}
}
async function withinViewport(page,selector) {
  const boxes=await page.locator(selector).evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight}}));
  expect(boxes.length).toBeGreaterThan(0);
  for(const box of boxes){expect(box.left).toBeGreaterThanOrEqual(-1);expect(box.right).toBeLessThanOrEqual(box.width+1);expect(box.top).toBeGreaterThanOrEqual(-1);expect(box.bottom).toBeLessThanOrEqual(box.height+1);}
}
async function returnHome(page) {
  await page.getByRole('button',{name:'BrainBite home',exact:true}).click();
  await expect(page.locator('#home.show')).toBeVisible();
}

test('expedition header keeps profile and settings destinations wired',async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Adventure navigation'})).toBeVisible();
  const profile=page.getByRole('button',{name:'Your profile',exact:true});
  const settings=page.getByRole('button',{name:'Settings',exact:true});
  await expect(profile).toBeVisible();
  await expect(settings).toBeVisible();
  await withinViewport(page,'.expedition-profile, .expedition-settings');

  await profile.click();
  await expect(page.locator('#profile.show')).toBeVisible();
  await expect(page.locator('#profile h2')).toHaveText('Profile');
  await returnHome(page);

  await settings.click();
  await expect(page.locator('#settings.show')).toBeVisible();
  await expect(page.locator('#settings h2')).toHaveText('Settings');
  await expect(page.locator('#reducedMotion')).toBeVisible();
  await returnHome(page);
});

test('expedition More menu keeps Practice, Make & code, and Parents wired',async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  const more=page.locator('.expedition-more');
  const summary=more.locator('summary');
  const openMore=async()=>{
    await summary.click();
    await expect(more).toHaveAttribute('open','');
  };

  await openMore();
  await more.getByRole('button',{name:'Practice',exact:true}).click();
  await expect(page.locator('#practice.show')).toBeVisible();
  await expect(page.locator('#practice h2')).toHaveText('Practice Lab');
  await returnHome(page);

  await openMore();
  await more.getByRole('button',{name:'Make & code',exact:true}).click();
  await expect(page.locator('#code.show')).toBeVisible();
  await expect(page.locator('#code h2')).toHaveText('Code');
  await returnHome(page);

  await openMore();
  await more.getByRole('button',{name:'Parents',exact:true}).click();
  await expect(page.locator('#parent.show')).toBeVisible();
  await expect(page.locator('#parent h2')).toHaveText('Parent Dashboard');
  await expect(page.locator('#parentGate')).toBeVisible();
  await returnHome(page);
});

test('expedition Explore, Collection, and My space keep existing destinations wired',async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  const destinations=[
    ['Explore','#worlds','Worlds'],
    ['Collection','#bites','My Bites'],
    ['My space','#brainbase','BrainBase Greybox'],
  ];
  for(const [label,screen,heading] of destinations){
    const destination=page.getByRole('button',{name:label,exact:true});
    await expect(destination).toBeVisible();
    await destination.click();
    await expect(page.locator(`${screen}.show`)).toBeVisible();
    await expect(page.locator(`${screen} > h2`)).toHaveText(heading);
    await returnHome(page);
  }
});

test('expedition real answer tiles complete a mission with persistent honest results',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:1280,height:900});
 await page.emulateMedia({reducedMotion:'reduce'});
 await ready(page);
 await withinViewport(page,'#continueBtn');
 await page.locator('#continueBtn').click();
 await expect(page.locator('#game canvas.webgl-canvas')).toBeVisible();
 await expect(page.locator('.webgl-answer-controls button').first()).toBeVisible();
 await withinViewport(page,'.webgl-answer-controls button');
 for(let attempt=0;attempt<35 && !(await page.locator('#clearBanner').isVisible());attempt++) {
   const answer=await page.evaluate(()=>webglPrompt().targets[0]);
   if(answer===undefined)break;
   const buttons=page.locator('.webgl-answer-controls button');
   const index=await buttons.evaluateAll((nodes,value)=>nodes.findIndex(node=>node.dataset.value===String(value)),answer);
   expect(index).toBeGreaterThanOrEqual(0);
   await buttons.nth(index).click();
   await page.waitForTimeout(500);
 }
 await expect(page.locator('#clearBanner')).toBeVisible();
 await expect(page.locator('#clearStars')).toHaveAttribute('aria-label','3 of 3 stars');
 await expect(page.locator('#clearPoints')).toHaveText(/\+\d+ BrainBites/);
 expect(await page.evaluate(()=>P().missionStars[1])).toBe(3);
 await page.waitForTimeout(12500);
 await expect(page.locator('#clearBanner')).toBeVisible();
 await withinViewport(page,'#clearNext');
 await page.screenshot({path:'.ui-captures/expedition/results-1280.png'});
 await page.locator('#clearNext').click();
 await expect(page.locator('#game')).toHaveClass(/show/);
 expect(await page.evaluate(()=>window.BrainBiteGame.getState().m.id)).toBe(2);
});

for(const size of [{width:1280,height:900},{width:390,height:844}])test(`expedition ${size.width}px home and play fit and keep utilities reachable`,async({page})=>{
 await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});
 await ready(page);
 await page.screenshot({path:`.ui-captures/expedition/home-${size.width}.png`});
 await withinViewport(page,'#continueBtn, .home-rail button');
 const homeOverlap=await page.evaluate(()=>{const play=document.getElementById('continueBtn').getBoundingClientRect();return ['homeHeroTitle','homeGoalText'].some(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width>0&&r.height>0&&Math.min(play.right,r.right)>Math.max(play.left,r.left)&&Math.min(play.bottom,r.bottom)>Math.max(play.top,r.top)});});
 expect(homeOverlap).toBe(false);
 await page.locator('#continueBtn').click();
 await expect(page.locator('#game canvas.webgl-canvas')).toBeVisible();
 await withinViewport(page,'.webgl-answer-controls button, #exitBtn');
 await page.screenshot({path:`.ui-captures/expedition/game-${size.width}.png`});
 await page.locator('#exitBtn').click();
 await expect(page.locator('#game')).not.toHaveClass(/show/);
});

test('expedition is opt-in and available offline after installation',async({page,context})=>{
  await page.goto('/?presentation=dom',{waitUntil:'commit'});
  await expect(page.locator('html')).not.toHaveAttribute('data-ui','expedition');
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/service-worker.js');await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 await ready(page);
 await context.setOffline(true);
 await page.reload();
 await expect(page.locator('#home canvas.webgl-canvas')).toBeVisible({timeout:15000});
 await page.locator('#continueBtn').click();
  await expect(page.locator('.webgl-answer-controls button').first()).toBeVisible();
});

test('expedition remains explicit opt-in in the Windows shell',async({page})=>{
  await page.addInitScript(()=>{window.__TAURI_INTERNALS__={};});
  await page.goto('/?presentation=dom',{waitUntil:'commit'});
  await expect.poll(()=>page.evaluate(()=>window.BrainBitePlatform?.kind())).toBe('tauri');
  await expect(page.locator('html')).not.toHaveAttribute('data-ui','expedition');
  await page.goto('/?ui=classic&presentation=dom',{waitUntil:'commit'});
  await expect(page.locator('html')).not.toHaveAttribute('data-ui','expedition');
  await page.goto('/?ui=expedition&presentation=dom',{waitUntil:'commit'});
  await expect(page.locator('html')).toHaveAttribute('data-ui','expedition');
});

test('classic WebGL does not request the Expedition scene module',async({page})=>{
  test.setTimeout(45000);
  let expeditionSceneRequested=false;
  await page.route('**/presentation/expedition-scene.mjs',route=>{expeditionSceneRequested=true;return route.abort();});
  await page.goto('/?presentation=webgl',{waitUntil:'commit'});
  await expect(page.locator('html')).not.toHaveAttribute('data-ui','expedition');
  await expect.poll(()=>page.evaluate(()=>Boolean(window.BrainBitePresentation)),{timeout:15000}).toBe(true);
  await expect(page.locator('#home canvas.webgl-canvas')).toBeVisible({timeout:15000});
  expect(expeditionSceneRequested).toBe(false);
});

test('a missing Expedition stylesheet falls back through normal classic boot',async({page})=>{
  await page.route('**/presentation/expedition.css',route=>route.abort());
  await page.goto('/?ui=expedition&presentation=dom',{waitUntil:'commit'});
  await expect(page.locator('html')).not.toHaveAttribute('data-ui','expedition');
  await expect.poll(()=>page.evaluate(()=>Boolean(window.BrainBitePresentation)),{timeout:15000}).toBe(true);
  await expect(page.locator('#home.show')).toBeVisible();
  await expect(page.locator('link[href$="/presentation/expedition.css"]')).toHaveCount(0);
});

test('expedition keyboard answers preserve errors and WebGL loss falls back to playable controls',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.emulateMedia({reducedMotion:'reduce'});
 await ready(page);await page.locator('#continueBtn').click();
 await expect(page.locator('#game canvas.webgl-canvas')).toBeVisible();
 const wrong=await page.evaluate(()=>window.BrainBiteGame.pillarChoices().find(value=>!webglPrompt().targets.includes(value)));
 const choice=page.locator('.webgl-answer-controls button').filter({hasText:new RegExp(`^${wrong}$`)});
 await choice.focus();await page.keyboard.press('Enter');
 await expect.poll(()=>page.evaluate(()=>window.BrainBiteGame.getState().wrong)).toBe(1);
 await expect(page.locator('#feedback')).not.toHaveText('Ready.');
 const correct=await page.evaluate(()=>webglPrompt().targets[0]);
 const buttons=page.locator('.webgl-answer-controls button');
 const index=await buttons.evaluateAll((nodes,value)=>nodes.findIndex(node=>node.dataset.value===String(value)),correct);
 await buttons.nth(index).focus();await page.keyboard.press('Enter');
 await expect.poll(()=>page.evaluate(()=>window.BrainBiteGame.getState().correct)).toBe(1);
 await page.evaluate(()=>document.querySelector('#game canvas.webgl-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await expect(page.locator('html')).not.toHaveClass(/presentation-webgl/,{timeout:10000});
 await expect(page.locator('#board')).toBeVisible();
 await withinViewport(page,'#exitBtn');
});
