const RECOVERY_KEY='bb-core-v3-recovery';
const KEY='bb-core-v3',BACK='bb-core-v3-back';
// Save-generation policy lives in content/storage-copies.js so it can be unit tested.
// Declared here, before the canonical load runs, because load() reconciles the copies.
const STORE_COPY_KEYS=BrainBiteStorageCopies.DEFAULT_KEYS;
const PRE_OPERATION_ROLLBACK_KEY='bb-core-v3-pre-operation-rollback';
const PARENT_AUTH_KEY='bb-parent-auth-v1';
const PARENT_AUTH_ITERATIONS=600000;
const PARENT_LOCK_MS=15*60*1000;
const TIME_USAGE_KEY='bb-time-usage-v1';
const TIME_USAGE_BACKUP_KEY='bb-time-usage-v1-backup';
const TIME_USAGE_VERSION=1;
const TIME_CHECKPOINT_MS=15*1000;
const TIME_INACTIVITY_MS=15*60*1000;
const TIME_EXTENSION_MS=15*60*1000;
const TIME_EXIT_PREFIX='bb-time-usage-v1-exit:';
const TIME_EXIT_RECEIPT_LIMIT=128;
const SECRET_KEYS=new Set(['parentPin','parentAuth','pinHash','pinSalt','password','idToken','refreshToken','accessToken']);
const $=id=>document.getElementById(id);
const REGISTRY=window.BrainBiteRegistry;
const CONTENT_REVIEW=window.BrainBiteContentReviewManifest;
const CONTENT_CONTROL=window.BrainBiteContentControl;
if(!CONTENT_REVIEW?.getReviewRecord||!CONTENT_CONTROL?.evaluateLaunch) {
 const launchHint=document.getElementById('launchHint');
 if(launchHint) launchHint.textContent='Activities are unavailable while content safety checks load.';
 throw new Error('BrainBite content review manifest or runtime gate is unavailable.');
}
if(!REGISTRY?.validateRegistry().valid)throw new Error('BrainBite experience registry is unavailable or invalid.');
const MISSIONS=REGISTRY.missions;
const WORLDS=REGISTRY.worlds;
const CONTENT_UNAVAILABLE_MESSAGE='This activity is not available yet. Please choose another activity.';
let BUBBLE_REEF_REWARDS_PROMISE=null;
function currentContentGateMode(){return CONTENT_CONTROL.getRuntimeMode()}
function isInternalBubbleReefPreview(){
 return currentContentGateMode()==='internal-review'&&window.BrainBiteWorldPreview?.getProfile?.()==='bubble-reef'
}
function bubbleReefRewards(){
 if(!BUBBLE_REEF_REWARDS_PROMISE)BUBBLE_REEF_REWARDS_PROMISE=import('./content/bubble-reef/rewards.mjs').catch(error=>{console.warn('[BrainBite] Bubble Reef rewards unavailable.',error);return null});
 return BUBBLE_REEF_REWARDS_PROMISE
}
async function grantBubbleReefPreviewReward({profileId,missionId,progression:completedProgression,awardedAt,canonicalRewardGranted}){
 const rewards=await bubbleReefRewards();
 const contribution=rewards?.BUBBLE_REEF_BASE_CONTRIBUTION;
 if(!rewards||contribution?.missionId!==missionId)return {status:'not-applicable',granted:false};
 const profile=STORE.profiles.find(candidate=>candidate.id===profileId);
 if(!profile)return {status:'profile-unavailable',granted:false};
 const existing=profile.bubbleReefRewards?.profileId===profileId
  ?profile.bubbleReefRewards
  :rewards.createBubbleReefRewardState(profileId);
 const result=rewards.grantBubbleReefContribution(existing,{progression:completedProgression,awardedAt});
 profile.bubbleReefRewards=result.state;
 if(result.granted&&!canonicalRewardGranted){
  const reward=result.state.rewards.find(item=>item.id===result.receipt?.rewardId);
  profile.stars+=Number(reward?.stars)||0;
  profile.spark+=Number(reward?.spark)||0;
 }
 profile.updatedAt=Date.now();
 await persistCanonicalState({renderAfter:true});
 return result
}
function showContentUnavailable(target='launchHint'){
 const element=$(target)||$('launchHint');
 if(!element)return false;
 element.textContent=CONTENT_UNAVAILABLE_MESSAGE;
 element.dataset.contentGate='unavailable';
 return false
}
function registryMissionGate(mission){
  const learner=core()&&P()?ensureProfileLearningCore(P()):null;
  return CONTENT_CONTROL.evaluateLaunch({
  identity:`registry-mission:${mission?.id}`,
  sourceValue:mission,
  launchedPayload:mission,
  registry:REGISTRY,
  mode:currentContentGateMode(),
   programmaticValidation:REGISTRY.validateRegistry(),
   quarantinedContentIdentities:Object.keys(learner?.contentQuarantine||{}),
  })
}
function generatedChallengeGate(challenge,skill,validation){
  const templateId=challenge?.templateId||challenge?.skillId;
  const learner=core()&&P()?ensureProfileLearningCore(P()):null;
  return CONTENT_CONTROL.evaluateLaunch({
   identity:`generated-template:${templateId}`,
   sourceValue:core()?.CURRICULUM_ITEM_TEMPLATES?.[templateId],
   launchedPayload:challenge,
   quarantinedContentIdentities:Object.keys(learner?.contentQuarantine||{}),
   core:core(),
  mode:currentContentGateMode(),
  programmaticValidation:validation,
  skill,
 })
}
function blank(name='Kid 1'){return {id:(crypto.randomUUID?.()||('p-'+Date.now()+'-'+Math.random())),name,score:0,stars:0,spark:0,progression:REGISTRY.createProgression(),learningCore:null,bestCombo:0,missionStars:{},bite:'Nib',unlockedBites:['Nib'],cosmetics:[],equippedCosmetic:null,programmableBits:{},activeProgrammableBitId:null,mastery:{math:10,words:10,spanish:10},skills:{},mistakes:[],practice:[],snap:[],sessions:[],settings:{reducedMotion:false,cameraMotionReduction:false,largeTargets:false,highContrast:false,captions:false,dyslexicFont:false,textScale:'1',qualityTier:'balanced',soundOn:true,musicOn:false,enemySpeed:'normal'},controls:{dailyMinutes:30,maxSessionMinutes:20,requireParentForPractice:false}}}
let LOADED_STORE_RAW=null;
const SCHEMA_VERSION=9;
 const DEF={schemaVersion:SCHEMA_VERSION,registryVersion:REGISTRY.registryVersion,active:0,profiles:[blank()],deletedProfiles:[]};let STORE=load(),G=null;function P(){return STORE.profiles[STORE.active]}
 window.BrainBiteProfile={getActiveBit:()=>{const bits=P()?.programmableBits||{};return bits[P()?.activeProgrammableBitId]||Object.values(bits)[0]||null}};

window.BrainBiteGame={
  getState(){return G},
  getActivityState(){return G?.activity?.challenge||null},
  getActivityFamily(){return G?.activity?.family||G?.m?.activityFamily||null},
  getContentControl(){return {mode:currentContentGateMode(),manifestVersion:CONTENT_REVIEW.getReviewManifest().version,manifestLoaded:CONTENT_CONTROL.manifestAvailable}},
  evaluateContentRecord(identity,options={}){return CONTENT_CONTROL.evaluateRecord(identity,{...options,mode:options.mode||currentContentGateMode()})},
  startMission(id){return start(id)},
  startPracticeMission(id){return start(id,{allowLocked:true,progressionEligible:false})},
  startCurriculumChallenge(challenge,options){return startCurriculumChallenge(challenge,options)},
  startTypingChallenge(challenge,options={}){
    const started=startCurriculumChallenge(challenge,options);
    if(!started||!G)return false;
    const requested=challenge?.typingTargets||challenge?.targetSequence||challenge?.answers||[];
    const targets=[...new Set((Array.isArray(requested)?requested:[]).map(value=>String(value).trim()).filter(Boolean))];
    if(!targets.length)return false;
    G.typingMode={targets,targetIndex:0,target:targets[0],startedAt:Date.now(),attempts:[]};
    draw();
    return true;
  },
  resolveActivity(value,meta={}){return resolveLiveActivity(value,meta)},
  submitTypedAnswer(typed,{attemptId,elapsedMs,hints=0,readAloud=false,guided=false}={}){
    const typing=window.BrainBiteTyping;
    if(!typing||!G)return {accepted:false,reason:'typing-unavailable'};
    if(!checkpointGameplayActivity({reason:'activity'}))return {accepted:false,reason:'time-limit'};
    if(G.typingMode?.completed)return {accepted:false,reason:'typing-complete'};
    if(G.paused)return {accepted:false,reason:'paused'};
    const target=G.typingMode?.target||activityValues(G.activity?.challenge||{})[0]||G.m?.correct?.[0]||'';
    const score=typing.scoreTypingAttempt({attemptId,target,typed,elapsedMs,hints,readAloud,guided});
    if(!score.valid)return {accepted:false,reason:'invalid-typed-attempt',score};
    if(G.typingMode){
      const correct=score.correct;
      const assisted=!!G.assisted||score.support!=='independent';
      const attempt=recordLiveActivityAttempt(correct,score.actual,{responseTimeMs:score.elapsedMs,assisted,hintsUsed:assisted?Math.max(1,hints):hints,randomLike:!score.plausibleTiming});
      if(!attempt)return {accepted:false,score};
      G.typingMode.attempts.push({...attempt,typing:score});
      if(correct){
        if(G.typingMode.targetIndex+1<G.typingMode.targets.length){
          G.typingMode.targetIndex+=1;G.typingMode.target=G.typingMode.targets[G.typingMode.targetIndex];G.typingMode.startedAt=Date.now();draw();return {accepted:true,score,completed:false}
        }
        G.typingMode.completed=true;draw();complete();return {accepted:true,score,completed:true}
      }
      if(G.lives<=0){handleOutOfLives();return {accepted:false,score,refilling:true}}
      draw();return {accepted:false,score};
    }
    const accepted=resolveLiveActivity(score.actual,{responseTimeMs:score.elapsedMs,assisted:score.support!=='independent',hintsUsed:hints,randomLike:!score.plausibleTiming});
    return {accepted,score};
  },
  pillarChoices(){
    if(!G?.m)return [];
    // Prefer screenshot-like fraction set for fractions missions
    if(G.m.skill==='fractions' && document.documentElement.classList.contains('presentation-match'))return ['1/3','2/4','2/4','3/4'];
    if(document.documentElement.classList.contains('presentation-webgl')){
      const remaining=G.webglRemaining||[];
      const wrong=[...new Set((G.m.wrong||[]).map(String))];
      const offset=wrong.length?G.eaten%wrong.length:0;
      const fillers=[...wrong.slice(offset),...wrong.slice(0,offset)];
      return [...new Set([remaining[0],...fillers].filter(Boolean))].slice(0,4);
    }
    if(G.activity&&!isMatchFractionCompatibilityPath()){
      const used=new Set(activityProgress(G.activity.challenge).map(value=>String(value)));
      return activityChoices(G.activity.challenge).filter(value=>!used.has(String(value)));
    }
    const present=new Set((G.cells||[]).filter(cell=>cell&&!cell.eaten).map(cell=>String(cell.value)));
    const correct=(G.m.correct||[]).map(String).find(value=>present.has(value))||String(G.m.correct?.[0]??'');
    const wrong=(G.m.wrong||[]).map(String).filter(v=>v&&v!==correct&&present.has(v));
    return [...new Set([correct,...wrong].filter(Boolean))].slice(0,4);
  },
  tryAnswer(value){
    if(!G||G.paused)return false;
    if(!checkpointGameplayActivity({reason:'activity'}))return false;
    if(G.activity&&!isMatchFractionCompatibilityPath())return resolveLiveActivity(value);
    const target=String(value);
    const webgl=document.documentElement.classList.contains('presentation-webgl');
    const presentation=webgl
      ||(document.documentElement.classList.contains('presentation-match')&&!document.documentElement.classList.contains('presentation-match-game-dom'));
    // MATCH fraction plates / WebGL pillars resolve by LearningCore answer sets (no 5×5 cell required).
    // MATCH non-fractions DOM battle uses the normal board path below.
    if(presentation){
      const remainingIndex=webgl?(G.webglRemaining||[]).indexOf(target):-1;
      const ok=webgl?remainingIndex>=0:(G.m.correct||[]).map(String).includes(target);
      if(ok){
        if(webgl)G.webglRemaining.splice(remainingIndex,1);
        G.combo++;G.max=Math.max(G.max,G.combo);G.eaten++;G.correct++;
        awardProgressionScore(100*G.combo);P().mastery[G.m.world]=Math.min(100,P().mastery[G.m.world]+1);
        updateSkill(G.m.skill,true,{...attemptSupport(),source:G.source||'mission'});G.retryAssist=false;$('feedback').textContent='CHOMP! Correct.';fileCue(G.combo>=8?'super':'correct');
        emitAnswer(target,true,G.m.boss?G.boss<=25:G.eaten>=G.total);
        if(G.m.boss){G.boss=Math.max(0,G.boss-25);if(G.boss===0){draw();complete();return true}}
        else if(G.eaten>=G.total){draw();complete();return true}
        draw();return true;
      }
      const outcome=updateSkill(G.m.skill,false,{...attemptSupport(),independent:false,source:G.source||'mission'});if(outcome?.contentQuarantined){$('feedback').textContent=CONTENT_UNAVAILABLE_MESSAGE;draw();return false}G.combo=0;G.wrong++;G.lives--;P().mastery[G.m.world]=Math.max(0,P().mastery[G.m.world]-.5);P().mistakes.push({skill:G.m.skill,chosen:target,ts:Date.now()});$('feedback').textContent=wrongAnswerFeedback(target);fileCue('wrong');emitAnswer(target,false,false);draw();handleOutOfLives();return false;
    }
    for(let y=0;y<5;y++)for(let x=0;x<5;x++){
      const c=G.cells[ix(x,y)];
      if(c&&!c.eaten&&String(c.value)===target){
        G.p={x,y};bite();bossTick();enemy();hit();
        $('feedback').textContent=c.correct?'CHOMP! Correct.':incorrectAttemptMessage(c.value);
        draw();return true;
      }
    }
    const outcome=updateSkill(G.m.skill,false,{...attemptSupport(),independent:false,source:G.source||'mission'});if(outcome?.contentQuarantined){$('feedback').textContent=CONTENT_UNAVAILABLE_MESSAGE;draw();return false}G.combo=0;G.wrong++;G.lives--;P().mastery[G.m.world]=Math.max(0,P().mastery[G.m.world]-.5);P().mistakes.push({skill:G.m.skill,chosen:target,ts:Date.now()});$('feedback').textContent=wrongAnswerFeedback(target);fileCue('wrong');emitAnswer(target,false,false);draw();handleOutOfLives();return false;
  }
};

let audioCtx=null,musicOsc=null,musicGain=null;
const BOSS_PHASES=3;

const AUDIO_FILES={correct:'audio/bite-correct.wav',wrong:'audio/bite-wrong.wav',hit:'audio/enemy-hit.wav',boss:'audio/boss-hit.wav',clear:'audio/mission-clear.wav',super:'audio/super-bite.wav'};
async function fileCue(name){if(!P().settings.soundOn)return;const src=AUDIO_FILES[name];if(!src)return cue(name);try{const a=new Audio(src);a.volume=.35;await a.play()}catch{cue(name)}}

function audioContext(){if(!audioCtx)try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch{}return audioCtx}
function cue(name){
 if(!P().settings.soundOn)return;
 const map={correct:[680,.06],wrong:[170,.08],hit:[230,.08],boss:[320,.11],clear:[900,.14],super:[1020,.15]};
 const v=map[name];if(!v)return;const c=audioContext();if(!c)return;
 const o=c.createOscillator(),g=c.createGain();o.frequency.value=v[0];g.gain.setValueAtTime(.035,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+v[1]);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+v[1]);
}
function syncMusic(){
 const c=audioContext();
 if(!P().settings.musicOn||!c){if(musicOsc){try{musicOsc.stop()}catch{}musicOsc=null}return}
 if(musicOsc)return;
 musicOsc=c.createOscillator();musicGain=c.createGain();musicOsc.type='sine';musicOsc.frequency.value=110;musicGain.gain.value=.008;musicOsc.connect(musicGain);musicGain.connect(c.destination);musicOsc.start();
}



const INTEGRATION_KEY='bb-core-v9-integrations';
function integrationState(){
 try{
  const stored=JSON.parse(localStorage.getItem(INTEGRATION_KEY)||'null'),cloud=stored?.cloud||{};
  return {cloud:{provider:cloud.provider==='firebase'?'firebase':'none',url:String(cloud.url||''),key:String(cloud.key||'')}}
 }catch{return {cloud:{provider:'none',url:'',key:''}}}
}
let INTEGRATIONS=integrationState();
function saveIntegrations(){localStorage.setItem(INTEGRATION_KEY,JSON.stringify(INTEGRATIONS));renderIntegrations();renderCloudAuth()}
function validHttpUrl(v){try{const u=new URL(v);return u.protocol==='https:'||u.hostname==='localhost'||u.hostname==='127.0.0.1'}catch{return false}}
function renderIntegrationBadge(element,configured,value){if(!element)return;element.replaceChildren();const badge=document.createElement('span');badge.className=configured?'integration-ok':'integration-warn';badge.textContent=configured?String(value):'Not configured';element.appendChild(badge)}
function renderIntegrations(){
 if(!$('cloudProviderStatus'))return;
 $('cloudProvider').value=INTEGRATIONS.cloud.provider;$('cloudUrl').value=INTEGRATIONS.cloud.url;$('cloudKey').value=INTEGRATIONS.cloud.key;
 renderIntegrationBadge($('cloudProviderStatus'),INTEGRATIONS.cloud.provider!=='none',INTEGRATIONS.cloud.provider);
 $('envStatus').textContent=location.protocol==='https:'?'HTTPS':'Local / non-HTTPS';
}
async function integrationCheck(){return [
 ['HTTPS or localhost',location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)],
 ['Cloud config',INTEGRATIONS.cloud.provider==='none'||(validHttpUrl(INTEGRATIONS.cloud.url)&&!!INTEGRATIONS.cloud.key)],
 ['Online API available','fetch' in window]
]}

const SYNC_KEY='bb-core-v6-sync';
const SYNC_QUEUE_LIMIT=500;
const SYNC_ACKNOWLEDGED_LIMIT=2000;
const FIRESTORE_SAFE_DOCUMENT_BYTES=900*1024;
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function newCryptographicUuid(){
 if(typeof globalThis.crypto?.randomUUID==='function')return globalThis.crypto.randomUUID();
 if(typeof globalThis.crypto?.getRandomValues!=='function')throw new Error('Secure random generation is unavailable.');
 const bytes=new Uint8Array(16);
 globalThis.crypto.getRandomValues(bytes);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=[...bytes].map(value=>value.toString(16).padStart(2,'0'));
 return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10).join('')}`
}
const PAGE_WRITER_SESSION_KEY='bb-core-writer-v1';
function pageWriterId(){
 let value='';try{value=sessionStorage.getItem(PAGE_WRITER_SESSION_KEY)||''}catch{}
 if(UUID_PATTERN.test(value))return value;
 value=newCryptographicUuid();try{sessionStorage.setItem(PAGE_WRITER_SESSION_KEY,value)}catch{}
 return value;
}
const PAGE_WRITER_ID=pageWriterId();
function belongsToInstallation(originId,installationId){const value=String(originId||'');return value===installationId||value.startsWith(`${installationId}:`)}
function stableSyncJson(value){
 if(Array.isArray(value))return `[${value.map(stableSyncJson).join(',')}]`;
 if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableSyncJson(value[key])}`).join(',')}}`;
 return JSON.stringify(value)
}
function deterministicSyncId(event){
 const source=stableSyncJson(event),words=[0x811c9dc5,0x9e3779b9];
 for(let offset=0;offset<source.length;offset++)for(let lane=0;lane<words.length;lane++)words[lane]=Math.imul(words[lane]^(source.charCodeAt(offset)+lane*131),0x01000193)>>>0;
 return `legacy-sync-${words.map(word=>word.toString(16).padStart(8,'0')).join('')}`
}
function boundedUniqueSyncIds(values){
 const result=[],seen=new Set();
 for(let index=(Array.isArray(values)?values.length:0)-1;index>=0;index--){const value=String(values[index]??'').trim();if(!value||seen.has(value))continue;seen.add(value);result.push(value);if(result.length>=SYNC_ACKNOWLEDGED_LIMIT)break}
 return result.reverse()
}
function normalizeSyncEvent(value,index=0){
 if(!value||typeof value!=='object')return null;
 const event=structuredClone(value),id=String(event.eventId||event.id||deterministicSyncId(event,index));
 event.id=id;event.eventId=id;event.type=String(event.type||'unknown');event.profileId=event.profileId==null?null:String(event.profileId);
 event.timestamp=Number(event.timestamp||event.ts)||0;event.ts=event.timestamp;event.schemaVersion=Number(event.schemaVersion)||STORE.schemaVersion;
 event.payload=event.payload&&typeof event.payload==='object'?event.payload:{};
 return event
}
function normalizeSyncQueue(values,acknowledgedIds=[],inFlightIds=new Set()){
 const acknowledged=new Set(acknowledgedIds),byId=new Map();
 for(const [index,value] of (Array.isArray(values)?values:[]).entries()){
  const event=normalizeSyncEvent(value,index);if(!event||acknowledged.has(event.eventId))continue;
  byId.set(event.eventId,{event,index});
 }
 const entries=[...byId.values()],latestDeleteByProfile=new Map(),latestStoreByProfile=new Map(),retained=[];
 for(const entry of entries){
  const {event}=entry,key=event.profileId||'';
  if(event.type==='profile-delete'){const current=latestDeleteByProfile.get(key);if(!current||event.timestamp>=current.event.timestamp)latestDeleteByProfile.set(key,entry);continue}
  if(event.type==='store-update'&&!inFlightIds.has(event.eventId)){const current=latestStoreByProfile.get(key);if(!current||event.timestamp>=current.event.timestamp)latestStoreByProfile.set(key,entry);continue}
  retained.push(entry);
 }
 const deletes=[...latestDeleteByProfile.values()];
 const deletedProfiles=new Set(deletes.map(entry=>entry.event.profileId||''));
 retained.push(...[...latestStoreByProfile.values()].filter(entry=>!deletedProfiles.has(entry.event.profileId||'')));
 const order=(left,right)=>left.event.timestamp-right.event.timestamp||left.index-right.index||left.event.eventId.localeCompare(right.event.eventId);
 deletes.sort(order);retained.sort(order);
 const prioritizedDeletes=deletes.slice(-SYNC_QUEUE_LIMIT);
 const capacity=Math.max(0,SYNC_QUEUE_LIMIT-prioritizedDeletes.length);
 const prioritizedOrdinary=capacity>0?retained.slice(-capacity):[];
 return [...prioritizedDeletes,...prioritizedOrdinary].map(entry=>entry.event)
}
function installationSequenceFloor(installationId){
 let floor=0;
 for(const profile of STORE.profiles||[])for(const skill of Object.values(profile.learningCore?.skills||{})){
  for(const attempt of skill?.recentPerformance||[])if(belongsToInstallation(attempt?.originId,installationId)&&Number.isSafeInteger(Number(attempt.originSequence)))floor=Math.max(floor,Number(attempt.originSequence));
  for(const source of core()?.evidenceProvenanceSources?.(skill?.evidenceProvenance)||[])if(belongsToInstallation(source?.id,installationId)&&Number.isSafeInteger(Number(source.sequence)))floor=Math.max(floor,Number(source.sequence));
 }
 return Math.max(0,floor)
}
function syncState(){
 let stored={};try{const parsed=JSON.parse(localStorage.getItem(SYNC_KEY)||'null');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))stored=parsed}catch{}
 const installationId=UUID_PATTERN.test(String(stored.installationId||''))?stored.installationId:newCryptographicUuid();
 const storedSequence=Number(stored.attemptSequence);
 const attemptSequence=Math.max(Number.isSafeInteger(storedSequence)&&storedSequence>=0?storedSequence:0,installationSequenceFloor(installationId));
 const acknowledgedEventIds=boundedUniqueSyncIds(stored.acknowledgedEventIds);
 return {...stored,account:stored.account||null,queue:normalizeSyncQueue(stored.queue,acknowledgedEventIds),acknowledgedEventIds,lastSync:stored.lastSync||null,provider:stored.provider||'local-only',installationId,attemptSequence}
}
let SYNC=syncState();
let PAGE_ATTEMPT_SEQUENCE=SYNC.attemptSequence;
const SYNC_IN_FLIGHT=new Set();
const PERSISTENCE_LOCK_NAME='brainbite:canonical-local-state:v1';
const PERSISTENCE_LEASE_KEY='bb-core-v3-write-lease';
const PERSISTENCE_LEASE_PREFIX=`${PERSISTENCE_LEASE_KEY}:`;
const PERSISTENCE_GENERATION_KEY='bb-core-v3-write-generation';
let PERSISTENCE_CHANNEL=null;try{PERSISTENCE_CHANNEL=new BroadcastChannel('brainbite:canonical-local-state:v1')}catch{}
let PERSISTENCE_CHAIN=Promise.resolve();
let PERSISTENCE_DB_PROMISE=null;
function readStoredSync(){try{const value=JSON.parse(localStorage.getItem(SYNC_KEY)||'null');return value&&typeof value==='object'&&!Array.isArray(value)?value:null}catch{return null}}
function persistedAttemptSequence(){const value=Number(readStoredSync()?.attemptSequence);return Number.isSafeInteger(value)&&value>=0?value:0}
function waitForPersistenceTurn(delay=8){return new Promise(resolve=>setTimeout(resolve,delay))}
function fallbackPersistenceGeneration(){
 let value=null;try{value=JSON.parse(localStorage.getItem(PERSISTENCE_GENERATION_KEY)||'null')}catch{}
 const generation=Number(value?.generation);
 return {generation:Number.isSafeInteger(generation)&&generation>=0?generation:0,nonce:typeof value?.nonce==='string'?value.nonce:'',owner:typeof value?.owner==='string'?value.owner:''};
}
function fallbackPersistenceClaims(now=Date.now()){
 const claims=[];
 for(let index=0;index<localStorage.length;index++){
  const key=localStorage.key(index);if(!key?.startsWith(PERSISTENCE_LEASE_PREFIX))continue;
  let claim=null;try{claim=JSON.parse(localStorage.getItem(key)||'null')}catch{}
  if(!claim||claim.owner!==key.slice(PERSISTENCE_LEASE_PREFIX.length)||Number(claim.expiresAt)<=now){try{localStorage.removeItem(key)}catch{};index--;continue}
  const ticket=Number(claim.ticket);
  if(claim.choosing===true||(Number.isSafeInteger(ticket)&&ticket>0))claims.push({...claim,key,ticket:Number.isSafeInteger(ticket)?ticket:0});
 }
 return claims;
}
async function withFallbackPersistenceLease(action){
 const owner=`${PAGE_WRITER_ID}:${newCryptographicUuid()}`,key=`${PERSISTENCE_LEASE_PREFIX}${owner}`,deadline=Date.now()+7000,leaseMs=2500;
 try{
  localStorage.setItem(key,JSON.stringify({owner,choosing:true,ticket:0,expiresAt:Date.now()+leaseMs}));
  await waitForPersistenceTurn(0);
  const ticket=Math.max(0,...fallbackPersistenceClaims().map(claim=>claim.ticket))+1;
  localStorage.setItem(key,JSON.stringify({owner,choosing:false,ticket,expiresAt:Date.now()+leaseMs}));
  while(Date.now()<deadline){
   const now=Date.now();
   const own=fallbackPersistenceClaims(now).find(claim=>claim.owner===owner);
   if(!own||own.ticket!==ticket)throw new Error('Local persistence lock ownership was lost.');
   const blocked=fallbackPersistenceClaims(now).some(claim=>claim.owner!==owner&&(claim.choosing===true||claim.ticket<ticket||(claim.ticket===ticket&&claim.owner.localeCompare(owner)<0)));
   if(!blocked){
    localStorage.setItem(key,JSON.stringify({owner,choosing:false,ticket,expiresAt:Date.now()+leaseMs}));
    await waitForPersistenceTurn(0);
    const verified=fallbackPersistenceClaims().find(claim=>claim.owner===owner);
    if(verified?.ticket===ticket){
     let result;
     for(let attempt=0;attempt<8;attempt++){
      const before=fallbackPersistenceGeneration(),nonce=newCryptographicUuid();
      result=await action();
      const current=fallbackPersistenceGeneration();
      localStorage.setItem(PERSISTENCE_GENERATION_KEY,JSON.stringify({generation:Math.max(before.generation,current.generation)+1,nonce,owner}));
      await waitForPersistenceTurn(16);
      const observed=fallbackPersistenceGeneration();
      if(observed.nonce!==nonce){await waitForPersistenceTurn(observed.owner&&observed.owner.localeCompare(owner)<0?48:4);continue}
      await waitForPersistenceTurn(16);
      if(fallbackPersistenceGeneration().nonce===nonce)return result;
     }
     throw new Error('Local persistence optimistic commit did not stabilize.');
    }
   }
   await waitForPersistenceTurn();
  }
  throw new Error('Local persistence lock timed out.');
 }finally{try{localStorage.removeItem(key)}catch{}}
}
function persistenceDatabase(){
 if(PERSISTENCE_DB_PROMISE)return PERSISTENCE_DB_PROMISE;
 PERSISTENCE_DB_PROMISE=new Promise((resolve,reject)=>{
  const request=indexedDB.open('brainbite-local-persistence',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('locks');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('IndexedDB persistence lock failed.'));
 });
 return PERSISTENCE_DB_PROMISE;
}
async function withIndexedDbPersistenceLock(action){
 const database=await persistenceDatabase();
 return new Promise((resolve,reject)=>{
  const transaction=database.transaction('locks','readwrite'),store=transaction.objectStore('locks');
  let result;
  transaction.oncomplete=()=>resolve(result);
  transaction.onerror=()=>reject(transaction.error||new Error('IndexedDB persistence transaction failed.'));
  transaction.onabort=()=>reject(transaction.error||new Error('IndexedDB persistence transaction aborted.'));
  const turn=store.get(PERSISTENCE_LOCK_NAME);
  turn.onerror=()=>transaction.abort();
  turn.onsuccess=()=>{try{result=action();store.put(Date.now(),PERSISTENCE_LOCK_NAME)}catch(error){try{transaction.abort()}catch{}reject(error)}};
 });
}
async function withPersistenceLock(action){
 if(globalThis.navigator?.locks?.request)return navigator.locks.request(PERSISTENCE_LOCK_NAME,{mode:'exclusive'},action);
 if(globalThis.indexedDB)try{return await withIndexedDbPersistenceLock(action)}catch(error){if(error?.name!=='InvalidStateError'&&error?.name!=='UnknownError')throw error}
 return withFallbackPersistenceLease(action);
}

function timeDayKey(value){
 const date=new Date(value),year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
 return `${year}-${month}-${day}`
}
function timeInteger(value,max=Number.MAX_SAFE_INTEGER){const number=Number(value);return Number.isSafeInteger(number)&&number>=0&&number<=max?number:null}
function emptyTimeUsageLedger(){return {version:TIME_USAGE_VERSION,profiles:{},updatedAt:0,warning:null,appliedExitIds:[]}}
function emptyProfileTimeUsage(profileId,now=Date.now()){
 return {profileId:String(profileId),dayKey:timeDayKey(now),dailyActiveMs:0,sessionId:null,sessionStartedAt:0,sessionActiveMs:0,lastTickAt:0,lastActivityAt:0,extensionGrantedMs:0,extensionActiveMs:0,updatedAt:now,lastSeenWallClock:now,recoveryBaselineMs:0}
}
function normalizeProfileTimeUsage(raw,profileId){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||String(raw.profileId)!==String(profileId)||!/^(?:\d{4})-(?:\d{2})-(?:\d{2})$/.test(String(raw.dayKey||'')))return null;
 const fields=['dailyActiveMs','sessionStartedAt','sessionActiveMs','lastTickAt','lastActivityAt','extensionGrantedMs','extensionActiveMs','updatedAt','lastSeenWallClock','recoveryBaselineMs'],clean={profileId:String(profileId),dayKey:String(raw.dayKey),sessionId:raw.sessionId==null?null:String(raw.sessionId).slice(0,100)};
 for(const field of fields){const max=field==='extensionGrantedMs'||field==='extensionActiveMs'?TIME_EXTENSION_MS:Number.MAX_SAFE_INTEGER,value=timeInteger(raw[field],max);if(value===null)return null;clean[field]=value}
 if(clean.extensionActiveMs>clean.extensionGrantedMs||clean.recoveryBaselineMs>clean.dailyActiveMs)return null;
 return clean
}
function normalizeTimeUsageLedger(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==TIME_USAGE_VERSION||!raw.profiles||typeof raw.profiles!=='object'||Array.isArray(raw.profiles))return null;
 const profiles={};
 for(const [profileId,value] of Object.entries(raw.profiles)){const normalized=normalizeProfileTimeUsage(value,profileId);if(!normalized)return null;profiles[profileId]=normalized}
 const updatedAt=timeInteger(raw.updatedAt);if(updatedAt===null)return null;
 const warning=raw.warning&&raw.warning.code==='reconstructed-from-sessions'?{code:'reconstructed-from-sessions',at:timeInteger(raw.warning.at)||updatedAt}:null;
 const appliedExitIds=[...new Set((Array.isArray(raw.appliedExitIds)?raw.appliedExitIds:[]).filter(value=>typeof value==='string'&&value.length>=8&&value.length<=100))].slice(-TIME_EXIT_RECEIPT_LIMIT);
 return {version:TIME_USAGE_VERSION,profiles,updatedAt,warning,appliedExitIds}
}
function parseTimeUsageCopy(raw){
 if(raw==null)return {status:'missing',value:null};
 try{const value=normalizeTimeUsageLedger(JSON.parse(raw));return value?{status:'valid',value}:{status:'invalid',value:null}}catch{return {status:'invalid',value:null}}
}
function reconstructTimeUsageFromSessions(now=Date.now()){
 const ledger=emptyTimeUsageLedger(),dayKey=timeDayKey(now);
 for(const profile of STORE.profiles||[]){
  const dailyActiveMs=(profile.sessions||[]).filter(session=>timeDayKey(Number(session.ts)||0)===dayKey).reduce((total,session)=>total+Math.max(0,Math.round((Number(session.durationSec)||0)*1000)),0);
  ledger.profiles[profile.id]={...emptyProfileTimeUsage(profile.id,now),dailyActiveMs,recoveryBaselineMs:dailyActiveMs};
 }
 ledger.updatedAt=now;ledger.warning={code:'reconstructed-from-sessions',at:now};return ledger
}
function writeTimeUsageCopiesUnlocked(ledger){
 const normalized=normalizeTimeUsageLedger(ledger);if(!normalized)throw new Error('Invalid time usage ledger.');
 const payload=JSON.stringify(normalized);localStorage.setItem(TIME_USAGE_BACKUP_KEY,payload);localStorage.setItem(TIME_USAGE_KEY,payload);return normalized
}
function readPendingExitContributions(){
 const contributions=[];
 for(let index=0;index<localStorage.length;index++){
  const key=localStorage.key(index);if(!key?.startsWith(TIME_EXIT_PREFIX))continue;
  let value=null;try{value=JSON.parse(localStorage.getItem(key)||'null')}catch{}
  const id=String(value?.id||''),profileId=String(value?.profileId||''),dayKey=String(value?.dayKey||''),deltaMs=timeInteger(value?.deltaMs,TIME_CHECKPOINT_MS),at=timeInteger(value?.at);
  if(id&&key===`${TIME_EXIT_PREFIX}${id}`&&profileId&&/^(?:\d{4})-(?:\d{2})-(?:\d{2})$/.test(dayKey)&&deltaMs&&at!==null)contributions.push({key,id,profileId,dayKey,sessionId:value.sessionId==null?null:String(value.sessionId).slice(0,100),deltaMs,at});
  else{try{localStorage.removeItem(key)}catch{}index--}
 }
 return contributions.sort((left,right)=>left.at-right.at||left.id.localeCompare(right.id))
}
function reconcilePendingExitContributions(ledger){
 const working=normalizeTimeUsageLedger(ledger)||emptyTimeUsageLedger(),applied=new Set(working.appliedExitIds),removableKeys=[];
 for(const contribution of readPendingExitContributions()){
  if(applied.has(contribution.id)){removableKeys.push(contribution.key);continue}
  let entry=ensureProfileTimeUsage(working,contribution.profileId,contribution.at);
  if(contribution.dayKey===entry.dayKey){entry=consumeTimeDelta(entry,contribution.deltaMs,Math.max(contribution.at,entry.lastSeenWallClock));working.profiles[contribution.profileId]=entry;working.updatedAt=Math.max(working.updatedAt,entry.updatedAt)}
  applied.add(contribution.id);removableKeys.push(contribution.key)
 }
 working.appliedExitIds=[...applied].slice(-TIME_EXIT_RECEIPT_LIMIT);return {ledger:working,removableKeys}
}
let TIME_USAGE_WARNING='';
function loadTimeUsageLedger(){
 const primary=parseTimeUsageCopy(localStorage.getItem(TIME_USAGE_KEY)),backup=parseTimeUsageCopy(localStorage.getItem(TIME_USAGE_BACKUP_KEY));
 let ledger;
 if(primary.status==='valid'&&backup.status==='valid')ledger=mergeTimeUsageLedgers(primary.value,backup.value);
 else if(primary.status==='valid')ledger=primary.value;
 else if(backup.status==='valid')ledger=backup.value;
 else if(primary.status==='invalid'||backup.status==='invalid')ledger=reconstructTimeUsageFromSessions();
 else ledger=emptyTimeUsageLedger();
 if(primary.status!=='valid'||backup.status!=='valid')try{writeTimeUsageCopiesUnlocked(ledger)}catch(error){reportPersistenceFailure(error)}
 ledger=reconcilePendingExitContributions(ledger).ledger;
 TIME_USAGE_WARNING=ledger.warning?'Play-time records needed recovery. Usage was rebuilt from completed sessions; a parent should review today\'s limits.':'';
 return ledger
}
function mergeProfileTimeUsage(left,right){
 if(!left)return right;if(!right)return left;
 if(left.dayKey!==right.dayKey)return left.dayKey>right.dayKey?left:right;
 const newer=left.sessionStartedAt>right.sessionStartedAt?left:right.sessionStartedAt>left.sessionStartedAt?right:(left.updatedAt>=right.updatedAt?left:right);
 const sameSession=left.sessionId&&left.sessionId===right.sessionId;
 return {...newer,dailyActiveMs:Math.max(left.dailyActiveMs,right.dailyActiveMs),sessionActiveMs:sameSession?Math.max(left.sessionActiveMs,right.sessionActiveMs):newer.sessionActiveMs,extensionGrantedMs:Math.max(left.extensionGrantedMs,right.extensionGrantedMs),extensionActiveMs:Math.max(left.extensionActiveMs,right.extensionActiveMs),updatedAt:Math.max(left.updatedAt,right.updatedAt),lastSeenWallClock:Math.max(left.lastSeenWallClock,right.lastSeenWallClock),recoveryBaselineMs:Math.max(left.recoveryBaselineMs,right.recoveryBaselineMs)}
}
function mergeTimeUsageLedgers(left,right){
 const a=normalizeTimeUsageLedger(left)||emptyTimeUsageLedger(),b=normalizeTimeUsageLedger(right)||emptyTimeUsageLedger(),profiles={};
 for(const profileId of new Set([...Object.keys(a.profiles),...Object.keys(b.profiles)]))profiles[profileId]=mergeProfileTimeUsage(a.profiles[profileId],b.profiles[profileId]);
 return {version:TIME_USAGE_VERSION,profiles,updatedAt:Math.max(a.updatedAt,b.updatedAt),warning:a.warning||b.warning||null,appliedExitIds:[...new Set([...(a.appliedExitIds||[]),...(b.appliedExitIds||[])])].slice(-TIME_EXIT_RECEIPT_LIMIT)}
}
function rollProfileTimeUsage(entry,now=Date.now()){
 const wallClock=Math.max(Number(now)||0,entry.lastSeenWallClock),nextDay=timeDayKey(wallClock);
 if(nextDay>entry.dayKey)return {...emptyProfileTimeUsage(entry.profileId,wallClock),updatedAt:wallClock,lastSeenWallClock:wallClock};
 return {...entry,lastSeenWallClock:Math.max(entry.lastSeenWallClock,Number(now)||0),updatedAt:Math.max(entry.updatedAt,Number(now)||0)}
}
function ensureProfileTimeUsage(ledger,profileId,now=Date.now()){
 const existing=ledger.profiles[profileId]||emptyProfileTimeUsage(profileId,now),rolled=rollProfileTimeUsage(existing,now);ledger.profiles[profileId]=rolled;ledger.updatedAt=Math.max(ledger.updatedAt,rolled.updatedAt);return rolled
}
let TIME_USAGE=loadTimeUsageLedger();
let TIME_RUNTIME={profileId:null,sessionId:null,lastTickAt:0,lifecycleCaptured:false};
let TIME_PENDING_LAUNCH=null;
function queueTimeUsageMutation(profileId,mutation){
 const apply=ledger=>{const now=Date.now(),entry=ensureProfileTimeUsage(ledger,profileId,now),next=normalizeProfileTimeUsage(mutation({...entry},now),profileId);if(!next)throw new Error('Invalid time usage update.');ledger.profiles[profileId]=next;ledger.updatedAt=Math.max(ledger.updatedAt,next.updatedAt);return ledger};
 TIME_USAGE=apply(mergeTimeUsageLedgers(TIME_USAGE,loadTimeUsageLedger()));
 PERSISTENCE_CHAIN=PERSISTENCE_CHAIN.catch(()=>{}).then(()=>withPersistenceLock(()=>{
  const primary=parseTimeUsageCopy(localStorage.getItem(TIME_USAGE_KEY)),backup=parseTimeUsageCopy(localStorage.getItem(TIME_USAGE_BACKUP_KEY));
  const persisted=mergeTimeUsageLedgers(primary.value||emptyTimeUsageLedger(),backup.value||emptyTimeUsageLedger()),reconciled=reconcilePendingExitContributions(persisted);TIME_USAGE=writeTimeUsageCopiesUnlocked(apply(reconciled.ledger));for(const key of reconciled.removableKeys)try{localStorage.removeItem(key)}catch{}
 })).catch(error=>{reportPersistenceFailure(error);return {error}});
 return PERSISTENCE_CHAIN
}
function timeLimitState(entry=P()?ensureProfileTimeUsage(TIME_USAGE,P().id):null){
 if(!entry||!P())return {expired:false,reason:'daily',dailyRemainingMs:0,sessionRemainingMs:0,extensionRemainingMs:0};
 const profile=STORE.profiles.find(candidate=>candidate.id===entry.profileId)||P(),dailyLimit=Math.max(5,Math.min(180,Number(profile.controls?.dailyMinutes)||30))*60000,sessionLimit=Math.max(5,Math.min(120,Number(profile.controls?.maxSessionMinutes)||20))*60000;
 const extensionRemainingMs=Math.max(0,entry.extensionGrantedMs-entry.extensionActiveMs),dailyRemainingMs=Math.max(0,dailyLimit-entry.dailyActiveMs),sessionRemainingMs=Math.max(0,sessionLimit-entry.sessionActiveMs),baseExpired=dailyRemainingMs===0||sessionRemainingMs===0;
 return {expired:baseExpired&&extensionRemainingMs===0,reason:dailyRemainingMs===0?'daily':'session',dailyRemainingMs,sessionRemainingMs,extensionRemainingMs}
}
function consumeTimeDelta(entry,delta,now){
 const before=timeLimitState(entry),baseRoom=Math.min(before.dailyRemainingMs,before.sessionRemainingMs),extensionUse=Math.max(0,Math.min(delta-baseRoom,before.extensionRemainingMs));
 return {...entry,dailyActiveMs:entry.dailyActiveMs+delta,sessionActiveMs:entry.sessionActiveMs+delta,lastTickAt:now,lastActivityAt:now,extensionActiveMs:Math.min(entry.extensionGrantedMs,entry.extensionActiveMs+extensionUse),updatedAt:now,lastSeenWallClock:Math.max(entry.lastSeenWallClock,now)}
}
function prepareTimeUsageLaunch(){
 const profileId=P().id,now=Date.now();TIME_USAGE=mergeTimeUsageLedgers(TIME_USAGE,loadTimeUsageLedger());let entry=ensureProfileTimeUsage(TIME_USAGE,profileId,now),state=timeLimitState(entry),logicalNow=Math.max(now,entry.lastSeenWallClock);
 if(state.expired){showTimeUp(state.reason);return false}
 const resumes=!!entry.sessionId&&logicalNow-entry.lastActivityAt<=TIME_INACTIVITY_MS,sessionId=resumes?entry.sessionId:newCryptographicUuid();
 queueTimeUsageMutation(profileId,(current,commitNow)=>{const logicalCommitNow=Math.max(commitNow,current.lastSeenWallClock),canResume=!!current.sessionId&&logicalCommitNow-current.lastActivityAt<=TIME_INACTIVITY_MS;return {...current,sessionId:canResume?current.sessionId:sessionId,sessionStartedAt:canResume?current.sessionStartedAt:logicalCommitNow,sessionActiveMs:canResume?current.sessionActiveMs:0,lastTickAt:logicalCommitNow,lastActivityAt:canResume?current.lastActivityAt:logicalCommitNow,updatedAt:logicalCommitNow,lastSeenWallClock:logicalCommitNow}});
 entry=ensureProfileTimeUsage(TIME_USAGE,profileId,now);TIME_RUNTIME={profileId,sessionId:entry.sessionId,lastTickAt:now,lifecycleCaptured:false};return true
}
function gameplayIsVisible(){return !!G&&!G.timeExpired&&$('game')?.classList.contains('show')&&document.visibilityState!=='hidden'}
function checkpointGameplayActivity({forceActive=false,reason='activity',bestEffortOnly=false}={}){
 if(!G||G.timeExpired||TIME_RUNTIME.profileId!==P().id)return !G?.timeExpired;
 const now=Date.now(),active=(forceActive&&$('game')?.classList.contains('show'))||gameplayIsVisible(),elapsed=Math.max(0,now-TIME_RUNTIME.lastTickAt),delta=active?Math.min(TIME_CHECKPOINT_MS,elapsed):0;TIME_RUNTIME.lastTickAt=now;
 if(!delta){if(reason==='activity')queueTimeUsageMutation(P().id,(entry,commitNow)=>({...entry,lastActivityAt:commitNow,lastTickAt:commitNow,updatedAt:commitNow,lastSeenWallClock:Math.max(entry.lastSeenWallClock,commitNow)}));return true}
 if(bestEffortOnly){const entry=ensureProfileTimeUsage(TIME_USAGE,P().id,now),next=consumeTimeDelta(entry,delta,now);TIME_USAGE.profiles[P().id]=next;TIME_USAGE.updatedAt=Math.max(TIME_USAGE.updatedAt,next.updatedAt)}
 else queueTimeUsageMutation(P().id,(entry,commitNow)=>consumeTimeDelta(entry,delta,commitNow));
 const state=timeLimitState(ensureProfileTimeUsage(TIME_USAGE,P().id,now));if(state.expired){showTimeUp(state.reason);return false}return true
}
function readTimeToday(profileId=P()?.id){const entry=profileId&&TIME_USAGE.profiles[profileId];return entry?entry.dailyActiveMs:null}
function showTimeUp(reason='daily'){
 if(G&&$('game')?.classList.contains('show'))G.timeExpired=true;else G=null;
 const message=reason==='session'?'That play session is finished. Great work taking a break!':'Today\'s play time is finished. Great work today!';
 if($('timeUpMessage'))$('timeUpMessage').textContent=message;
 if($('timeRemaining'))$('timeRemaining').textContent='No play time remains. A parent can add 15 active minutes.';
 if($('timeUpStatus'))$('timeUpStatus').textContent='';
 window.dispatchEvent(new CustomEvent('bb:time-up',{detail:{reason,profileId:P()?.id}}));show('timeup');void save();return false
}
function clearTimeUsageWarning(){if(!TIME_USAGE.warning)return;TIME_USAGE.warning=null;TIME_USAGE_WARNING='';queueTimeUsageMutation(P().id,(entry,now)=>({...entry,updatedAt:now}))}
function captureExitTimeContribution(){
 if(!G||G.timeExpired||TIME_RUNTIME.profileId!==P().id||!$('game')?.classList.contains('show')||TIME_RUNTIME.lifecycleCaptured)return false;
 const now=Date.now(),deltaMs=Math.min(TIME_CHECKPOINT_MS,Math.max(0,now-TIME_RUNTIME.lastTickAt));
 if(!deltaMs){TIME_RUNTIME.lastTickAt=now;TIME_RUNTIME.lifecycleCaptured=true;return false}
 const entry=ensureProfileTimeUsage(TIME_USAGE,P().id,now),id=newCryptographicUuid(),contribution={id,profileId:P().id,dayKey:entry.dayKey,sessionId:entry.sessionId,deltaMs,at:now};
 try{localStorage.setItem(`${TIME_EXIT_PREFIX}${id}`,JSON.stringify(contribution));TIME_RUNTIME.lastTickAt=now;TIME_RUNTIME.lifecycleCaptured=true;TIME_USAGE=reconcilePendingExitContributions(TIME_USAGE).ledger;return true}catch(error){reportPersistenceFailure(error);return false}
}
window.BrainBiteTimeUsage={read:profileId=>structuredClone(TIME_USAGE.profiles[profileId||P()?.id]||null),checkpoint:options=>checkpointGameplayActivity(options),state:()=>timeLimitState(),keys:{primary:TIME_USAGE_KEY,backup:TIME_USAGE_BACKUP_KEY}};
function mergeSyncStates(localValue,persistedValue){
 const local=localValue&&typeof localValue==='object'?localValue:{},persisted=persistedValue&&typeof persistedValue==='object'?persistedValue:{};
 const acknowledgedEventIds=boundedUniqueSyncIds([...(persisted.acknowledgedEventIds||[]),...(local.acknowledgedEventIds||[])]);
 const queue=normalizeSyncQueue([...(persisted.queue||[]),...(local.queue||[])],acknowledgedEventIds,SYNC_IN_FLIGHT);
 const installationId=UUID_PATTERN.test(String(persisted.installationId||''))?persisted.installationId:(UUID_PATTERN.test(String(local.installationId||''))?local.installationId:newCryptographicUuid());
 return {...persisted,...local,account:local.account||persisted.account||null,queue,acknowledgedEventIds,lastSync:Math.max(Number(local.lastSync)||0,Number(persisted.lastSync)||0)||null,provider:local.provider==='firebase'||persisted.provider==='firebase'?'firebase':(local.provider||persisted.provider||'local-only'),installationId,attemptSequence:Math.max(Number(local.attemptSequence)||0,Number(persisted.attemptSequence)||0,installationSequenceFloor(installationId))};
}
// Bounded local issue log. A closed-beta report of "it broke" is only actionable if the
// app kept the last few failures, so this ring records type, message, context, and time —
// and nothing else. Learner names, answers, and prompts never enter it.
const DIAGNOSTIC_KEY='bb-diagnostics-v1';
const DIAGNOSTIC_LIMIT=50;
let DIAGNOSTICS=[];
try{const stored=JSON.parse(localStorage.getItem(DIAGNOSTIC_KEY)||'[]');if(Array.isArray(stored))DIAGNOSTICS=stored.slice(-DIAGNOSTIC_LIMIT)}catch{DIAGNOSTICS=[]}
function recordDiagnostic(type,message,context=''){
 try{
  const entry={type:String(type||'issue').slice(0,40),message:String(message||'').slice(0,240),context:String(context||'').slice(0,120),ts:Date.now()};
  DIAGNOSTICS.push(entry);
  if(DIAGNOSTICS.length>DIAGNOSTIC_LIMIT)DIAGNOSTICS=DIAGNOSTICS.slice(-DIAGNOSTIC_LIMIT);
  localStorage.setItem(DIAGNOSTIC_KEY,JSON.stringify(DIAGNOSTICS));
 }catch{/* diagnostics must never break the app */}
 return DIAGNOSTICS.length;
}
function recentDiagnostics(){return DIAGNOSTICS.map(entry=>({...entry}))}
window.addEventListener('error',event=>recordDiagnostic('runtime-error',event?.message||'unknown error',`${event?.filename||''}:${event?.lineno||0}`));
window.addEventListener('unhandledrejection',event=>recordDiagnostic('unhandled-rejection',event?.reason?.message||String(event?.reason||'unknown'),'promise'));
function reportPersistenceFailure(error){
 const reason=error?.name==='QuotaExceededError'?'device storage is full':'storage is unavailable';
 globalThis.__BRAINBITE_PERSISTENCE_ERROR__={name:error?.name||'Error',message:String(error?.message||error||reason),at:Date.now()};
 recordDiagnostic('persistence',error?.message||reason,error?.name||'Error');
 const health=document.getElementById('saveHealth');if(health)health.textContent=`Save failed: ${reason}. Your current session is still open.`;
 console.error('[BrainBite] Local save failed.',error)
}
function persistCanonicalState({renderAfter=false}={}){
 PERSISTENCE_CHAIN=PERSISTENCE_CHAIN.catch(()=>{}).then(()=>withPersistenceLock(()=>{
  STORE=mergeStores(STORE,readAllStoredStores());
  SYNC=mergeSyncStates(SYNC,readStoredSync());
  writeStoreCopiesUnlocked(STORE);
  localStorage.setItem(SYNC_KEY,JSON.stringify(SYNC));
  PERSISTENCE_CHANNEL?.postMessage({store:STORE,sync:SYNC});
 })).catch(error=>{reportPersistenceFailure(error);return {error}});
 return PERSISTENCE_CHAIN.then(()=>{if(renderAfter)render();return {store:STORE,sync:SYNC}});
}
function initializeCanonicalState(){
 PERSISTENCE_CHAIN=PERSISTENCE_CHAIN.catch(()=>{}).then(()=>withPersistenceLock(()=>{
  const currentRaw=localStorage.getItem(KEY);
  if(currentRaw!==LOADED_STORE_RAW)STORE=mergeStores(STORE,readAllStoredStores());
  SYNC=mergeSyncStates(SYNC,readStoredSync());
  writeStoreCopiesUnlocked(STORE);
  localStorage.setItem(SYNC_KEY,JSON.stringify(SYNC));
  LOADED_STORE_RAW=JSON.stringify(STORE);
  PERSISTENCE_CHANNEL?.postMessage({store:STORE,sync:SYNC});
 })).catch(error=>{reportPersistenceFailure(error);return {error}});
 return PERSISTENCE_CHAIN;
}
function persistSyncState(){SYNC.attemptSequence=Math.max(Number(SYNC.attemptSequence)||0,persistedAttemptSequence());return persistCanonicalState()}
function saveSync(){const pending=persistSyncState();renderSync();return pending}
window.addEventListener('storage',event=>{
 if([TIME_USAGE_KEY,TIME_USAGE_BACKUP_KEY].includes(event.key)){
  const incoming=parseTimeUsageCopy(event.newValue);if(incoming.value)TIME_USAGE=mergeTimeUsageLedgers(TIME_USAGE,incoming.value);
  if(document.readyState!=='loading')renderControls();return
 }
 if(![KEY,BACK,RECOVERY_KEY,SYNC_KEY].includes(event.key))return;
 STORE=mergeStores(STORE,readAllStoredStores());
 SYNC=mergeSyncStates(SYNC,readStoredSync());
 if(document.readyState!=='loading')render();
});
if(PERSISTENCE_CHANNEL)PERSISTENCE_CHANNEL.onmessage=event=>{
 if(!event.data?.store||!event.data?.sync)return;
 STORE=event.data.replace?migrateStore(structuredClone(event.data.store)):mergeStores(STORE,[event.data.store]);
 SYNC=mergeSyncStates(SYNC,event.data.sync);
 if(document.readyState!=='loading')render();
};
function nextAttemptOrigin(){
 if(!UUID_PATTERN.test(String(SYNC.installationId||'')))SYNC.installationId=newCryptographicUuid();
 const current=Number(PAGE_ATTEMPT_SEQUENCE);
 if(!Number.isSafeInteger(current)||current<0)PAGE_ATTEMPT_SEQUENCE=Math.max(Number(SYNC.attemptSequence)||0,installationSequenceFloor(SYNC.installationId));
 if(PAGE_ATTEMPT_SEQUENCE>=Number.MAX_SAFE_INTEGER)throw new Error('Learning attempt sequence exhausted.');
 PAGE_ATTEMPT_SEQUENCE+=1;SYNC.attemptSequence=Math.max(Number(SYNC.attemptSequence)||0,PAGE_ATTEMPT_SEQUENCE);
 return {originId:`${SYNC.installationId}:${PAGE_WRITER_ID}`,originSequence:PAGE_ATTEMPT_SEQUENCE}
}
initializeCanonicalState();
function syncEventSignature(event){
 return [event.type||'',event.profileId||'',event.schemaVersion||STORE.schemaVersion,JSON.stringify(event.payload||{})].join('|');
}
function queueSyncEvent(event){
 const generatedId=event?.eventId||event?.id||newCryptographicUuid();
 const next=normalizeSyncEvent({...event,id:generatedId,eventId:generatedId,timestamp:event?.timestamp||event?.ts||Date.now()});
 const signature=syncEventSignature(next);
 if(SYNC.queue.some(item=>!SYNC_IN_FLIGHT.has(item.eventId||item.id)&&syncEventSignature(item)===signature))return;
 SYNC.queue=normalizeSyncQueue([...SYNC.queue,next],SYNC.acknowledgedEventIds,SYNC_IN_FLIGHT);
}

function readStoredStore(raw){
 try{
   const parsed=JSON.parse(raw);
   return parsed&&Array.isArray(parsed.profiles)?migrateStore(parsed):null;
 }catch{
   return null;
 }
}
function readStoredCopy(key){return readStoredStore(localStorage.getItem(key))}

function writeStoreCopiesUnlocked(store){
 return BrainBiteStorageCopies.writeRotated(localStorage,STORE_COPY_KEYS,store,readStoredCopy);
}

// Write the reconciled state to every slot. This is only safe once the generations have
// been unioned, because the result is then a superset of each slot. Ordinary autosaves
// keep rotating distinct generations through writeStoreCopiesUnlocked.
function convergeStoreCopiesUnlocked(store){
 return BrainBiteStorageCopies.converge(localStorage,STORE_COPY_KEYS,store);
}

// The initial canonical load runs before the ES module that provides LearningCore, so it
// can only union attempt records, not the per-writer evidence provenance. Without this
// pass, two tabs that each recorded an attempt would keep both records but count one
// attempt. Run once, as soon as LearningCore is available.
let CANONICAL_RECONCILED_WITH_CORE=false;
let CANONICAL_RECONCILE_RUNS=0;
function reconcileCanonicalStateWithCore(){
 const c=core();if(!c||CANONICAL_RECONCILED_WITH_CORE)return false;
 CANONICAL_RECONCILED_WITH_CORE=true;CANONICAL_RECONCILE_RUNS+=1;
 // Nothing to reconcile while every slot already holds the same payload.
 const raw=[RECOVERY_KEY,BACK,KEY].map(key=>localStorage.getItem(key));
 if(new Set(raw.filter(value=>value!==null)).size<2)return false;
 const recovered=mergeStores(STORE,readEveryStoredCopy());
 const byId=new Map(recovered.profiles.map(profile=>[String(profile.id),profile]));
 // The freshly loaded store stays authoritative for names, settings, and progression.
 // A stored generation may only add evidence for profiles this installation still has,
 // and it can never resurrect a profile or move the active index.
 const profiles=STORE.profiles.map(profile=>{
  const copy=byId.get(String(profile.id));
  return copy&&copy!==profile?mergeProfiles(profile,copy):profile;
 });
 const merged={...STORE,profiles,active:STORE.active};
 if(JSON.stringify(merged)===JSON.stringify(STORE))return false;
 STORE=merged;
 LOADED_STORE_RAW=JSON.stringify(STORE);
 // Converge immediately so the reconciled state is readable without waiting for the
 // lock, then converge again behind any pending write so a late rotation cannot
 // re-introduce a stale generation.
 convergeStoreCopiesUnlocked(STORE);
 PERSISTENCE_CHAIN=PERSISTENCE_CHAIN.catch(()=>{}).then(()=>withPersistenceLock(()=>{
  STORE=mergeStores(STORE,readAllStoredStores());
  convergeStoreCopiesUnlocked(STORE);
  localStorage.setItem(SYNC_KEY,JSON.stringify(SYNC));
  LOADED_STORE_RAW=JSON.stringify(STORE);
 })).catch(error=>{reportPersistenceFailure(error);return {error}});
 PERSISTENCE_CHANNEL?.postMessage({store:STORE,sync:SYNC});
 return true;
}

function createManualBackupUnlocked(){
 const primaryRaw=localStorage.getItem(KEY),backupRaw=localStorage.getItem(BACK);
 const primary=readStoredStore(primaryRaw)||migrateStore(structuredClone(STORE));
 const previousBackup=readStoredStore(backupRaw);
 const payload=JSON.stringify(primary);
 if(previousBackup)localStorage.setItem(RECOVERY_KEY,JSON.stringify(previousBackup));
 else if(!readStoredStore(localStorage.getItem(RECOVERY_KEY)))localStorage.setItem(RECOVERY_KEY,payload);
 localStorage.setItem(BACK,payload);
 return primary;
}

function replaceStoreCopiesUnlocked(store){
 const replacement=migrateStore(structuredClone(store));
 const payload=JSON.stringify(replacement);
 const existingRecovery=readStoredStore(localStorage.getItem(RECOVERY_KEY));
 localStorage.setItem(RECOVERY_KEY,JSON.stringify(existingRecovery||replacement));
 localStorage.setItem(BACK,payload);
 localStorage.setItem(KEY,payload);
 return replacement;
}

function replaceCanonicalState(store,{renderAfter=true}={}){
 PERSISTENCE_CHAIN=PERSISTENCE_CHAIN.catch(()=>{}).then(()=>withPersistenceLock(()=>{
  STORE=replaceStoreCopiesUnlocked(store);
  SYNC=mergeSyncStates(SYNC,readStoredSync());
  localStorage.setItem(SYNC_KEY,JSON.stringify(SYNC));
  LOADED_STORE_RAW=localStorage.getItem(KEY);
  PERSISTENCE_CHANNEL?.postMessage({store:STORE,sync:SYNC,replace:true});
 }));
 return PERSISTENCE_CHAIN.then(()=>{if(renderAfter)render();return {store:STORE,sync:SYNC}})
}

function createPreOperationRollback(operation){
 const snapshot={version:1,operation:String(operation||'replacement'),createdAt:Date.now(),store:migrateStore(structuredClone(STORE)),sync:structuredClone(SYNC)};
 localStorage.setItem(PRE_OPERATION_ROLLBACK_KEY,JSON.stringify(snapshot));
 return snapshot
}

async function replaceCanonicalStateSafely(operation,replacementFactory){
 const original={
  store:structuredClone(STORE),sync:structuredClone(SYNC),loadedRaw:LOADED_STORE_RAW,
  copies:new Map([KEY,BACK,RECOVERY_KEY,SYNC_KEY].map(key=>[key,localStorage.getItem(key)])),
 };
 createPreOperationRollback(operation);
 try{
  const replacement=await replacementFactory();
  if(!replacement||!Array.isArray(replacement.profiles)||replacement.profiles.length===0)throw new Error('Replacement does not contain a usable learner profile.');
  return await replaceCanonicalState(migrateStore(structuredClone(replacement)),{renderAfter:true})
 }catch(error){
  STORE=original.store;SYNC=original.sync;LOADED_STORE_RAW=original.loadedRaw;
  let rollbackStorageFailed=false;
  for(const [key,value] of original.copies){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value)}catch{rollbackStorageFailed=true}}
  if(rollbackStorageFailed)error.rollbackStorageFailed=true;
  render();throw error
 }
}

function validateImportedStoreIdentity(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Array.isArray(raw.profiles)||raw.profiles.length===0)throw new Error('The selected file does not contain learner profiles.');
 if(Object.hasOwn(raw,'schemaVersion')&&(!Number.isInteger(raw.schemaVersion)||raw.schemaVersion<1||raw.schemaVersion>9))throw new Error('The selected file has an unsupported schema version.');
 if(Object.hasOwn(raw,'deletedProfiles')&&!Array.isArray(raw.deletedProfiles))throw new Error('The selected file has an invalid deleted-profile ledger.');
 const schemaVersion=Number(raw.schemaVersion)||1,modern=schemaVersion>=8,idPattern=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
 if(Object.hasOwn(raw,'active')&&(!Number.isInteger(raw.active)||raw.active<0||raw.active>=raw.profiles.length))throw new Error('The selected file has an invalid active profile index.');
 if(modern&&!Object.hasOwn(raw,'active'))throw new Error('The selected file is missing its active profile index.');
 const tombstones=Array.isArray(raw.deletedProfiles)?raw.deletedProfiles:[],deletedIds=new Set();
 for(const tombstone of tombstones){
  if(!tombstone||typeof tombstone.id!=='string'||!idPattern.test(tombstone.id))throw new Error('The selected file has an invalid deleted profile ID.');
  if(deletedIds.has(tombstone.id))throw new Error('The selected file has duplicate deleted profile IDs.');
  deletedIds.add(tombstone.id)
 }
 const profileIds=new Set();
 for(const profile of raw.profiles){
  if(!profile||typeof profile!=='object'||Array.isArray(profile))throw new Error('The selected file has an invalid learner profile.');
  const hasId=Object.hasOwn(profile,'id')&&profile.id!==null&&profile.id!==undefined&&profile.id!=='';
  if(!hasId){if(modern)throw new Error('The selected file has a missing profile ID.');continue}
  if(typeof profile.id!=='string'||!idPattern.test(profile.id))throw new Error('The selected file has an unsafe profile ID.');
  if(profileIds.has(profile.id))throw new Error('The selected file has duplicate profile IDs.');
  if(deletedIds.has(profile.id))throw new Error('The selected file reuses a deleted profile ID.');
  profileIds.add(profile.id)
 }
 const migrated=migrateStore(structuredClone(raw)),migratedIds=new Set();
 if(!Number.isInteger(migrated.active)||migrated.active<0||migrated.active>=migrated.profiles.length)throw new Error('The selected file has an invalid active profile.');
 for(const profile of migrated.profiles){
  if(typeof profile.id!=='string'||!idPattern.test(profile.id)||migratedIds.has(profile.id))throw new Error('The selected file could not produce unique safe profile IDs.');
  migratedIds.add(profile.id)
 }
 return migrated
}

function importedStoreFromText(text){
 const parsed=JSON.parse(text);let raw;
 if(parsed?.format==='brainbite-progress'){if(!validateEnvelope(parsed))throw new Error('The BrainBite progress envelope failed validation.');raw=parsed.payload.store}
 else if(parsed&&Array.isArray(parsed.profiles))raw=parsed;
 else throw new Error('The selected file is not a valid BrainBite progress export.');
 return validateImportedStoreIdentity(raw)
}

window.BrainBiteSensitiveActions={rollbackKey:PRE_OPERATION_ROLLBACK_KEY,request:requestSensitiveAction};

function readAllStoredStores(){
 return BrainBiteStorageCopies.readAll(readStoredCopy,STORE_COPY_KEYS);
}

// Every readable generation, oldest first. Used only by the post-core reconciliation,
// which can union per-writer evidence provenance correctly.
function readEveryStoredCopy(){
 return BrainBiteStorageCopies.readEvery(readStoredCopy,STORE_COPY_KEYS);
}

function mergeStores(localStore,persistedStores=[]){
 const candidates=[...(Array.isArray(persistedStores)?persistedStores:[]),localStore].filter(value=>value&&Array.isArray(value.profiles)).map(value=>migrateStore(structuredClone(value)));
 if(!candidates.length)return structuredClone(DEF);
 const tombstones=new Map();
 for(const candidate of candidates)for(const item of candidate.deletedProfiles||[])if(item?.id)tombstones.set(String(item.id),Math.max(tombstones.get(String(item.id))||0,Number(item.deletedAt)||0));
 const profiles=new Map();
 for(const candidate of candidates)for(const profile of candidate.profiles||[]){
  if(!profile?.id||tombstones.has(String(profile.id)))continue;
  const existing=profiles.get(String(profile.id));
  profiles.set(String(profile.id),existing?mergeProfiles(existing,profile):structuredClone(profile));
 }
 const localActiveId=localStore?.profiles?.[localStore.active]?.id;
 const persistedActiveId=[...candidates].reverse().map(candidate=>candidate.profiles?.[candidate.active]?.id).find(id=>profiles.has(String(id)));
 const merged={...structuredClone(candidates[0]),...structuredClone(candidates.at(-1)),schemaVersion:SCHEMA_VERSION,registryVersion:REGISTRY.registryVersion,deletedProfiles:[...tombstones].map(([id,deletedAt])=>({id,deletedAt})).sort((a,b)=>a.id.localeCompare(b.id)),profiles:[...profiles.values()]};
 if(!merged.profiles.length)merged.profiles=[blank()];
 const activeId=profiles.has(String(localActiveId))?localActiveId:persistedActiveId;
 merged.active=Math.max(0,merged.profiles.findIndex(profile=>profile.id===activeId));
 return migrateStore(merged);
}

function writeStoreCopies(){return persistCanonicalState({renderAfter:false})}

function applyCloudWriteResult(written,fallbackProfileId){
 if(!written)return null;
 if(!Array.isArray(STORE.profiles))STORE.profiles=[];
 const profileId=written.id||fallbackProfileId;
 if(written.deleted){rememberProfileDeletion(profileId,written.deletedAt);}
 else if(profileId&&!isProfileDeleted(profileId)){
  const profile={...structuredClone(written),id:profileId};
  const index=STORE.profiles.findIndex(item=>item.id===profileId);
  if(index>=0)STORE.profiles[index]=mergeProfiles(STORE.profiles[index],profile,{remoteCloud:true});else STORE.profiles.push(profile);
 }
 if(STORE.profiles.length===0){STORE.profiles.push(blank());STORE.active=0}
 else STORE.active=Math.max(0,Math.min(STORE.profiles.length-1,Number(STORE.active)||0));
 return written
}
function acknowledgeSyncEvents(ids){SYNC.acknowledgedEventIds=boundedUniqueSyncIds([...(SYNC.acknowledgedEventIds||[]),...ids]);SYNC.queue=normalizeSyncQueue(SYNC.queue,SYNC.acknowledgedEventIds,SYNC_IN_FLIGHT)}
function commitCloudWriteResults(){return persistCanonicalState().then(()=>persistCanonicalState({renderAfter:true}))}

async function retryPendingSync(){
 const c=cloudClient();if(!c||!c.configured()||!c.session)throw new Error('Sign in to Firebase first');
 const acknowledged=new Set(SYNC.acknowledgedEventIds||[]);
 const canonicalDeletions=(STORE.deletedProfiles||[]).map(tombstone=>normalizeSyncEvent({
  id:deterministicSyncId({type:'profile-delete',profileId:String(tombstone.id),deletedAt:Number(tombstone.deletedAt)||0}),
  type:'profile-delete',profileId:String(tombstone.id),payload:{deletedAt:Number(tombstone.deletedAt)||0},timestamp:Number(tombstone.deletedAt)||0,schemaVersion:STORE.schemaVersion,
 })).filter(event=>!acknowledged.has(event.eventId));
 const canonicalDeletionProfiles=new Set(canonicalDeletions.map(event=>event.profileId));
 // Tombstones are canonical state, not disposable queue history. Reconstruct
 // them before bounded ordinary events so queue pressure cannot forget a delete.
 const pending=[
  ...canonicalDeletions,
  ...SYNC.queue.filter(event=>event.type!=='profile-delete'||!canonicalDeletionProfiles.has(event.profileId)),
 ];
 const pendingIds=new Set(pending.map(ev=>ev.eventId||ev.id));
 const completedIds=new Set();
 pendingIds.forEach(id=>SYNC_IN_FLIGHT.add(id));
 let ok=0,failed=0;
 try{
   for(const ev of pending){
     try{
         if(ev.type==='profile-delete'){
           await c.pushProfileDeletion(ev.profileId,ev.payload?.deletedAt||ev.timestamp);
           for(const queued of SYNC.queue)if(queued.type==='profile-delete'&&queued.profileId===ev.profileId)completedIds.add(queued.eventId||queued.id);
         }else if(ev.type==='store-update'){
         const profile=ev.profileId&&STORE.profiles.find(p=>p.id===ev.profileId);
         if(profile)applyCloudWriteResult(await c.pushProfile(profile),profile.id);
         else for(const item of [...STORE.profiles])applyCloudWriteResult(await c.pushProfile(item),item.id);
       }
       ok++;completedIds.add(ev.eventId||ev.id);
     }catch{failed++}
   }
   // Remove only events that were part of this attempt. Saves made while the
   // network was in flight remain queued for the next retry.
    acknowledgeSyncEvents(completedIds);
    SYNC.queue=SYNC.queue.filter(ev=>!completedIds.has(ev.eventId||ev.id));
    await commitCloudWriteResults();
    SYNC.lastSync=Date.now();SYNC.provider='firebase';await saveSync();
 } finally {
   pendingIds.forEach(id=>SYNC_IN_FLIGHT.delete(id));
 }
 return {ok,failed}
}
function cloudSnapshot(){
 return {exportedAt:Date.now(),provider:'firebase',signedIn:!!cloudClient()?.session,store:cloudStoreProjection(),sync:{queueLength:SYNC.queue.length,lastSync:SYNC.lastSync}}
}

async function pushAllToFirebase(){
  const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');
  const queuedAtStart=new Set(SYNC.queue.map(ev=>ev.eventId||ev.id));
  queuedAtStart.forEach(id=>SYNC_IN_FLIGHT.add(id));
  try{
    for(const tombstone of STORE.deletedProfiles||[])await c.pushProfileDeletion(tombstone.id,tombstone.deletedAt);
    for(const profile of [...STORE.profiles]){
      applyCloudWriteResult(await c.pushProfile(profile),profile.id);
    }
    await commitCloudWriteResults();
    acknowledgeSyncEvents(queuedAtStart);
    SYNC.queue=SYNC.queue.filter(ev=>!queuedAtStart.has(ev.eventId||ev.id));
    SYNC.lastSync=Date.now();SYNC.provider='firebase';await saveSync()
  } finally {
    queuedAtStart.forEach(id=>SYNC_IN_FLIGHT.delete(id));
  }
}
async function pullAllFromFirebase(){
  const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');
  const remote=await c.pullProfiles();
  for(const row of remote){
    const rp=sanitizeRemoteProfile(row.progress);if(!rp||!rp.id)continue;
    if(rp.deleted){
      rememberProfileDeletion(rp.id||row.client_profile_id,rp.deletedAt||Date.parse(row.client_updated_at||row.updated_at)||Date.now());
      continue;
    }
    if(isProfileDeleted(rp.id||row.client_profile_id))continue;
    const i=STORE.profiles.findIndex(p=>p.id===rp.id||p.id===row.client_profile_id);
   if(i>=0)STORE.profiles[i]=mergeProfiles(STORE.profiles[i],{...rp,updatedAt:Date.parse(row.client_updated_at||row.updated_at)||Date.now()},{remoteCloud:true});
    else STORE.profiles.push(migrateStore({profiles:[rp],schemaVersion:STORE.schemaVersion}).profiles[0]);
  }
  if(STORE.profiles.length===0){STORE.profiles.push(blank());STORE.active=0}
  await persistCanonicalState();SYNC.lastSync=Date.now();SYNC.provider='firebase';await saveSync();render()
}
function renderCloudAuth(){
 const c=cloudClient(),status=$('localAccountStatus');
 if(!status)return;
 if(INTEGRATIONS.cloud.provider!=='firebase'){status.textContent=SYNC.account?`Local email saved for ${SYNC.account.email}`:'Configure the dedicated BrainBite Firebase project to enable parent sign-in.';return}
 if(c?.session?.email){status.replaceChildren();const badge=document.createElement('span');badge.className='integration-ok auth-status';badge.textContent=`Signed in: ${c.session.email}`;status.appendChild(badge)}
 else status.textContent='Firebase configured. Sign in or create a parent account.'
}

function renderSync(){if(!$('syncMode'))return;$('syncMode').textContent=SYNC.provider==='local-only'?'Local-first':'Connected';$('syncQueueCount').textContent=`${SYNC.queue.length} pending`;$('lastSync').textContent=SYNC.lastSync?new Date(SYNC.lastSync).toLocaleString():'Never';$('localAccountEmail').value=SYNC.account?.email||'';$('localAccountStatus').textContent=SYNC.account?`Local identity saved for ${SYNC.account.email}`:'No local parent identity saved.'}

function mergeLearningCore(localCore,remoteCore,{preferRemote=false}={}){
 if(!localCore)return remoteCore?structuredClone(remoteCore):null;
 if(!remoteCore)return structuredClone(localCore);
 const newer=preferRemote?remoteCore:localCore,older=preferRemote?localCore:remoteCore;
 const out={...structuredClone(older),...structuredClone(newer)};
 out.completedStages=[...new Set([...(localCore.completedStages||[]),...(remoteCore.completedStages||[])])];
 out.rewards=mergeHistory(localCore.rewards,remoteCore.rewards,200);
 out.rewardLedger={...(localCore.rewardLedger||{}),...(remoteCore.rewardLedger||{})};
 out.practice=mergeHistory(localCore.practice,remoteCore.practice,100);
 out.sessions=mergeHistory(localCore.sessions,remoteCore.sessions,100);
 out.telemetry=mergeHistory(localCore.telemetry,remoteCore.telemetry,200);
 out.sentEventIds=[...new Set([...(localCore.sentEventIds||[]),...(remoteCore.sentEventIds||[])])];
 const sent=new Set(out.sentEventIds);
 out.offlineQueue=mergeHistory(localCore.offlineQueue,remoteCore.offlineQueue,200).filter(event=>!sent.has(event.id||event.eventId));
 out.skills={};
 for(const skillId of new Set([...Object.keys(localCore.skills||{}),...Object.keys(remoteCore.skills||{})])){
  const left=localCore.skills?.[skillId],right=remoteCore.skills?.[skillId];
  if(!left||!right){out.skills[skillId]=structuredClone(left||right);continue}
  const leftTs=Math.max(Number(left.lastPracticedAt)||0,Number(left.lastIndependentSuccessAt)||0);
  const rightTs=Math.max(Number(right.lastPracticedAt)||0,Number(right.lastIndependentSuccessAt)||0);
  const selected=rightTs>leftTs?right:leftTs>rightTs?left:preferRemote?right:left;
  const other=selected===left?right:left;
  out.skills[skillId]=core()?.mergeSkillStates?.(left,right,{preferRight:selected===right})||{...structuredClone(other),...structuredClone(selected),recentPerformance:mergeHistory(left.recentPerformance,right.recentPerformance,30),reviewHistory:mergeHistory(left.reviewHistory,right.reviewHistory,30)}
 }
 out.mastery={...(localCore.mastery||{}),...(remoteCore.mastery||{})};
 for(const [skillId,skill] of Object.entries(out.skills))if(Number.isFinite(Number(skill.masteryScore)))out.mastery[skillId]=Number(skill.masteryScore);
 const localHub=localCore.hub||{},remoteHub=remoteCore.hub||{};
 out.hub={...localHub,...remoteHub,...(preferRemote?remoteHub:localHub),variant:localHub.variant==='upgraded'||remoteHub.variant==='upgraded'?'upgraded':((preferRemote?remoteHub:localHub).variant||'starter'),expansionUnlocked:!!(localHub.expansionUnlocked||remoteHub.expansionUnlocked),visibleChangeCount:Math.max(Number(localHub.visibleChangeCount)||0,Number(remoteHub.visibleChangeCount)||0),upgrades:[...new Set([...(localHub.upgrades||[]),...(remoteHub.upgrades||[])])]};
 out.settings={...(older.settings||{}),...(newer.settings||{})};
 return out
}

function mergeBubbleReefRewardState(local, remote) {
 const ownerId=local?.id||remote?.id;
 const left=local?.bubbleReefRewards?.profileId===ownerId?local.bubbleReefRewards:null;
 const right=remote?.bubbleReefRewards?.profileId===ownerId?remote.bubbleReefRewards:null;
 if(!left&&!right)return null;
 const source=left||right;
 const uniqueById=(a,b)=>[...new Map([...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].filter(item=>item&&typeof item.id==='string').map(item=>[item.id,item])).values()];
 return {
  schemaVersion:Math.max(Number(left?.schemaVersion)||0,Number(right?.schemaVersion)||0),
  profileId:source.profileId,
  contributionLedger:{...(left?.contributionLedger||{}),...(right?.contributionLedger||{})},
  contributions:uniqueById(left?.contributions,right?.contributions),
  rewards:uniqueById(left?.rewards,right?.rewards),
 };
}

function mergeProfiles(local,remote,{remoteCloud=false}={}){
  if(core()){
   local=structuredClone(local);remote=structuredClone(remote);
   projectLearningCore(local,ensureProfileLearningCore(local));
   projectLearningCore(remote,ensureProfileLearningCore(remote));
  }
  const localTs=Number(local.updatedAt||0),remoteTs=Number(remote.updatedAt||0);
 const newer=remoteTs>localTs?remote:local,older=remoteTs>localTs?local:remote;
 const out=structuredClone(newer);
 for(const [key,value] of Object.entries(local))if(!Object.hasOwn(remote,key))out[key]=structuredClone(value);
 out.id=local.id||remote.id;
 out.name=newer.name||older.name;
 out.score=Math.max(local.score||0,remote.score||0);
 out.stars=Math.max(local.stars||0,remote.stars||0);
 out.spark=Math.max(local.spark||0,remote.spark||0);
 out.progression=REGISTRY.mergeProgression(local,remote,{preferRemote:remoteTs>localTs});
 out.learningCore=mergeLearningCore(local.learningCore,remote.learningCore,{preferRemote:remoteTs>localTs});
 delete out.completed;delete out.unlockedMath;delete out.unlockedWords;delete out.unlockedSpanish;delete out.lastMission;
 out.unlockedBites=[...new Set([...(local.unlockedBites||[]),...(remote.unlockedBites||[])])];
 out.cosmetics=[...new Set([...(local.cosmetics||[]),...(remote.cosmetics||[])])];
  out.mistakes=mergeHistory(local.mistakes,remote.mistakes,100);
  out.sessions=mergeHistory(local.sessions,remote.sessions,50);
  out.practice=mergeHistory(local.practice,remote.practice,100);
  // Ordinary local/recovery reconciliation retains legacy records. Cloud
  // ingress is one-way for this retired field and can never add or replace it.
  out.snap=remoteCloud?structuredClone(Array.isArray(local.snap)?local.snap:[]):mergeHistory(local.snap,remote.snap,100);
 out.skills={...(older.skills||{}),...(newer.skills||{})};
 out.mastery={...(older.mastery||{}),...(newer.mastery||{})};
 out.settings={...(older.settings||{}),...(newer.settings||{})};
 out.controls={...(older.controls||{}),...(newer.controls||{})};
 out.programmableBits=sanitizeProgrammableBits({...((older.programmableBits)||{}),...((newer.programmableBits)||{})});
 out.bubbleReefRewards=mergeBubbleReefRewardState(local,remote);
 out.activeProgrammableBitId=Object.hasOwn(out.programmableBits,newer.activeProgrammableBitId)?newer.activeProgrammableBitId:Object.keys(out.programmableBits)[0]||null;
 out.updatedAt=Math.max(localTs,remoteTs)||Date.now();
  if(out.learningCore)projectLearningCore(out,out.learningCore);
   return scrubSecrets(out)
}
function canonicalValue(value){
  if(Array.isArray(value))return value.map(canonicalValue);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalValue(value[key])]));
  return value;
}
function historyIdentity(record){
  const stableId=record?.id||record?.eventId||record?.recordId;
  return stableId?`id:${stableId}`:`fp:${JSON.stringify(canonicalValue(record))}`;
}
function mergeHistory(local=[],remote=[],limit=100){
  const unique=new Map();
  for(const record of [...(local||[]),...(remote||[])])if(record&&typeof record==='object'&&!unique.has(historyIdentity(record)))unique.set(historyIdentity(record),record);
  return [...unique.values()].sort((a,b)=>(a.ts||a.timestamp||0)-(b.ts||b.timestamp||0)).slice(-limit);
}
function isProfileDeleted(profileId){return !!profileId&&(STORE.deletedProfiles||[]).some(item=>item.id===profileId)}
function awardProgressionScore(points){const awarded=G?.progressionEligible?points:0;if(awarded)P().score+=awarded;if(G)G.earned=(Number(G.earned)||0)+awarded;showBattleToast(awarded)}
// The reward toast only ever reports what was actually earned, and only after an answer.
let battleToastTimer=null;
function showBattleToast(points){const toast=document.querySelector('#game .battle-toast');if(!toast)return;$('battleRewardTitle').textContent=G?.m?.boss?'Boss hit!':'Great job!';$('battleRewardText').textContent=points>0?`+${points} BrainBites`:'Nice bite!';toast.hidden=false;const stars=$('battleProfileStars');if(stars)stars.textContent=P().score;clearTimeout(battleToastTimer);battleToastTimer=setTimeout(hideBattleToast,2500)}
function hideBattleToast(){clearTimeout(battleToastTimer);battleToastTimer=null;const toast=document.querySelector('#game .battle-toast');if(toast)toast.hidden=true}
function filterDeletedFoundationLearners(foundation){
 if(!foundation?.learners||typeof foundation.learners!=='object')return foundation;
 for(const [key,learner] of Object.entries(foundation.learners))if(isProfileDeleted(key)||isProfileDeleted(learner?.profileId))delete foundation.learners[key];
 if(isProfileDeleted(foundation.activeLearnerId))foundation.activeLearnerId=null;
 return foundation
}
function rememberProfileDeletion(profileId,deletedAt=Date.now()){
  if(!profileId)return;
  STORE.deletedProfiles=STORE.deletedProfiles||[];
  const existing=STORE.deletedProfiles.find(item=>item.id===profileId);
  if(existing)existing.deletedAt=Math.max(Number(existing.deletedAt)||0,Number(deletedAt)||0);
  else STORE.deletedProfiles.push({id:profileId,deletedAt:Number(deletedAt)||Date.now()});
  const removedIndex=STORE.profiles.findIndex(profile=>profile.id===profileId);
  if(removedIndex>=0){STORE.profiles.splice(removedIndex,1);if(STORE.active>=STORE.profiles.length)STORE.active=Math.max(0,STORE.profiles.length-1)}
}
function testConflictMerge(){
 const a={name:'Kid',score:100,stars:3,completed:[1,2],mastery:{math:30},updatedAt:100};
 const b={name:'Kid',score:250,stars:6,completed:[2,3],mastery:{math:50},updatedAt:200};
 const m=mergeProfiles(a,b);
 return m.score===250&&m.stars===6&&m.progression.completedMissionIds.includes(1)&&m.progression.completedMissionIds.includes(3)&&m.mastery.math===50
}

function simulateLocalSync(){const merged={profiles:STORE.profiles.map(p=>({name:p.name,score:p.score,stars:p.stars,completed:p.progression.completedMissionIds.length,updatedAt:Date.now()})),schemaVersion:STORE.schemaVersion};localStorage.setItem('bb-core-v6-last-snapshot',JSON.stringify(merged));acknowledgeSyncEvents(SYNC.queue.map(event=>event.eventId||event.id));SYNC.queue=[];SYNC.lastSync=Date.now();return saveSync()}


function stableStringify(x){return JSON.stringify(x,Object.keys(x).sort())}
const CLOUD_ID_PATTERN=/^[a-z0-9][a-z0-9._:@\/#-]{0,127}$/;
const CLOUD_BIT_ID_PATTERN=/^[a-z0-9][a-z0-9-]{0,31}$/;
const CLOUD_BLOCKED_URL_PATTERN=/^(?:data|blob|file):/i;
const CLOUD_MASTERY_STATES=new Set(['Unknown','Introduced','Practicing','Developing','Strong','Mastered']);
const CLOUD_STAGES=new Set(['child-profile','brainbase','play-portal','jungle-circuit','target-smash','letter-trail','knowledge-platforms','secret-reward','fraction-kraken','brainbase-upgrade','save','exit','reopen','continue']);
const CLOUD_BITES=new Set(['Nib','Zip','Bloop','Scout']);
const CLOUD_COSMETICS=new Set(['space_trail','book_glasses','rainbow_cape','boss_crown']);
const CLOUD_EVIDENCE_KEYS=['attempts','independentSuccesses','assistedSuccesses','hintsUsed','incorrectAttempts','rapidAttempts','responseTimeMsTotal'];
function cloudObject(value){return !!value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
function cloudNumber(value,min=0,max=Number.MAX_SAFE_INTEGER,fallback=0,{integer=false}={}){const number=Number(value);if(!Number.isFinite(number)||number<min||number>max)return fallback;return integer?Math.trunc(number):number}
function cloudTimestamp(value,{nullable=true}={}){if(value==null)return nullable?null:0;const number=Number(value);return Number.isSafeInteger(number)&&number>=0&&number<=8640000000000000?number:(nullable?null:0)}
function cloudText(value,{max=128,pattern=null,allowed=null,fallback=''}={}){if(typeof value!=='string')return fallback;const text=value.trim();if(!text||text.length>max||CLOUD_BLOCKED_URL_PATTERN.test(text)||pattern&&!pattern.test(text)||allowed&&!allowed.has(text))return fallback;return text}
function cloudId(value,max=128){return cloudText(value,{max,pattern:CLOUD_ID_PATTERN})}
function cloudIdArray(value,{max=64,itemMax=128,allowed=null}={}){const result=[];for(const raw of Array.isArray(value)?value:[]){const item=allowed?cloudText(raw,{max:itemMax,allowed}):cloudId(raw,itemMax);if(item&&!result.includes(item))result.push(item);if(result.length>=max)break}return result}
function cloudEvidence(value={}){const source=cloudObject(value),out={};for(const key of CLOUD_EVIDENCE_KEYS)out[key]=cloudNumber(source[key],0,key==='responseTimeMsTotal'?Number.MAX_SAFE_INTEGER:1_000_000,0,{integer:true});return out}
function cloudAttempt(value={}){const source=cloudObject(value),id=cloudId(source.id||source.attemptId),originId=cloudId(source.originId),at=cloudTimestamp(source.at);if(!id||!at)return null;const result={id,correct:!!source.correct,assisted:!!source.assisted,hintsUsed:cloudNumber(source.hintsUsed,0,100,0,{integer:true}),responseTimeMs:cloudNumber(source.responseTimeMs,0,86_400_000,0,{integer:true}),at,source:cloudId(source.source,48)||'practice',homeworkMode:!!source.homeworkMode,randomLike:!!source.randomLike,repeatedPattern:!!source.repeatedPattern};if(originId)result.originId=originId;const sequence=cloudNumber(source.originSequence,1,Number.MAX_SAFE_INTEGER,0,{integer:true});if(sequence)result.originSequence=sequence;const identity=cloudId(source.contentIdentity,128);if(identity)result.contentIdentity=identity;return result}
function cloudReview(value={}){const source=cloudObject(value),at=cloudTimestamp(source.at);if(!at)return null;return {at,correct:!!source.correct,assisted:!!source.assisted,independent:!!source.independent,hintsUsed:cloudNumber(source.hintsUsed,0,100,0,{integer:true}),responseTimeMs:cloudNumber(source.responseTimeMs,0,86_400_000,0,{integer:true}),nextReviewAt:cloudTimestamp(source.nextReviewAt)}}
function cloudSkillProjection(value={},key='skill'){
 const source=cloudObject(value),skillId=cloudId(source.skillId||key),evidence=cloudEvidence(source.evidence);if(!skillId)return null;
 const legacy=CLOUD_EVIDENCE_KEYS.map(name=>evidence[name]),stored=cloudObject(source.evidenceProvenance),packed=typeof stored.packed==='string'&&stored.packed.length<=131072&&/^p2:(?:[A-Za-z0-9+/]*={0,2})(?:\.[A-Za-z0-9+/]*={0,2})*$/.test(stored.packed)?stored.packed:'p2:';
 const out={skillId,definitionId:cloudId(source.definitionId)||skillId,masteryScore:cloudNumber(source.masteryScore,0,100),confidence:cloudNumber(source.confidence,0,1,.1),masteryState:cloudText(source.masteryState,{max:16,allowed:CLOUD_MASTERY_STATES,fallback:'Unknown'}),evidence,evidenceProvenance:{version:5,legacy:Array.isArray(stored.legacy)&&stored.legacy.length===7?stored.legacy.map((item,index)=>cloudNumber(item,0,Number.MAX_SAFE_INTEGER,legacy[index],{integer:true})):legacy,packed},recentPerformance:(Array.isArray(source.recentPerformance)?source.recentPerformance:[]).slice(-12).map(cloudAttempt).filter(Boolean),reviewHistory:(Array.isArray(source.reviewHistory)?source.reviewHistory:[]).slice(-32).map(cloudReview).filter(Boolean),prerequisiteState:{met:cloudIdArray(source.prerequisiteState?.met,{max:64}),missing:cloudIdArray(source.prerequisiteState?.missing,{max:64})},lastPracticedAt:cloudTimestamp(source.lastPracticedAt),lastIndependentSuccessAt:cloudTimestamp(source.lastIndependentSuccessAt),nextReviewAt:cloudTimestamp(source.nextReviewAt),remediationLevel:cloudNumber(source.remediationLevel,0,20,0,{integer:true}),rewardIds:cloudIdArray(source.rewardIds,{max:64})};
 try{core()?.normalizeSkillState?.(out,{id:skillId})}catch{out.evidenceProvenance={version:5,legacy,packed:'p2:'}}
 return out
}
function cloudSkillMap(value,max=256){const result={};for(const [key,raw] of Object.entries(cloudObject(value)).slice(0,max)){const skill=cloudSkillProjection(raw,key);if(skill)result[skill.skillId]=skill}return result}
function cloudScoreMap(value,max=256){const result={};for(const [key,raw] of Object.entries(cloudObject(value)).slice(0,max)){const id=cloudId(key);if(id)result[id]=cloudNumber(raw,0,100)}return result}
function cloudReward(value={}){const source=cloudObject(value),id=cloudId(source.id);if(!id)return null;return {id,bossId:cloudId(source.bossId),rewardId:cloudId(source.rewardId),unique:source.unique!==false,awardedAt:cloudTimestamp(source.awardedAt,{nullable:false})}}
function cloudRewardLedger(value,max=256){const result={};for(const key of Object.keys(cloudObject(value)).slice(0,max)){const id=cloudId(key);if(id&&value[key]===true)result[id]=true}return result}
function compactLearningCore(value){
 const state=cloudObject(value),stage=cloudText(state.stage,{max:32,allowed:CLOUD_STAGES,fallback:'child-profile'});
 return {version:cloudNumber(state.version,1,100,1,{integer:true}),stage,completedStages:cloudIdArray(state.completedStages,{max:CLOUD_STAGES.size,itemMax:32,allowed:CLOUD_STAGES}),skills:cloudSkillMap(state.skills),mastery:cloudScoreMap(state.mastery),rewards:(Array.isArray(state.rewards)?state.rewards:[]).slice(-200).map(cloudReward).filter(Boolean),rewardLedger:cloudRewardLedger(state.rewardLedger),hub:{variant:state.hub?.variant==='upgraded'?'upgraded':'starter',expansionUnlocked:!!state.hub?.expansionUnlocked,visibleChangeCount:cloudNumber(state.hub?.visibleChangeCount,0,1_000_000,0,{integer:true}),upgrades:cloudIdArray(state.hub?.upgrades,{max:64})}}
}
function externalizeProfile(profile,{cloud=false}={}){
 const clean=scrubSecrets(structuredClone(profile||{}));
 if(!cloud)return clean;
 return cloudProfileProjection(clean)
}
function externalizeStore(store=STORE){const clean=scrubSecrets(structuredClone(store));clean.profiles=(clean.profiles||[]).map(profile=>externalizeProfile(profile));return clean}
function cloudSettingsProjection(settings={}){return {reducedMotion:!!settings.reducedMotion,cameraMotionReduction:!!settings.cameraMotionReduction,largeTargets:!!settings.largeTargets,highContrast:!!settings.highContrast,captions:!!settings.captions,dyslexicFont:!!settings.dyslexicFont,textScale:cloudText(settings.textScale,{max:4,allowed:new Set(['0.9','1','1.1','1.25']),fallback:'1'}),qualityTier:cloudText(settings.qualityTier,{max:16,allowed:new Set(['ultra','high','balanced','performance','mobile']),fallback:'balanced'}),soundOn:settings.soundOn!==false,musicOn:!!settings.musicOn,enemySpeed:cloudText(settings.enemySpeed,{max:12,allowed:new Set(['slow','normal','fast']),fallback:'normal'})}}
function cloudControlsProjection(controls={}){
 const daily=Math.max(5,Math.min(180,Math.trunc(Number(controls.dailyMinutes)||30))),session=Math.max(5,Math.min(120,daily,Math.trunc(Number(controls.maxSessionMinutes)||20)));
 // The false sentinel remains only for compatibility with the deployed
 // Firestore schema; there is no local setting or production feature.
 return {dailyMinutes:daily,maxSessionMinutes:session,requireParentForSnap:false,requireParentForPractice:!!controls.requireParentForPractice}
}
function cloudMasteryProjection(mastery={}){
 return {math:cloudNumber(mastery.math,0,100),words:cloudNumber(mastery.words,0,100),spanish:cloudNumber(mastery.spanish,0,100)}
}
function cloudLegacySkills(value){const result={};for(const [key,raw] of Object.entries(cloudObject(value)).slice(0,256)){const id=cloudId(key),source=cloudObject(raw);if(!id)continue;result[id]={mastery:cloudNumber(source.mastery,0,100),streak:cloudNumber(source.streak,0,1_000_000,0,{integer:true}),lastSeen:cloudTimestamp(source.lastSeen),nextReview:cloudTimestamp(source.nextReview),masteryState:cloudText(source.masteryState,{max:16,allowed:CLOUD_MASTERY_STATES,fallback:'Unknown'}),confidence:cloudNumber(source.confidence,0,1)}}return result}
function cloudMistake(value){const source=cloudObject(value),skill=cloudId(source.skill),ts=cloudTimestamp(source.ts);return skill&&ts?{skill,ts}:null}
function cloudPractice(value){const source=cloudObject(value),subject=cloudId(source.subject,32),ts=cloudTimestamp(source.ts);if(!subject||!ts)return null;const out={subject,grade:cloudText(source.grade,{max:8,pattern:/^(?:K|[1-6])$/}),difficulty:cloudNumber(source.difficulty,1,10,1,{integer:true}),type:cloudId(source.type,32),ts,homework:!!source.homework,validated:source.validated===true,quarantined:source.quarantined===true};for(const key of ['curriculumSkillId','contentId','contentIdentity','manifestStatus','gateMode','sessionReason']){const id=cloudId(source[key]);if(id)out[key]=id}const missionId=cloudNumber(source.missionId,1,1_000_000,0,{integer:true});if(missionId)out.missionId=missionId;return out}
function cloudSession(value){const source=cloudObject(value),id=cloudId(source.id),mission=cloudNumber(source.mission,1,1_000_000,0,{integer:true}),skillId=cloudId(source.skillId),world=cloudId(source.world,32),ts=cloudTimestamp(source.ts);if((!mission&&!skillId&&!world)||!ts)return null;const out={mission,world,skillId,combo:cloudNumber(source.combo,0,1_000_000,0,{integer:true}),accuracy:source.accuracy==null?null:cloudNumber(source.accuracy,0,100),moves:cloudNumber(source.moves,0,1_000_000,0,{integer:true}),durationSec:cloudNumber(source.durationSec,0,86_400,0,{integer:true}),practice:!!source.practice,homework:!!source.homework,source:cloudId(source.source,48)||'mission',ts};if(id)out.id=id;return out}
function cloudHistory(value,projector,max=100){return (Array.isArray(value)?value:[]).slice(-max).map(projector).filter(Boolean)}
function cloudProgrammableBits(value){const result={};for(const [key,raw] of Object.entries(cloudObject(value)).slice(0,64)){const source=cloudObject(raw),id=cloudText(source.id||key,{max:32,pattern:CLOUD_BIT_ID_PATTERN});if(!id||result[id])continue;const behavior={};for(const event of ['correct','mistake','collect','reset'])behavior[event]=(Array.isArray(source.behavior?.[event])?source.behavior[event]:[]).slice(0,12).flatMap(item=>{const action=cloudObject(item),type=cloudText(action.type,{max:8,allowed:new Set(['glow','cheer','collect','move'])});if(!type)return [];return type==='move'?[{type,amount:cloudNumber(action.amount,1,3,1,{integer:true})}]:[{type}]});result[id]={id,behavior}}return result}
function cloudLessonProgress(value){const result={};for(const [key,raw] of Object.entries(cloudObject(value)).slice(0,128)){const id=cloudId(key),source=cloudObject(raw);if(!id)continue;result[id]={masteryScore:cloudNumber(source.masteryScore,0,100),completedAt:cloudTimestamp(source.completedAt)}}return result}
function cloudBubbleReefRewards(value,profileId){const source=cloudObject(value);if(source.profileId!==profileId)return {};const contributionId='bubble-reef-base-current-restored',rewardId=`${contributionId}:bubble-reef-current-cache`,contribution=(Array.isArray(source.contributions)?source.contributions:[]).find(item=>item?.id===contributionId),reward=(Array.isArray(source.rewards)?source.rewards:[]).find(item=>item?.id===rewardId),awardedAt=cloudTimestamp(reward?.awardedAt);if(!contribution||!reward||!awardedAt)return {};const out={schemaVersion:1,profileId,contributionLedger:{},contributions:[{id:contributionId,type:'base-contribution',worldProfileId:'bubble-reef',routeId:'bubble-reef-preview-route',missionId:8,persistent:true,contributedAt:cloudTimestamp(contribution.contributedAt)||awardedAt}],rewards:[{id:rewardId,contributionId,rewardId:'bubble-reef-current-cache',type:'mission-reward',unique:true,stars:3,spark:3,awardedAt}]};out.contributionLedger[contributionId]={contributionId,rewardId,awardedAt};return out}
function cloudProfileProjection(profile={}){
 const clean=cloudObject(profile),id=cloudId(clean.id),bits=cloudProgrammableBits(clean.programmableBits),cosmetics=cloudIdArray(clean.cosmetics,{max:128,itemMax:32,allowed:CLOUD_COSMETICS}),equipped=cloudText(clean.equippedCosmetic,{max:32,allowed:CLOUD_COSMETICS});
 return {
  id,name:cloudText(clean.name,{max:40,fallback:'Kid'}),score:cloudNumber(clean.score,0,1_000_000_000,0,{integer:true}),stars:cloudNumber(clean.stars,0,1_000_000_000,0,{integer:true}),spark:cloudNumber(clean.spark,0,1_000_000_000,0,{integer:true}),
  progression:REGISTRY.normalizeProgression(clean.progression),learningCore:compactLearningCore(clean.learningCore),bestCombo:cloudNumber(clean.bestCombo,0,1_000_000,0,{integer:true}),bite:cloudText(clean.bite,{max:16,allowed:CLOUD_BITES,fallback:'Nib'}),
  unlockedBites:cloudIdArray(clean.unlockedBites,{max:CLOUD_BITES.size,itemMax:16,allowed:CLOUD_BITES}),cosmetics,
  equippedCosmetic:cosmetics.includes(equipped)?equipped:'',programmableBits:bits,
  activeProgrammableBitId:Object.hasOwn(bits,clean.activeProgrammableBitId)?clean.activeProgrammableBitId:'',mastery:cloudMasteryProjection(clean.mastery),
  skills:cloudLegacySkills(clean.skills),mistakes:cloudHistory(clean.mistakes,cloudMistake),practice:cloudHistory(clean.practice,cloudPractice),
  snap:[],sessions:cloudHistory(clean.sessions,cloudSession),settings:cloudSettingsProjection(clean.settings),controls:cloudControlsProjection(clean.controls),updatedAt:cloudTimestamp(clean.updatedAt,{nullable:false}),
  codeLabProjects:{},codeBridgeLessons:cloudLessonProgress(clean.codeBridgeLessons),
  programmableBitLessons:cloudLessonProgress(clean.programmableBitLessons),bubbleReefRewards:cloudBubbleReefRewards(clean.bubbleReefRewards,id)
 }
}
function cloudStoreProjection(store=STORE){
 return {schemaVersion:cloudNumber(store?.schemaVersion,1,100,9,{integer:true}),registryVersion:cloudId(store?.registryVersion,64)||cloudId(REGISTRY.registryVersion,64),active:cloudNumber(store?.active,0,100,0,{integer:true}),profiles:(Array.isArray(store?.profiles)?store.profiles:[]).slice(0,20).map(cloudProfileProjection).filter(profile=>profile.id),deletedProfiles:(Array.isArray(store?.deletedProfiles)?store.deletedProfiles:[]).slice(-100).flatMap(item=>{const id=cloudId(item?.id),deletedAt=cloudTimestamp(item?.deletedAt,{nullable:false});return id&&deletedAt?[{id,deletedAt}]:[]})}
}
function sanitizeRemoteProfile(profile){
 const source=cloudObject(profile);
 if(source.deleted===true){const id=cloudId(source.id),deletedAt=cloudTimestamp(source.deletedAt,{nullable:false});return id&&deletedAt?{id,deleted:true,deletedAt}:null}
 const clean=cloudProfileProjection(profile||{});
 if(clean.equippedCosmetic==='')clean.equippedCosmetic=null;
 if(clean.activeProgrammableBitId==='')clean.activeProgrammableBitId=null;
 return clean
}
function exportEnvelope(){
 const store=externalizeStore();const payload={schemaVersion:store.schemaVersion,exportedAt:Date.now(),store};
 const digest=checksum(JSON.stringify(payload.store));
 return {format:'brainbite-progress',version:3,payload,digest}
}
function checksum(value){let hash=2166136261;for(const byte of new TextEncoder().encode(value)){hash^=byte;hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16).padStart(8,'0')}
function validateEnvelope(x){
 if(!x||x.format!=='brainbite-progress'||![2,3].includes(x.version)||!x.payload?.store)return false;
 const digest=checksum(JSON.stringify(x.payload.store));
 return digest===x.digest&&Array.isArray(x.payload.store.profiles)
}




class BrainBiteFirebaseREST {
  constructor(projectId,apiKey){this.projectId=projectId||'';this.apiKey=apiKey||'';this.session=this.loadSession()}
  configured(){return /^[a-z0-9-]{6,}$/.test(this.projectId)&&this.apiKey.length>=20}
  loadSession(){try{return JSON.parse(localStorage.getItem('bb-firebase-session')||'null')}catch{return null}}
  saveSession(s){this.session=s;if(s)localStorage.setItem('bb-firebase-session',JSON.stringify(s));else localStorage.removeItem('bb-firebase-session')}
  async signUp(email,password){
    const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(this.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'Sign-up failed');this.saveSession({idToken:d.idToken,refreshToken:d.refreshToken,localId:d.localId,email:d.email,expiresIn:d.expiresIn});return d
  }
  async signIn(email,password){
    const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(this.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'Sign-in failed');this.saveSession({idToken:d.idToken,refreshToken:d.refreshToken,localId:d.localId,email:d.email,expiresIn:d.expiresIn});return d
  }
  async refresh(){
    if(!this.session?.refreshToken)return null;
    const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:this.session.refreshToken});
    const r=await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(this.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'Token refresh failed');this.saveSession({...this.session,idToken:d.id_token,refreshToken:d.refresh_token,localId:d.user_id});return this.session
  }
  async signOut(){this.saveSession(null)}
  userId(){return this.session?.localId||null}
  authHeaders(){return {'Authorization':`Bearer ${this.session?.idToken||''}`,'Content-Type':'application/json'}}
  async fetchAuthorized(url,options={},authRetriesRemaining=1){
    const response=await fetch(url,{...options,headers:{...this.authHeaders(),...(options.headers||{})}});
    if(response.status!==401)return response;
    if(authRetriesRemaining<=0)throw new Error('Cloud authorization expired. Sign in again.');
    const refreshed=await this.refresh();
    if(!refreshed?.idToken)throw new Error('Cloud authorization expired. Sign in again.');
    return this.fetchAuthorized(url,options,authRetriesRemaining-1)
  }
  docUrl(profileId){return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents/families/${encodeURIComponent(this.userId())}/profiles/${encodeURIComponent(profileId)}`}
  wrapValue(v){
    if(v===null)return {nullValue:null};
    if(Array.isArray(v))return {arrayValue:{values:v.map(x=>this.wrapValue(x))}};
    if(typeof v==='string')return {stringValue:v};
    if(typeof v==='number')return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};
    if(typeof v==='boolean')return {booleanValue:v};
    if(typeof v==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,val])=>[k,this.wrapValue(val)]))}};
    return {stringValue:String(v)}
  }
  unwrapValue(x){
    if(!x)return null;if('stringValue'in x)return x.stringValue;if('integerValue'in x)return Number(x.integerValue);if('doubleValue'in x)return Number(x.doubleValue);if('booleanValue'in x)return x.booleanValue;if('nullValue'in x)return null;
    if(x.arrayValue)return (x.arrayValue.values||[]).map(v=>this.unwrapValue(v));
    if(x.mapValue)return Object.fromEntries(Object.entries(x.mapValue.fields||{}).map(([k,v])=>[k,this.unwrapValue(v)]));
    return null
  }
  profilePatchBody(profile,updatedAt=new Date().toISOString()){
    const external=externalizeProfile(profile,{cloud:true});return {fields:{ownerId:{stringValue:this.userId()},displayName:{stringValue:external.name},clientProfileId:{stringValue:external.id},progress:this.wrapValue(external),clientUpdatedAt:{timestampValue:updatedAt}}}
  }
  serializeSafePatch(body,label='profile'){
    const serialized=JSON.stringify(body);
    const bytes=new TextEncoder().encode(serialized).byteLength;
    if(bytes>FIRESTORE_SAFE_DOCUMENT_BYTES)throw new Error(`Cloud ${label} is too large to sync safely (${bytes} UTF-8 bytes; limit ${FIRESTORE_SAFE_DOCUMENT_BYTES}). Reduce stored history before retrying.`);
    return serialized
  }
  async pushProfile(profile,conflictRetriesRemaining=2){
    if(!this.userId())throw new Error('Sign in first');
    // Reject an oversized local profile before even reading the remote document.
    this.serializeSafePatch(this.profilePatchBody(profile),'profile');
    const current=await this.readProfileDocument(profile.id);
    const currentProgress=sanitizeRemoteProfile(this.unwrapValue(current?.fields?.progress));
    // A deletion tombstone is authoritative for this UUID. Profile IDs are
    // never reused, so a stale device must not recreate the document.
    if(currentProgress?.deleted)return structuredClone(currentProgress);
    const merged=currentProgress?mergeProfiles(profile,currentProgress,{remoteCloud:true}):structuredClone(profile);
    const body=this.profilePatchBody(merged);
    const serializedBody=this.serializeSafePatch(body,'profile');
    const patchUrl=current?.updateTime?`${this.docUrl(profile.id)}?currentDocument.updateTime=${encodeURIComponent(current.updateTime)}`:`${this.docUrl(profile.id)}?currentDocument.exists=false`;
    const r=await this.fetchAuthorized(patchUrl,{method:'PATCH',body:serializedBody});
    if((r.status===409||r.status===412)&&conflictRetriesRemaining>0)return this.pushProfile(profile,conflictRetriesRemaining-1);
    if(!r.ok)throw new Error(`Cloud write failed (${r.status})`)
    return merged
  }
  async readProfileDocument(profileId){
    const r=await this.fetchAuthorized(this.docUrl(profileId));
    if(r.status===404)return null;
    if(!r.ok)throw new Error(`Cloud profile read failed (${r.status})`);
    const body=await r.json();
    if(body?.fields)return body;
    const suffix=`/profiles/${profileId}`;
    return body?.documents?.find(document=>String(document.name||'').endsWith(suffix))||null;
  }
  async pushProfileDeletion(profileId,deletedAt=Date.now()){
    if(!this.userId())throw new Error('Sign in first');
    const tombstone={id:profileId,deleted:true,deletedAt:Number(deletedAt)||Date.now()};
    const body={fields:{ownerId:{stringValue:this.userId()},displayName:{stringValue:''},clientProfileId:{stringValue:profileId},progress:this.wrapValue(tombstone),clientUpdatedAt:{timestampValue:new Date(tombstone.deletedAt).toISOString()}}};
    const serializedBody=this.serializeSafePatch(body,'deletion marker');
    const r=await this.fetchAuthorized(this.docUrl(profileId),{method:'PATCH',body:serializedBody});
    if(!r.ok)throw new Error(`Cloud delete marker failed (${r.status})`)
  }
  async pullProfiles(){
    if(!this.userId())throw new Error('Sign in first');
    const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents/families/${encodeURIComponent(this.userId())}/profiles`;
    const r=await this.fetchAuthorized(url);
    if(r.status===404)return [];
    if(!r.ok)throw new Error(`Cloud read failed (${r.status})`);
    const d=await r.json();
    return (d.documents||[]).map(doc=>({name:doc.name,progress:this.unwrapValue(doc.fields?.progress),client_updated_at:doc.fields?.clientUpdatedAt?.timestampValue,updated_at:doc.updateTime}))
  }
  async deleteFamily(){
    if(!this.userId())throw new Error('Sign in first');
    const profiles=await this.pullProfiles();
    for(const p of profiles){
      if(!p.name)continue;
      const r=await this.fetchAuthorized(`https://firestore.googleapis.com/v1/${p.name}`,{method:'DELETE'});
      if(!r.ok&&r.status!==404)throw new Error(`Cloud delete failed (${r.status})`)
    }
    return {profilesDeleted:profiles.length}
  }
  async deleteAuthAccount(){
    if(!this.session?.idToken)throw new Error('Sign in first');
    const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(this.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:this.session.idToken})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||'Account delete failed');this.saveSession(null);return true
  }
}
function cloudClient(){
 if(INTEGRATIONS.cloud.provider!=='firebase')return null;
 return new BrainBiteFirebaseREST(INTEGRATIONS.cloud.url,INTEGRATIONS.cloud.key)
}


const BITES=[
 {name:'Nib',emoji:'🟢',unlockStars:0},
 {name:'Zip',emoji:'🟡',unlockStars:12},
 {name:'Bloop',emoji:'🔵',unlockStars:30},
 {name:'Scout',emoji:'🟣',unlockStars:60}
];
const SHOP=[
 {id:'space_trail',name:'Space Trail',cost:15},
 {id:'book_glasses',name:'Wordwood Glasses',cost:20},
 {id:'rainbow_cape',name:'Rainbow Cape',cost:25},
 {id:'boss_crown',name:'Boss Crown',cost:35}
];
const REVIEW_MS={first:10*60*1000,second:24*60*60*1000,mastered:3*24*60*60*1000};
let parentUnlocked=false,parentUnlockedUntil=0,deferredPrompt=null;
function bytesToB64(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary)}
function b64ToBytes(value){const binary=atob(String(value||''));return Uint8Array.from(binary,character=>character.charCodeAt(0))}
function readParentAuth(){
 try{const value=JSON.parse(localStorage.getItem(PARENT_AUTH_KEY)||'null');if(!value||value.version!==1||value.algorithm!=='PBKDF2-SHA-256'||Number(value.iterations)<PARENT_AUTH_ITERATIONS||!value.saltB64||!value.verifierB64)return null;return {version:1,algorithm:'PBKDF2-SHA-256',iterations:Number(value.iterations),saltB64:String(value.saltB64),verifierB64:String(value.verifierB64),failedAttempts:Math.max(0,Number(value.failedAttempts)||0),lockedUntil:Math.max(0,Number(value.lockedUntil)||0),updatedAt:Number(value.updatedAt)||0}}catch{return null}
}
function writeParentAuth(value){localStorage.setItem(PARENT_AUTH_KEY,JSON.stringify(value))}
async function deriveParentVerifier(pin,salt,iterations=PARENT_AUTH_ITERATIONS){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,256))
}
function sameBytes(left,right){if(left.length!==right.length)return false;let difference=0;for(let index=0;index<left.length;index++)difference|=left[index]^right[index];return difference===0}
async function createParentAuth(pin){if(!/^\d{6,10}$/.test(pin))throw new Error('PIN must be 6-10 digits.');const salt=crypto.getRandomValues(new Uint8Array(16)),verifier=await deriveParentVerifier(pin,salt);const auth={version:1,algorithm:'PBKDF2-SHA-256',iterations:PARENT_AUTH_ITERATIONS,saltB64:bytesToB64(salt),verifierB64:bytesToB64(verifier),failedAttempts:0,lockedUntil:0,updatedAt:Date.now()};writeParentAuth(auth);return auth}
async function verifyParentPin(pin){
 const auth=readParentAuth();if(!auth)return {ok:false,setup:true};
 const now=Date.now();if(auth.lockedUntil>now)return {ok:false,locked:true,lockedUntil:auth.lockedUntil};
 if(auth.lockedUntil){auth.failedAttempts=0;auth.lockedUntil=0}
 const actual=await deriveParentVerifier(pin,b64ToBytes(auth.saltB64),auth.iterations),ok=sameBytes(actual,b64ToBytes(auth.verifierB64));
 if(ok){auth.failedAttempts=0;auth.lockedUntil=0;auth.updatedAt=now;writeParentAuth(auth);return {ok:true}}
 auth.failedAttempts+=1;if(auth.failedAttempts>=5)auth.lockedUntil=now+PARENT_LOCK_MS;auth.updatedAt=now;writeParentAuth(auth);return {ok:false,locked:auth.lockedUntil>now,lockedUntil:auth.lockedUntil,remaining:Math.max(0,5-auth.failedAttempts)}
}
function hasParentAccess(){if(parentUnlocked&&Date.now()>=parentUnlockedUntil)lockParentAccess();return parentUnlocked}
function lockParentAccess(){parentUnlocked=false;parentUnlockedUntil=0;for(const id of ['parentPinInput','confirmParentPin','changeCurrentParentPin','newParentPin','changeConfirmParentPin','parentPassword'])if($(id))$(id).value=''}
function unlockParentAccess(){parentUnlocked=true;parentUnlockedUntil=Date.now()+15*60*1000}
async function requireParentAuthorization({inputId='timeUpParentPin',statusId='timeUpStatus'}={}){
 const status=$(statusId),input=$(inputId);
 const auth=readParentAuth();
 if(!auth){if(input)input.value='';if(status)status.textContent='A parent must set up the family PIN in Parent settings before adding time.';return false}
 if(auth.lockedUntil>Date.now()){if(input)input.value='';if(status)status.textContent=`Too many attempts. Try again after ${new Date(auth.lockedUntil).toLocaleTimeString()}.`;return false}
 const pin=input?.value||'';if(input)input.value='';
 const result=await verifyParentPin(pin);
 if(result.locked){if(status)status.textContent=`Too many attempts. Try again after ${new Date(result.lockedUntil).toLocaleTimeString()}.`;return false}
 if(!result.ok){if(status)status.textContent=`Incorrect PIN. ${result.remaining} attempt(s) remaining.`;return false}
 unlockParentAccess();return true
}
function renderParentGate(){
 const setup=!readParentAuth();$('parentGatePrompt').textContent=setup?'Set up a 6-10 digit family PIN to protect parent areas on this device.':'Enter the family PIN to open parent areas.';
 $('confirmParentPinLabel').hidden=!setup;$('unlockParent').textContent=setup?'Set PIN':'Unlock';
}
let SENSITIVE_ACTION=null;
function sensitiveActionFocusables(){
 const dialog=$('sensitiveActionDialog');
 return dialog?[...dialog.querySelectorAll('button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])')].filter(element=>!element.disabled&&!element.closest('[hidden]')):[]
}
function closeSensitiveAction(approved=false){
 const current=SENSITIVE_ACTION;if(!current)return;
 SENSITIVE_ACTION=null;
 const backdrop=$('sensitiveActionBackdrop'),dialog=$('sensitiveActionDialog');
 backdrop.hidden=true;dialog.removeAttribute('aria-busy');
 $('sensitiveActionPin').value='';$('sensitiveActionConfirmation').value='';$('sensitiveActionStatus').textContent='';
 $('sensitiveActionCancel').disabled=false;$('sensitiveActionConfirm').disabled=false;
 current.resolve(approved);
 if(current.invoker?.isConnected)current.invoker.focus()
}
function sensitiveActionKeydown(event){
 if(!SENSITIVE_ACTION)return;
 if(event.key==='Escape'&&!$('sensitiveActionDialog').hasAttribute('aria-busy')){event.preventDefault();closeSensitiveAction(false);return}
 if(event.key!=='Tab')return;
 const focusable=sensitiveActionFocusables();if(!focusable.length){event.preventDefault();$('sensitiveActionDialog').focus();return}
 const first=focusable[0],last=focusable.at(-1),activeIndex=focusable.indexOf(document.activeElement);
 if(event.shiftKey&&activeIndex<=0){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&(activeIndex===focusable.length-1||activeIndex<0)){event.preventDefault();first.focus()}
}
async function approveSensitiveAction(){
 const current=SENSITIVE_ACTION;if(!current)return;
 const confirmation=$('sensitiveActionConfirmation'),pin=$('sensitiveActionPin'),status=$('sensitiveActionStatus');
 if(current.confirmationValue!==null&&confirmation.value!==current.confirmationValue){status.textContent=`Type ${current.confirmationValue} exactly to continue.`;confirmation.focus();return}
 const auth=readParentAuth();
 if(!auth){status.textContent='Set up a family PIN before using this action.';pin.value='';pin.focus();return}
 if(auth.lockedUntil>Date.now()){status.textContent=`Too many attempts. Try again after ${new Date(auth.lockedUntil).toLocaleTimeString()}.`;pin.value='';pin.focus();return}
 const dialog=$('sensitiveActionDialog');status.textContent='Verifying parent PIN…';dialog.setAttribute('aria-busy','true');$('sensitiveActionCancel').disabled=true;$('sensitiveActionConfirm').disabled=true;
 const enteredPin=pin.value;pin.value='';
 try{
  const result=await verifyParentPin(enteredPin);
  if(result.locked){status.textContent=`Too many attempts. Try again after ${new Date(result.lockedUntil).toLocaleTimeString()}.`;return}
  if(!result.ok){status.textContent=`Incorrect PIN. ${result.remaining} attempt(s) remaining.`;return}
  closeSensitiveAction(true)
 }finally{
  if(SENSITIVE_ACTION){dialog.removeAttribute('aria-busy');$('sensitiveActionCancel').disabled=false;$('sensitiveActionConfirm').disabled=false;pin.focus()}
 }
}
function requestSensitiveAction({title,description,confirmText='Continue',confirmationValue=null,confirmationPrompt='',invoker=document.activeElement,statusId=null}={}){
 if(!hasParentAccess()){
  const status=statusId?$(statusId):null;if(status)status.textContent='Parent areas are locked. Unlock them before using this action.';
  return Promise.resolve(false)
 }
 if(SENSITIVE_ACTION)closeSensitiveAction(false);
 $('sensitiveActionTitle').textContent=title||'Confirm parent action';$('sensitiveActionDescription').textContent=description||'';$('sensitiveActionConfirm').textContent=confirmText;
 const label=$('sensitiveActionConfirmationLabel');label.hidden=confirmationValue===null;$('sensitiveActionConfirmationPrompt').textContent=confirmationPrompt||'';
 $('sensitiveActionConfirmation').value='';$('sensitiveActionPin').value='';$('sensitiveActionStatus').textContent='';$('sensitiveActionBackdrop').hidden=false;
 return new Promise(resolve=>{
  SENSITIVE_ACTION={resolve,invoker,confirmationValue:confirmationValue===null?null:String(confirmationValue)};
  (confirmationValue===null?$('sensitiveActionPin'):$('sensitiveActionConfirmation')).focus()
 })
}
$('sensitiveActionCancel').addEventListener('click',()=>closeSensitiveAction(false));
$('sensitiveActionConfirm').addEventListener('click',approveSensitiveAction);
$('sensitiveActionDialog').addEventListener('keydown',sensitiveActionKeydown);
function sanitizeProgrammableBits(value){
 const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{},result={};
 for(const [key,raw] of Object.entries(source)){
  if(!raw||typeof raw!=='object')continue;
  const id=String(raw.id||key).trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');
  if(!/^[a-z0-9][a-z0-9-]{0,31}$/.test(id)||result[id])continue;
  const behavior={};
  for(const event of ['correct','mistake','collect','reset']){
   const values=Array.isArray(raw.behavior?.[event])?Array.from(raw.behavior[event]):raw.behavior?.[event]==null?[]:[raw.behavior[event]];
   behavior[event]=values.slice(0,12).flatMap(action=>{
    if(typeof action==='string'){
     if(['glow','cheer','collect'].includes(action))return [{type:action}];
     const move=/^move\(([1-3])\)$/.exec(action);if(move)return [{type:'move',amount:Number(move[1])}];
    }
    if(action&&typeof action==='object'&&['glow','cheer','collect'].includes(action.type))return [{type:action.type}];
    if(action?.type==='move'&&Number.isInteger(action.amount)&&action.amount>=1&&action.amount<=3)return [{type:'move',amount:action.amount}];
    return [];
   });
  }
  result[id]={id,name:String(raw.name||id).slice(0,40)||id,behavior};
 }
 return result;
}
function scrubSecrets(value){
 if(Array.isArray(value))return value.map(scrubSecrets);
 if(!value||typeof value!=='object')return value;
 const clean={};for(const [key,child] of Object.entries(value))if(!SECRET_KEYS.has(key))clean[key]=scrubSecrets(child);return clean
}
function migrateStore(x){
 x=scrubSecrets(x);
 if(!x||!Array.isArray(x.profiles))return structuredClone(DEF);
  if(!Array.isArray(x.deletedProfiles))x.deletedProfiles=[];
  x.deletedProfiles=x.deletedProfiles.filter(item=>item&&item.id).map(item=>({id:String(item.id),deletedAt:Number(item.deletedAt)||Date.now()}));
  const deletedIds=new Set(x.deletedProfiles.map(item=>item.id));
  x.profiles=x.profiles.filter(profile=>!deletedIds.has(profile?.id));
  if(x.profiles.length===0)x.profiles=[blank()];
 if(!x.schemaVersion)x.schemaVersion=1;
 x.profiles.forEach(p=>{
    if(!p.id)p.id=`legacy-${checksum(JSON.stringify(p))}-${x.profiles.indexOf(p)}`;if(p.spark==null)p.spark=0;if(!p.missionStars||typeof p.missionStars!=='object'||Array.isArray(p.missionStars))p.missionStars={};if(!p.unlockedBites)p.unlockedBites=['Nib'];if(!p.bite)p.bite='Nib';
   if(!p.cosmetics)p.cosmetics=[];if(p.equippedCosmetic===undefined)p.equippedCosmetic=null;
   if(!p.skills)p.skills={};if(!p.sessions)p.sessions=[];
   p.name=String(p.name||'Kid').trim().slice(0,40)||'Kid';p.score=Math.max(0,Number(p.score)||0);p.stars=Math.max(0,Number(p.stars)||0);p.spark=Math.max(0,Number(p.spark)||0);
   p.progression=REGISTRY.normalizeProgression(p);
   delete p.completed;delete p.unlockedMath;delete p.unlockedWords;delete p.unlockedSpanish;delete p.lastMission;
   for(const key of ['unlockedBites','cosmetics','mistakes','practice','snap','sessions'])if(!Array.isArray(p[key]))p[key]=[];
   if(!p.mastery||typeof p.mastery!=='object')p.mastery={math:10,words:10,spanish:10};
   if(!p.settings||typeof p.settings!=='object')p.settings={};
   if(!p.codeLabProjects||typeof p.codeLabProjects!=='object'||Array.isArray(p.codeLabProjects))p.codeLabProjects={};
   p.programmableBits=sanitizeProgrammableBits(p.programmableBits);
   p.activeProgrammableBitId=Object.hasOwn(p.programmableBits,p.activeProgrammableBitId)?p.activeProgrammableBitId:Object.keys(p.programmableBits)[0]||null;
   if(p.settings.reducedMotion===undefined)p.settings.reducedMotion=false;
   if(p.settings.cameraMotionReduction===undefined)p.settings.cameraMotionReduction=false;
   if(p.settings.largeTargets===undefined)p.settings.largeTargets=false;
   if(p.settings.highContrast===undefined)p.settings.highContrast=false;
   if(p.settings.captions===undefined)p.settings.captions=false;
   if(p.settings.dyslexicFont===undefined)p.settings.dyslexicFont=false;
   if(!p.settings.textScale)p.settings.textScale='1';
   if(!p.settings.qualityTier)p.settings.qualityTier='balanced';
   if(p.settings.soundOn===undefined)p.settings.soundOn=true;
   if(p.settings.musicOn===undefined)p.settings.musicOn=false;
   if(!p.settings.enemySpeed)p.settings.enemySpeed='normal';if(!p.controls||typeof p.controls!=='object')p.controls={};
   p.controls.dailyMinutes=Math.max(5,Math.min(180,Number(p.controls.dailyMinutes)||30));p.controls.maxSessionMinutes=Math.max(5,Math.min(120,p.controls.dailyMinutes,Number(p.controls.maxSessionMinutes)||20));delete p.controls.requireParentForSnap;p.controls.requireParentForPractice=!!p.controls.requireParentForPractice;
 });
  x.active=Math.max(0,Math.min(x.profiles.length-1,Number(x.active)||0));
  x.schemaVersion=SCHEMA_VERSION;x.registryVersion=REGISTRY.registryVersion;
 return x;
}

function load(){LOADED_STORE_RAW=localStorage.getItem(KEY);return mergeStores(null,readAllStoredStores())}
function save(){const startedAt=globalThis.performance?.now?.();if(P()){if(core())projectLearningCore(P(),ensureProfileLearningCore(P()));P().updatedAt=Date.now()}queueSyncEvent({type:'store-update',profileId:P()?.id||null,payload:{active:STORE.active,schemaVersion:STORE.schemaVersion},schemaVersion:STORE.schemaVersion,ts:Date.now()});render();return persistCanonicalState().then(result=>{if(startedAt!=null)window.BrainBitePresentation?.recordSave?.(Math.max(0,globalThis.performance.now()-startedAt));return result})}
const PARENT_ONLY_SCREENS=new Set(['profiles','recovery','account','integrations','controls','diagnostics','release','qa','advanced']);
const RETIRED_SCREEN_IDS=new Set(['snap']);
const WORLD_SCREENS=new Set(['worlds','math','words','spanish']);
const LANDSCAPE_PROMPT_QUERY='(orientation:landscape) and (max-height:520px) and (max-width:1024px)';
let landscapePromptMedia=null,landscapePromptDismissed=false;
try{landscapePromptDismissed=sessionStorage.getItem('bb-landscape-dismissed')==='1'}catch{}
// Short landscape phones cannot show the battle safely, so ask for a rotation. The
// prompt is dismissible and only ever covers the bottom strip of the screen.
function updateLandscapePrompt(){
 const prompt=$('landscapePrompt');if(!prompt)return;
 if(!landscapePromptMedia)landscapePromptMedia=matchMedia(LANDSCAPE_PROMPT_QUERY);
 const battle=!!$('game')?.classList.contains('show');
 const show=landscapePromptMedia.matches&&battle&&!landscapePromptDismissed;
 if(prompt.hidden===!show)return;
 prompt.hidden=!show;
 const status=$('landscapePromptStatus');
 if(status)status.textContent=show?'Turn your device upright to make the battle answers easier to tap.':'';
}
function dismissLandscapePrompt(){
 landscapePromptDismissed=true;
 try{sessionStorage.setItem('bb-landscape-dismissed','1')}catch{}
 updateLandscapePrompt();
}
// First-run choreography: name, then world, then one guided mission. Stages are stored
// on the profile, so a sibling profile keeps its own progress through the sequence.
const FIRST_RUN_STAGES = ['name', 'world', 'mission', 'done'];
function firstRunState(profile = P()) {
  if (!profile) return { stage: 'done' };
  const stored = profile.firstRun;
  const stage = FIRST_RUN_STAGES.includes(stored?.stage) ? stored.stage : (progression(profile).completedMissionIds.length ? 'done' : 'name');
  return { stage };
}
function setFirstRunStage(stage) {
  const profile = P(); if (!profile) return;
  profile.firstRun = { stage, updatedAt: Date.now() };
}
function renderFirstRun() {
  const card = $('firstRunCard'), hint = $('firstRunHint'), profile = P();
  if (!card || !profile) return;
  const { stage } = firstRunState(profile);
  const showCard = stage === 'name' || stage === 'world';
  card.hidden = !showCard;
  if (showCard) {
    const nameStep = stage === 'name';
    $('firstRunTitle').textContent = nameStep ? 'What should Bite call you?' : 'Ready for your first adventure?';
    $('firstRunText').textContent = nameStep
      ? 'Your name shows up on your BrainBase and your trophies.'
      : 'Tap PLAY to explore Number Nebula. Bite will show you what to do.';
    $('firstRunNameLabel').hidden = !nameStep;
    $('firstRunConfirm').hidden = !nameStep;
    $('firstRunConfirm').textContent = "Let's go";
  }
  const battle = $('game')?.classList.contains('show');
  hint.hidden = !(battle && stage === 'mission');
  if (!hint.hidden) hint.textContent = 'Tap the answer Bite should eat.';
  return stage;
}
function parentShellRequired(statusId){
 if(hasParentAccess())return true;
 const status=statusId?$(statusId):null;if(status)status.textContent='Parent areas are locked. Unlock them before using this action.';
 return false
}
function show(id){
 const requested=id;if(RETIRED_SCREEN_IDS.has(id)||!$(id))id='home';
 if(id==='qa'&&!labAllowed())id=hasParentAccess()?'advanced':'parent';
 if(id==='parent'){
  const access=hasParentAccess();renderParentGate();$('parentGate').hidden=access;$('parentContent').hidden=!access;
  if(!access)$('parentGateMsg').textContent=readParentAuth()?'Unlock with the family PIN to open parent areas.':'Set up a family PIN to open parent areas.'
 }
 if(PARENT_ONLY_SCREENS.has(id)&&!hasParentAccess()){
  id='parent';renderParentGate();$('parentGate').hidden=false;$('parentContent').hidden=true;$('parentGateMsg').textContent=readParentAuth()?'Unlock with the family PIN to open this screen.':'Set up a family PIN to open this screen.'
 }
 if(id==='practice'&&P().controls.requireParentForPractice&&!hasParentAccess()){
  id='parent';renderParentGate();$('parentGate').hidden=false;$('parentContent').hidden=true;$('parentGateMsg').textContent='Unlock parent controls to use Practice Lab.'
 }
 const active=document.querySelector('.screen.show')?.id;
 if(active==='game'&&id!=='game'){checkpointGameplayActivity({forceActive:true,reason:'navigation'});applyWorldTheme('')}
 document.querySelectorAll('.screen').forEach(x=>x.classList.remove('show'));$(id).classList.add('show');syncNavigationState(id);return requested===id
}
function syncNavigationState(id=document.querySelector('.screen.show')?.id||'home'){
 const parentContext=(id==='parent'||PARENT_ONLY_SCREENS.has(id))&&hasParentAccess();
 const childDock=$('childDock'),parentShell=$('parentShellNav');
 if(childDock)childDock.hidden=id==='parent'||PARENT_ONLY_SCREENS.has(id)||id==='timeup';
 if(parentShell)parentShell.hidden=!parentContext;
 const childTarget=WORLD_SCREENS.has(id)?'worlds':id==='bites'?'bites':id;
 childDock?.querySelectorAll('[data-screen]').forEach(button=>{
  const current=button.dataset.screen===childTarget;
  if(current)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
 });
 const parentTarget=['integrations','diagnostics','release','qa'].includes(id)?'advanced':id;
 parentShell?.querySelectorAll('[data-screen]').forEach(button=>{
  const current=button.dataset.screen===parentTarget;
  if(current)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
 });
 const presentationControl=$('parentPresentationControl'),presentationNote=$('parentPresentationNote');
 if(presentationControl)presentationControl.hidden=!parentContext;
 if(presentationNote)presentationNote.hidden=!parentContext;
 updateLandscapePrompt();
 renderFirstRun();
}
let CODE_BRIDGE=null;
let CODE_BRIDGE_PROGRAM='';
let CODE_BRIDGE_AWARDED='';
let CODE_BRIDGE_LESSON_ID='';
function codeBridge(){
 if(!CODE_BRIDGE&&window.BrainBiteCodeBridge?.createCodeBridge)CODE_BRIDGE=window.BrainBiteCodeBridge.createCodeBridge();
 return CODE_BRIDGE;
}
function renderCodeBridge(result){
 if(!result)return;
 $('codeBridgeState').textContent=JSON.stringify({...result.state,cursor:result.cursor,total:result.total,done:result.done},null,2);
 $('codeBridgeTrace').textContent=result.trace.length?result.trace.map(entry=>`${entry.index+1}. ${entry.command}${entry.amount==null?'':`(${entry.amount})`}`).join('\n'):'No commands run yet.';
}
function recordCodeBridgeCompletion(result,program){
 if(!result?.done||!result.state.bridgeOpen)return false;
 const signature=checksum(program);
 if(CODE_BRIDGE_AWARDED===signature)return false;
 CODE_BRIDGE_AWARDED=signature;
 const outcome=updateSkill('coding-bridge',true,{attemptId:`code-bridge-${signature}`,independent:true,assisted:false,responseTimeMs:Math.max(1000,(result.trace.length||1)*800),source:'code-bridge'});
 if(outcome&&!outcome.contentQuarantined&&CODE_BRIDGE_LESSON_ID){P().codeBridgeLessons={...(P().codeBridgeLessons||{}),[CODE_BRIDGE_LESSON_ID]:{masteryScore:100,completedAt:Date.now()}}}
 void persistCanonicalState();
 return !outcome?.contentQuarantined;
}
function progression(profile=P()){profile.progression=REGISTRY.normalizeProgression(profile.progression);return profile.progression}
function prog(world){return progression().completedMissionIds.filter(id=>REGISTRY.getMission(id)?.world===world).length}

function skillRec(skill){if(!P().skills[skill])P().skills[skill]={mastery:10,streak:0,lastSeen:null,nextReview:null};return P().skills[skill]}
function updateSkill(skill,correct,meta={}){
 const c=core(),profile=P(),now=Date.now();
 if(c){
  let learner=ensureProfileLearningCore(profile);
  const responseTimeMs=Math.max(0,Number(meta.responseTimeMs)||now-(G?.lastAttemptAt||G?.startedAt||now));
  const attemptId=meta.attemptId||newCryptographicUuid();
  const origin=nextAttemptOrigin();
  const contentTelemetry=G?.contentControl?CONTENT_CONTROL.toTelemetryContext(G.contentControl):null;
  const attempt={id:attemptId,...origin,correct:!!correct,independent:meta.independent!==false&&!meta.assisted,assisted:!!meta.assisted,hintsUsed:Number(meta.hintsUsed)||0,responseTimeMs,randomLike:meta.randomLike===true||responseTimeMs<450,source:meta.source||'mission',homeworkMode:!!G?.homeworkMode,at:now,...(contentTelemetry||{})};
  if(G){G.outcomes=Array.isArray(G.outcomes)?G.outcomes:[...(G.outcomes||[])];G.outcomes.push(attempt);G.outcomes=G.outcomes.slice(-CONTENT_CONTROL.SUSPICIOUS_THRESHOLDS.windowAttempts)}
  const suspicion=G?CONTENT_CONTROL.quarantineSuspiciousOutcome(G.outcomes,{contentIdentity:contentTelemetry?.contentIdentity||null}):null;
  const freshReviewSignals=(suspicion?.reviewSignals||[]).filter(signal=>!(G?.reviewSignals||[]).includes(signal));
  if(G&&freshReviewSignals.length){
   G.reviewSignals=[...(G.reviewSignals||[]),...freshReviewSignals];
   const payload={...(contentTelemetry||{}),signals:freshReviewSignals,thresholds:suspicion.thresholds,action:'review-telemetry',learnerPunishment:'none'};
   learner=c.addTelemetry(learner,{id:newCryptographicUuid(),type:'ContentOutcomeObserved',createdAt:now,payload});
   learner=c.queueOfflineEvent(learner,{id:newCryptographicUuid(),type:'ContentOutcomeObserved',schemaVersion:STORE.schemaVersion,timestamp:now,payload});
  }
  const freshQualitySignals=(suspicion?.signals||[]).filter(signal=>!(G?.suspiciousSignals||[]).includes(signal));
  if(G&&freshQualitySignals.length){
   G.suspiciousSignals=[...(G.suspiciousSignals||[]),...freshQualitySignals];G.contentQuarantined=true;
   learner.contentQuarantine={...(learner.contentQuarantine||{}),[contentTelemetry.contentIdentity]:{quarantinedAt:now,signals:[...freshQualitySignals]}};
   const payload={...(contentTelemetry||{}),signals:freshQualitySignals,thresholds:suspicion.thresholds,action:suspicion.action,learnerPunishment:'none'};
   learner=c.addTelemetry(learner,{id:newCryptographicUuid(),type:'ContentOutcomeFlagged',createdAt:now,payload});
   learner=c.queueOfflineEvent(learner,{id:newCryptographicUuid(),type:'ContentOutcomeFlagged',schemaVersion:STORE.schemaVersion,timestamp:now,payload});
   profile.learningCore=learner;projectLearningCore(profile);G.lastAttemptAt=now;void persistCanonicalState();
   return {...profile.skills[skill],contentQuarantined:true}
  }
  if(G?.contentQuarantined)return {...profile.skills[skill],contentQuarantined:true};
  learner=attempt.source==='homework'?c.recordHomeworkAttempt(learner,skill,attempt,{id:skill}):c.recordLearnerAttempt(learner,skill,attempt,{id:skill});
  const recentAttempt=learner.skills?.[skill]?.recentPerformance?.at?.(-1)||learner.skills?.[skill]?.recentPerformance?.[learner.skills?.[skill]?.recentPerformance?.length-1];
  if(recentAttempt?.id===attemptId&&contentTelemetry)Object.assign(recentAttempt,contentTelemetry);
  if(contentTelemetry)learner=c.addTelemetry(learner,{id:newCryptographicUuid(),type:'ContentAttemptRecorded',createdAt:now,payload:{...contentTelemetry,attemptId,skillId:skill,correct:!!correct,assisted:attempt.assisted,hintsUsed:attempt.hintsUsed,responseTimeMs}});
   // Cloud-visible events stay unlinkable; provenance remains in the local
   // canonical ledger used for exact cross-device evidence merging.
   learner=c.queueOfflineEvent(learner,{id:newCryptographicUuid(),type:'LearningAttemptRecorded',schemaVersion:STORE.schemaVersion,timestamp:now,payload:{...((contentTelemetry)||{}),skillId:skill,attemptId,correct:!!correct,independent:attempt.independent,assisted:attempt.assisted,hintsUsed:attempt.hintsUsed,responseTimeMs,randomLike:attempt.randomLike,source:attempt.source,homeworkMode:!!G?.homeworkMode}});
  profile.learningCore=learner;
  projectLearningCore(profile);
  if(G)G.lastAttemptAt=now;
  window.dispatchEvent(new CustomEvent('bb:bit-event',{detail:{event:correct?'correct':'mistake',skillId:skill}}));
  return profile.skills[skill];
 }
 const r=skillRec(skill);r.lastSeen=now;
 if(correct){r.streak++;r.mastery=Math.min(100,r.mastery+2);r.nextReview=now+(r.streak>=3?REVIEW_MS.mastered:r.streak===2?REVIEW_MS.second:REVIEW_MS.first)}
 else{r.streak=0;r.mastery=Math.max(0,r.mastery-2);r.nextReview=now+REVIEW_MS.first}
  window.dispatchEvent(new CustomEvent('bb:bit-event',{detail:{event:correct?'correct':'mistake',skillId:skill}}));
  return r
}
function dueSkills(){return Object.entries(P().skills).filter(([k,v])=>v.nextReview&&v.nextReview<=Date.now()).map(([k,v])=>({skill:k,...v}))}
function recommended(){
 const all=Object.entries(P().skills);
 if(!all.length)return null;
 return all.sort((a,b)=>(a[1].mastery||0)-(b[1].mastery||0))[0][0];
}
function lowEndDevice(){
 const memory=Number(navigator.deviceMemory||0);
 const cores=Number(navigator.hardwareConcurrency||0);
 return (memory>0&&memory<=4)||(cores>0&&cores<=4);
}
function worldMeta(world){
 const data=REGISTRY.getWorld(world)||WORLDS[0];
 return {title:data.name,tag:data.tag,art:data.art,accent:data.accent,summary:data.summary,bosses:data.bossIds.map(id=>REGISTRY.bosses.find(boss=>boss.id===id)?.name).filter(Boolean)};
}
function biteArtForName(name){
 const map={Nib:'assets/art/nib.svg',Zip:'assets/art/zip.svg',Bloop:'assets/art/bloop.svg',Scout:'assets/art/scout.svg'};
 return map[name]||map.Nib;
}
function profileLevel(){
 return Math.max(1,Math.floor((P().score||0)/300)+1);
}
function profileXp(){
 const score=Math.max(0,P().score||0);
 const current=score%300;
 return {current,max:300,percent:Math.max(0,Math.min(100,Math.round(current/3)))};
}
function streakCount(){
 const seen=new Set((P().sessions||[]).slice(-30).map(s=>new Date(s.ts).toDateString()));
 const cutoff=Date.now()-7*24*60*60*1000;
 return [...seen].filter(day=>new Date(day).getTime()>=cutoff).length;
}
function nextRewardState(){
 const score=Math.max(0,P().score||0);
 const remainder=score%500;
 const remaining=remainder===0?500:500-remainder;
 return {remaining,percent:Math.max(0,Math.min(100,Math.round((remainder/500)*100)))};
}
function currentGoalState(){
 const profile=P();
 const state=progression(profile);
 const mission=REGISTRY.getMission(state.lastMissionId)||MISSIONS[0];
 const missions=state.completedMissionIds.length;
 const progress=missions%5;
 const remaining=progress===0?5:5-progress;
 return {world:worldMeta(mission?.world||'math').title,remaining,total:5,progress:Math.round((progress/5)*100)};
}
function worldLabelFor(world){return worldMeta(world).title.toUpperCase();}
// UI Phase 3.1: an illustrated route instead of a grid of dots. A dirt path winds through
// the world's missions; finished nodes show a check, the current one a pin, the boss its
// badge, and a chest waits after the boss. The text label carries the same information.
const MINIMAP_POINTS=[[18,100],[42,86],[66,98],[92,84],[112,62],[90,44],[64,52],[40,38],[62,20],[96,18]];
function svgEl(name,attrs={},children=[]){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));children.forEach(child=>el.appendChild(child));return el}
function renderMinimap(mission){
 const title=$('minimapTitle'),nodes=$('minimapNodes');
 if(!title||!nodes)return;
 const world=mission?.world;
 const worldDefinition=world?REGISTRY.getWorld(world):null;
 const ids=worldDefinition?.missionIds||[];
 const completed=progression().completedMissionIds;
 title.textContent=world?worldMeta(world).title:'Jungle Circuit';
 nodes.replaceChildren();
 if(!ids.length){nodes.setAttribute('aria-label','Mission route map');return}
 const done=ids.filter(id=>completed.includes(id)).length;
 const points=ids.map((_,i)=>MINIMAP_POINTS[i]||[20+(i%5)*20,100-Math.floor(i/5)*40]);
 const chest=[124,26];
 const d=[...points,chest].map(([x,y],i,all)=>{if(!i)return `M${x} ${y}`;const [px,py]=all[i-1];const mx=(px+x)/2;return `Q${mx} ${py} ${x} ${y}`}).join(' ');
 const svg=svgEl('svg',{viewBox:'0 0 140 120',class:'mm-svg','aria-hidden':'true',focusable:'false'},[
  svgEl('rect',{x:0,y:0,width:140,height:120,rx:12,fill:'#1d4d32'}),
  svgEl('ellipse',{cx:30,cy:30,rx:34,ry:22,fill:'#2f6b3f'}),svgEl('ellipse',{cx:118,cy:92,rx:30,ry:24,fill:'#2f6b3f'}),
  svgEl('ellipse',{cx:74,cy:70,rx:26,ry:14,fill:'#2a7f93','fill-opacity':'.75'}),
  svgEl('path',{d,fill:'none',stroke:'#6b4d2a','stroke-width':12,'stroke-linecap':'round','stroke-linejoin':'round'}),
  svgEl('path',{d,fill:'none',stroke:'#c9a36a','stroke-width':8,'stroke-linecap':'round','stroke-linejoin':'round'}),
 ]);
 const node=(x,y,kind)=>{
  const g=svgEl('g',{class:`mm-node-svg mm-${kind}`,transform:`translate(${x} ${y})`});
  if(kind==='done'){g.append(svgEl('circle',{r:6.5,fill:'#3fbf5f',stroke:'#0b3d1c','stroke-width':1.5}),svgEl('path',{d:'M-3 0 L-1 2.6 L3.2 -2.4',fill:'none',stroke:'#fff','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'}))}
  else if(kind==='here'){g.append(svgEl('path',{d:'M0 3 C-5 -3 -6 -6 -6 -9 A6 6 0 1 1 6 -9 C6 -6 5 -3 0 3 Z',fill:'#38bdf8',stroke:'#0c4a6e','stroke-width':1.5}),svgEl('circle',{cy:-9,r:2.4,fill:'#fff'}))}
  else if(kind==='boss'){g.append(svgEl('circle',{r:7.5,fill:'#8b5cf6',stroke:'#3b0764','stroke-width':1.5}),svgEl('circle',{cx:-2.4,cy:-1.5,r:1.4,fill:'#fff'}),svgEl('circle',{cx:2.4,cy:-1.5,r:1.4,fill:'#fff'}),svgEl('path',{d:'M-4 3.5 Q-2 5.5 0 3.5 Q2 5.5 4 3.5',fill:'none',stroke:'#fff','stroke-width':1.2}))}
  else if(kind==='chest'){g.append(svgEl('rect',{x:-7,y:-5,width:14,height:10,rx:2,fill:'#b7791f',stroke:'#5b3a1a','stroke-width':1.5}),svgEl('rect',{x:-7,y:-5,width:14,height:4,rx:2,fill:'#d69e2e'}),svgEl('rect',{x:-1.5,y:-2,width:3,height:3,fill:'#fde68a'}))}
  else{g.append(svgEl('circle',{r:5,fill:'#94a3b8',stroke:'#334155','stroke-width':1.5}))}
  return g;
 };
 ids.forEach((id,index)=>{
  const definition=REGISTRY.getMission(id);
  const isDone=completed.includes(id),isHere=id===mission?.id,isBoss=!!definition?.boss;
  const kind=isHere?'here':isDone?'done':isBoss?'boss':'locked';
  const g=node(...points[index],kind);
  g.appendChild(svgEl('title',{},[document.createTextNode(`${id}. ${definition?.title||'Mission'}${isDone?' (complete)':isHere?' (current)':' (locked)'}`)]));
  svg.appendChild(g);
 });
 svg.appendChild(node(...chest,'chest'));
 nodes.appendChild(svg);
 const next=ids.find(id=>!completed.includes(id));
 nodes.setAttribute('aria-label',`${title.textContent} route: ${done} of ${ids.length} missions complete${mission?`, current mission ${mission.id}`:''}${next&&next!==mission?.id?`, next mission ${next}`:''}`);
}
function missionStatus(world,id){
 const profile=P();
 if(progression(profile).completedMissionIds.includes(id))return 'complete';
 if(unlocked(REGISTRY.getMission(id)))return 'available';
 return 'locked';
}
function renderWorldShowcase(){
 const slot=$('worldShowcase');
 if(!slot)return;
 slot.innerHTML=WORLDS.map(({id:world})=>{
  const meta=worldMeta(world);
  const done=prog(world);
  const total=REGISTRY.getWorld(world).missionIds.length;
  const bossDone=MISSIONS.filter(m=>m.world===world&&m.boss&&progression().completedMissionIds.includes(m.id)).length;
  return `
   <button class="world-card world-${world}" data-screen="${world}" aria-label="Open ${meta.title} showcase">
     <img src="${meta.art}" alt="${meta.title}">
     <div>
       <p class="world-tag">${meta.tag}</p>
       <h3>${meta.title}</h3>
       <p>${meta.summary}</p>
       <p class="world-progress">${done}/${total} missions · ${bossDone}/${meta.bosses.length} bosses</p>
     </div>
   </button>
  `;
 }).join('');
 slot.querySelectorAll('[data-screen]').forEach(button=>button.onclick=()=>show(button.dataset.screen));
}
function applyWorldTheme(world){
 const root=document.documentElement;
 root.classList.remove('world-math','world-words','world-spanish','world-none');
 root.classList.add(world?`world-${world}`:'world-none');
 const bite=$('homeBite');
 if(bite)bite.src=biteArtForName(P().bite);
}
function unlockBites(){
 BITES.forEach(b=>{if(P().stars>=b.unlockStars&&!P().unlockedBites.includes(b.name))P().unlockedBites.push(b.name)})
}
function renderBites(){
 const c=$('biteCards');if(!c)return;c.innerHTML='';
 BITES.forEach(b=>{const on=P().unlockedBites.includes(b.name),d=document.createElement('div');d.className='panel bite-card-option'+(P().bite===b.name?' selected':'')+(on?'':' locked');d.innerHTML=`<h3>${b.emoji} ${b.name}</h3><p>${on?'Unlocked':`Unlock at ${b.unlockStars} stars`}</p><button ${on?'':'disabled'}>${P().bite===b.name?'Selected':'Select'}</button>`;if(on)d.querySelector('button').onclick=()=>{P().bite=b.name;save()};c.appendChild(d)});
 $('sparkCount').textContent=P().spark||0;const s=$('shopList');s.innerHTML='';SHOP.forEach(i=>{const owned=P().cosmetics.includes(i.id),d=document.createElement('div');d.className='shop-row';d.innerHTML=`<div><b>${i.name}</b><div>${i.cost} Spark</div></div><button>${P().equippedCosmetic===i.id?'Equipped':owned?'Equip':'Buy'}</button>`;d.querySelector('button').onclick=()=>{if(P().equippedCosmetic===i.id)return;if(owned){P().equippedCosmetic=i.id;save();return}if(P().spark<i.cost){alert('Not enough Spark yet.');return}P().spark-=i.cost;P().cosmetics.push(i.id);P().equippedCosmetic=i.id;save()};s.appendChild(d)})
 renderBitEditor();
 renderBitLessons();
}
function renderBitLessons(){
 const host=$('bites');if(!host||!window.BrainBiteProgrammableBitCurriculum)return;
 let panel=$('bitLessonPanel');if(!panel){panel=document.createElement('div');panel.id='bitLessonPanel';panel.className='panel bit-editor-panel';host.appendChild(panel)}
 panel.replaceChildren();const title=document.createElement('h3');title.textContent='Bit Behavior Lessons';panel.appendChild(title);
 const mode=currentContentGateMode();const status=document.createElement('p');status.setAttribute('role','status');status.textContent=mode==='production'?'Lessons are awaiting educator review before production release.':'Internal review lessons only; saving a lesson updates the editor, not mastery.';panel.appendChild(status);if(mode==='production')return;
 const states=P().programmableBitLessons||{};const lessons=window.BrainBiteProgrammableBitCurriculum.availableLessons(states);const select=document.createElement('select');select.id='bitLessonSelect';select.setAttribute('aria-label','Bit lesson');lessons.forEach(lesson=>{const option=document.createElement('option');option.value=lesson.id;option.textContent=lesson.title;select.appendChild(option)});panel.appendChild(select);
 const load=document.createElement('button');load.id='loadBitLesson';load.type='button';load.textContent='Load Lesson';panel.appendChild(load);const feedback=document.createElement('p');feedback.id='bitLessonFeedback';feedback.setAttribute('role','status');feedback.textContent=lessons.length?'Choose a lesson to load into the editor.':'Complete the current reviewed lesson before continuing.';panel.appendChild(feedback);
 load.disabled=!lessons.length;load.onclick=()=>{const lesson=lessons.find(item=>item.id===select.value);if(!lesson)return;const bitId=P().activeProgrammableBitId||'spark-bit';const id=$('bitEditorId'),field=$('bitAction-'+lesson.targetEvent);if(id)id.value=bitId;if(field)field.value=lesson.behaviorSteps.map(step=>typeof step==='string'?step:step.type==='move'?`move(${step.amount})`:step.type).join(', ');feedback.textContent=`Loaded ${lesson.title}. Save the editor to keep this behavior.`};
}
function renderBitEditor(){
 const host=$('bites');if(!host||!window.BrainBiteBits)return;
 let panel=$('bitEditorPanel');
 if(!panel){panel=document.createElement('div');panel.id='bitEditorPanel';panel.className='panel bit-editor-panel';host.appendChild(panel)}
 panel.replaceChildren();
 const title=document.createElement('h3');title.textContent='Build a Programmable Bit';panel.appendChild(title);
 const help=document.createElement('p');help.textContent='Choose safe reactions for your Bit. Actions are local, bounded, and never execute JavaScript.';panel.appendChild(help);
 const idLabel=document.createElement('label');idLabel.textContent='Bit name ';const idInput=document.createElement('input');idInput.id='bitEditorId';idInput.value='spark-bit';idInput.maxLength=32;idLabel.appendChild(idInput);panel.appendChild(idLabel);
 const fields={};for(const event of ['correct','mistake','collect']){const label=document.createElement('label');label.textContent=`${event} actions `;const input=document.createElement('input');input.id=`bitAction-${event}`;input.placeholder='glow, cheer, move(1)';input.maxLength=100;label.appendChild(input);fields[event]=input;panel.appendChild(label)}
 const activeLabel=document.createElement('label');activeLabel.textContent='Active Bit ';const activeSelect=document.createElement('select');activeSelect.id='bitActiveId';activeSelect.setAttribute('aria-label','Active Bit');activeLabel.appendChild(activeSelect);panel.appendChild(activeLabel);
 const actions=document.createElement('div');actions.className='code-bridge-actions';const saveButton=document.createElement('button');saveButton.id='saveBit';saveButton.textContent='Save Bit';const runButton=document.createElement('button');runButton.id='runBitEvent';runButton.textContent='Test Correct';const resetButton=document.createElement('button');resetButton.id='resetBit';resetButton.textContent='Reset';actions.append(saveButton,runButton,resetButton);panel.appendChild(actions);
 const feedback=document.createElement('p');feedback.id='bitEditorFeedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.textContent='Ready.';panel.appendChild(feedback);const output=document.createElement('pre');output.id='bitEditorState';output.className='code-bridge-output';panel.appendChild(output);
 const getBehavior=()=>Object.fromEntries(Object.entries(fields).map(([event,input])=>[event,input.value.split(',').map(value=>value.trim()).filter(Boolean)]));
 const saved=sanitizeProgrammableBits(P().programmableBits);P().programmableBits=saved;Object.keys(saved).forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=id;activeSelect.appendChild(option)});const first=saved[P().activeProgrammableBitId]||Object.values(saved)[0];activeSelect.value=first?.id||'';activeSelect.disabled=!first;activeSelect.onchange=()=>{P().activeProgrammableBitId=activeSelect.value||null;P().updatedAt=Date.now();void persistCanonicalState();renderBitEditor()};if(first){idInput.value=first.id;for(const event of Object.keys(fields))fields[event].value=(first.behavior?.[event]||[]).map(action=>action.type==='move'?`move(${action.amount})`:action.type).join(', ')}
 saveButton.onclick=()=>{try{const bit=window.BrainBiteBits.createBit({id:idInput.value,name:idInput.value,behavior:getBehavior()});P().programmableBits={...(P().programmableBits||{}),[bit.id]:bit};P().activeProgrammableBitId=bit.id;if(![...activeSelect.options].some(option=>option.value===bit.id)){const option=document.createElement('option');option.value=bit.id;option.textContent=bit.id;activeSelect.appendChild(option)}activeSelect.disabled=false;activeSelect.value=bit.id;P().updatedAt=Date.now();queueSyncEvent({type:'store-update',profileId:P()?.id||null,payload:{active:STORE.active,schemaVersion:STORE.schemaVersion},schemaVersion:STORE.schemaVersion,ts:Date.now()});void persistCanonicalState();feedback.textContent='Bit saved to this profile.';output.textContent=JSON.stringify(bit,null,2)}catch(error){feedback.textContent=`Bit rejected: ${error.message}`}};
 runButton.onclick=()=>{try{const bit=window.BrainBiteBits.createBit({id:idInput.value,name:idInput.value,behavior:getBehavior()});const runtime=window.BrainBiteBits.createBitRuntime(bit);const result=runtime.trigger('correct');feedback.textContent='Correct reaction simulated.';output.textContent=JSON.stringify(result,null,2)}catch(error){feedback.textContent=`Simulation stopped safely: ${error.message}`}};
 resetButton.onclick=()=>{output.textContent='';feedback.textContent='Bit editor reset.';for(const input of Object.values(fields))input.value=''};
}
document.querySelectorAll('[data-screen="bites"]').forEach(button=>button.addEventListener('click',()=>renderBites()));
window.addEventListener('load',()=>{if(window.BrainBiteBits)renderBites()});
function parentDashboardSummary(){
 const c=core(),learner=c?ensureProfileLearningCore(P()):null;
 if(c&&learner){
  const taxonomy=c.createCurriculumTaxonomy();
  const known=new Set(taxonomy.skills.map(skill=>skill.id));
  for(const mission of MISSIONS)if(!known.has(mission.skill)){
   taxonomy.skills.push({id:mission.skill,name:mission.title,subject:mission.world,grade:null,domain:`mission:${mission.world}`,prerequisites:[],supportedActivityTypes:[mission.activityFamily],representations:['gameplay'],hint:mission.prompt,canonical:false,source:'mission-registry'});
   known.add(mission.skill);
  }
  const insights=c.buildParentInsights(learner,taxonomy);
  const homework=(learner.practice||[]).filter(item=>item.homework||item.type==='homework');
  return {
   weekly:{sessions:insights.weeklySummary.sessions,avgAccuracy:insights.weeklySummary.avgAccuracy,practice:insights.weeklySummary.practiceItems,homework:insights.weeklySummary.homework,improvements:insights.improving.length},
   priority:insights.priority.map(item=>({skill:item.name||item.skillId,skillId:item.skillId,mastery:item.masteryScore,streak:projectedStreak(learner.skills?.[item.skillId]),nextReview:learner.skills?.[item.skillId]?.nextReviewAt||null,reason:item.reason,confidence:item.confidence})),
   homework,
   insights,
  };
 }
 const skills=Object.entries(P().skills||{}).map(([skill,meta])=>({skill,mastery:meta.mastery||0,streak:meta.streak||0,nextReview:meta.nextReview||null,lastSeen:meta.lastSeen||0}));
 const weekAgo=Date.now()-7*24*60*60*1000;
 const weeklySessions=(P().sessions||[]).filter(s=>s.ts>=weekAgo);
 const weeklyPractice=(P().practice||[]).filter(p=>p.ts>=weekAgo);
 const avgAccuracy=weeklySessions.length?Math.round(weeklySessions.reduce((sum,s)=>sum+(s.accuracy||0),0)/weeklySessions.length):null;
 const homework=weeklyPractice.filter(p=>p.homework||p.type==='homework');
 const priority=[...skills].sort((a,b)=>a.mastery-b.mastery||a.streak-b.streak).slice(0,4);
 const improvements=skills.filter(s=>s.lastSeen>=weekAgo).length;
 return {
  weekly:{sessions:weeklySessions.length,avgAccuracy,practice:weeklyPractice.length,homework:homework.length,improvements},
  priority,
  homework,
 };
}
function renderParent(){
 const rs=recommended();$('recommendedSkill').textContent=rs?`Focus next: ${rs}`:'Play more missions to generate a recommendation.';
 const due=dueSkills(),memoryDue=$('memoryDue');memoryDue.replaceChildren();if(due.length)due.forEach(x=>{const chip=document.createElement('span');chip.className='memory-chip';chip.textContent=String(x.skill||'skill');memoryDue.appendChild(chip)});else memoryDue.textContent='No Memory Drops due right now.';
 const summary=parentDashboardSummary();
 $('weeklySummary').innerHTML=`<div>Sessions this week: <b>${summary.weekly.sessions}</b></div><div>Avg accuracy: <b>${summary.weekly.avgAccuracy==null?'n/a':summary.weekly.avgAccuracy+'%'}</b></div><div>Practice items: <b>${summary.weekly.practice}</b></div><div>Homework items: <b>${summary.weekly.homework}</b></div><div>Recent skills touched: <b>${summary.weekly.improvements}</b></div>`;
 const priority=$('skillPriority');priority.replaceChildren();if(summary.priority.length)summary.priority.forEach(x=>{const row=document.createElement('div');row.textContent=`${String(x.skill||'skill')} · mastery ${Math.round(x.mastery)}%${x.nextReview&&x.nextReview<=Date.now()?' · due':''}`;priority.appendChild(row)});else priority.textContent='No skill priority yet.';
 const homeworkSummary=$('homeworkSummary');homeworkSummary.replaceChildren();
 if(summary.homework.length)summary.homework.slice(-5).reverse().forEach(x=>{const row=document.createElement('div');row.textContent=`${x.subject}${x.grade?` grade ${x.grade}`:''} · ${x.topic||'practice'}${x.homework?' · homework':''}`;homeworkSummary.appendChild(row)});
 else homeworkSummary.textContent='No homework practice recorded yet.';
}

function renderLaunchHint(){
 const el=$('launchHint');
 if(!el)return;
 const profile=P();
 const tier=profile.settings.qualityTier||'balanced';
 const lowEnd=lowEndDevice();
 const firstRun=progression(profile).completedMissionIds.length===0;
 el.textContent=firstRun
  ? 'Tap PLAY to start your first adventure!'
  : 'Tap PLAY to keep going!';
 // Device advice is for grown-ups: it lives in Parents → Advanced, not on the child's home.
 const hint=$('deviceHint');
 if(hint){const show=lowEnd&&tier==='balanced';hint.hidden=!show;hint.textContent=show?'This device may feel smoother on Performance mode (Settings → Quality tier).':''}
}



function launchChecks(){
 const checks=[];
 checks.push(['30 missions loaded',MISSIONS.length===30]);
 checks.push(['3 bosses loaded',MISSIONS.filter(m=>m.boss).length===3]);
 checks.push(['Profiles exist',STORE.profiles.length>0]);
 checks.push(['Save schema current',STORE.schemaVersion===8]);
 checks.push(['Service worker support','serviceWorker'in navigator]);
 checks.push(['Firebase configured',INTEGRATIONS.cloud.provider==='firebase'&&/^[a-z0-9-]{6,}$/.test(INTEGRATIONS.cloud.url)&&INTEGRATIONS.cloud.key.length>=20]);
 checks.push(['Firebase signed in',!!cloudClient()?.session]);
 checks.push(['Privacy page linked',true]);
 checks.push(['Terms page linked',true]);
 return checks
}

function selfCheck(){
 const results=[];
 results.push(['Save schema',STORE.schemaVersion===8]);
 results.push(['Profiles',Array.isArray(STORE.profiles)&&STORE.profiles.length>0]);
 results.push(['30 missions',MISSIONS.length===30]);
 results.push(['Math boss',!!MISSIONS.find(m=>m.id===10&&m.boss)]);
 results.push(['Word boss',!!MISSIONS.find(m=>m.id===20&&m.boss)]);
 results.push(['Spanish boss',!!MISSIONS.find(m=>m.id===30&&m.boss)]);
 results.push(['Service worker', 'serviceWorker' in navigator]);
 results.push(['Local storage',(()=>{try{localStorage.setItem('__bbtest','1');localStorage.removeItem('__bbtest');return true}catch{return false}})()]);results.push(['Conflict merge',testConflictMerge()]);results.push(['Versioned export envelope',validateEnvelope(exportEnvelope())]);
 return results;
}
function renderDiagnostics(){
 if(!$('diagSave'))return;
 $('diagSave').innerHTML=`<span class="${STORE.schemaVersion===SCHEMA_VERSION?'diag-ok':'diag-warn'}">Schema v${STORE.schemaVersion||'?'}</span>`;
 const issueRows=$('diagIssues');
 if(issueRows){
  const issues=recentDiagnostics().slice(-6).reverse();
  issueRows.replaceChildren();
  if(issues.length)issues.forEach(entry=>{const row=document.createElement('div');row.textContent=`${new Date(entry.ts).toLocaleTimeString()} · ${entry.type} · ${entry.message}`;issueRows.appendChild(row)});
  else issueRows.textContent='No local issues recorded.';
 }
 $('diagOffline').innerHTML=`<span class="${'serviceWorker'in navigator?'diag-ok':'diag-warn'}">${'serviceWorker'in navigator?'Service worker supported':'Service worker unavailable'}</span>`;
 $('diagAudio').innerHTML=`<span class="${audioContext()?'diag-ok':'diag-warn'}">${audioContext()?'WebAudio ready':'WebAudio unavailable'}</span>`;
 const ss=P().sessions.slice(-8).reverse(),sessionRows=$('diagSessions');sessionRows.replaceChildren();if(ss.length)ss.forEach(s=>{const row=document.createElement('div');row.textContent=`${new Date(Number(s.ts)||0).toLocaleString()} · Mission ${String(s.mission??'')} · combo ${String(s.combo??'')}${s.accuracy!=null?` · ${String(s.accuracy)}%`:''}`;sessionRows.appendChild(row)});else sessionRows.textContent='No completed sessions yet.';
 const blockers=[
   ['Authenticated cloud sync/backend',INTEGRATIONS.cloud.provider==='firebase'&&!!cloudClient()?.session],
   ['Final production audio/music assets',false],
   ['Educator curriculum review',false],
   ['Fluent-speaker language review',false],
   ['Broad real-device accessibility QA',false],
   ['Core 30-mission app',true],
   ['Profiles / parent / recovery',true],
   ['Offline PWA shell',true],['Local sync queue/conflict-ready layer',true],['Generated beta audio assets',true]
 ];
 $('releaseBlockers').innerHTML=blockers.map(([n,ok])=>`<div><span class="${ok?'diag-ok':'diag-warn'}">${ok?'✓':'○'}</span> ${n}</div>`).join('');
}


function usageTodayMinutes(){const authoritative=readTimeToday();if(authoritative!=null)return Math.round(authoritative/60000);const day=new Date().toDateString(),sessions=(P().sessions||[]).filter(s=>new Date(s.ts).toDateString()===day),secs=sessions.reduce((a,s)=>a+(s.durationSec||0),0);return Math.round(secs/60)}
function renderControls(){
 if(!$('dailyMinutes'))return;
 const c=P().controls;$('dailyMinutes').value=c.dailyMinutes;$('maxSessionMinutes').value=c.maxSessionMinutes;$('requireParentForPractice').checked=c.requireParentForPractice;
 const used=usageTodayMinutes();$('todayUsage').textContent=`${used} minutes played`;
 const state=timeLimitState();$('sessionLimitStatus').innerHTML=state.expired?'<span class=limit-stop>Play limit reached.</span>':state.dailyRemainingMs<=5*60000?'<span class=limit-warn>Close to the daily play limit.</span>':'Within the daily play limit.';
 if($('timeLedgerWarning')){$('timeLedgerWarning').textContent=TIME_USAGE_WARNING;$('timeLedgerWarning').hidden=!TIME_USAGE_WARNING}
}


function finalGateRows(){
 return [
 ['30 missions + 3 bosses',MISSIONS.length===30&&MISSIONS.filter(m=>m.boss).length===3,'app'],
 ['Profiles / parent controls / recovery',STORE.profiles.length>0,'app'],
 ['PWA + offline service worker','serviceWorker'in navigator,'app'],
 ['Firebase configured',INTEGRATIONS.cloud.provider==='firebase'&&/^[a-z0-9-]{6,}$/.test(INTEGRATIONS.cloud.url)&&INTEGRATIONS.cloud.key.length>=20,'external'],
 ['Firebase parent signed in',!!cloudClient()?.session,'external'],
 ['Educator curriculum review',false,'human'],
 ['Fluent-speaker Spanish review',false,'human'],
 ['Legal/privacy review',false,'human'],
 ['Two-device cloud sync QA',!!QA.deviceAPushed&&!!QA.deviceBPulled,'external'],['Real-device accessibility QA',false,'human']
 ]
}
function renderRelease(){
 if(!$('finalGates'))return;
 const rows=finalGateRows();
 $('releaseFirebase').innerHTML=rows[3][1]?'<span class=release-pass>Configured</span>':'<span class=release-open>Open</span>';
 $('finalGates').innerHTML=rows.map(([n,ok,type])=>`<div><span class="${ok?'release-pass':type==='optional'?'release-open':'release-open'}">${ok?'✓':'○'}</span> ${n}</div>`).join('');
}
function diagnosticBundle(){
 return {generatedAt:new Date().toISOString(),version:'2.0.0',schemaVersion:STORE.schemaVersion,profiles:STORE.profiles.length,missionCount:MISSIONS.length,bossCount:MISSIONS.filter(m=>m.boss).length,recentIssues:recentDiagnostics(),sync:{provider:SYNC.provider,queue:SYNC.queue.length,lastSync:SYNC.lastSync},integrations:{cloudProvider:INTEGRATIONS.cloud.provider,cloudConfigured:INTEGRATIONS.cloud.provider==='firebase'&&!!INTEGRATIONS.cloud.url&&!!INTEGRATIONS.cloud.key},gates:finalGateRows().map(([name,pass,type])=>({name,pass,type}))}
}


const LAB_KEY='brainbite-v2-lab';
function labAllowed(){return globalThis.__BRAINBITE_LAB__===true&&currentContentGateMode()==='internal-review'}
function labState(){try{return JSON.parse(localStorage.getItem(LAB_KEY)||'null')||{skillId:'number-facts',family:'target-smash',difficulty:'normal',preset:'practicing',krakenPhase:'intro'}}catch{return {skillId:'number-facts',family:'target-smash',difficulty:'normal',preset:'practicing',krakenPhase:'intro'}}}
let LAB=labState();
function saveLab(){if(!labAllowed())return false;localStorage.setItem(LAB_KEY,JSON.stringify(LAB));renderLab();return true}
function core(){return window.BrainBiteCore||null}
let FOUNDATION_CACHE_MIGRATED=false;
function syncCoreSettings(profile,learner){
 const settings=profile.settings||{};
 learner.settings={...(learner.settings||{}),reducedMotion:!!settings.reducedMotion,highContrast:!!settings.highContrast,captions:!!settings.captions,cameraMotionReduction:!!settings.cameraMotionReduction,textScale:Number(settings.textScale)||1};
 return learner
}
function projectedStreak(skill){
 let streak=0;
 for(const attempt of [...(skill?.recentPerformance||[])].reverse()){
  if(!attempt.correct)break;
  streak++;
 }
 return streak
}
function legacyMasteryState(score){
 if(score>=60)return 'Developing';
 if(score>=35)return 'Practicing';
 if(score>0)return 'Introduced';
 return 'Unknown'
}
function displayMasterySkillIds(){
 const taxonomy=core()?.createCurriculumTaxonomy?.();
 const curriculumSkills=Array.isArray(taxonomy?.skills)?taxonomy.skills:[];
 const curriculumIds=subjects=>curriculumSkills.filter(skill=>subjects.has(skill.subject)).map(skill=>skill.id);
 const missionIds=world=>MISSIONS.filter(mission=>mission.world===world).map(mission=>mission.skill);
 return {
  math:new Set([...curriculumIds(new Set(['math'])),...missionIds('math')]),
  words:new Set([...curriculumIds(new Set(['reading','spelling','vocabulary','grammar'])),...missionIds('words')]),
  spanish:new Set(missionIds('spanish')),
 }
}
function ensureProfileLearningCore(profile){
 const c=core();if(!c||!profile)return null;
 let learner=profile.learningCore&&typeof profile.learningCore==='object'?structuredClone(profile.learningCore):c.defaultLearner(profile.name,profile.id);
 learner.profileId=profile.id;learner.name=profile.name;
 learner.practice=mergeHistory(learner.practice,profile.practice,100);
 learner.sessions=mergeHistory(learner.sessions,profile.sessions,100);
 if(!learner.legacyProjectionImportedAt){
  learner.skills=learner.skills||{};
  for(const [skillId,legacy] of Object.entries(profile.skills||{}))if(!learner.skills[skillId]){
   const masteryScore=Math.max(0,Math.min(100,Number(legacy?.mastery)||0));
   learner.skills[skillId]={...c.createSkillState(skillId,{id:skillId}),masteryScore,confidence:Math.min(.4,masteryScore/200),masteryState:legacyMasteryState(masteryScore),lastPracticedAt:Number(legacy?.lastSeen)||null,nextReviewAt:Number(legacy?.nextReview)||null,legacyImported:true};
   learner.mastery[skillId]=masteryScore;
  }
  learner.legacyProjectionImportedAt=Date.now();
 }
 return syncCoreSettings(profile,learner)
}
function projectLearningCore(profile,learner=profile?.learningCore){
 if(!profile||!learner)return profile;
 profile.learningCore=structuredClone(learner);
 profile.skills=Object.fromEntries(Object.entries(learner.skills||{}).map(([skillId,skill])=>[skillId,{mastery:Number(skill.masteryScore)||0,streak:projectedStreak(skill),lastSeen:skill.lastPracticedAt||null,nextReview:skill.nextReviewAt||null,masteryState:skill.masteryState,confidence:Number(skill.confidence)||0}]));
 profile.mastery=profile.mastery&&typeof profile.mastery==='object'?profile.mastery:{};
 for(const [display,skillIds] of Object.entries(displayMasterySkillIds())){
  const scores=Object.entries(learner.skills||{}).filter(([skillId])=>skillIds.has(skillId)).map(([,skill])=>Number(skill.masteryScore)||0);
  if(scores.length)profile.mastery[display]=Math.round(scores.reduce((sum,value)=>sum+value,0)/scores.length);
 }
 profile.practice=structuredClone(learner.practice||[]);
 profile.sessions=structuredClone(learner.sessions||[]);
 return profile
}
function recordPracticeItem(item){
 const profile=P(),learner=ensureProfileLearningCore(profile);
 if(!learner){profile.practice.push(item);return item}
 learner.practice=mergeHistory(learner.practice,[item],100);
 projectLearningCore(profile,learner);
 return item
}
function recordLearningSession(item){
 const profile=P(),learner=ensureProfileLearningCore(profile);
 if(!learner){profile.sessions.push(item);if(profile.sessions.length>30)profile.sessions.shift();return item}
 learner.sessions=mergeHistory(learner.sessions,[item],100);
 projectLearningCore(profile,learner);
 return item
}
function applyFoundationToProfiles(value,{write=true}={}){
 const c=core();if(!c)return null;
 const foundation=filterDeletedFoundationLearners(c.normalizeFoundationState(value,STORE));
 for(const learner of Object.values(foundation.learners||{})){
  let profile=STORE.profiles.find(item=>item.id===learner.profileId);
  if(!profile){profile=blank(learner.name);profile.id=learner.profileId;STORE.profiles.push(profile)}
  learner.name=profile.name;
   projectLearningCore(profile,learner);
  profile.settings={...profile.settings,reducedMotion:!!learner.settings.reducedMotion,highContrast:!!learner.settings.highContrast,captions:!!learner.settings.captions,cameraMotionReduction:!!learner.settings.cameraMotionReduction,textScale:String(learner.settings.textScale||1)};
 }
 const activeIndex=STORE.profiles.findIndex(profile=>profile.id===foundation.activeLearnerId);
 if(activeIndex>=0)STORE.active=activeIndex;
 if(write)writeStoreCopies(STORE);
 return foundationFromProfiles()
}
function migrateFoundationCache(){
 const c=core();if(!c||FOUNDATION_CACHE_MIGRATED)return;
 FOUNDATION_CACHE_MIGRATED=true;
 const keys=[c.STORAGE_KEY,c.BACKUP_KEY,c.RECOVERY_KEY].filter(Boolean);
 const activeProfileId=P()?.id,candidates=[];
 for(const key of keys){
  try{
   const raw=localStorage.getItem(key);if(!raw)continue;
   const parsed=JSON.parse(raw);if(!parsed?.learners||typeof parsed.learners!=='object'||!Object.keys(parsed.learners).length)continue;
   candidates.push(filterDeletedFoundationLearners(c.normalizeFoundationState(parsed,STORE)))
  }catch{}
 }
 for(const cached of candidates)for(const learner of Object.values(cached.learners||{})){
  let profile=STORE.profiles.find(item=>item.id===learner.profileId);
  if(!profile){profile=blank(learner.name);profile.id=learner.profileId;STORE.profiles.push(profile)}
  const localTime=Math.max(Number(profile.learningCore?.saveMeta?.lastSavedAt)||0,...Object.values(profile.learningCore?.skills||{}).map(skill=>Number(skill.lastPracticedAt)||0));
  const remoteTime=Math.max(Number(learner.saveMeta?.lastSavedAt)||0,...Object.values(learner.skills||{}).map(skill=>Number(skill.lastPracticedAt)||0));
  const merged=mergeLearningCore(profile.learningCore,learner,{preferRemote:!profile.learningCore||remoteTime>localTime});
  merged.name=profile.name;profile.learningCore=structuredClone(syncCoreSettings(profile,merged))
 }
 const activeIndex=STORE.profiles.findIndex(profile=>profile.id===activeProfileId);if(activeIndex>=0)STORE.active=activeIndex;
 if(candidates.length){keys.forEach(key=>localStorage.removeItem(key));writeStoreCopies(STORE)}
}
function foundationFromProfiles(){
 const c=core();if(!c)return null;
 migrateFoundationCache();
 const state=c.createFoundationState();
  for(const profile of STORE.profiles){
   const learner=ensureProfileLearningCore(profile);
   state.learners[profile.id]=structuredClone(learner)
  }
 state.activeLearnerId=P()?.id||Object.keys(state.learners)[0]||null;
 return c.normalizeFoundationState(state,STORE)
}
const FOUNDATION_STORAGE={
 getItem(key){const c=core();if(!c)return null;if(key===c.LEGACY_PROFILE_KEY)return JSON.stringify(STORE);if(key===c.STORAGE_KEY)return JSON.stringify(foundationFromProfiles());return null},
 setItem(key,value){const c=core();if(!c||key!==c.STORAGE_KEY)return null;try{return applyFoundationToProfiles(JSON.parse(value))}catch{return null}},
 removeItem(){}
};
function loadFoundation(){const c=core();if(!c)return null;try{return c.loadFoundationState(FOUNDATION_STORAGE,STORE)}catch{return foundationFromProfiles()||c.createFoundationState()}}
function renderBrainBase(state){const c=core(),root=$('brainbase-root'),preview=document.querySelector('.bb-world-gateway');if(preview)preview.hidden=!labAllowed();if(c&&root)c.renderBrainBaseShell(root,state||loadFoundation(),{storage:FOUNDATION_STORAGE,legacyStore:STORE})}
function persistFoundation(state){const c=core();if(!c)return null;c.persistFoundationState(state,FOUNDATION_STORAGE);const canonical=foundationFromProfiles();renderBrainBase(canonical);return canonical}
window.BrainBiteFoundationBridge={mount(root){const c=core();if(c&&root)c.mountBrainBiteFoundation(root,{storage:FOUNDATION_STORAGE,legacyStore:STORE})},load:loadFoundation,persist:persistFoundation};
function applyLabFoundation(mutator){const c=core();if(!c||!labAllowed())return null;let foundation=loadFoundation();if(!foundation)return null;const next=mutator(foundation)||foundation;const saved=persistFoundation(next);renderLab();return saved}
function labPresetState(preset, skillId){const c=core();const skill=c?.createSkillState(skillId)||{skillId};const now=Date.now();const presets={unknown:{masteryScore:0,confidence:0.08,evidence:{attempts:0,independentSuccesses:0,assistedSuccesses:0,hintsUsed:0,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:0},nextReviewAt:null,masteryState:'Unknown'},introduced:{masteryScore:14,confidence:0.18,evidence:{attempts:1,independentSuccesses:0,assistedSuccesses:1,hintsUsed:1,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:2800},nextReviewAt:now+20*60*1000,masteryState:'Introduced'},practicing:{masteryScore:34,confidence:0.34,evidence:{attempts:3,independentSuccesses:1,assistedSuccesses:1,hintsUsed:1,incorrectAttempts:1,rapidAttempts:0,responseTimeMsTotal:7600},nextReviewAt:now+35*60*1000,masteryState:'Practicing'},developing:{masteryScore:57,confidence:0.56,evidence:{attempts:5,independentSuccesses:2,assistedSuccesses:1,hintsUsed:0,incorrectAttempts:1,rapidAttempts:0,responseTimeMsTotal:11000},nextReviewAt:now+70*60*1000,masteryState:'Developing'},strong:{masteryScore:78,confidence:0.78,evidence:{attempts:7,independentSuccesses:4,assistedSuccesses:1,hintsUsed:0,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:14500},lastIndependentSuccessAt:now-60*60*1000,nextReviewAt:now+12*60*60*1000,masteryState:'Strong'},mastered:{masteryScore:94,confidence:0.9,evidence:{attempts:10,independentSuccesses:6,assistedSuccesses:1,hintsUsed:0,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:18000},lastIndependentSuccessAt:now-30*60*1000,nextReviewAt:now+3*24*60*60*1000,masteryState:'Mastered'}};return {...skill,...presets[preset]}}
function selectionForMode(challenge, mode){const wrong=challenge.distractors?.[0]??(challenge.choices||[]).find(x=>!(challenge.answers||[]).includes(x.value??x));if(challenge.family==='Target Smash'){const correct=challenge.answers||[];if(mode==='incorrect'||mode==='random')return [String(wrong?.value??wrong??'miss')];return correct.slice();}if(challenge.family==='Letter Trail'){const expected=challenge.targetSequence?.[challenge.revealed?.length||0];if(mode==='incorrect'||mode==='random')return String(challenge.distractors?.[0]||'X');return expected;}if(challenge.family==='Knowledge Platforms'){const expected=challenge.platformOrder?.[challenge.visited?.length||0];if(mode==='incorrect'||mode==='random')return String(challenge.distractors?.[0]||'Skip');return expected;}return null}
function simulateLabAttempt(mode){
 const c=core();if(!c||!labAllowed())return false;
 const skillId=$('labSkill')?.value||LAB.skillId||'number-facts';
 const requestedFamily=$('labFamily')?.value||LAB.family||'target-smash';
 const difficulty=$('labDifficulty')?.value||LAB.difficulty||'normal';
 const templateByLabSkill={'number-facts':'math-1-addition','word-order':'reading-1-decoding','fraction-meaning':'math-4-fractions'};
 const templateId=templateByLabSkill[skillId]||'math-1-addition',canonicalSkill=c.findCurriculumSkill(templateId);
 const family=canonicalSkill?.supportedActivityTypes?.includes(requestedFamily)?requestedFamily:canonicalSkill?.supportedActivityTypes?.[0];
 const approved=c.createApprovedCurriculumChallenge(templateId,{family,difficulty,seed:17}),challenge=approved.challenge;
 const gate=approved.approved?generatedChallengeGate(challenge,canonicalSkill,approved.validation):null;if(!gate?.approved)return false;
 const selection=selectionForMode(challenge,mode),meta={independent:mode!=='assisted',assisted:mode==='assisted',hintsUsed:mode==='assisted'?1:0,responseTimeMs:mode==='random'?430:mode==='incorrect'?2400:mode==='assisted'?2100:1200,randomLike:mode==='random'};
 let result;if(family==='Target Smash')result=c.resolveTargetSmashResult(challenge,selection,meta);else if(family==='Letter Trail')result=c.resolveLetterTrailChoice(challenge,selection,meta);else result=c.resolveKnowledgePlatformChoice(challenge,selection,meta);
 const telemetry=CONTENT_CONTROL.toTelemetryContext(gate);
 applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];learner.currentChallenge={...result.challenge,contentIdentity:gate.contentIdentity};const updated=c.recordLearnerAttempt(learner,skillId,result.attempt,{id:skillId});const attempt=updated.skills?.[skillId]?.recentPerformance?.at?.(-1);if(attempt)Object.assign(attempt,telemetry);foundation.learners[foundation.activeLearnerId]=updated});
 LAB.skillId=skillId;LAB.family=requestedFamily;LAB.difficulty=difficulty;saveLab();return true
}
function currentLabState(){const c=core();if(!c)return null;const foundation=loadFoundation();if(!foundation)return null;const learner=foundation.learners[foundation.activeLearnerId];return {c,foundation,learner}}
function fillLearnerSelect(select,learners,activeId){if(!select)return;const fragment=document.createDocumentFragment();Object.values(learners||{}).forEach(learner=>{const option=document.createElement('option');option.value=String(learner.profileId||'');option.textContent=String(learner.name||'Learner');option.selected=learner.profileId===activeId;fragment.appendChild(option)});select.replaceChildren(fragment)}
function renderLab(){if(!$('labInspect'))return;const nav=document.querySelector('[data-screen="qa"]');if(nav)nav.hidden=!labAllowed();if(!labAllowed()){$('qa').hidden=true;return}$('qa').hidden=false;const snapshot=currentLabState();if(!snapshot){$('labActiveLearner').textContent='BrainBiteCore loading…';$('labInspect').textContent='BrainBite foundation is not ready yet.';return}const {c,foundation,learner}=snapshot;const skillId=$('labSkill').value||LAB.skillId||'number-facts';const skill=learner.skills?.[skillId]||c.createSkillState(skillId);const review=skill.reviewHistory?.at?.(-1)||skill.reviewHistory?.[skill.reviewHistory.length-1]||null;$('labActiveLearner').textContent=`${learner.name} (${learner.profileId})`;$('labStage').textContent=`Stage: ${learner.stage} · Hub: ${learner.hub.variant}${learner.hub.expansionUnlocked?' · Expansion unlocked':''}`;$('labQueue').textContent=`Offline queue: ${learner.offlineQueue.length} · Sent: ${learner.sentEventIds.length}`;$('labMastery').textContent=`${skillId}: ${skill.masteryState} · score ${skill.masteryScore} · confidence ${(skill.confidence*100).toFixed(0)}%`;$('labReview').textContent=review?`Next review ${new Date(skill.nextReviewAt||review.nextReviewAt).toLocaleString()}`:'No review scheduled.';$('labHub').textContent=learner.hub.variant==='upgraded'?'Upgraded hub with expansion unlocked':'Starter hub';$('labRewards').textContent=`${learner.rewards.length} reward(s) · ${learner.rewards.map(r=>r.name).join(', ')||'None'}`;fillLearnerSelect($('labLearnerSelect'),foundation.learners,foundation.activeLearnerId);const summary={profileId:learner.profileId,name:learner.name,stage:learner.stage,hub:learner.hub,skill:{skillId,masteryState:skill.masteryState,masteryScore:skill.masteryScore,confidence:skill.confidence,evidence:skill.evidence,reviewHistory:skill.reviewHistory.slice(-4),nextReviewAt:skill.nextReviewAt},rewards:learner.rewards,offlineQueue:learner.offlineQueue,sentEventIds:learner.sentEventIds,contentCheck:c.validateContentBundle(c.createVerticalSliceContent())};const pre=document.createElement('pre');pre.className='lab-json';pre.textContent=JSON.stringify(summary,null,2);$('labInspect').innerHTML='';$('labInspect').appendChild(pre);const content=c.validateContentBundle(c.createVerticalSliceContent());$('labContentCheck').innerHTML=`<div class="${content.valid?'diag-ok':'diag-warn'}">${content.valid?'Content bundle valid':'Content bundle quarantined'}${content.quarantined.length?`: ${content.quarantined.join(', ')}`:''}</div>`;LAB.skillId=skillId;LAB.family=$('labFamily').value||LAB.family;LAB.difficulty=$('labDifficulty').value||LAB.difficulty;LAB.preset=$('labSkillPreset').value||LAB.preset;LAB.krakenPhase=$('labKrakenPhase').value||LAB.krakenPhase}

const QA_STORAGE='brainbite-v2-qa';
function qaState(){try{return JSON.parse(localStorage.getItem(QA_STORAGE)||'{}')}catch{return {}}}
let QA=qaState();
function saveQA(){localStorage.setItem(QA_STORAGE,JSON.stringify(QA));renderQA()}
function renderQA(){
 if(!$('twoDeviceChecklist'))return;
 const nav=document.querySelector('[data-screen="qa"]');if(nav)nav.hidden=!labAllowed();
 if(!labAllowed()){$('qa').hidden=true;$('labDeveloperTools')?.replaceChildren();return}
 $('qa').hidden=false;
 const lab=captureLabOverview();
 if($('labLearnerSelect'))$('labLearnerSelect').value=lab?.foundation?.activeLearnerId||'';
 if($('labSkill'))$('labSkill').value=LAB.skillId||$('labSkill').value;
 if($('labFamily'))$('labFamily').value=LAB.family||$('labFamily').value;
 if($('labDifficulty'))$('labDifficulty').value=LAB.difficulty||$('labDifficulty').value;
 if($('labSkillPreset'))$('labSkillPreset').value=LAB.preset||$('labSkillPreset').value;
 if($('labKrakenPhase'))$('labKrakenPhase').value=LAB.krakenPhase||$('labKrakenPhase').value;
 if($('labLearnerSelect')&&lab?.foundation)fillLearnerSelect($('labLearnerSelect'),lab.foundation.learners,lab.foundation.activeLearnerId)
 if($('labActiveLearner')&&lab?.learner){$('labActiveLearner').textContent=`${lab.learner.name} (${lab.learner.profileId})`;$('labStage').textContent=`Stage: ${lab.learner.stage} · Hub: ${lab.learner.hub.variant}${lab.learner.hub.expansionUnlocked?' · Expansion unlocked':''}`;$('labQueue').textContent=`Offline queue: ${lab.learner.offlineQueue.length} · Sent: ${lab.learner.sentEventIds.length}`;$('labHub').textContent=lab.learner.hub.variant==='upgraded'?'Upgraded hub with expansion unlocked':'Starter hub';$('labRewards').textContent=`${lab.learner.rewards.length} reward(s) · ${lab.learner.rewards.map(r=>r.name).join(', ')||'None'}`}
 if($('labInspect')&&lab?.summary){const pre=document.createElement('pre');pre.className='lab-json';pre.textContent=JSON.stringify(lab.summary,null,2);$('labInspect').innerHTML='';$('labInspect').appendChild(pre)}
 if($('labContentCheck')&&lab?.summary?.contentCheck){const content=lab.summary.contentCheck;$('labContentCheck').innerHTML=`<div class="${content.valid?'diag-ok':'diag-warn'}">${content.valid?'Content bundle valid':'Content bundle quarantined'}${content.quarantined.length?`: ${content.quarantined.join(', ')}`:''}</div>`}
 const steps=[
  ['Device A created progress',!!QA.deviceA],
  ['Device A pushed cloud',!!QA.deviceAPushed],
  ['Device B signed in',!!QA.deviceB],
  ['Device B pulled cloud',!!QA.deviceBPulled],
  ['Progress matched',!!QA.progressMatched],
  ['Second account isolation tested',!!QA.isolationTested]
 ];
 $('twoDeviceChecklist').innerHTML=steps.map(([n,ok])=>`<div class="qa-step"><span class="${ok?'qa-done':'qa-open'}">${ok?'✓':'○'}</span> ${n}</div>`).join('');
 const access=[
  'Keyboard: arrows + WASD',
  'Touch controls',
  'Reduced Motion',
  'High Contrast',
  'Large Targets',
  '200% zoom — manual',
  'Screen reader — manual',
  'Portrait phone — manual',
  'Landscape tablet — manual'
 ];
 $('accessibilityMatrix').innerHTML=access.map(x=>`<div class="qa-step">${x}</div>`).join('');
 renderLabDeveloperTools();
}

function renderLabDeveloperTools(){
 const host=$('labDeveloperTools');if(!host||!labAllowed())return;
 host.replaceChildren();
 const title=document.createElement('h3');title.textContent='Developer-only state tools';
 const description=document.createElement('p');description.textContent='These controls are created only inside an authorized internal-review Lab session and are absent from production.';
 const actions=document.createElement('div');actions.className='cloud-actions';
 const status=document.createElement('p');status.id='labDeveloperStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const add=(id,label,handler,className='')=>{const button=document.createElement('button');button.id=id;button.type='button';button.textContent=label;if(className)button.className=className;button.onclick=handler;actions.appendChild(button);return button};
 add('labSimulateSync','Run Local Sync Simulation',async()=>{await simulateLocalSync();status.textContent='Local sync simulation completed.'});
 add('labTestConflictMerge','Test Conflict Merge',()=>{status.textContent=testConflictMerge()?'Conflict merge test passed.':'Conflict merge test failed.'});
 add('labDiscardSyncQueue','Discard Pending Sync Queue',async event=>{
  if(!SYNC.queue.length){status.textContent='The pending sync queue is already empty.';return}
  const approved=await requestSensitiveAction({title:'Discard pending sync changes?',description:`This removes ${SYNC.queue.length} pending local sync event(s). It does not delete learner progress.`,confirmText:'Discard pending changes',confirmationValue:'DISCARD',confirmationPrompt:'Type DISCARD exactly',invoker:event.currentTarget,statusId:'labDeveloperStatus'});
  if(!approved){status.textContent='Queue discard cancelled. Pending changes were kept.';return}
  const ids=SYNC.queue.map(item=>item.eventId||item.id);acknowledgeSyncEvents(ids);SYNC.queue=SYNC.queue.filter(item=>!ids.includes(item.eventId||item.id));await saveSync();status.textContent=`Discarded ${ids.length} pending sync event(s).`
 },'danger');
 add('labRunSelfCheck','Run Self-Check',()=>{const rows=selfCheck();status.textContent=rows.map(([name,ok])=>`${ok?'PASS':'CHECK'}: ${name}`).join(' · ')});
 add('labRunLaunchCheck','Run Launch Check',()=>{const rows=launchChecks();status.textContent=rows.map(([name,ok])=>`${ok?'PASS':'OPEN'}: ${name}`).join(' · ')});
 host.append(title,description,actions,status)
}

function captureLabOverview(){
 const c=core();
 if(!c)return null;
 const foundation=loadFoundation();
 if(!foundation)return null;
 const learner=foundation.learners[foundation.activeLearnerId];
 const skillId=$('labSkill')?.value||LAB.skillId||'number-facts';
 const skill=learner.skills?.[skillId]||c.createSkillState(skillId);
 const summary={profileId:learner.profileId,name:learner.name,stage:learner.stage,hub:learner.hub,skill:{skillId,masteryState:skill.masteryState,masteryScore:skill.masteryScore,confidence:skill.confidence,evidence:skill.evidence,reviewHistory:skill.reviewHistory.slice(-4),nextReviewAt:skill.nextReviewAt},rewards:learner.rewards,offlineQueue:learner.offlineQueue,sentEventIds:learner.sentEventIds,contentCheck:c.validateContentBundle(c.createVerticalSliceContent())};
 return {c,foundation,learner,summary};
}

function renderMistakeRows(){const container=$('mistakes');if(!container)return;container.replaceChildren();const mistakes=P().mistakes.slice(-8).reverse();if(!mistakes.length){container.textContent='No recent mistakes.';return}mistakes.forEach(m=>{const row=document.createElement('div');row.append(document.createTextNode(`${String(m.skill||'skill')}: chose `));const chosen=document.createElement('b');chosen.textContent=String(m.chosen||'');row.appendChild(chosen);container.appendChild(row)})}
function render(){
 if(core()){try{reconcileCanonicalStateWithCore()}catch(error){reportPersistenceFailure(error)}projectLearningCore(P(),ensureProfileLearningCore(P()));}
 const profile=P();
 const xp=profileXp();
 const goal=currentGoalState();
 const reward=nextRewardState();
 const streak=streakCount();
 $('profileName').textContent=profile.name;
 $('stars').textContent=profile.stars;
 $('score').textContent=profile.score;
 $('mathProgress').textContent=`${prog('math')} / 10`;
 $('wordProgress').textContent=`${prog('words')} / 10`;
 $('spanishProgress').textContent=`${prog('spanish')} / 10`;
 const homeBite=$('homeBite');if(homeBite)homeBite.src=biteArtForName(profile.bite);
 const homeAvatar=$('homeAvatar');if(homeAvatar)homeAvatar.src=biteArtForName(profile.bite);
 const nib=$('nib');if(nib)nib.src=biteArtForName(profile.bite);
 const homeProfileName=$('homeProfileName');if(homeProfileName)homeProfileName.textContent=profile.name;
 const homeLevel=$('homeLevel');if(homeLevel)homeLevel.textContent=`Level ${profileLevel()}`;
 const homeXpText=$('homeXpText');if(homeXpText)homeXpText.textContent=`${xp.current} / ${xp.max} XP`;
 const homeXpBar=$('homeXpBar');if(homeXpBar)homeXpBar.style.width=`${xp.percent}%`;
 const homeBrainBites=$('homeBrainBites');if(homeBrainBites)homeBrainBites.textContent=profile.score;
 const homeBrainifacts=$('homeBrainifacts');if(homeBrainifacts)homeBrainifacts.textContent=profile.spark||0;
 const homeGoalTitle=$('homeGoalTitle');if(homeGoalTitle)homeGoalTitle.textContent=`Solve ${goal.total} missions`;
 const homeGoalBar=$('homeGoalBar');if(homeGoalBar)homeGoalBar.style.width=`${goal.progress}%`;
 const homeGoalText=$('homeGoalText');if(homeGoalText)homeGoalText.textContent=`${goal.remaining} more mission${goal.remaining===1?'':'s'} in ${goal.world} for a reward!`;
 const homeGoalReward=$('homeGoalReward');if(homeGoalReward)homeGoalReward.textContent=`${Math.max(50,goal.remaining*25)} Star`;
 const homeRewardTitle=$('homeRewardTitle');if(homeRewardTitle)homeRewardTitle.textContent=`Gain ${reward.remaining} more XP`;
 const homeRewardBar=$('homeRewardBar');if(homeRewardBar)homeRewardBar.style.width=`${reward.percent}%`;
 const homeRewardText=$('homeRewardText');if(homeRewardText)homeRewardText.textContent='Earn BrainBites to reach the next level!';
 const homeStreak=$('homeStreak');if(homeStreak)homeStreak.textContent=streak?`${streak}-day streak`:'Keep it up';
 const homeStreakDots=$('homeStreakDots');if(homeStreakDots)homeStreakDots.innerHTML=Array.from({length:7},(_,i)=>`<span class="${i<streak?'on':''}"></span>`).join('');
 const comboBanner=$('comboBanner');if(comboBanner)comboBanner.textContent=`x${G?.combo||0}`;
 const battleProfileName=$('battleProfileName');if(battleProfileName)battleProfileName.textContent=profile.name;
 const battleProfileLevel=$('battleProfileLevel');if(battleProfileLevel)battleProfileLevel.textContent=`Level ${profileLevel()}`;
 const battleProfileStars=$('battleProfileStars');if(battleProfileStars)battleProfileStars.textContent=profile.score;
 const battleGoalTitle=$('battleGoalTitle');if(battleGoalTitle)battleGoalTitle.textContent=G?.m?.boss?`Defeat ${G.m.bossName}`:`Clear ${G?.m?.title||'the mission'}`;
 const battleGoalBar=$('battleGoalBar');if(battleGoalBar)battleGoalBar.style.width=G?`${Math.max(0,Math.min(100,Math.round((G.eaten/Math.max(1,G.total))*100)))}%`:'0%';
 const battleGoalText=$('battleGoalText');if(battleGoalText)battleGoalText.textContent=G?.m?.boss?'Finish the arena phase to push the boss back.':'Choose the correct tile to keep moving through the jungle.';
 renderWorldShowcase();WORLDS.forEach(w=>renderList(w.id+'List',w.id));$('parentMath').textContent=Math.round(P().mastery.math)+'%';$('parentWords').textContent=Math.round(P().mastery.words)+'%';$('parentSpanish').textContent=Math.round(P().mastery.spanish)+'%';renderMistakeRows();renderProfiles();renderChildProfiles();unlockBites();renderBites();renderParent();renderDiagnostics();renderSync();renderControls();renderIntegrations();renderRelease();renderQA();applySettings();renderLaunchHint();renderFirstRun();$('saveHealth').textContent=`Save healthy · Backup ${localStorage.getItem(BACK)?'available':'not created yet'}`}
function unlocked(m){return !!m&&REGISTRY.isMissionUnlocked(progression(),m.id)}
function renderList(id,world){const l=$(id);l.innerHTML='';const meta=worldMeta(world);const count=prog(world);const worldDefinition=REGISTRY.getWorld(world);const bosses=MISSIONS.filter(m=>m.world===world&&m.boss).length;const completed=progression().completedMissionIds;const clearedBosses=MISSIONS.filter(m=>m.world===world&&m.boss&&completed.includes(m.id)).length;l.innerHTML=`<div class="world-banner world-${world}"><img src="${meta.art}" alt="${meta.title}"><div><p class="world-tag">${meta.tag}</p><h3>${meta.title}</h3><p>${meta.summary}</p><p class="world-progress">${count}/${worldDefinition.missionIds.length} missions &middot; ${clearedBosses}/${bosses} bosses cleared</p></div></div>`;MISSIONS.filter(m=>m.world===world).forEach(m=>{const on=unlocked(m),done=completed.includes(m.id),gate=on?registryMissionGate(m):null,available=!!(on&&gate?.approved),d=document.createElement('div');d.className='mission-row '+world+(on?'':' locked')+(available?'':' unavailable')+(m.boss?' boss':'')+(done?' done':'');d.innerHTML=`<div><div class="mission-topline"><b>${m.id}. ${m.title}</b><span class="mission-badge">${m.boss?'Boss':'Mission'}</span></div><div class="mission-skill">${m.skill}</div></div><button aria-label="${done?'Replay':available?'Play':'Unavailable'} mission ${m.id}: ${m.title}" ${available?'':'disabled'}>${done?'Replay':available?'Play':on?'Unavailable':'Locked'}</button>`;if(available)d.querySelector('button').onclick=()=>start(m.id);l.appendChild(d)})}
function isMatchFractionCompatibilityPath(){
 return !!G?.m?.skill&&G.m.skill==='fractions'&&document.documentElement.classList.contains('presentation-match')&&!document.documentElement.classList.contains('presentation-match-game-dom')
}
function activityValues(challenge){
 if(!challenge)return [];
 if(challenge.family==='Target Smash')return Array.isArray(challenge.answers)?challenge.answers:[];
 if(challenge.family==='Letter Trail')return Array.isArray(challenge.targetSequence)?challenge.targetSequence:[];
 if(challenge.family==='Knowledge Platforms')return Array.isArray(challenge.platformOrder)?challenge.platformOrder:[];
 return []
}
function activityChoices(challenge){
 if(!challenge)return [];
 const values=challenge.family==='Target Smash'
  ?(Array.isArray(challenge.choices)?challenge.choices.map(choice=>choice&&typeof choice==='object'?choice.value:choice):[...(challenge.answers||[]),...(challenge.distractors||[])])
  :challenge.family==='Letter Trail'
   ?(Array.isArray(challenge.choices)?challenge.choices:[...(challenge.targetSequence||[]),...(challenge.distractors||[])])
   :challenge.family==='Knowledge Platforms'
     ?(Array.isArray(challenge.platforms)?challenge.platforms:[...(challenge.platformOrder||[]),...(challenge.distractors||[])])
     :[];
  return [...new Map(values.filter(value=>value!==undefined&&value!==null).map(value=>{
    const normalized=value&&typeof value==='object'?(value.value??value.label??value.text):value;
    return [String(normalized),normalized]
  })).values()]
}
function activityProgress(challenge){
 if(!challenge)return [];
 if(challenge.family==='Target Smash')return challenge.selected||[];
 if(challenge.family==='Letter Trail')return challenge.revealed||[];
 if(challenge.family==='Knowledge Platforms')return challenge.visited||[];
 return []
}
function createLiveActivity(m){
 const c=core();
 if(!c||!m?.activityFamily)return null;
 let challenge=m.curriculumChallenge?structuredClone(m.curriculumChallenge):null;
 if(!challenge){
  const routed=c.resolveMissionChallenge?.(m.id);
  if(!routed?.approved||!routed.challenge)return null;
  challenge=structuredClone(routed.challenge);
  // Registry missions may expose a longer ordered platform path than the
  // generic route needs. Keep that family-specific order without changing
  // the registry or introducing subject-specific answer rules.
  if(m.activityFamily==='Knowledge Platforms'&&Array.isArray(m.correct)&&m.correct.length>challenge.platformOrder.length){
   const order=[...new Set(m.correct.map(String))];
   const distractors=[...new Set((m.wrong||[]).map(String))].filter(value=>!order.includes(value));
   challenge.platformOrder=order;
   challenge.distractors=distractors;
   challenge.platforms=[...order,...distractors].sort(()=>Math.random()-.5);
  }
 }
 if(challenge.family!==m.activityFamily)return null;
 challenge.attempts=Array.isArray(challenge.attempts)?challenge.attempts:[];
 if(challenge.family==='Target Smash')challenge.selected=Array.isArray(challenge.selected)?challenge.selected:[];
 if(challenge.family==='Letter Trail'){
  challenge.revealed=Array.isArray(challenge.revealed)?challenge.revealed:[];
  challenge.errors=Math.max(0,Number(challenge.errors)||0);
 }
 if(challenge.family==='Knowledge Platforms'){
  challenge.visited=Array.isArray(challenge.visited)?challenge.visited:[];
  challenge.errors=Math.max(0,Number(challenge.errors)||0);
 }
 return {family:challenge.family,challenge,attempts:[],lastAttempt:null,errorCount:0}
}
function activityChoiceValue(challenge,value){
 const wanted=String(value);
 return activityChoices(challenge).find(candidate=>String(candidate)===wanted)
}
function syncLiveActivityMetrics(){
 const progress=activityProgress(G?.activity?.challenge);
 if(!G?.activity||!G.activity.challenge)return;
 G.eaten=progress.length;
 G.total=activityValues(G.activity.challenge).length;
 G.activity.completed=!!G.activity.challenge.completed;
 G.activity.errorCount=Math.max(0,Number(G.activity.challenge.errors)||0);
}
function recordLiveActivityAttempt(correct,value,meta={}){
 if(G?.retryAssist)meta={...meta,assisted:true,independent:false,hintsUsed:Math.max(1,Number(meta.hintsUsed)||0)};
 const outcome=updateSkill(G.m.skill,correct,{...meta,source:G.source||'mission'});
 if(outcome?.contentQuarantined){
  $('feedback').textContent=CONTENT_UNAVAILABLE_MESSAGE;
  draw();
  return null
 }
 G.moves++;
 if(correct){
  G.retryAssist=false;G.combo++;G.max=Math.max(G.max,G.combo);G.correct++;awardProgressionScore(100*G.combo);P().mastery[G.m.world]=Math.min(100,P().mastery[G.m.world]+1);$('feedback').textContent='CHOMP! Correct.';fileCue(G.combo>=8?'super':'correct');emitAnswer(value,true,false)
 }else{
  G.combo=0;G.wrong++;G.lives--;P().mastery[G.m.world]=Math.max(0,P().mastery[G.m.world]-.5);P().mistakes.push({skill:G.m.skill,chosen:String(value),ts:Date.now()});$('feedback').textContent=wrongAnswerFeedback(value);fileCue('wrong');emitAnswer(value,false,false)
 }
 return {correct,value:String(value),at:Date.now(),...meta}
}
function resolveLiveActivity(value,meta={}){
 if(!G?.activity||G.paused||isMatchFractionCompatibilityPath())return false;
 if(!checkpointGameplayActivity({reason:'activity'}))return false;
 const c=core();
 if(!c)return false;
 const current=G.activity.challenge;
 if(current.completed||G.activity.completed||G.contentQuarantined)return false;
 const picked=activityChoiceValue(current,value);
 const legacyTargetAnswer=current.family==='Target Smash'&&picked===undefined&&G.m?.correct?.some(answer=>String(answer)===String(value));
 if(picked===undefined&&!legacyTargetAnswer)return false;
 const selected=current.selected||[];
 const resolvedValue=picked===undefined?String(value):picked;
 const interactionMeta={
  ...attemptSupport(),
  responseTimeMs:Math.max(0,Number(meta.responseTimeMs)||0),
  randomLike:meta.randomLike===true,
  ...meta,
 };
 let next,currentCorrect=false;
 if(current.family==='Target Smash'){
  currentCorrect=!selected.some(item=>String(item)===String(resolvedValue))&&(
   current.answers||[]).some(answer=>String(answer)===String(resolvedValue));
  const selection=currentCorrect?[...selected,resolvedValue]:[resolvedValue];
  const result=c.resolveTargetSmashResult(current,selection,interactionMeta);
  next={...result.challenge,selected:currentCorrect?[...selected,resolvedValue]:selected,completed:currentCorrect&&[...(selected||[]),resolvedValue].length>0&&(
   current.answers||[]).every(answer=>[...(selected||[]),resolvedValue].some(item=>String(item)===String(answer))) };
  // Legacy callers can still submit a full mission answer set even when the
  // live activity is limited to its six physical choices.
  if(legacyTargetAnswer){
   currentCorrect=true;
   next={...current,selected:[...selected,resolvedValue],completed:!!current.completed,attempts:[...(current.attempts||[]),result.attempt]};
  }
 }else if(current.family==='Letter Trail'){
  const result=c.resolveLetterTrailChoice(current,resolvedValue,interactionMeta);
  currentCorrect=!!result.attempt.correct;
  next=result.challenge;
 }else if(current.family==='Knowledge Platforms'){
  const result=c.resolveKnowledgePlatformChoice(current,resolvedValue,interactionMeta);
  currentCorrect=!!result.attempt.correct;
  next=result.challenge;
 }else return false;
 const attempt=recordLiveActivityAttempt(currentCorrect,resolvedValue,interactionMeta);
 if(!attempt)return false;
 next.attempts=[...(current.attempts||[]),{...attempt}];
 if(current.family!=='Target Smash'&&currentCorrect===false)next.errors=Math.max(0,Number(next.errors)||0);
 G.activity.challenge=next;
 G.activity.lastAttempt=attempt;
 G.activity.attempts.push(attempt);
 if(currentCorrect&&Array.isArray(G.webglRemaining)){
  const remainingIndex=G.webglRemaining.findIndex(item=>String(item)===String(resolvedValue));
  if(remainingIndex>=0)G.webglRemaining.splice(remainingIndex,1);
 }
 syncLiveActivityMetrics();
 draw();
 if(next.completed){complete();return true}
 handleOutOfLives();
 // DOM legacy callers treat a discovered answer tile as handled even when it
 // was a distractor; WebGL keeps its historical false return for misses.
 return currentCorrect||!document.documentElement.classList.contains('presentation-webgl')
}
function renderProfiles(){const l=$('profileList');l.replaceChildren();STORE.profiles.forEach((p,i)=>{const d=document.createElement('div'),details=document.createElement('div'),name=document.createElement('b'),stars=document.createElement('div'),button=document.createElement('button');d.className='profile-row';name.textContent=p.name;stars.textContent=`${p.stars} stars`;button.textContent=i===STORE.active?'Active':'Switch';button.disabled=i===STORE.active;details.append(name,stars);d.append(details,button);button.onclick=()=>{if(i===STORE.active)return;STORE.active=i;lockParentAccess();save();show('home')};l.appendChild(d)})}
function renderChildProfiles(){
 const active=$('childActiveProfile'),list=$('childProfileList');if(!active||!list)return;active.textContent=P().name;list.replaceChildren();
 STORE.profiles.forEach((profile,index)=>{const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button'),current=index===STORE.active;row.className='profile-row child-profile-row';label.textContent=`${profile.name} · ${profile.stars} stars`;button.textContent=current?'Active learner':'Switch learner';button.disabled=current;button.setAttribute('aria-label',current?`${profile.name}, active learner`:`Switch to ${profile.name}`);button.onclick=()=>{if(current)return;STORE.active=index;lockParentAccess();void save();show('home')};row.append(label,button);list.appendChild(row)});
}
function setCaption(text){const el=$('captionText');if(!el)return;const on=!!P().settings.captions;el.textContent=text||'';el.hidden=!on||!text}
function start(id,options={}){const m=REGISTRY.getMission(id);return m?launchMission(m,options):false}
function launchMission(m,{allowLocked=false,progressionEligible=true,assisted=false,source='mission',homeworkMode=false,contentControl=null}={}){const canonical=REGISTRY.getMission(m?.id),missionUnlocked=!!canonical&&REGISTRY.isMissionUnlocked(progression(),canonical.id);if(!m)return false;if(progressionEligible&&!canonical)return false;if(!allowLocked&&!missionUnlocked){$('launchHint').textContent='Complete the earlier mission in this world first.';return false}const gate=contentControl||registryMissionGate(m);if(!gate?.approved)return showContentUnavailable('launchHint');if(!prepareTimeUsageLaunch()){TIME_PENDING_LAUNCH={mission:m,options:{allowLocked,progressionEligible,assisted,source,homeworkMode,contentControl:gate}};return false}TIME_PENDING_LAUNCH=null;if(progressionEligible&&missionUnlocked){P().progression=REGISTRY.normalizeProgression({...progression(),lastMissionId:canonical.id});save()}show('game');applyWorldTheme(m.world);$('prompt').textContent=m.prompt;$('worldLabel').textContent=worldMeta(m.world).title.toUpperCase();renderMinimap(m);$('prompt').lang=m.world==='spanish'?'es':'en';
 if(progressionEligible&&missionUnlocked&&['name','world'].includes(firstRunState(P()).stage)){setFirstRunStage('mission');renderFirstRun();save()}
 const webgl=document.documentElement.classList.contains('presentation-webgl'),bossBox=$('bossBox');bossBox.hidden=!m.boss;bossBox.style.display=m.boss?'':'none';$('bossName').textContent=m.bossName||'Boss';renderBossPortrait(m);const guidedHint=assisted?(m.curriculumChallenge?.supportMetadata?.scaffold||m.curriculumChallenge?.hintMetadata?.hint||''):'';$('feedback').textContent=assisted?`Guided support is on.${guidedHint?` ${guidedHint}`:' This attempt counts as assisted evidence.'}`:`Entering ${worldMeta(m.world).title}.`;G=makeGame(m);G.progressionEligible=!!(progressionEligible&&missionUnlocked);G.internalBubbleReefPreview=G.progressionEligible&&isInternalBubbleReefPreview();G.launchOptions={allowLocked:!!allowLocked,progressionEligible:!!progressionEligible,assisted:!!assisted,source,homeworkMode:!!homeworkMode,contentControl:gate};G.contentControl=gate;G.assisted=!!assisted;G.source=source;G.homeworkMode=!!homeworkMode;G.guidedHint=guidedHint;if(webgl){G.webglRemaining=[...new Set((m.correct||[]).map(String))];G.total=m.boss?Math.min(4,G.webglRemaining.length):G.webglRemaining.length}$('speakPrompt').hidden=false;setCaption(m.prompt);hideBattleToast();hideSnackCard();hideExplainer();clearEnteringStatusSoon();draw();return true}
function startCurriculumChallenge(challenge,{assisted=false,homeworkMode=false}={}){
 const c=core(),skill=c?.findCurriculumSkill?.(challenge?.skillId),validation=c?.validateGeneratedChallenge?.(challenge,skill||{});
 const gate=c&&skill&&validation?.approved?generatedChallengeGate(challenge,skill,validation):null;
 const familyValues=challenge?.family==='Letter Trail'?challenge?.targetSequence:challenge?.family==='Knowledge Platforms'?challenge?.platformOrder:challenge?.answers;
 const primitiveArray=value=>Array.isArray(value)&&value.length>0&&value.every(item=>item===null?false:['string','number'].includes(typeof item));
 if(!c||!skill||challenge?.source!=='curriculum'||!primitiveArray(familyValues)||!primitiveArray(challenge?.distractors)||!validation?.approved||!gate?.approved)return showContentUnavailable('practiceResult');
 const correct=challenge.family==='Letter Trail'?challenge.targetSequence:challenge.family==='Knowledge Platforms'?challenge.platformOrder:challenge.answers;
 const wrong=challenge.distractors;
 const world=challenge.subject==='math'?'math':'words';
 const mission={id:`curriculum:${challenge.id||challenge.skillId}:${Date.now()}`,title:skill.name,world,skill:challenge.skillId,activityFamily:challenge.family,prompt:challenge.prompt,correct:[...new Set((correct||[]).map(String))],wrong:[...new Set(wrong.map(String))],boss:false,curriculumChallenge:structuredClone(challenge)};
 return launchMission(mission,{allowLocked:true,progressionEligible:false,assisted,source:homeworkMode?'homework':'adaptive-practice',homeworkMode,contentControl:gate})
}
function makeGame(m){
 let vals=shuffle([...m.correct,...m.wrong,...m.wrong]).slice(0,24);
 m.correct.slice(0,3).forEach(c=>{if(!vals.includes(c))vals[Math.floor(Math.random()*vals.length)]=c});
 let cells=vals.map(v=>({value:v,correct:m.correct.includes(v),eaten:false}));
 cells.splice(12,0,{value:'',correct:false,eaten:true});
 // Keep the legacy registry mission contract intact; family-aware live
 // interaction is enabled for reviewed curriculum challenges only.
 const activity=m.curriculumChallenge?createLiveActivity(m):null,startedAt=Date.now();
 const total=activity?activityValues(activity.challenge).length:cells.slice(0,25).filter(c=>c.correct&&!c.eaten).length;
 return {m,cells:cells.slice(0,25),activity,activityFamily:activity?.family||m.activityFamily||null,p:{x:2,y:2},e:{x:0,y:0},mist:[],lives:3,combo:0,max:0,eaten:0,total,boss:100,moves:0,correct:0,wrong:0,outcomes:[],suspiciousSignals:[],startedAt,lastAttemptAt:startedAt}
}
// The arrival line is a status, not part of the prompt: clear it once announced.
let enteringStatusTimer=null;
function clearEnteringStatusSoon(){clearTimeout(enteringStatusTimer);enteringStatusTimer=setTimeout(()=>{const f=$('feedback');if(f&&f.textContent.startsWith('Entering '))f.textContent=''},1500)}
// Boss portrait from the inline sprite (UI rubric B6); unknown bosses keep the plain badge.
function renderBossPortrait(mission){const art=document.querySelector('#bossBox .boss-art');if(!art)return;const id=String(mission?.bossId||mission?.bossName||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const symbol=id&&document.getElementById(`b-${id}`);art.replaceChildren();art.classList.toggle('has-portrait',!!symbol);if(!symbol)return;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','ui-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`#b-${id}`);svg.appendChild(use);art.appendChild(svg)}
// ---- Answer event contract (G2.1) -----------------------------------------------------------
// Fired once per attempt, after the learning update and before the redraw, so presentation
// can animate the disc that was chosen. Presentation never decides correctness.
function emitAnswer(value,correct,final){if(!G)return;const combo=G.combo;window.dispatchEvent(new CustomEvent('bb:answer',{detail:{value:String(value),correct:!!correct,combo,boss:!!G.m?.boss,final:!!final}}));if(correct&&combo>0&&combo%3===0)celebrateCombo(combo)}
function celebrateCombo(combo){const panel=document.querySelector('#game .battle-combo');const banner=$('comboBanner');if(banner)banner.dataset.streak=combo>=9?'Unstoppable!':combo>=6?'On fire!':'Hot streak!';if(panel){panel.dataset.streakLabel=`x${combo} ${banner?.dataset.streak||''}`;panel.classList.remove('combo-flash');void panel.offsetWidth;panel.classList.add('combo-flash');setTimeout(()=>panel.classList.remove('combo-flash'),900)}const status=$('comboStatus');if(status)status.textContent=`${combo} in a row! ${banner?.dataset.streak||''}`;comboCue(combo)}
function comboCue(combo){if(!P().settings.soundOn)return;const c=audioContext();if(!c)return;const base=combo>=9?880:combo>=6?740:620;[0,.09,.18].forEach((delay,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=base*(1+i*.25);g.gain.setValueAtTime(.03,c.currentTime+delay);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+delay+.12);o.connect(g);g.connect(c.destination);o.start(c.currentTime+delay);o.stop(c.currentTime+delay+.13)})}
// ---- Mission stars and the mission-clear moment (G6.1, G2.5) ------------------------------
// One star for finishing, two for at least 80% right first time, three for at least 90%
// with no guided help. Stars never gate progress; replays can only raise them.
function missionStarRating(game){const attempts=(Number(game?.correct)||0)+(Number(game?.wrong)||0);const accuracy=attempts?(Number(game.correct)||0)/attempts:0;const assisted=!!game?.assisted||(Number(game?.assistedAttempts)||0)>0;return 1+(accuracy>=.8?1:0)+(accuracy>=.9&&!assisted?1:0)}
let clearBannerTimer=null;
function showClearBanner(screenId,clear){const banner=$('clearBanner'),screen=$(screenId);if(!banner||!screen)return;screen.insertBefore(banner,screen.children[1]||null);$('clearTitle').textContent=clear.title;const stars=$('clearStars');stars.textContent='\u2605'.repeat(clear.stars)+'\u2606'.repeat(3-clear.stars);stars.setAttribute('aria-label',`${clear.stars} of 3 stars`);const points=$('clearPoints');const next=nextMissionAfter(clear.missionId,clear.world);$('clearNext').hidden=!next;$('clearNext').onclick=()=>{hideClearBanner();if(next)start(next.id)};banner.hidden=false;const reduced=document.documentElement.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced||!clear.earned){points.textContent=clear.earned?`+${clear.earned} BrainBites`:'Practice counts too!'}else{const started=performance.now();const tick=()=>{const k=Math.min(1,(performance.now()-started)/800);points.textContent=`+${Math.round(clear.earned*k)} BrainBites`;if(k<1)requestAnimationFrame(tick)};tick()}clearTimeout(clearBannerTimer);clearBannerTimer=setTimeout(hideClearBanner,12000)}
function hideClearBanner(){clearTimeout(clearBannerTimer);clearBannerTimer=null;const banner=$('clearBanner');if(banner)banner.hidden=true}
function nextMissionAfter(id,world){const ids=REGISTRY.getWorld(world)?.missionIds||[];const nextId=ids[ids.indexOf(Number(id))+1];return nextId&&REGISTRY.isMissionUnlocked(progression(),nextId)?REGISTRY.getMission(nextId):null}
// ---- Kind failure (G3, decision D11) --------------------------------------------------
// Running out of hearts costs time, not progress: Bite has a snack, hearts refill, and the
// mission continues from the current question. After SNACK_REFILLS refills the child
// chooses to keep practising (no progression, no rewards) or to go back to the map.
const SNACK_REFILLS=2,SNACK_MS=2000;
let snackTimer=null;
function handleOutOfLives(){
 if(!G||G.lives>0||G.paused||G.contentQuarantined)return false;
 G.refills=Number(G.refills)||0;
 G.paused=true;hideExplainer();
 if(G.refills<SNACK_REFILLS){
  G.refills++;showSnackCard(false);
  clearTimeout(snackTimer);snackTimer=setTimeout(()=>{if(!G?.paused)return;G.lives=3;G.paused=false;G.combo=0;hideSnackCard();$('feedback').textContent='Hearts full. Keep going!';draw()},SNACK_MS);
 }else showSnackCard(true);
 draw();return true;
}
function showSnackCard(choice){const card=$('snackCard');if(!card)return;$('snackTitle').textContent=choice?'Bite is tired!':'Bite needs a snack!';$('snackText').textContent=choice?'Keep practising for fun, or head back to the map.':'Hearts refill in a moment. Your progress is kept.';$('snackActions').hidden=!choice;card.hidden=false;if(choice)$('snackPractice').focus()}
function hideSnackCard(){clearTimeout(snackTimer);snackTimer=null;const card=$('snackCard');if(card)card.hidden=true}
function continueAsPractice(){if(!G)return;G.progressionEligible=false;G.practiceAfterWipeout=true;G.lives=3;G.combo=0;G.paused=false;hideSnackCard();$('feedback').textContent='Practice run: no stars or BrainBites, just learning.';draw()}
// ---- Explain, then retry (G3) --------------------------------------------------------------
// A wrong answer shows why for a few seconds. The next attempt is recorded as assisted
// evidence, because the child has just been shown the reasoning; it can never raise
// independent mastery.
let explainerTimer=null;
function attemptSupport(){const assisted=!!(G?.assisted||G?.retryAssist);if(assisted&&G)G.assistedAttempts=(Number(G.assistedAttempts)||0)+1;return {assisted,independent:!assisted,hintsUsed:assisted?1:0}}
function wrongAnswerFeedback(value){
 const message=incorrectAttemptMessage(value);
 if(!G)return message;
 G.retryAssist=true;
 const visual=window.BrainBiteExplainers?.explain?.({prompt:G.m?.prompt,skill:G.m?.skill,chosen:value});
 if(visual)showExplainer(visual);
 return visual&&!explanationForCurrentChallenge()&&!G.guidedHint?`Not ${value}. ${visual.text}`:message;
}
function showExplainer(visual){const box=$('explainer');if(!box)return;box.innerHTML=visual.svg||'';box.hidden=!visual.svg;clearTimeout(explainerTimer);explainerTimer=setTimeout(hideExplainer,3500)}
function hideExplainer(){clearTimeout(explainerTimer);explainerTimer=null;const box=$('explainer');if(box){box.hidden=true;box.innerHTML=''}}
function restartCurrentMission(){const mission=G?.m?structuredClone(G.m):null,options={...(G?.launchOptions||{})},typingMode=G?.typingMode?structuredClone(G.typingMode):null;if(!mission||G?.contentQuarantined)return;setTimeout(()=>{if(G?.contentQuarantined)return;launchMission(mission,options);if(typingMode){G.typingMode={...typingMode,targetIndex:0,target:typingMode.targets?.[0]||typingMode.target,startedAt:Date.now(),attempts:[],completed:false};draw()}},500)}
function explanationForCurrentChallenge(){
 for(const candidate of [G?.m?.curriculumChallenge,G?.activity?.challenge,G?.m]){
  const text=String(candidate?.explanation||'').trim();
  if(text)return text;
 }
 return '';
}
// Wrong answers are the teaching moment: show the reviewed explanation when the content
// carries one, and keep the assisted hint in front of it when guided support is on.
function incorrectAttemptMessage(value){
 if(G?.guidedHint)return `Try again. ${G.guidedHint}`;
 const explanation=explanationForCurrentChallenge();
 return explanation?`Not ${value}. ${explanation}`:`Not ${value}. Try another.`;
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}const ix=(x,y)=>y*5+x;
function drawTypingBoard(b){
 const mode=G?.typingMode;
 if(!b||!mode)return false;
 const escape=value=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
 b.className=`board typing-board world-${G.m.world}`;
 b.dataset.typingEncounter='true';
 b.innerHTML=`<div class="typing-encounter"><p class="typing-label">Type the answer</p><strong class="typing-target">${escape(mode.target)}</strong><label for="typingInput">Your answer</label><input id="typingInput" autocomplete="off" autocapitalize="off" spellcheck="false"><button id="typingSubmit" type="button">Submit</button><p class="typing-help">Press Enter to submit. Hints count as supported practice.</p></div>`;
 const input=$('typingInput');
 input.disabled=!!mode.completed;
 const submit=()=>{const button=$('typingSubmit');if(button)button.disabled=true;const result=window.BrainBiteGame.submitTypedAnswer(input.value,{attemptId:`typing-${Date.now()}-${Math.random().toString(36).slice(2)}`,elapsedMs:Math.max(0,Date.now()-mode.startedAt),hints:0});if(!result.accepted&&input.isConnected){input.value='';input.focus()}};
 $('typingSubmit').disabled=!!mode.completed;
 $('typingSubmit').onclick=submit;
 input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();submit()}};
 input.focus();
 return true;
}
function drawActivityBoard(b){
 if(G?.typingMode&&drawTypingBoard(b))return true;
 const activity=G.activity,challenge=activity?.challenge;
 if(!b||!activity||!challenge)return false;
 delete b.dataset.typingEncounter;
 const family=activity.family,progress=new Set(activityProgress(challenge).map(value=>String(value)));
 const choices=activityChoices(challenge);
 b.className=`board world-${G.m.world} activity-board activity-${family.toLowerCase().replace(/[^a-z]+/g,'-')}${G.m.boss?' boss-arena':''}`;
 b.dataset.activityFamily=family;
 b.dataset.activityCompleted=String(!!challenge.completed);
 b.replaceChildren();
 const row=document.createElement('div');row.setAttribute('role','row');row.setAttribute('aria-rowindex','1');b.appendChild(row);
 choices.forEach(value=>{
  const button=document.createElement('button');
  const key=String(value);
  button.type='button';button.className='cell activity-target';button.setAttribute('role','gridcell');button.dataset.activityChoice=key;button.dataset.activityFamily=family;button.textContent=key;
  const used=progress.has(key);
  button.setAttribute('aria-pressed',String(used));
  if(used)button.classList.add('selected');
  if((family==='Target Smash'||family==='Letter Trail'||family==='Knowledge Platforms')&&used)button.disabled=true;
  button.addEventListener('click',()=>resolveLiveActivity(value));
  row.appendChild(button);
 });
 return true
}
function draw(){window.dispatchEvent(new CustomEvent('bb:game-draw'));renderMinimap(G?.m);$('lives').textContent=G.lives;$('combo').textContent=G.combo;const comboBanner=$('comboBanner');if(comboBanner)comboBanner.textContent=`x${G.combo}`;const stars=document.querySelectorAll('#game .battle-stars span');if(stars?.length){const lit=Math.min(3,Math.floor(G.combo/3));stars.forEach((s,i)=>{s.innerHTML=i<lit?'&#9733;':'&#9734;';s.style.color=i<lit?'#f5c518':'#9aa3b5'})}$('targets').textContent=`${G.eaten}/${G.total}`;$('bossHealth').value=G.boss;$('bossHealth').max=100;const phase=G.boss>66?1:G.boss>33?2:3;$('bossPhase').textContent=G.m.boss?`${G.m.bossName} - Phase ${phase} of ${BOSS_PHASES}`:`Phase ${phase} of ${BOSS_PHASES}`;const healthFill=$('healthFill');if(healthFill)healthFill.style.width=`${Math.max(0,Math.min(100,(G.lives/3)*100))}%`;const healthText=$('healthText');if(healthText)healthText.textContent=`${Math.max(0,G.lives)} / 3`;const healthBox=document.querySelector('#game .battle-health');if(healthBox)healthBox.setAttribute('aria-label',`Lives: ${Math.max(0,G.lives)} of 3`);setCaption(G?.m?.prompt);const b=$('board');const battleSurface=document.querySelector('#game .battle-shell');if(G.activity&&!isMatchFractionCompatibilityPath()&&drawActivityBoard(b)){if(battleSurface)battleSurface.dataset.answerSurface='dom';window.BrainBitePresentation?.setBattleChoices?.([]);return}if(battleSurface)battleSurface.dataset.answerSurface='three-d';b.className=`board world-${G.m.world}${G.m.boss?' boss-arena':''}`;b.innerHTML='';for(let y=0;y<5;y++)for(let x=0;x<5;x++){const c=G.cells[ix(x,y)]||{eaten:true,value:''},d=document.createElement('div');d.className='cell';d.setAttribute('role','gridcell');if(x===G.p.x&&y===G.p.y)d.classList.add('player');if(x===G.e.x&&y===G.e.y)d.classList.add('enemy');if(G.mist.some(m=>m.x===x&&m.y===y))d.classList.add('mistake');if(!c.eaten)d.textContent=c.value;b.appendChild(d)}}
function move(dx,dy){if(!G||G.paused||!checkpointGameplayActivity({reason:'activity'}))return;let nx=Math.max(0,Math.min(4,G.p.x+dx)),ny=Math.max(0,Math.min(4,G.p.y+dy));if(nx===G.p.x&&ny===G.p.y)return;G.p={x:nx,y:ny};if(G.activity&&!isMatchFractionCompatibilityPath()){G.moves++;draw();return}G.moves++;bite();bossTick();enemy();hit();draw()}
function bite(){const c=G.cells[ix(G.p.x,G.p.y)];if(!c||c.eaten)return;c.eaten=true;if(c.correct){G.combo++;G.max=Math.max(G.max,G.combo);G.eaten++;G.correct++;awardProgressionScore(100*G.combo);P().mastery[G.m.world]=Math.min(100,P().mastery[G.m.world]+1);updateSkill(G.m.skill,true,{...attemptSupport(),source:G.source||'mission'});G.retryAssist=false;$('feedback').textContent='CHOMP! Correct.';if(firstRunState(P()).stage==='mission'){setFirstRunStage('done');renderFirstRun();save()}fileCue(G.combo>=8?'super':'correct');emitAnswer(c.value,true,G.m.boss?G.boss<=25:G.eaten>=G.total);if(G.m.boss){G.boss=Math.max(0,G.boss-25);if(G.boss===0)return complete()}else if(G.eaten>=G.total)return complete()}else{const outcome=updateSkill(G.m.skill,false,{...attemptSupport(),independent:false,source:G.source||'mission'});if(outcome?.contentQuarantined){$('feedback').textContent=CONTENT_UNAVAILABLE_MESSAGE;return}G.combo=0;G.wrong++;G.lives--;P().mastery[G.m.world]=Math.max(0,P().mastery[G.m.world]-.5);P().mistakes.push({skill:G.m.skill,chosen:c.value,ts:Date.now()});G.mist.push({x:G.p.x,y:G.p.y});$('feedback').textContent=wrongAnswerFeedback(c.value);fileCue('wrong');emitAnswer(c.value,false,false);handleOutOfLives()}}

function bossTick(){
 if(!G.m.boss)return;
 if(G.m.world==='math'&&G.moves%3===0){G.lives--;G.e.x=Math.floor(Math.random()*5);G.e.y=Math.floor(Math.random()*5);$('feedback').textContent='Asteroid blast!'}
 if(G.m.world==='words'&&G.moves%2===0){G.cells=shuffle(G.cells)}
 if(G.m.world==='spanish'&&G.moves%2===0){G.e={x:Math.floor(Math.random()*5),y:Math.floor(Math.random()*5)}}
 handleOutOfLives()
}

function enemy(){let step=P().settings.enemySpeed==='slow'?2:1;if(G.moves%step)return;let x=G.e.x,y=G.e.y,dx=Math.sign(G.p.x-x),dy=Math.sign(G.p.y-y);if(Math.abs(G.p.x-x)>Math.abs(G.p.y-y))x+=dx;else y+=dy;G.e={x,y}}
function hit(){if(G.e.x===G.p.x&&G.e.y===G.p.y){G.lives--;G.combo=0;G.e={x:0,y:0};$('feedback').textContent='Bonk! Keep going.';fileCue('hit');handleOutOfLives()}}
function complete(){if(!checkpointGameplayActivity({reason:'complete'}))return false;const session={mission:G.m.id,world:G.m.world,skillId:G.m.skill,combo:G.max,accuracy:G.correct?Math.round(100*G.correct/Math.max(1,G.correct+G.wrong)):null,moves:G.moves,durationSec:Math.max(1,Math.round((Date.now()-(G.startedAt||Date.now()))/1000)),practice:G.progressionEligible===false,homework:!!G.homeworkMode,source:G.source||'mission',ts:Date.now()};if(G.progressionEligible===false){recordLearningSession(session);save();fileCue('clear');$('feedback').textContent='Practice complete!';setCaption('Practice complete.');setTimeout(()=>{show('home');render()},600);return true}const profile=P(),before=progression(),wasComplete=before.completedMissionIds.includes(G.m.id),next=REGISTRY.completeMission(before,G.m.id);if(!wasComplete&&!next.completedMissionIds.includes(G.m.id)){$('feedback').textContent='This mission is still locked.';return false}profile.progression=next;if(!wasComplete){profile.stars+=3;profile.spark+=(G.m.boss?10:3)}profile.bestCombo=Math.max(profile.bestCombo,G.max);const missionStars=missionStarRating(G);profile.missionStars={...(profile.missionStars||{})};profile.missionStars[G.m.id]=Math.max(Number(profile.missionStars[G.m.id])||0,missionStars);fileCue(G.m.boss?'boss':'clear');recordLearningSession(session);save();if(G.internalBubbleReefPreview)void grantBubbleReefPreviewReward({profileId:profile.id,missionId:G.m.id,progression:next,awardedAt:session.ts,canonicalRewardGranted:!wasComplete});$('feedback').textContent=G.m.boss?`${G.m.bossName} defeated!`:'Mission complete!';setCaption(G.m.boss?`${G.m.bossName} defeated.`:'Mission complete.');const clear={missionId:G.m.id,world:G.m.world,title:G.m.boss?`${G.m.bossName} defeated!`:'Mission complete!',stars:missionStars,earned:Number(G.earned)||0};setTimeout(()=>{const match=document.documentElement.classList.contains('presentation-match');const target=match?'home':G.m.world;show(target);render();showClearBanner(target,clear)},600);return true}
function applySettings(){let s=P().settings;$('reducedMotion').checked=s.reducedMotion;$('cameraMotionReduction').checked=s.cameraMotionReduction;$('largeTargets').checked=s.largeTargets;$('highContrast').checked=s.highContrast;$('captions').checked=s.captions;$('dyslexicFont').checked=s.dyslexicFont;$('textScale').value=s.textScale||'1';$('qualityTier').value=s.qualityTier||'balanced';$('enemySpeed').value=s.enemySpeed;$('soundOn').checked=s.soundOn;$('musicOn').checked=s.musicOn;syncMusic();const root=document.documentElement;root.classList.toggle('reduced-motion',s.reducedMotion);root.classList.toggle('camera-motion-reduction',s.cameraMotionReduction);root.classList.toggle('large-targets',s.largeTargets);root.classList.toggle('high-contrast',s.highContrast);root.classList.toggle('captions-on',s.captions);root.classList.toggle('dyslexic-font',s.dyslexicFont);root.classList.toggle('quality-ultra',s.qualityTier==='ultra');root.classList.toggle('quality-high',s.qualityTier==='high');root.classList.toggle('quality-balanced',!s.qualityTier||s.qualityTier==='balanced');root.classList.toggle('quality-performance',s.qualityTier==='performance');root.classList.toggle('quality-mobile',s.qualityTier==='mobile');root.classList.toggle('low-end-device',lowEndDevice());root.style.setProperty('--bb-text-scale',String(Number(s.textScale)||1))}
document.querySelectorAll('[data-screen]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.screen)));
$('unlockParent').onclick=async()=>{const pin=$('parentPinInput').value,confirmPin=$('confirmParentPin').value;try{if(!readParentAuth()){if(pin!==confirmPin)throw new Error('PIN confirmation does not match.');await createParentAuth(pin);unlockParentAccess();$('parentGateMsg').textContent='Family PIN set. Parent areas are unlocked.'}else{const result=await verifyParentPin(pin);if(result.locked)throw new Error(`Too many attempts. Try again after ${new Date(result.lockedUntil).toLocaleTimeString()}.`);if(!result.ok)throw new Error(`Incorrect PIN. ${result.remaining} attempt(s) remaining.`);unlockParentAccess();$('parentGateMsg').textContent='Parent areas unlocked.'}$('parentGate').hidden=true;$('parentContent').hidden=false;syncNavigationState('parent')}catch(error){$('parentGateMsg').textContent=error.message}finally{$('parentPinInput').value='';$('confirmParentPin').value='';renderParentGate()}};
$('saveParentPin').onclick=async()=>{const current=$('changeCurrentParentPin').value,next=$('newParentPin').value,confirmPin=$('changeConfirmParentPin').value;try{const verified=await verifyParentPin(current);if(verified.locked)throw new Error(`Too many attempts. Try again after ${new Date(verified.lockedUntil).toLocaleTimeString()}.`);if(!verified.ok)throw new Error('Current PIN is incorrect.');if(next!==confirmPin)throw new Error('New PIN confirmation does not match.');await createParentAuth(next);unlockParentAccess();$('parentPinStatus').textContent='Family PIN changed.'}catch(error){$('parentPinStatus').textContent=error.message}finally{for(const id of ['changeCurrentParentPin','newParentPin','changeConfirmParentPin'])$(id).value=''}};
$('lockParent').onclick=()=>{lockParentAccess();$('parentContent').hidden=true;$('parentGate').hidden=false;renderParentGate();syncNavigationState('parent');$('parentGateMsg').textContent='Parent areas locked.'};
const parentExitToChild=$('parentExitToChild');if(parentExitToChild)parentExitToChild.onclick=()=>{show('home');render()};
// Explicit readiness: reconcile saved generations as soon as LearningCore exists instead
// of relying on the first render happening to be late enough.
window.addEventListener('bb:core-ready',()=>{
 try{if(reconcileCanonicalStateWithCore())render()}catch(error){reportPersistenceFailure(error)}
},{once:true});
window.BrainBiteCanonicalState=Object.freeze({reconcileRuns:()=>CANONICAL_RECONCILE_RUNS,reconciled:()=>CANONICAL_RECONCILED_WITH_CORE});
const landscapeDismiss=$('landscapePromptDismiss');if(landscapeDismiss)landscapeDismiss.onclick=dismissLandscapePrompt;
const firstRunConfirm=$('firstRunConfirm');
if(firstRunConfirm)firstRunConfirm.onclick=()=>{
 const entered=$('firstRunName')?.value.trim();
 if(entered){P().name=entered.slice(0,24);$('profileName').textContent=P().name}
 setFirstRunStage('world');
 const status=$('firstRunStatus');
 if(status)status.textContent=`Nice to meet you${entered?`, ${P().name}`:''}. Tap PLAY to start your first adventure.`;
 save();render();
};
const firstRunName=$('firstRunName');
if(firstRunName)firstRunName.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();firstRunConfirm?.click()}});
if(typeof matchMedia==='function'){
 const landscapeQuery=matchMedia(LANDSCAPE_PROMPT_QUERY);
 landscapeQuery.addEventListener?.('change',updateLandscapePrompt);
}
window.addEventListener('resize',updateLandscapePrompt);
window.addEventListener('orientationchange',updateLandscapePrompt);
updateLandscapePrompt();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){captureExitTimeContribution();lockParentAccess();try{audioCtx?.suspend?.()}catch{}}else{try{audioCtx?.resume?.()}catch{}if(gameplayIsVisible()){TIME_RUNTIME.lastTickAt=Date.now();TIME_RUNTIME.lifecycleCaptured=false}}});
window.addEventListener('pagehide',()=>{captureExitTimeContribution();lockParentAccess()});
setInterval(()=>checkpointGameplayActivity({reason:'interval'}),TIME_CHECKPOINT_MS);


$('continueBtn').onclick=()=>start(progression().lastMissionId||1);$('exitBtn').onclick=()=>{checkpointGameplayActivity({forceActive:true,reason:'exit'});applyWorldTheme('');show('home')};$('snackPractice').onclick=continueAsPractice;$('clearClose').onclick=hideClearBanner;$('snackRestart').onclick=()=>{hideSnackCard();if(G)G.paused=false;restartCurrentMission()};$('snackMap').onclick=()=>{hideSnackCard();$('exitBtn').click()};
$('reducedMotion').onchange=e=>{P().settings.reducedMotion=e.target.checked;save()};$('cameraMotionReduction').onchange=e=>{P().settings.cameraMotionReduction=e.target.checked;save()};$('largeTargets').onchange=e=>{P().settings.largeTargets=e.target.checked;save()};$('highContrast').onchange=e=>{P().settings.highContrast=e.target.checked;save()};$('captions').onchange=e=>{P().settings.captions=e.target.checked;save();setCaption(G?.m?.prompt||'')};$('dyslexicFont').onchange=e=>{P().settings.dyslexicFont=e.target.checked;save()};$('textScale').onchange=e=>{P().settings.textScale=e.target.value;save()};$('qualityTier').onchange=e=>{P().settings.qualityTier=e.target.value;save()};$('enemySpeed').onchange=e=>{P().settings.enemySpeed=e.target.value;save()};$('soundOn').onchange=e=>{P().settings.soundOn=e.target.checked;save()};$('musicOn').onchange=e=>{P().settings.musicOn=e.target.checked;syncMusic();save()};
$('addProfile').onclick=()=>{if(!parentShellRequired('profileActionStatus'))return;let n=$('newProfile').value.trim();if(!n)return;STORE.profiles.push(blank(n));STORE.active=STORE.profiles.length-1;$('newProfile').value='';save();lockParentAccess();show('home')};
$('exportActiveProfile').onclick=()=>{if(!parentShellRequired('profileActionStatus'))return;const profile=STORE.profiles[STORE.active];if(!profile)return;const b=new Blob([JSON.stringify(externalizeProfile(profile),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`brainbite-profile-${profile.name.replace(/[^\w-]+/g,'-').toLowerCase()||'kid'}.json`;a.click();URL.revokeObjectURL(a.href)};
$('deleteActiveProfile').onclick=async event=>{
 const status=$('profileActionStatus');if(!parentShellRequired('profileActionStatus'))return;
 if(STORE.profiles.length<=1){status.textContent='Keep at least one learner profile.';return}
 const profile=STORE.profiles[STORE.active],approved=await requestSensitiveAction({title:'Delete learner profile?',description:`This permanently removes ${profile.name}'s local mastery, rewards, and world state. A cloud deletion marker will be queued.`,confirmText:'Delete profile',confirmationValue:profile.name,confirmationPrompt:`Type ${profile.name} exactly`,invoker:event.currentTarget,statusId:'profileActionStatus'});
 if(!approved){status.textContent='Profile deletion cancelled. No progress was changed.';return}
 if(STORE.profiles.length<=1||STORE.profiles[STORE.active]?.id!==profile.id){status.textContent='Profile deletion stopped because the active profile changed.';return}
 const deletedAt=Date.now();rememberProfileDeletion(profile.id,deletedAt);queueSyncEvent({type:'profile-delete',profileId:profile.id,payload:{deletedAt},schemaVersion:STORE.schemaVersion,ts:deletedAt});await save();status.textContent=`${profile.name} was deleted locally.`;
 const c=cloudClient();if(c?.configured()&&c.session){try{await c.pushProfileDeletion(profile.id,deletedAt);const completed=SYNC.queue.filter(item=>item.type==='profile-delete'&&item.profileId===profile.id).map(item=>item.eventId||item.id);acknowledgeSyncEvents(completed);SYNC.queue=SYNC.queue.filter(item=>!completed.includes(item.eventId||item.id));await saveSync();status.textContent=`${profile.name} was deleted locally and the cloud deletion marker was saved.`}catch(error){status.textContent=`${profile.name} was deleted locally; cloud deletion remains queued: ${error.message}`}}
};
$('backupBtn').onclick=()=>{if(!parentShellRequired('saveHealth'))return;try{createManualBackupUnlocked();render();$('saveHealth').textContent='Backup created from the current valid save'}catch(error){$('saveHealth').textContent=`Backup failed: ${error?.name==='QuotaExceededError'?'device storage is full':'storage unavailable'}`}};
$('restoreBtn').onclick=async event=>{
 const status=$('saveHealth');if(!parentShellRequired('saveHealth'))return;
 if(!readStoredStore(localStorage.getItem(BACK))&&!readStoredStore(localStorage.getItem(RECOVERY_KEY))){status.textContent='No valid backup';return}
 const approved=await requestSensitiveAction({title:'Restore saved progress?',description:'Current progress will be replaced by the newest valid backup. A separate rollback snapshot of the current progress will be kept.',confirmText:'Restore backup',invoker:event.currentTarget,statusId:'saveHealth'});
 if(!approved){status.textContent='Restore cancelled. Current progress was not changed.';return}
 try{await replaceCanonicalStateSafely('restore',()=>{const recovered=readStoredStore(localStorage.getItem(BACK))||readStoredStore(localStorage.getItem(RECOVERY_KEY));if(!recovered)throw new Error('No valid backup');return recovered});status.textContent='Backup restored. The previous progress remains available as the pre-operation rollback snapshot.'}
 catch(error){status.textContent=`Restore failed; current progress was kept${error.rollbackStorageFailed?', but device storage could not be fully restored':''}: ${error.message}`}
};
$('exportBtn').onclick=()=>{if(!parentShellRequired('saveHealth'))return;const env=exportEnvelope(),b=new Blob([JSON.stringify(env,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='brainbite-progress-v2.json';a.click();URL.revokeObjectURL(a.href)};
$('importFile').onchange=async event=>{
 const status=$('saveHealth'),file=event.target.files?.[0];
 try{
  if(!file||!parentShellRequired('saveHealth'))return;
  let replacement;
  try{replacement=importedStoreFromText(await file.text())}catch(error){status.textContent=`Import rejected before any progress changed: ${error.message}`;return}
  const approved=await requestSensitiveAction({title:'Import progress?',description:'The selected file will replace current progress only after validation. A separate rollback snapshot will be kept.',confirmText:'Import progress',invoker:event.currentTarget,statusId:'saveHealth'});
  if(!approved){status.textContent='Import cancelled. Current progress was not changed.';return}
  await replaceCanonicalStateSafely('import',()=>replacement);status.textContent='Progress imported. The previous progress remains available as the pre-operation rollback snapshot.'
 }catch(error){status.textContent=`Import failed; current progress was kept${error.rollbackStorageFailed?', but device storage could not be fully restored':''}: ${error.message}`}
 finally{event.target.value=''}
};
const MAP={math:{fraction:8,multiplication:6,addition:2,prime:9},words:{synonym:12,antonym:13,spelling:17,homophone:18,context:19},spanish:{color:22,animal:23,food:24,family:25,greeting:21}};
function curriculumSkillForPractice(subject,grade,topic){
 const c=core();const taxonomy=c?.curriculumTaxonomy?.();if(!c||!taxonomy)return null;
 const normalizedGrade=grade||'K';const normalizedTopic=(topic||'').toLowerCase();
 const skills=taxonomy.skills||[];const subjectSkills=skills.filter(skill=>skill.subject===subject&&skill.grade===normalizedGrade);
 return subjectSkills.find(skill=>normalizedTopic&&[skill.keyword,skill.name,skill.domain].some(v=>String(v||'').toLowerCase().includes(normalizedTopic)))||subjectSkills[0]||null;
}
$('buildPractice').onclick=()=>{
 let s=$('practiceSubject').value,t=$('practiceTopic').value.toLowerCase(),difficulty=$('practiceDifficulty').value,grade=$('practiceGrade').value,homework=$('homeworkMode').checked,id=null,plan=null;
 for(const [k,v] of Object.entries(MAP[s]||{}))if(t.includes(k))id=v;
 if(!homework&&(s==='math'||s==='words'||s==='spanish')){
   if(!id)id=s==='math'?1:s==='words'?11:21;
   recordPracticeItem({subject:s,topic:t,grade,difficulty,missionId:id,type:'mission',ts:Date.now()});
   $('practiceResult').innerHTML=`Mapped to <b>${MISSIONS.find(m=>m.id===id).title}</b>. <button id="playPractice">Play now</button>`;
   document.getElementById('playPractice').onclick=()=>window.BrainBiteGame.startPracticeMission(id);
 } else {
   const skill=curriculumSkillForPractice(s,grade,t);
   const c=core();
   const seed=P().practice.length+1;
   const adaptive=skill&&c?.buildCurriculumSession?c.buildCurriculumSession({learner:ensureProfileLearningCore(P()),subject:s,grade,sessionMinutes:P().controls.maxSessionMinutes||20,skillStates:P().learningCore?.skills||{}}):null;
   const sessionItem=adaptive?.items?.find(item=>item.skillId===skill?.id)||adaptive?.items?.[0]||null;
   const routed=skill&&c?.createApprovedCurriculumChallenge?c.createApprovedCurriculumChallenge(skill.id,{subject:s,grade,topic:t,seed,difficulty,family:sessionItem?.family}):null;
   plan=routed?.approved?routed.challenge:null;
   const validation=plan&&c?c.validateGeneratedChallenge(plan,skill):null;
   const gate=plan&&validation?.approved?generatedChallengeGate(plan,skill,validation):null;
   const approved=!!(plan&&validation?.approved&&gate?.approved);
   const type=homework?'homework':'adaptive-practice';
   recordPracticeItem({subject:s,topic:t,grade,difficulty,homework,type,curriculumSkillId:skill?.id||null,contentId:plan?.id||null,contentIdentity:gate?.telemetry?.contentIdentity||null,manifestStatus:gate?.telemetry?.manifestStatus||null,gateMode:gate?.telemetry?.gateMode||currentContentGateMode(),sessionReason:sessionItem?.reason||'current-learning',ts:Date.now(),validated:approved,quarantined:!approved});
   if(!approved){$('practiceResult').textContent='This practice item did not pass content review and was quarantined.';save();return}
   const result=`${homework?'Homework':'Adaptive practice'} plan ready for <b>${skill.name}</b> (${skill.grade}).`;
   $('practiceResult').innerHTML=`${result} <span class="small">Content score: ${c.scoreContentQuality(plan,skill).score}</span> <button id="guidedPractice">${homework?'Start guided homework':'Start with support'}</button> <button id="independentPractice">Try independently</button>`;
   document.getElementById('guidedPractice').onclick=()=>window.BrainBiteGame.startCurriculumChallenge(plan,{assisted:true,homeworkMode:homework});
   document.getElementById('independentPractice').onclick=()=>window.BrainBiteGame.startCurriculumChallenge(plan,{assisted:false,homeworkMode:false});
 }
 save();
};


// Read-aloud: a child who cannot read fluently must be able to hear the task and, most
// importantly, why an answer was wrong. Explicit buttons only, so nothing speaks unasked.
function speakText(text){
 const value=String(text||'').trim();
 if(!value||typeof speechSynthesis==='undefined')return false;
 try{
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(value);
  utterance.lang=(G?.m?.world==='spanish'||document.querySelector('#prompt')?.lang==='es')?'es-ES':'en-US';
  speechSynthesis.speak(utterance);
  return true;
 }catch{return false}
}
$('speakPrompt').onclick=()=>{if(!G)return;speakText(G.m.prompt)};
const speakFeedback=$('speakFeedback');if(speakFeedback)speakFeedback.onclick=()=>{const text=$('feedback')?.textContent||'';if(!speakText(text))setCaption('Nothing to read yet.')};

const codeRun=$('codeRun'),codeStep=$('codeStep'),codeReset=$('codeReset'),codeSuggest=$('codeSuggest');
if(codeRun&&codeStep&&codeReset){
 const runCode=(action)=>{
  const bridge=codeBridge();
  if(!bridge){$('codeBridgeFeedback').textContent='Code Bridge is still loading.';return}
  const program=$('codeProgram').value;
  try{
   let result;
   if(action==='run'){CODE_BRIDGE_PROGRAM=program;result=bridge.run(program)}
   else if(action==='step'){
    if(CODE_BRIDGE_PROGRAM!==program){CODE_BRIDGE_PROGRAM=program;bridge.load(program)}
    result=bridge.step();
   }else{CODE_BRIDGE_PROGRAM='';CODE_BRIDGE_AWARDED='';result=bridge.reset()}
   renderCodeBridge(result);
   if(result.done&&result.state.bridgeOpen){
    const awarded=recordCodeBridgeCompletion(result,program);
    $('codeBridgeFeedback').textContent=awarded?'Bridge open. Coding evidence recorded.':'Bridge open. This program was already recorded.';
   }else if(action==='reset')$('codeBridgeFeedback').textContent='Bridge reset. Ready for another program.';
   else $('codeBridgeFeedback').textContent=result.done?'Program complete. Open the bridge to finish.':`Step ${result.cursor} of ${result.total}.`;
  }catch(error){$('codeBridgeFeedback').textContent=`Program stopped safely: ${error.message}`;renderCodeBridge(bridge.getState())}
 };
 codeRun.onclick=()=>runCode('run');codeStep.onclick=()=>runCode('step');codeReset.onclick=()=>runCode('reset');
 renderCodeBridge(codeBridge()?.getState());
}
if(codeSuggest){
 codeSuggest.onclick=()=>{
  if(currentContentGateMode()!=='internal-review'){$('codeLessonLabel').textContent='Lessons are awaiting educator review.';$('codeBridgeFeedback').textContent='Lesson suggestions are unavailable in production until review is complete.';return}
  const lesson=window.BrainBiteCodeCurriculum?.selectLesson(P()?.codeBridgeLessons||{});
  if(!lesson){$('codeLessonLabel').textContent='All available lessons completed.';return}
  CODE_BRIDGE_LESSON_ID=lesson.id;$('codeProgram').value=lesson.program;$('codeLessonLabel').textContent=` ${lesson.title} · ${lesson.difficulty} · ${lesson.support} support`;
  $('codeBridgeFeedback').textContent='Lesson loaded. Run it when you are ready.';
 };
}

const codeLabRun=$('codeLabRun'),codeLabReset=$('codeLabReset'),codeLabExport=$('codeLabExport'),codeLabImport=$('codeLabImport'),codeLabImportFile=$('codeLabImportFile');
function renderCodeLab(project,result=null){
 if(project)$('codeLabState').textContent=JSON.stringify(result?{success:result.success,state:result.result.state,trace:result.result.trace,project:result.project}:project,null,2);
}
if(codeLabRun&&codeLabReset&&codeLabExport&&codeLabImport){
 codeLabRun.onclick=()=>{
  const api=window.BrainBiteCodeLab;
  if(!api){$('codeLabFeedback').textContent='Code Lab is still loading.';return}
  try{
   const project=api.createProject({id:$('codeLabName').value,name:$('codeLabName').value,program:$('codeLabProgram').value});
   const result=api.runProject(project);P().codeLabProjects={...(P().codeLabProjects||{}),[project.id]:result.project};
   if(result.success)updateSkill('coding-bridge',true,{attemptId:`code-lab-${project.id}-${checksum(project.program)}`,independent:true,assisted:false,responseTimeMs:Math.max(1000,result.result.trace.length*800),source:'code-lab'});
   $('codeLabName').value=project.id;$('codeLabFeedback').textContent=result.success?'Project ran successfully. Coding evidence recorded.':'Project ran safely. Open the bridge and unlock the gate to complete it.';renderCodeLab(result.project,result);save();
  }catch(error){$('codeLabFeedback').textContent=`Project stopped safely: ${error.message}`}
 };
 codeLabReset.onclick=()=>{const id=$('codeLabName').value.trim().toLowerCase();const current=P().codeLabProjects?.[id];if(!current){$('codeLabFeedback').textContent='No saved project to reset.';return}const reset=window.BrainBiteCodeLab.resetProject(current);P().codeLabProjects[id]=reset;renderCodeLab(reset);$('codeLabFeedback').textContent='Project reset.';save()};
 codeLabExport.onclick=()=>{try{const project=window.BrainBiteCodeLab.createProject({id:$('codeLabName').value,name:$('codeLabName').value,program:$('codeLabProgram').value});const blob=new Blob([window.BrainBiteCodeLab.serializeProject(project)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`brainbite-code-lab-${project.id}.json`;link.click();URL.revokeObjectURL(link.href);$('codeLabFeedback').textContent='Project exported.'}catch(error){$('codeLabFeedback').textContent=`Export stopped safely: ${error.message}`}};
 codeLabImport.onclick=()=>codeLabImportFile.click();
 codeLabImportFile.onchange=async event=>{try{const project=window.BrainBiteCodeLab.deserializeProject(await event.target.files[0].text());P().codeLabProjects={...(P().codeLabProjects||{}),[project.id]:project};$('codeLabName').value=project.id;$('codeLabProgram').value=project.program;renderCodeLab(project);$('codeLabFeedback').textContent='Project imported safely.';save()}catch(error){$('codeLabFeedback').textContent=`Import rejected: ${error.message}`}finally{event.target.value=''}};
}

document.addEventListener('keydown',e=>{if(!$('game').classList.contains('show'))return;const k=e.key.toLowerCase();if(['arrowup','w'].includes(k))move(0,-1);if(['arrowdown','s'].includes(k))move(0,1);if(['arrowleft','a'].includes(k))move(-1,0);if(['arrowright','d'].includes(k))move(1,0)});document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{let d=b.dataset.d;if(d==='u')move(0,-1);if(d==='d')move(0,1);if(d==='l')move(-1,0);if(d==='r')move(1,0)});render();
window.addEventListener('load',()=>render());

const installBtn=$('installBtn');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(installBtn)installBtn.hidden=false});
if(installBtn)installBtn.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true};



$('saveControls').onclick=()=>{const d=Math.max(5,Math.min(180,Number($('dailyMinutes').value)||30)),requested=Math.max(5,Math.min(120,Number($('maxSessionMinutes').value)||20)),m=Math.min(d,requested),corrected=m!==requested;P().controls={dailyMinutes:d,maxSessionMinutes:m,requireParentForPractice:$('requireParentForPractice').checked};$('dailyMinutes').value=d;$('maxSessionMinutes').value=m;$('controlsStatus').textContent=corrected?`Parent controls saved. Session limit corrected to ${m} minutes so it does not exceed the daily limit.`:'Parent controls saved.';clearTimeUsageWarning();save()};
$('timeUpParentOverride').onclick=async()=>{if(!await requireParentAuthorization())return;const profileId=P().id;queueTimeUsageMutation(profileId,(entry,now)=>({...entry,extensionGrantedMs:TIME_EXTENSION_MS,updatedAt:now,lastSeenWallClock:Math.max(entry.lastSeenWallClock,now)}));const state=timeLimitState();if(state.extensionRemainingMs<=0){$('timeUpStatus').textContent='The 15-minute extension for today has already been used.';return}const pending=TIME_PENDING_LAUNCH;G&&(G.timeExpired=false);TIME_RUNTIME={profileId,sessionId:TIME_USAGE.profiles[profileId]?.sessionId||null,lastTickAt:Date.now(),lifecycleCaptured:false};$('timeUpStatus').textContent='15 active minutes added.';if(G)show('game');else if(pending){TIME_PENDING_LAUNCH=null;launchMission(pending.mission,pending.options)}else show('home')};
$('timeUpReturnHome').onclick=()=>{G=null;TIME_PENDING_LAUNCH=null;TIME_RUNTIME={profileId:null,sessionId:null,lastTickAt:0,lifecycleCaptured:false};applyWorldTheme('');show('home');render()};


$('createCloudAccount').onclick=async()=>{
 try{const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');const email=$('localAccountEmail').value.trim(),password=$('parentPassword').value;if(password.length<8)throw new Error('Password must be at least 8 characters');await c.signUp(email,password);renderCloudAuth();$('localAccountStatus').textContent=c.session?'Account created and signed in.':'Account created. Check email if confirmation is required.'}
 catch(e){$('localAccountStatus').textContent=e.message}finally{$('parentPassword').value=''}
};
$('signInCloud').onclick=async()=>{
 try{const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');await c.signIn($('localAccountEmail').value.trim(),$('parentPassword').value);renderCloudAuth()}
 catch(e){$('localAccountStatus').textContent=e.message}finally{$('parentPassword').value=''}
};
$('signOutCloud').onclick=async()=>{try{const c=cloudClient();if(c)await c.signOut();renderCloudAuth()}catch(e){$('localAccountStatus').textContent=e.message}finally{$('parentPassword').value=''}};
$('pushCloudSync').onclick=async()=>{try{await pushAllToFirebase();$('mergeResult').textContent='Cloud upload complete.'}catch(e){$('mergeResult').textContent=e.message}};
$('pullCloudSync').onclick=async()=>{try{await pullAllFromFirebase();$('mergeResult').textContent='Cloud download and merge complete.'}catch(e){$('mergeResult').textContent=e.message}};



$('copyFirebaseChecklist').onclick=async()=>{
 const text=`BrainBite Firebase Setup
1. Create Firebase project
2. Enable Email/Password Authentication
3. Create Firestore
4. Deploy firebase/firestore.rules
5. Paste Project ID + Web API key into BrainBite Integrations`;
 try{await navigator.clipboard.writeText(text);$('copySetupMsg').textContent='Copied.'}catch{$('copySetupMsg').textContent='Copy unavailable.'}
};

$('saveCloudConfig').onclick=()=>{const provider=$('cloudProvider').value,url=$('cloudUrl').value.trim(),key=$('cloudKey').value.trim();if(provider!=='none'&&(!/^[a-z0-9-]{6,}$/.test(url)||key.length<20)){$('cloudConfigMsg').textContent='Add a valid Firebase Project ID and Web API key.';return}INTEGRATIONS.cloud={provider,url,key};saveIntegrations();$('cloudConfigMsg').textContent='Firebase configuration saved locally.'};
$('runIntegrationCheck').onclick=async()=>{const rows=await integrationCheck();$('integrationCheckResult').innerHTML=rows.map(([n,ok])=>`<div><span class="${ok?'integration-ok':'integration-warn'}">${ok?'PASS':'CHECK'}</span> ${n}</div>`).join('')};


$('retryQueue').onclick=async()=>{try{const r=await retryPendingSync();$('mergeResult').textContent=`Retry finished: ${r.ok} ok, ${r.failed} failed.`}catch(e){$('mergeResult').textContent=e.message}};
$('exportCloudSnapshot').onclick=()=>{const b=new Blob([JSON.stringify(cloudSnapshot(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='brainbite-cloud-snapshot.json';a.click()};
$('deleteCloudAccount').onclick=async event=>{
 const status=$('mergeResult');if(!parentShellRequired('mergeResult'))return;
 const c=cloudClient();if(!c||!c.session){status.textContent='Sign in before deleting cloud family data or the Firebase account.';return}
 const approved=await requestSensitiveAction({title:'Delete cloud family and account?',description:'BrainBite will first delete the signed-in family data, then delete the Firebase authentication account. Local learner progress is kept.',confirmText:'Delete cloud account',invoker:event.currentTarget,statusId:'mergeResult'});
 if(!approved){status.textContent='Cloud deletion cancelled. No cloud or local state was changed.';return}
 try{await c.deleteFamily()}
 catch(error){status.textContent=`Cloud family data deletion failed before account deletion. The Firebase account, local progress, session, and pending sync queue were kept: ${error.message}`;return}
 try{await c.deleteAuthAccount()}
 catch(error){status.textContent=`Cloud family data was deleted, but Firebase account deletion failed. The signed-in session and pending sync queue were kept so a parent can retry safely: ${error.message}`;return}
 try{const ids=SYNC.queue.map(item=>item.eventId||item.id);acknowledgeSyncEvents(ids);SYNC.queue=SYNC.queue.filter(item=>!ids.includes(item.eventId||item.id));SYNC.lastSync=null;SYNC.provider='local-only';await saveSync();renderCloudAuth();status.textContent='Cloud family data and Firebase account were deleted. Local learner progress remains on this device.'}
 catch(error){status.textContent=`Cloud family data and Firebase account were deleted, but local sync cleanup failed. Local learner progress was kept: ${error.message}`}
};

$('saveLocalAccount').onclick=()=>{const email=$('localAccountEmail').value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){$('localAccountStatus').textContent='Enter a valid email address.';return}SYNC.account={email,createdAt:SYNC.account?.createdAt||Date.now()};saveSync()};
if('serviceWorker'in navigator){
 const updateStatus=$('updateStatus'),applyUpdate=$('applyUpdate');
 const announceUpdate=message=>{if(updateStatus)updateStatus.textContent=message;if(applyUpdate)applyUpdate.hidden=false};
 navigator.serviceWorker.addEventListener('controllerchange',()=>announceUpdate('A new version is ready.'));
 if(applyUpdate)applyUpdate.onclick=()=>location.reload();
 navigator.serviceWorker.ready.then(reg=>{reg.update().catch(()=>{})}).catch(()=>{});
}
window.addEventListener('online',()=>{$('updateStatus').textContent='Online'});
window.addEventListener('offline',()=>{$('updateStatus').textContent='Offline mode'});

const bubbleReefLivePreviewBtn=$('bubbleReefLivePreviewBtn');
if(bubbleReefLivePreviewBtn){
 bubbleReefLivePreviewBtn.hidden=currentContentGateMode()!=='internal-review';
 bubbleReefLivePreviewBtn.onclick=async()=>{
  const status=$('bubbleReefLivePreviewStatus');
  if(currentContentGateMode()!=='internal-review'){status.textContent='Live Bubble Reef preview is awaiting educator review.';return}
  const profile=await window.BrainBiteWorldPreview?.setProfile?.('bubble-reef');
  status.textContent=profile==='bubble-reef'?'Live 3D Bubble Reef preview loaded.':'Live 3D preview unavailable.';
  document.querySelector('button[data-screen="home"]')?.click();
 };
}

$('downloadReleaseBackup').onclick=()=>{const b=new Blob([JSON.stringify(exportEnvelope(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='brainbite-v2.0-release-backup.json';a.click()};
$('downloadDiagnostics').onclick=()=>{const b=new Blob([JSON.stringify(diagnosticBundle(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='brainbite-v2.0-diagnostics.json';a.click()};


$('labLearnerSelect').onchange=()=>{const id=$('labLearnerSelect').value;applyLabFoundation(foundation=>{if(foundation.learners[id])foundation.activeLearnerId=id})};
$('labSwitchLearner').onclick=()=>{$('labLearnerSelect').dispatchEvent(new Event('change'))};
$('labCreateLearner').onclick=()=>{const c=core();if(!c)return;const name=$('labLearnerName').value.trim()||`Lab Kid ${Date.now()}`;applyLabFoundation(foundation=>{const learner=c.defaultLearner(name);foundation.learners[learner.profileId]=learner;foundation.activeLearnerId=learner.profileId;$('labLearnerName').value=''})};
$('labResetLearner').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];foundation.learners[foundation.activeLearnerId]=c.defaultLearner(learner.name,learner.profileId)})};
$('labSetSkillState').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];const skillId=$('labSkill').value||LAB.skillId||'number-facts';learner.skills[skillId]=labPresetState($('labSkillPreset').value||LAB.preset||'practicing',skillId);learner.mastery[skillId]=learner.skills[skillId].masteryScore})};
$('labSimCorrect').onclick=()=>simulateLabAttempt('correct');
$('labSimAssisted').onclick=()=>simulateLabAttempt('assisted');
$('labSimIncorrect').onclick=()=>simulateLabAttempt('incorrect');
$('labSimRandom').onclick=()=>simulateLabAttempt('random');
$('labForceBrainBase').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];learner.stage='brainbase';learner.activeActivity=null;learner.currentChallenge=null})};
$('labJumpKraken').onclick=()=>{if(!labAllowed())return;LAB.krakenPhase=$('labKrakenPhase').value||LAB.krakenPhase||'intro';saveLab()};
$('labGrantReward').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];foundation.learners[foundation.activeLearnerId]=c.grantBrainifact(learner,'fraction-kraken')})};
$('labUpgradeHub').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];foundation.learners[foundation.activeLearnerId]=c.upgradeBrainBase(learner)})};
$('labQueueOffline').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];const skillId=$('labSkill').value||LAB.skillId||'number-facts';const event={id:newCryptographicUuid(),type:'LearningAttemptRecorded',payload:{skillId,family:$('labFamily').value||LAB.family||'target-smash',difficulty:$('labDifficulty').value||LAB.difficulty||'normal',mode:'queued'},createdAt:Date.now()};foundation.learners[foundation.activeLearnerId]=c.queueOfflineEvent(learner,event)})};
$('labReplayOffline').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];const replay=c.replayOfflineQueue(learner,()=>true);foundation.learners[foundation.activeLearnerId]=replay.learner})};
$('labSaveSnapshot').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>c.createRecoverySnapshot(foundation))};
$('labCorruptSave').onclick=()=>{if(!labAllowed())return;const foundation=loadFoundation();if(!foundation)return;persistFoundation(foundation);localStorage.setItem(KEY,'{broken');renderLab()};
$('labRestoreRecovery').onclick=()=>{if(!labAllowed())return;const recovered=readStoredStore(localStorage.getItem(BACK))||readStoredStore(localStorage.getItem(RECOVERY_KEY));if(!recovered)return;STORE=recovered;writeStoreCopies(STORE);render();renderLab()};
$('labRefreshBrainBase').onclick=()=>{renderBrainBase(loadFoundation());renderLab()};
$('labSkill').onchange=renderLab;
$('labFamily').onchange=renderLab;
$('labDifficulty').onchange=renderLab;
$('labSkillPreset').onchange=renderLab;
$('labKrakenPhase').onchange=renderLab;

$('qaDeviceA').onclick=()=>{QA.deviceA=true;QA.deviceAPushed=false;saveQA();alert('Device A: play a mission, then use Account & Sync → Push to Cloud. Mark the next step after that push succeeds.')};
$('qaDeviceB').onclick=()=>{QA.deviceB=true;saveQA();alert('Device B: open BrainBite on a second browser/device, sign in with the same parent account, then Pull from Cloud.')};
$('qaIsolation').onclick=()=>{QA.isolationTested=true;saveQA();alert('Isolation test: sign in with a different Firebase parent account. That account must not be able to read the first family profile documents.')};
// Keep the board's grid semantics valid for assistive technology without changing its visual layout.
new MutationObserver(() => {
 const board=document.getElementById('board');
 if(!board||board.firstElementChild?.getAttribute('role')==='row')return;
 const cells=[...board.children].filter(el=>el.getAttribute('role')==='gridcell');
 if(!cells.length)return;
 for(let i=0;i<cells.length;i+=5){const row=document.createElement('div');row.setAttribute('role','row');row.setAttribute('aria-rowindex',String(i/5+1));board.insertBefore(row,cells[i]);cells.slice(i,i+5).forEach(cell=>row.appendChild(cell))}
}).observe(document.body,{childList:true,subtree:true});
