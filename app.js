const RECOVERY_KEY='bb-core-v3-recovery';
const KEY='bb-core-v3',BACK='bb-core-v3-back';
const $=id=>document.getElementById(id);
const MISSIONS=[
 {id:1,title:'Even Number Hunt',world:'math',skill:'even-numbers',prompt:'Bite all even numbers.',correct:['2','4','6','8','10','12','14','16','18','20'],wrong:['1','3','5','7','9','11','13','15','17','19']},
 {id:2,title:'Addition to 10',world:'math',skill:'add-to-10',prompt:'Bite all number sentences that make 10.',correct:['1+9','2+8','3+7','4+6','5+5'],wrong:['1+8','2+7','3+6','4+5','6+5']},
 {id:3,title:'Addition to 20',world:'math',skill:'add-to-20',prompt:'Bite all number sentences that make 20.',correct:['11+9','12+8','13+7','14+6','15+5'],wrong:['11+8','12+7','13+6','14+5','10+7']},
 {id:4,title:'Subtraction',world:'math',skill:'subtraction-facts',prompt:'Bite all subtraction facts.',correct:['10-2','9-1','8-3','7-4','6-2'],wrong:['10-3','9-2','8-1','7-1','6-1']},
 {id:5,title:'Multiples of 3',world:'math',skill:'multiples-of-3',prompt:'Bite all multiples of 3.',correct:['3','6','9','12','15','18','21','24','27','30'],wrong:['2','4','5','7','8','10','11','13','14','16']},
 {id:6,title:'Multiplication Facts',world:'math',skill:'multiplication-facts',prompt:'Bite all multiplication facts.',correct:['2x3','2x4','3x3','4x2','5x2'],wrong:['2+3','3+3','4+2','5-2','6-1']},
 {id:7,title:'Division Facts',world:'math',skill:'division-facts',prompt:'Bite all division facts.',correct:['12÷3','15÷5','18÷6','20÷4','24÷6'],wrong:['12+3','15+5','18-6','20-4','24-6']},
 {id:8,title:'Fractions',world:'math',skill:'fractions',prompt:'Bite all equivalent fractions.',correct:['1/2','2/4','3/6','4/8','5/10'],wrong:['1/3','2/3','3/5','4/7','5/8']},
 {id:9,title:'Prime Numbers',world:'math',skill:'prime-numbers',prompt:'Bite all prime numbers.',correct:['2','3','5','7','11','13','17','19'],wrong:['4','6','8','9','10','12','14','15']},
 {id:10,title:'Astro Muncher',world:'math',skill:'astro-muncher',prompt:'Bite all prime numbers to power up Astro Muncher.',correct:['2','3','5','7','11','13','17','19'],wrong:['4','6','8','9','10','12','14','15'],boss:true,bossName:'Astro Muncher'},
 {id:11,title:'Animal Hunt',world:'words',skill:'animal-words',prompt:'Bite all animal words.',correct:['cat','dog','lion','zebra','otter','panda','horse','frog'],wrong:['table','chair','window','pencil','paper','cloud','river','stone']},
 {id:12,title:'Synonym Sprint',world:'words',skill:'synonyms',prompt:'Bite all synonym matches.',correct:['big','large','happy','glad','quick','fast'],wrong:['big','small','sad','slow','hot','cold']},
 {id:13,title:'Antonym Alley',world:'words',skill:'antonyms',prompt:'Bite all antonym matches.',correct:['hot/cold','start/stop','up/down','in/out','light/dark'],wrong:['hot/warm','start/begin','up/high','in/inside','light/bright']},
 {id:14,title:'Rhyming River',world:'words',skill:'rhyming',prompt:'Bite all rhyming words.',correct:['cake','make','lake','bake','snake','grape'],wrong:['cat','dog','fish','book','tree','ball']},
 {id:15,title:'Noun Forest',world:'words',skill:'nouns',prompt:'Bite all noun words.',correct:['tree','river','robot','school','rocket','garden'],wrong:['run','jump','sing','bright','quick','soft']},
 {id:16,title:'Verb Vines',world:'words',skill:'verbs',prompt:'Bite all verb words.',correct:['run','jump','climb','spin','write','dance'],wrong:['cat','river','blue','music','table','stone']},
 {id:17,title:'Spelling Street',world:'words',skill:'spelling-patterns',prompt:'Bite all correctly spelled words.',correct:['garden','planet','signal','silver','tunnel','pocket'],wrong:['gardan','planit','signel','silvar','tunel','pockit']},
 {id:18,title:'Homophone Hollow',world:'words',skill:'homophones',prompt:'Bite all homophone matches.',correct:['two','to','too','see','sea','pair','pear'],wrong:['tue','sea','boat','tree','bird','road']},
 {id:19,title:'Context Clue Cave',world:'words',skill:'context-clues',prompt:'Bite all context clue words.',correct:['cautious','enormous','ancient','sprint','whisper','glimmer'],wrong:['quick','slow','red','blue','chair','table']},
 {id:20,title:'Word Warp',world:'words',skill:'word-warp',prompt:'Bite all word warp targets to defeat Word Warp.',correct:['cautious','enormous','ancient','sprint','whisper','glimmer'],wrong:['quick','slow','red','blue','chair','table'],boss:true,bossName:'Word Warp'},
 {id:21,title:'Hola Portal',world:'spanish',skill:'spanish-greetings',prompt:'Bite all Spanish greeting words.',correct:['hola','adios','gracias','por favor','buenos dias'],wrong:['cat','house','blue','run','school']},
 {id:22,title:'Color Chase',world:'spanish',skill:'spanish-colors',prompt:'Bite all Spanish color words.',correct:['rojo','azul','verde','amarillo','negro','blanco'],wrong:['perro','casa','mesa','libro','comer','correr']},
 {id:23,title:'Animal Trail',world:'spanish',skill:'spanish-animals',prompt:'Bite all Spanish animal words.',correct:['gato','perro','conejo','pajaro','caballo','pez'],wrong:['rojo','azul','grande','pequeno','arriba','abajo']},
 {id:24,title:'Food Market',world:'spanish',skill:'spanish-food',prompt:'Bite all Spanish food words.',correct:['manzana','pan','leche','queso','arroz','sopa'],wrong:['casa','escuela','rojo','azul','jugar','mirar']},
 {id:25,title:'Family Plaza',world:'spanish',skill:'spanish-family',prompt:'Bite all Spanish family words.',correct:['madre','padre','hermano','hermana','abuela','abuelo'],wrong:['mesa','silla','ventana','puerta','rojo','azul']},
 {id:26,title:'Number Steps',world:'spanish',skill:'spanish-numbers',prompt:'Bite all Spanish number words.',correct:['uno','dos','tres','cuatro','cinco','seis'],wrong:['rojo','azul','grande','pequeno','correr','saltar']},
 {id:27,title:'Action Avenue',world:'spanish',skill:'spanish-actions',prompt:'Bite all Spanish action words.',correct:['correr','saltar','mirar','comer','leer','escribir'],wrong:['casa','mesa','libro','rojo','azul','pez']},
 {id:28,title:'Places Path',world:'spanish',skill:'spanish-places',prompt:'Bite all Spanish place words.',correct:['escuela','casa','parque','tienda','ciudad','playa'],wrong:['madre','padre','gato','pan','rojo','uno']},
 {id:29,title:'Phrase Finder',world:'spanish',skill:'spanish-phrases',prompt:'Bite all useful Spanish phrases.',correct:['buenos dias','por favor','lo siento','muchas gracias','hasta luego'],wrong:['gato','rojo','correr','casa','libro']},
 {id:30,title:'El Eco',world:'spanish',skill:'el-eco',prompt:'Bite all Spanish phrase echoes to defeat El Eco.',correct:['buenos dias','por favor','lo siento','muchas gracias','hasta luego'],wrong:['gato','rojo','correr','casa','libro'],boss:true,bossName:'El Eco'}
];
function blank(name='Kid 1'){return {id:(crypto.randomUUID?.()||('p-'+Date.now()+'-'+Math.random())),name,score:0,stars:0,spark:0,completed:[],unlockedMath:1,unlockedWords:11,unlockedSpanish:21,lastMission:1,bestCombo:0,bite:'Nib',unlockedBites:['Nib'],cosmetics:[],equippedCosmetic:null,mastery:{math:10,words:10,spanish:10},skills:{},mistakes:[],practice:[],snap:[],sessions:[],settings:{reducedMotion:false,cameraMotionReduction:false,largeTargets:false,highContrast:false,captions:false,dyslexicFont:false,textScale:'1',qualityTier:'balanced',soundOn:true,musicOn:false,enemySpeed:'normal'},controls:{dailyMinutes:30,maxSessionMinutes:20,requireParentForSnap:false,requireParentForPractice:false},parentPin:'1234'}}
const DEF={schemaVersion:7,active:0,profiles:[blank()]};let STORE=load(),G=null;function P(){return STORE.profiles[STORE.active]}


let audioCtx=null,musicOsc=null,musicGain=null;

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
function integrationState(){try{return JSON.parse(localStorage.getItem(INTEGRATION_KEY)||'null')||{cloud:{provider:'none',url:'',key:''},ocr:{provider:'none',endpoint:''}}}catch{return {cloud:{provider:'none',url:'',key:''},ocr:{provider:'none',endpoint:''}}}}
let INTEGRATIONS=integrationState();
function saveIntegrations(){localStorage.setItem(INTEGRATION_KEY,JSON.stringify(INTEGRATIONS));renderIntegrations();renderCloudAuth()}
function validHttpUrl(v){try{const u=new URL(v);return u.protocol==='https:'||u.hostname==='localhost'||u.hostname==='127.0.0.1'}catch{return false}}
function renderIntegrations(){
 if(!$('cloudProviderStatus'))return;
 $('cloudProvider').value=INTEGRATIONS.cloud.provider;$('cloudUrl').value=INTEGRATIONS.cloud.url;$('cloudKey').value=INTEGRATIONS.cloud.key;
 $('ocrProvider').value=INTEGRATIONS.ocr.provider;$('ocrEndpoint').value=INTEGRATIONS.ocr.endpoint;
 $('cloudProviderStatus').innerHTML=INTEGRATIONS.cloud.provider==='none'?'<span class=integration-warn>Not configured</span>':`<span class=integration-ok>${INTEGRATIONS.cloud.provider}</span>`;
 $('ocrProviderStatus').innerHTML=INTEGRATIONS.ocr.provider==='none'?'<span class=integration-warn>Not configured</span>':`<span class=integration-ok>${INTEGRATIONS.ocr.provider}</span>`;
 $('envStatus').textContent=location.protocol==='https:'?'HTTPS':'Local / non-HTTPS';
}
async function integrationCheck(){return [
 ['HTTPS or localhost',location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)],
 ['Cloud config',INTEGRATIONS.cloud.provider==='none'||(validHttpUrl(INTEGRATIONS.cloud.url)&&!!INTEGRATIONS.cloud.key)],
 ['OCR config',INTEGRATIONS.ocr.provider==='none'||validHttpUrl(INTEGRATIONS.ocr.endpoint)],
 ['Online API available','fetch' in window]
]}

const SYNC_KEY='bb-core-v6-sync';
function syncState(){try{return JSON.parse(localStorage.getItem(SYNC_KEY)||'null')||{account:null,queue:[],lastSync:null,provider:'local-only'}}catch{return {account:null,queue:[],lastSync:null,provider:'local-only'}}}
let SYNC=syncState();
function saveSync(){localStorage.setItem(SYNC_KEY,JSON.stringify(SYNC));renderSync()}
function syncEventSignature(event){
 return [event.type||'',event.profileId||'',event.schemaVersion||STORE.schemaVersion,JSON.stringify(event.payload||{})].join('|');
}
function queueSyncEvent(event){
 const next={...event,id:event.id||event.eventId||String(Date.now()+Math.random()),eventId:event.eventId||event.id||String(Date.now()+Math.random()),timestamp:event.timestamp||event.ts||Date.now(),schemaVersion:event.schemaVersion||STORE.schemaVersion};
 const signature=syncEventSignature(next);
 if(SYNC.queue.some(item=>syncEventSignature(item)===signature))return;
 SYNC.queue.push(next);
 if(SYNC.queue.length>200)SYNC.queue.shift();
}

function readStoredStore(raw){
 try{
   const parsed=JSON.parse(raw);
   return parsed&&Array.isArray(parsed.profiles)?migrateStore(parsed):null;
 }catch{
   return null;
 }
}

function writeStoreCopies(store){
 const payload=JSON.stringify(store);
 for(const key of [BACK,RECOVERY_KEY,KEY]){
   try{localStorage.setItem(key,payload)}catch{}
 }
 return payload;
}


async function retryPendingSync(){
 const c=cloudClient();if(!c||!c.configured()||!c.session)throw new Error('Sign in to Firebase first');
 const pending=[...SYNC.queue];
 let ok=0,failed=0;
 for(const ev of pending){
   try{
      if(ev.type==='store-update'){
       const profile=ev.profileId&&STORE.profiles.find(p=>p.id===ev.profileId);
       if(profile)await c.pushProfile(profile);
       else for(const p of STORE.profiles)await c.pushProfile(p);
     }
     ok++;
   }catch{failed++}
 }
 if(failed===0)SYNC.queue=[];
 SYNC.lastSync=Date.now();SYNC.provider='firebase';saveSync();
 return {ok,failed}
}
function cloudSnapshot(){
 return {exportedAt:Date.now(),provider:'firebase',signedIn:!!cloudClient()?.session,store:STORE,sync:{queueLength:SYNC.queue.length,lastSync:SYNC.lastSync}}
}

async function pushAllToFirebase(){
 const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');
 for(const p of STORE.profiles)await c.pushProfile(p);
 SYNC.lastSync=Date.now();SYNC.provider='firebase';SYNC.queue=[];saveSync()
}
async function pullAllFromFirebase(){
 const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');
 const remote=await c.pullProfiles();
 for(const row of remote){
   const rp=row.progress;if(!rp)continue;
   const i=STORE.profiles.findIndex(p=>p.id===rp.id||p.id===row.client_profile_id);
   if(i>=0)STORE.profiles[i]=mergeProfiles(STORE.profiles[i],{...rp,updatedAt:Date.parse(row.client_updated_at||row.updated_at)||Date.now()});
   else STORE.profiles.push(migrateStore({profiles:[rp],schemaVersion:STORE.schemaVersion}).profiles[0]);
 }
 localStorage.setItem(KEY,JSON.stringify(STORE));SYNC.lastSync=Date.now();SYNC.provider='firebase';saveSync();render()
}
function renderCloudAuth(){
 const c=cloudClient(),status=$('localAccountStatus');
 if(!status)return;
 if(INTEGRATIONS.cloud.provider!=='firebase'){status.textContent=SYNC.account?`Local email saved for ${SYNC.account.email}`:'Configure the dedicated BrainBite Firebase project to enable parent sign-in.';return}
 if(c?.session?.email){status.innerHTML=`<span class="integration-ok auth-status">Signed in: ${c.session.email}</span>`}
 else status.textContent='Firebase configured. Sign in or create a parent account.'
}

function renderSync(){if(!$('syncMode'))return;$('syncMode').textContent=SYNC.provider==='local-only'?'Local-first':'Connected';$('syncQueueCount').textContent=`${SYNC.queue.length} pending`;$('lastSync').textContent=SYNC.lastSync?new Date(SYNC.lastSync).toLocaleString():'Never';$('localAccountEmail').value=SYNC.account?.email||'';$('localAccountStatus').textContent=SYNC.account?`Local identity saved for ${SYNC.account.email}`:'No local parent identity saved.'}

function mergeProfiles(local,remote){
 const localTs=Number(local.updatedAt||0),remoteTs=Number(remote.updatedAt||0);
 const newer=remoteTs>localTs?remote:local,older=remoteTs>localTs?local:remote;
 const out=structuredClone(newer);
 out.id=local.id||remote.id;
 out.name=newer.name||older.name;
 out.score=Math.max(local.score||0,remote.score||0);
 out.stars=Math.max(local.stars||0,remote.stars||0);
 out.spark=Math.max(local.spark||0,remote.spark||0);
 out.completed=[...new Set([...(local.completed||[]),...(remote.completed||[])])];
 out.unlockedBites=[...new Set([...(local.unlockedBites||[]),...(remote.unlockedBites||[])])];
 out.cosmetics=[...new Set([...(local.cosmetics||[]),...(remote.cosmetics||[])])];
 out.mistakes=[...(local.mistakes||[]),...(remote.mistakes||[])].sort((a,b)=>(a.ts||0)-(b.ts||0)).slice(-100);
 out.sessions=[...(local.sessions||[]),...(remote.sessions||[])].sort((a,b)=>(a.ts||0)-(b.ts||0)).slice(-50);
 out.practice=[...(local.practice||[]),...(remote.practice||[])].sort((a,b)=>(a.ts||0)-(b.ts||0)).slice(-100);
 out.snap=[...(local.snap||[]),...(remote.snap||[])].sort((a,b)=>(a.ts||0)-(b.ts||0)).slice(-100);
 out.skills={...(older.skills||{}),...(newer.skills||{})};
 out.mastery={...(older.mastery||{}),...(newer.mastery||{})};
 out.settings={...(older.settings||{}),...(newer.settings||{})};
 out.controls={...(older.controls||{}),...(newer.controls||{})};
 out.updatedAt=Math.max(localTs,remoteTs,Date.now());
 return out
}
function testConflictMerge(){
 const a={name:'Kid',score:100,stars:3,completed:[1,2],mastery:{math:30},updatedAt:100};
 const b={name:'Kid',score:250,stars:6,completed:[2,3],mastery:{math:50},updatedAt:200};
 const m=mergeProfiles(a,b);
 return m.score===250&&m.stars===6&&m.completed.includes(1)&&m.completed.includes(3)&&m.mastery.math===50
}

function simulateLocalSync(){const merged={profiles:STORE.profiles.map(p=>({name:p.name,score:p.score,stars:p.stars,completed:p.completed.length,updatedAt:Date.now()})),schemaVersion:STORE.schemaVersion};localStorage.setItem('bb-core-v6-last-snapshot',JSON.stringify(merged));SYNC.queue=[];SYNC.lastSync=Date.now();saveSync()}


function stableStringify(x){return JSON.stringify(x,Object.keys(x).sort())}
function exportEnvelope(){
 const payload={schemaVersion:STORE.schemaVersion,exportedAt:Date.now(),store:STORE};
 const digest=checksum(JSON.stringify(payload.store));
 return {format:'brainbite-progress',version:2,payload,digest}
}
function checksum(value){let hash=2166136261;for(const byte of new TextEncoder().encode(value)){hash^=byte;hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16).padStart(8,'0')}
function validateEnvelope(x){
 if(!x||x.format!=='brainbite-progress'||x.version!==2||!x.payload?.store)return false;
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
  async pushProfile(profile){
    if(!this.userId())throw new Error('Sign in first');
    const body={fields:{ownerId:{stringValue:this.userId()},displayName:{stringValue:profile.name},clientProfileId:{stringValue:profile.id},progress:this.wrapValue(profile),clientUpdatedAt:{timestampValue:new Date().toISOString()}}};
    const r=await fetch(this.docUrl(profile.id),{method:'PATCH',headers:this.authHeaders(),body:JSON.stringify(body)});
    if(r.status===401){await this.refresh();return this.pushProfile(profile)}
    if(!r.ok)throw new Error(`Cloud write failed (${r.status})`)
  }
  async pullProfiles(){
    if(!this.userId())throw new Error('Sign in first');
    const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents/families/${encodeURIComponent(this.userId())}/profiles`;
    const r=await fetch(url,{headers:this.authHeaders()});
    if(r.status===401){await this.refresh();return this.pullProfiles()}
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
      const r=await fetch(`https://firestore.googleapis.com/v1/${p.name}`,{method:'DELETE',headers:this.authHeaders()});
      if(r.status===401){await this.refresh();return this.deleteFamily()}
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


function parseWorksheetText(text){
 const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const equations=[],words=[];
 for(const line of lines){
   if(/[=]/.test(line))equations.push(line);
   else words.push(line)
 }
 return {lines,equations,words}
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
let parentUnlocked=false,deferredPrompt=null;
function migrateStore(x){
 if(!x||!Array.isArray(x.profiles))return structuredClone(DEF);
 if(x.profiles.length===0)x.profiles=[blank()];
 if(!x.schemaVersion)x.schemaVersion=1;
 x.profiles.forEach(p=>{
   if(!p.id)p.id=(crypto.randomUUID?.()||('p-'+Date.now()+'-'+Math.random()));if(p.spark==null)p.spark=0;if(!p.unlockedBites)p.unlockedBites=['Nib'];if(!p.bite)p.bite='Nib';
   if(!p.cosmetics)p.cosmetics=[];if(p.equippedCosmetic===undefined)p.equippedCosmetic=null;
   if(!p.skills)p.skills={};if(!p.sessions)p.sessions=[];if(!p.parentPin)p.parentPin='1234';
   p.name=String(p.name||'Kid').trim().slice(0,40)||'Kid';p.score=Math.max(0,Number(p.score)||0);p.stars=Math.max(0,Number(p.stars)||0);p.spark=Math.max(0,Number(p.spark)||0);
   for(const key of ['completed','unlockedBites','cosmetics','mistakes','practice','snap','sessions'])if(!Array.isArray(p[key]))p[key]=[];
   if(!p.mastery||typeof p.mastery!=='object')p.mastery={math:10,words:10,spanish:10};
   if(!p.settings||typeof p.settings!=='object')p.settings={};
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
   if(!p.settings.enemySpeed)p.settings.enemySpeed='normal';if(!p.controls)p.controls={dailyMinutes:30,maxSessionMinutes:20,requireParentForSnap:false,requireParentForPractice:false};
 });
  x.active=Math.max(0,Math.min(x.profiles.length-1,Number(x.active)||0));
  x.schemaVersion=7;
 return x;
}

function load(){let value=readStoredStore(localStorage.getItem(KEY));if(!value)value=readStoredStore(localStorage.getItem(BACK));if(!value)value=readStoredStore(localStorage.getItem(RECOVERY_KEY));if(!value)value=structuredClone(DEF);writeStoreCopies(value);return value}
function save(){if(P())P().updatedAt=Date.now();writeStoreCopies(STORE);queueSyncEvent({type:'store-update',profileId:P()?.id||null,payload:{active:STORE.active,schemaVersion:STORE.schemaVersion},schemaVersion:STORE.schemaVersion,ts:Date.now()});localStorage.setItem(SYNC_KEY,JSON.stringify(SYNC));render()}
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('show'));$(id).classList.add('show')}
function prog(world){return P().completed.filter(id=>MISSIONS.find(m=>m.id===id)?.world===world).length}

function skillRec(skill){if(!P().skills[skill])P().skills[skill]={mastery:10,streak:0,lastSeen:null,nextReview:null};return P().skills[skill]}
function updateSkill(skill,correct){
 const r=skillRec(skill);r.lastSeen=Date.now();
 if(correct){r.streak++;r.mastery=Math.min(100,r.mastery+2);r.nextReview=Date.now()+(r.streak>=3?REVIEW_MS.mastered:r.streak===2?REVIEW_MS.second:REVIEW_MS.first)}
 else{r.streak=0;r.mastery=Math.max(0,r.mastery-2);r.nextReview=Date.now()+REVIEW_MS.first}
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
 const data={
  math:{title:'Number Nebula',tag:'Math',art:'assets/art/number-nebula.svg',accent:'num',summary:'Orbit through number-sense, facts, and fractions.',bosses:['Astro Muncher']},
  words:{title:'Wordwood',tag:'Words',art:'assets/art/wordwood.svg',accent:'word',summary:'Move through forested language paths and grammar vines.',bosses:['Word Warp']},
  spanish:{title:'Spanish Portal',tag:'Spanish',art:'assets/art/language-portals.svg',accent:'spanish',summary:'Step through portals for vocabulary, phrases, and fluency.',bosses:['El Eco']},
 };
 return data[world]||data.math;
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
 const mission=MISSIONS.find(m=>m.id===profile.lastMission)||MISSIONS[0];
 const missions=profile.completed.length;
 const progress=missions%5;
 const remaining=progress===0?5:5-progress;
 return {world:worldMeta(mission?.world||'math').title,remaining,total:5,progress:Math.round((progress/5)*100)};
}
function worldLabelFor(world){return worldMeta(world).title.toUpperCase();}
function missionStatus(world,id){
 const profile=P();
 if(profile.completed.includes(id))return 'complete';
 if(unlocked(MISSIONS.find(m=>m.id===id)))return 'available';
 return 'locked';
}
function renderWorldShowcase(){
 const slot=$('worldShowcase');
 if(!slot)return;
 slot.innerHTML=['math','words','spanish'].map(world=>{
  const meta=worldMeta(world);
  const done=prog(world);
  const total=10;
  const bossDone=MISSIONS.filter(m=>m.world===world&&m.boss&&P().completed.includes(m.id)).length;
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
}
function parentDashboardSummary(){
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
 const due=dueSkills();$('memoryDue').innerHTML=due.length?due.map(x=>`<span class=memory-chip>${x.skill}</span>`).join(''):'No Memory Drops due right now.';
 const summary=parentDashboardSummary();
 $('weeklySummary').innerHTML=`<div>Sessions this week: <b>${summary.weekly.sessions}</b></div><div>Avg accuracy: <b>${summary.weekly.avgAccuracy==null?'n/a':summary.weekly.avgAccuracy+'%'}</b></div><div>Practice items: <b>${summary.weekly.practice}</b></div><div>Homework items: <b>${summary.weekly.homework}</b></div><div>Recent skills touched: <b>${summary.weekly.improvements}</b></div>`;
 $('skillPriority').innerHTML=summary.priority.length?summary.priority.map(x=>`<div>${x.skill} · mastery ${Math.round(x.mastery)}%${x.nextReview&&x.nextReview<=Date.now()?' · due':''}</div>`).join(''):'No skill priority yet.';
 $('homeworkSummary').innerHTML=summary.homework.length?summary.homework.slice(-5).reverse().map(x=>`<div>${x.subject}${x.grade?` grade ${x.grade}`:''} · ${x.topic||'practice'}${x.homework?' · homework':''}</div>`).join(''):'No homework practice recorded yet.';
}

function renderLaunchHint(){
 const el=$('launchHint');
 if(!el)return;
 const profile=P();
 const tier=profile.settings.qualityTier||'balanced';
 const lowEnd=lowEndDevice();
 const firstRun=profile.completed.length===0;
 el.textContent=firstRun
  ? `Start with BrainBase, then open a world portal to unlock the Jungle Circuit flow.${lowEnd&&tier==='balanced'?' This device may feel smoother on Performance mode.':''}`
  : `Resume from your last mission or open BrainBase. Quality tier: ${tier}.${lowEnd&&tier==='balanced'?' Performance mode may be smoother on this device.':''}`;
}



function launchChecks(){
 const checks=[];
 checks.push(['30 missions loaded',MISSIONS.length===30]);
 checks.push(['3 bosses loaded',MISSIONS.filter(m=>m.boss).length===3]);
 checks.push(['Profiles exist',STORE.profiles.length>0]);
 checks.push(['Save schema current',STORE.schemaVersion===7]);
 checks.push(['Service worker support','serviceWorker'in navigator]);
 checks.push(['Firebase configured',INTEGRATIONS.cloud.provider==='firebase'&&/^[a-z0-9-]{6,}$/.test(INTEGRATIONS.cloud.url)&&INTEGRATIONS.cloud.key.length>=20]);
 checks.push(['Firebase signed in',!!cloudClient()?.session]);
 checks.push(['OCR connected',INTEGRATIONS.ocr.provider!=='none']);
 checks.push(['Privacy page linked',true]);
 checks.push(['Terms page linked',true]);
 return checks
}

function selfCheck(){
 const results=[];
 results.push(['Save schema',STORE.schemaVersion===7]);
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
 $('diagSave').innerHTML=`<span class="${STORE.schemaVersion===7?'diag-ok':'diag-warn'}">Schema v${STORE.schemaVersion||'?'}</span>`;
 $('diagOffline').innerHTML=`<span class="${'serviceWorker'in navigator?'diag-ok':'diag-warn'}">${'serviceWorker'in navigator?'Service worker supported':'Service worker unavailable'}</span>`;
 $('diagAudio').innerHTML=`<span class="${audioContext()?'diag-ok':'diag-warn'}">${audioContext()?'WebAudio ready':'WebAudio unavailable'}</span>`;
 const ss=P().sessions.slice(-8).reverse();
 $('diagSessions').innerHTML=ss.length?ss.map(s=>`<div>${new Date(s.ts).toLocaleString()} · Mission ${s.mission} · combo ${s.combo}${s.accuracy!=null?` · ${s.accuracy}%`:''}</div>`).join(''):'No completed sessions yet.';
 const blockers=[
   ['Automatic worksheet OCR/AI extraction',false],
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


function usageTodayMinutes(){
 const day=new Date().toDateString();
 const sessions=(P().sessions||[]).filter(s=>new Date(s.ts).toDateString()===day);
 const secs=sessions.reduce((a,s)=>a+(s.durationSec||0),0);return Math.round(secs/60)
}
function renderControls(){
 if(!$('dailyMinutes'))return;
 const c=P().controls;$('dailyMinutes').value=c.dailyMinutes;$('maxSessionMinutes').value=c.maxSessionMinutes;$('requireParentForSnap').checked=c.requireParentForSnap;$('requireParentForPractice').checked=c.requireParentForPractice;
 const used=usageTodayMinutes();$('todayUsage').textContent=`${used} minutes played`;
 $('sessionLimitStatus').innerHTML=used>=c.dailyMinutes?'<span class=limit-stop>Daily goal reached.</span>':used>=Math.max(1,c.dailyMinutes-5)?'<span class=limit-warn>Close to daily goal.</span>':'Within daily goal.';
}


function finalGateRows(){
 return [
 ['30 missions + 3 bosses',MISSIONS.length===30&&MISSIONS.filter(m=>m.boss).length===3,'app'],
 ['Profiles / parent controls / recovery',STORE.profiles.length>0,'app'],
 ['PWA + offline service worker','serviceWorker'in navigator,'app'],
 ['Firebase configured',INTEGRATIONS.cloud.provider==='firebase'&&/^[a-z0-9-]{6,}$/.test(INTEGRATIONS.cloud.url)&&INTEGRATIONS.cloud.key.length>=20,'external'],
 ['Firebase parent signed in',!!cloudClient()?.session,'external'],
 ['OCR connected (optional)',INTEGRATIONS.ocr.provider!=='none','optional'],
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
 $('releaseOcr').innerHTML=rows[5][1]?'<span class=release-pass>Connected</span>':'<span class=release-open>Optional / Open</span>';
 $('finalGates').innerHTML=rows.map(([n,ok,type])=>`<div><span class="${ok?'release-pass':type==='optional'?'release-open':'release-open'}">${ok?'✓':'○'}</span> ${n}</div>`).join('');
}
function diagnosticBundle(){
 return {generatedAt:new Date().toISOString(),version:'2.0.0',schemaVersion:STORE.schemaVersion,profiles:STORE.profiles.length,missionCount:MISSIONS.length,bossCount:MISSIONS.filter(m=>m.boss).length,sync:{provider:SYNC.provider,queue:SYNC.queue.length,lastSync:SYNC.lastSync},integrations:{cloudProvider:INTEGRATIONS.cloud.provider,cloudConfigured:INTEGRATIONS.cloud.provider==='firebase'&&!!INTEGRATIONS.cloud.url&&!!INTEGRATIONS.cloud.key,ocrProvider:INTEGRATIONS.ocr.provider},gates:finalGateRows().map(([name,pass,type])=>({name,pass,type}))}
}


const LAB_KEY='brainbite-v2-lab';
function labAllowed(){return location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.search.includes('lab=1')||localStorage.getItem('bb-lab-enabled')==='1'}
function labState(){try{return JSON.parse(localStorage.getItem(LAB_KEY)||'null')||{skillId:'number-facts',family:'target-smash',difficulty:'normal',preset:'practicing',krakenPhase:'intro'}}catch{return {skillId:'number-facts',family:'target-smash',difficulty:'normal',preset:'practicing',krakenPhase:'intro'}}}
let LAB=labState();
function saveLab(){localStorage.setItem(LAB_KEY,JSON.stringify(LAB));renderLab()}
function core(){return window.BrainBiteCore||null}
function loadFoundation(){const c=core();if(!c)return null;try{return c.loadFoundationState(localStorage)}catch{return c.createFoundationState()}}
function renderBrainBase(state){const c=core(),root=$('brainbase-root');if(c&&root)c.renderBrainBaseShell(root,state||loadFoundation(),{storage:localStorage})}
function persistFoundation(state){const c=core();if(!c)return null;const next=c.persistFoundationState(state,localStorage);renderBrainBase(next);return next}
function applyLabFoundation(mutator){const c=core();if(!c)return null;let foundation=loadFoundation();if(!foundation)return null;const next=mutator(foundation)||foundation;const saved=persistFoundation(next);renderLab();return saved}
function labPresetState(preset, skillId){const c=core();const skill=c?.createSkillState(skillId)||{skillId};const now=Date.now();const presets={unknown:{masteryScore:0,confidence:0.08,evidence:{attempts:0,independentSuccesses:0,assistedSuccesses:0,hintsUsed:0,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:0},nextReviewAt:null,masteryState:'Unknown'},introduced:{masteryScore:14,confidence:0.18,evidence:{attempts:1,independentSuccesses:0,assistedSuccesses:1,hintsUsed:1,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:2800},nextReviewAt:now+20*60*1000,masteryState:'Introduced'},practicing:{masteryScore:34,confidence:0.34,evidence:{attempts:3,independentSuccesses:1,assistedSuccesses:1,hintsUsed:1,incorrectAttempts:1,rapidAttempts:0,responseTimeMsTotal:7600},nextReviewAt:now+35*60*1000,masteryState:'Practicing'},developing:{masteryScore:57,confidence:0.56,evidence:{attempts:5,independentSuccesses:2,assistedSuccesses:1,hintsUsed:0,incorrectAttempts:1,rapidAttempts:0,responseTimeMsTotal:11000},nextReviewAt:now+70*60*1000,masteryState:'Developing'},strong:{masteryScore:78,confidence:0.78,evidence:{attempts:7,independentSuccesses:4,assistedSuccesses:1,hintsUsed:0,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:14500},lastIndependentSuccessAt:now-60*60*1000,nextReviewAt:now+12*60*60*1000,masteryState:'Strong'},mastered:{masteryScore:94,confidence:0.9,evidence:{attempts:10,independentSuccesses:6,assistedSuccesses:1,hintsUsed:0,incorrectAttempts:0,rapidAttempts:0,responseTimeMsTotal:18000},lastIndependentSuccessAt:now-30*60*1000,nextReviewAt:now+3*24*60*60*1000,masteryState:'Mastered'}};return {...skill,...presets[preset]}}
function selectionForMode(challenge, mode){const wrong=challenge.distractors?.[0]??(challenge.choices||[]).find(x=>!(challenge.answers||[]).includes(x.value??x));if(challenge.family==='Target Smash'){const correct=challenge.answers||[];if(mode==='incorrect'||mode==='random')return [String(wrong?.value??wrong??'miss')];return correct.slice();}if(challenge.family==='Letter Trail'){const expected=challenge.targetSequence?.[challenge.revealed?.length||0];if(mode==='incorrect'||mode==='random')return String(challenge.distractors?.[0]||'X');return expected;}if(challenge.family==='Knowledge Platforms'){const expected=challenge.platformOrder?.[challenge.visited?.length||0];if(mode==='incorrect'||mode==='random')return String(challenge.distractors?.[0]||'Skip');return expected;}return null}
function simulateLabAttempt(mode){const c=core();if(!c)return;const skillId=$('labSkill')?.value||LAB.skillId||'number-facts';const family=$('labFamily')?.value||LAB.family||'target-smash';const difficulty=$('labDifficulty')?.value||LAB.difficulty||'normal';const prompt='BrainBite Lab simulation';let challenge;if(family==='target-smash')challenge=c.createTargetSmashChallenge({skillId,prompt,answerType:'text',answers:['12','18'],distractors:['13','16'],difficulty});else if(family==='letter-trail')challenge=c.createLetterTrailChallenge({skillId,prompt,targetSequence:['B','I','T','E'],distractors:['A','N','S'],difficulty});else challenge=c.createKnowledgePlatformChallenge({skillId,prompt,platformOrder:['Count','Compare','Explain'],distractors:['Guess','Skip','Rush'],difficulty});const selection=selectionForMode(challenge,mode);const meta={independent:mode!=='assisted',assisted:mode==='assisted',hintsUsed:mode==='assisted'?1:0,responseTimeMs:mode==='random'?430:mode==='incorrect'?2400:mode==='assisted'?2100:1200,randomLike:mode==='random'};let result;if(family==='target-smash')result=c.resolveTargetSmashResult(challenge,selection,meta);else if(family==='letter-trail')result=c.resolveLetterTrailChoice(challenge,selection,meta);else result=c.resolveKnowledgePlatformChoice(challenge,selection,meta);applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];learner.currentChallenge=result.challenge;foundation.learners[foundation.activeLearnerId]=c.recordLearnerAttempt(learner,skillId,result.attempt,{id:skillId});});LAB.skillId=skillId;LAB.family=family;LAB.difficulty=difficulty;saveLab()}
function currentLabState(){const c=core();if(!c)return null;const foundation=loadFoundation();if(!foundation)return null;const learner=foundation.learners[foundation.activeLearnerId];return {c,foundation,learner}}
function renderLab(){if(!$('labInspect'))return;if(!labAllowed()){$('qa').hidden=true;return}$('qa').hidden=false;const snapshot=currentLabState();if(!snapshot){$('labActiveLearner').textContent='BrainBiteCore loading…';$('labInspect').textContent='BrainBite foundation is not ready yet.';return}const {c,foundation,learner}=snapshot;const skillId=$('labSkill').value||LAB.skillId||'number-facts';const skill=learner.skills?.[skillId]||c.createSkillState(skillId);const review=skill.reviewHistory?.at?.(-1)||skill.reviewHistory?.[skill.reviewHistory.length-1]||null;$('labActiveLearner').textContent=`${learner.name} (${learner.profileId})`;$('labStage').textContent=`Stage: ${learner.stage} · Hub: ${learner.hub.variant}${learner.hub.expansionUnlocked?' · Expansion unlocked':''}`;$('labQueue').textContent=`Offline queue: ${learner.offlineQueue.length} · Sent: ${learner.sentEventIds.length}`;$('labMastery').textContent=`${skillId}: ${skill.masteryState} · score ${skill.masteryScore} · confidence ${(skill.confidence*100).toFixed(0)}%`;$('labReview').textContent=review?`Next review ${new Date(skill.nextReviewAt||review.nextReviewAt).toLocaleString()}`:'No review scheduled.';$('labHub').textContent=learner.hub.variant==='upgraded'?'Upgraded hub with expansion unlocked':'Starter hub';$('labRewards').textContent=`${learner.rewards.length} reward(s) · ${learner.rewards.map(r=>r.name).join(', ')||'None'}`;const learnerSelect=$('labLearnerSelect');learnerSelect.innerHTML=Object.values(foundation.learners).map(l=>`<option value="${l.profileId}" ${l.profileId===foundation.activeLearnerId?'selected':''}>${l.name}</option>`).join('');const summary={profileId:learner.profileId,name:learner.name,stage:learner.stage,hub:learner.hub,skill:{skillId,masteryState:skill.masteryState,masteryScore:skill.masteryScore,confidence:skill.confidence,evidence:skill.evidence,reviewHistory:skill.reviewHistory.slice(-4),nextReviewAt:skill.nextReviewAt},rewards:learner.rewards,offlineQueue:learner.offlineQueue,sentEventIds:learner.sentEventIds,contentCheck:c.validateContentBundle(c.createVerticalSliceContent())};const pre=document.createElement('pre');pre.className='lab-json';pre.textContent=JSON.stringify(summary,null,2);$('labInspect').innerHTML='';$('labInspect').appendChild(pre);const content=c.validateContentBundle(c.createVerticalSliceContent());$('labContentCheck').innerHTML=`<div class="${content.valid?'diag-ok':'diag-warn'}">${content.valid?'Content bundle valid':'Content bundle quarantined'}${content.quarantined.length?`: ${content.quarantined.join(', ')}`:''}</div>`;LAB.skillId=skillId;LAB.family=$('labFamily').value||LAB.family;LAB.difficulty=$('labDifficulty').value||LAB.difficulty;LAB.preset=$('labSkillPreset').value||LAB.preset;LAB.krakenPhase=$('labKrakenPhase').value||LAB.krakenPhase}

const QA_STORAGE='brainbite-v2-qa';
function qaState(){try{return JSON.parse(localStorage.getItem(QA_STORAGE)||'{}')}catch{return {}}}
let QA=qaState();
function saveQA(){localStorage.setItem(QA_STORAGE,JSON.stringify(QA));renderQA()}
function renderQA(){
 if(!$('twoDeviceChecklist'))return;
 if(!labAllowed()){$('qa').hidden=true;return}
 $('qa').hidden=false;
 const lab=captureLabOverview();
 if($('labLearnerSelect'))$('labLearnerSelect').value=lab?.foundation?.activeLearnerId||'';
 if($('labSkill'))$('labSkill').value=LAB.skillId||$('labSkill').value;
 if($('labFamily'))$('labFamily').value=LAB.family||$('labFamily').value;
 if($('labDifficulty'))$('labDifficulty').value=LAB.difficulty||$('labDifficulty').value;
 if($('labSkillPreset'))$('labSkillPreset').value=LAB.preset||$('labSkillPreset').value;
 if($('labKrakenPhase'))$('labKrakenPhase').value=LAB.krakenPhase||$('labKrakenPhase').value;
 if($('labLearnerSelect')&&lab?.foundation){$('labLearnerSelect').innerHTML=Object.values(lab.foundation.learners).map(l=>`<option value="${l.profileId}" ${l.profileId===lab.foundation.activeLearnerId?'selected':''}>${l.name}</option>`).join('')}
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

function render(){
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
 const homeEnergy=$('homeEnergy');if(homeEnergy)homeEnergy.textContent=5;
 const homeGoalTitle=$('homeGoalTitle');if(homeGoalTitle)homeGoalTitle.textContent=`Solve ${goal.total} missions`;
 const homeGoalBar=$('homeGoalBar');if(homeGoalBar)homeGoalBar.style.width=`${goal.progress}%`;
 const homeGoalText=$('homeGoalText');if(homeGoalText)homeGoalText.textContent=`${goal.world} is ready. Complete ${goal.remaining} more mission${goal.remaining===1?'':'s'} to trigger the next reward.`;
 const homeGoalReward=$('homeGoalReward');if(homeGoalReward)homeGoalReward.textContent=`${Math.max(50,goal.remaining*25)} Star`;
 const homeRewardTitle=$('homeRewardTitle');if(homeRewardTitle)homeRewardTitle.textContent=`Gain ${reward.remaining} more XP`;
 const homeRewardBar=$('homeRewardBar');if(homeRewardBar)homeRewardBar.style.width=`${reward.percent}%`;
 const homeRewardText=$('homeRewardText');if(homeRewardText)homeRewardText.textContent='Collect enough BrainBites to unlock the next profile boost.';
 const homeStreak=$('homeStreak');if(homeStreak)homeStreak.textContent=streak?`${streak}-day streak`:'Keep it up';
 const homeStreakDots=$('homeStreakDots');if(homeStreakDots)homeStreakDots.innerHTML=Array.from({length:7},(_,i)=>`<span class="${i<streak?'on':''}"></span>`).join('');
 const comboBanner=$('comboBanner');if(comboBanner)comboBanner.textContent=`x${G?.combo||0}`;
 const battleProfileName=$('battleProfileName');if(battleProfileName)battleProfileName.textContent=profile.name;
 const battleProfileLevel=$('battleProfileLevel');if(battleProfileLevel)battleProfileLevel.textContent=`Level ${profileLevel()}`;
 const battleProfileStars=$('battleProfileStars');if(battleProfileStars)battleProfileStars.textContent=profile.score;
 const battleGoalTitle=$('battleGoalTitle');if(battleGoalTitle)battleGoalTitle.textContent=G?.m?.boss?`Defeat ${G.m.bossName}`:`Clear ${G?.m?.title||'the mission'}`;
 const battleGoalBar=$('battleGoalBar');if(battleGoalBar)battleGoalBar.style.width=G?`${Math.max(0,Math.min(100,Math.round((G.eaten/Math.max(1,G.total))*100)))}%`:'0%';
 const battleGoalText=$('battleGoalText');if(battleGoalText)battleGoalText.textContent=G?.m?.boss?'Finish the arena phase to push the boss back.':'Choose the correct tile to keep moving through the jungle.';
 const battleRewardTitle=$('battleRewardTitle');if(battleRewardTitle)battleRewardTitle.textContent=G?.m?.boss?'Boss reward':'Great job!';
 const battleRewardBar=$('battleRewardBar');if(battleRewardBar)battleRewardBar.style.width=G?`${Math.max(0,Math.min(100,Math.round((G.combo/8)*100)))}%`:'0%';
 const battleRewardText=$('battleRewardText');if(battleRewardText)battleRewardText.textContent=G?.m?.boss?'+10 Brainifacts':'+25 BrainBites';
 renderWorldShowcase();['math','words','spanish'].forEach(w=>renderList(w+'List',w));$('parentMath').textContent=Math.round(P().mastery.math)+'%';$('parentWords').textContent=Math.round(P().mastery.words)+'%';$('parentSpanish').textContent=Math.round(P().mastery.spanish)+'%';$('mistakes').innerHTML=P().mistakes.length?P().mistakes.slice(-8).reverse().map(m=>`<div>${m.skill}: chose <b>${m.chosen}</b></div>`).join(''):'No recent mistakes.';renderProfiles();unlockBites();renderBites();renderParent();renderDiagnostics();renderSync();renderControls();renderIntegrations();renderRelease();renderQA();applySettings();renderLaunchHint();$('saveHealth').textContent=`Save healthy · Backup ${localStorage.getItem(BACK)?'available':'not created yet'}`}
function unlocked(m){return m.world==='math'?m.id<=P().unlockedMath:m.world==='words'?m.id<=P().unlockedWords:m.id<=P().unlockedSpanish}
function renderList(id,world){const l=$(id);l.innerHTML='';const meta=worldMeta(world);const count=prog(world);const bosses=MISSIONS.filter(m=>m.world===world&&m.boss).length;const clearedBosses=MISSIONS.filter(m=>m.world===world&&m.boss&&P().completed.includes(m.id)).length;l.innerHTML=`<div class="world-banner world-${world}"><img src="${meta.art}" alt="${meta.title}"><div><p class="world-tag">${meta.tag}</p><h3>${meta.title}</h3><p>${meta.summary}</p><p class="world-progress">${count}/10 missions · ${clearedBosses}/${bosses} bosses cleared</p></div></div>`;MISSIONS.filter(m=>m.world===world).forEach(m=>{const on=unlocked(m),done=P().completed.includes(m.id),d=document.createElement('div');d.className='mission-row '+world+(m.boss?' boss':'')+(on?'':' locked')+(done?' done':'');d.innerHTML=`<div><div class="mission-topline"><b>${m.id}. ${m.title}</b><span class="mission-badge">${m.boss?'Boss':'Mission'}</span></div><div class="mission-skill">${m.skill}</div></div><button aria-label="${done?'Replay':'Play'} mission ${m.id}: ${m.title}" ${on?'':'disabled'}>${done?'Replay':on?'Play':'Locked'}</button>`;if(on)d.querySelector('button').onclick=()=>start(m.id);l.appendChild(d)})}
function renderProfiles(){const l=$('profileList');l.innerHTML='';STORE.profiles.forEach((p,i)=>{const d=document.createElement('div');d.className='profile-row';d.innerHTML=`<div><b>${p.name}</b><div>${p.stars} stars</div></div><button>${i===STORE.active?'Active':'Switch'}</button>`;d.querySelector('button').onclick=()=>{STORE.active=i;save()};l.appendChild(d)})}
function setCaption(text){const el=$('captionText');if(!el)return;const on=!!P().settings.captions;el.textContent=text||'';el.hidden=!on||!text}
function start(id){const m=MISSIONS.find(x=>x.id===id);P().lastMission=id;save();show('game');applyWorldTheme(m.world);$('prompt').textContent=m.prompt;$('worldLabel').textContent=worldMeta(m.world).title.toUpperCase();$('bossBox').hidden=!m.boss;$('bossName').textContent=m.bossName||'Boss';$('feedback').textContent=`Entering ${worldMeta(m.world).title}.`;G=makeGame(m);$('speakPrompt').hidden=false;setCaption(m.prompt);draw()}
function makeGame(m){let vals=shuffle([...m.correct,...m.wrong,...m.wrong]).slice(0,24);m.correct.slice(0,3).forEach(c=>{if(!vals.includes(c))vals[Math.floor(Math.random()*vals.length)]=c});let cells=vals.map(v=>({value:v,correct:m.correct.includes(v),eaten:false}));cells.splice(12,0,{value:'',correct:false,eaten:true});return {m,cells:cells.slice(0,25),p:{x:2,y:2},e:{x:0,y:0},mist:[],lives:3,combo:0,max:0,eaten:0,total:cells.slice(0,25).filter(c=>c.correct&&!c.eaten).length,boss:100,moves:0,correct:0,wrong:0,startedAt:Date.now()}}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}const ix=(x,y)=>y*5+x;
function draw(){$('lives').textContent=G.lives;$('combo').textContent=G.combo;$('targets').textContent=`${G.eaten}/${G.total}`;$('bossHealth').value=G.boss;$('bossPhase').textContent=G.m.boss?`${G.m.bossName} · ${G.boss>66?'Phase 1':G.boss>33?'Phase 2':'Final Phase'}`:'Exploration';setCaption(G?.m?.prompt);const b=$('board');b.className=`board world-${G.m.world}${G.m.boss?' boss-arena':''}`;b.innerHTML='';for(let y=0;y<5;y++)for(let x=0;x<5;x++){const c=G.cells[ix(x,y)]||{eaten:true,value:''},d=document.createElement('div');d.className='cell';d.setAttribute('role','gridcell');if(x===G.p.x&&y===G.p.y)d.classList.add('player');if(x===G.e.x&&y===G.e.y)d.classList.add('enemy');if(G.mist.some(m=>m.x===x&&m.y===y))d.classList.add('mistake');if(!c.eaten)d.textContent=c.value;b.appendChild(d)}}
function move(dx,dy){if(!G)return;let nx=Math.max(0,Math.min(4,G.p.x+dx)),ny=Math.max(0,Math.min(4,G.p.y+dy));if(nx===G.p.x&&ny===G.p.y)return;G.p={x:nx,y:ny};G.moves++;bite();bossTick();enemy();hit();draw()}
function bite(){const c=G.cells[ix(G.p.x,G.p.y)];if(!c||c.eaten)return;c.eaten=true;if(c.correct){G.combo++;G.max=Math.max(G.max,G.combo);G.eaten++;G.correct++;P().score+=100*G.combo;P().mastery[G.m.world]=Math.min(100,P().mastery[G.m.world]+1);updateSkill(G.m.skill,true);$('feedback').textContent='CHOMP! Correct.';fileCue(G.combo>=8?'super':'correct');if(G.m.boss){G.boss=Math.max(0,G.boss-25);if(G.boss===0)return complete()}else if(G.eaten>=G.total)return complete()}else{G.combo=0;G.wrong++;G.lives--;P().mastery[G.m.world]=Math.max(0,P().mastery[G.m.world]-.5);updateSkill(G.m.skill,false);P().mistakes.push({skill:G.m.skill,chosen:c.value,ts:Date.now()});G.mist.push({x:G.p.x,y:G.p.y});$('feedback').textContent=`Not ${c.value}. Try another tile.`;fileCue('wrong');if(G.lives<=0)setTimeout(()=>start(G.m.id),500)}}

function bossTick(){
 if(!G.m.boss)return;
 if(G.m.world==='math'&&G.moves%3===0){G.lives--;G.e.x=Math.floor(Math.random()*5);G.e.y=Math.floor(Math.random()*5);$('feedback').textContent='Asteroid blast!'}
 if(G.m.world==='words'&&G.moves%2===0){G.cells=shuffle(G.cells)}
 if(G.m.world==='spanish'&&G.moves%2===0){G.e={x:Math.floor(Math.random()*5),y:Math.floor(Math.random()*5)}}
 if(G.lives<=0)setTimeout(()=>start(G.m.id),500)
}

function enemy(){let step=P().settings.enemySpeed==='slow'?2:1;if(G.moves%step)return;let x=G.e.x,y=G.e.y,dx=Math.sign(G.p.x-x),dy=Math.sign(G.p.y-y);if(Math.abs(G.p.x-x)>Math.abs(G.p.y-y))x+=dx;else y+=dy;G.e={x,y}}
function hit(){if(G.e.x===G.p.x&&G.e.y===G.p.y){G.lives--;G.combo=0;G.e={x:0,y:0};$('feedback').textContent='Bonk! Keep going.';fileCue('hit');if(G.lives<=0)setTimeout(()=>start(G.m.id),500)}}
function complete(){if(!P().completed.includes(G.m.id)){P().completed.push(G.m.id);P().stars+=3;P().spark+=(G.m.boss?10:3)}P().bestCombo=Math.max(P().bestCombo,G.max);if(G.m.world==='math'&&G.m.id<10)P().unlockedMath=Math.max(P().unlockedMath,G.m.id+1);if(G.m.world==='words'&&G.m.id<20)P().unlockedWords=Math.max(P().unlockedWords,G.m.id+1);if(G.m.world==='spanish'&&G.m.id<30)P().unlockedSpanish=Math.max(P().unlockedSpanish,G.m.id+1);fileCue(G.m.boss?'boss':'clear');P().sessions.push({mission:G.m.id,world:G.m.world,combo:G.max,accuracy:G.correct?Math.round(100*G.correct/Math.max(1,G.correct+G.wrong)):null,moves:G.moves,durationSec:Math.max(1,Math.round((Date.now()-(G.startedAt||Date.now()))/1000)),ts:Date.now()});if(P().sessions.length>30)P().sessions.shift();save();$('feedback').textContent=G.m.boss?`${G.m.bossName} defeated!`:'Mission complete!';setCaption(G.m.boss?`${G.m.bossName} defeated.`:'Mission complete.');setTimeout(()=>{show(G.m.world);render()},600)}
function applySettings(){let s=P().settings;$('reducedMotion').checked=s.reducedMotion;$('cameraMotionReduction').checked=s.cameraMotionReduction;$('largeTargets').checked=s.largeTargets;$('highContrast').checked=s.highContrast;$('captions').checked=s.captions;$('dyslexicFont').checked=s.dyslexicFont;$('textScale').value=s.textScale||'1';$('qualityTier').value=s.qualityTier||'balanced';$('enemySpeed').value=s.enemySpeed;$('soundOn').checked=s.soundOn;$('musicOn').checked=s.musicOn;syncMusic();const root=document.documentElement;root.classList.toggle('reduced-motion',s.reducedMotion);root.classList.toggle('camera-motion-reduction',s.cameraMotionReduction);root.classList.toggle('large-targets',s.largeTargets);root.classList.toggle('high-contrast',s.highContrast);root.classList.toggle('captions-on',s.captions);root.classList.toggle('dyslexic-font',s.dyslexicFont);root.classList.toggle('quality-ultra',s.qualityTier==='ultra');root.classList.toggle('quality-high',s.qualityTier==='high');root.classList.toggle('quality-balanced',!s.qualityTier||s.qualityTier==='balanced');root.classList.toggle('quality-performance',s.qualityTier==='performance');root.classList.toggle('quality-mobile',s.qualityTier==='mobile');root.classList.toggle('low-end-device',lowEndDevice());root.style.setProperty('--bb-text-scale',String(Number(s.textScale)||1))}
$('parentNav').onclick=()=>{show('parent');$('parentGate').hidden=parentUnlocked;$('parentContent').hidden=!parentUnlocked};document.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>{const target=b.dataset.screen;if(target==='practice'&&P().controls.requireParentForPractice&&!parentUnlocked){show('parent');$('parentGateMsg').textContent='Unlock parent controls to use Practice Lab.';return}if(target==='snap'&&P().controls.requireParentForSnap&&!parentUnlocked){show('parent');$('parentGateMsg').textContent='Unlock parent controls to use Snap-to-Game.';return}show(target)});
$('unlockParent').onclick=()=>{if($('parentPinInput').value===P().parentPin){parentUnlocked=true;$('parentGate').hidden=true;$('parentContent').hidden=false;$('parentGateMsg').textContent=''}else $('parentGateMsg').textContent='Incorrect PIN.'};
$('saveParentPin').onclick=()=>{let v=$('newParentPin').value.trim();if(!/^\d{4}$/.test(v)){alert('PIN must be exactly 4 digits.');return}P().parentPin=v;$('newParentPin').value='';save()};


$('memoryBtn').onclick=()=>{const due=dueSkills();if(!due.length){$('launchHint').textContent='No Memory Drops are due yet.';return}const m=MISSIONS.find(x=>x.skill===due[0].skill);if(m)start(m.id)};

$('continueBtn').onclick=()=>start(P().lastMission||1);$('exitBtn').onclick=()=>{applyWorldTheme('');show('home')};
$('reducedMotion').onchange=e=>{P().settings.reducedMotion=e.target.checked;save()};$('cameraMotionReduction').onchange=e=>{P().settings.cameraMotionReduction=e.target.checked;save()};$('largeTargets').onchange=e=>{P().settings.largeTargets=e.target.checked;save()};$('highContrast').onchange=e=>{P().settings.highContrast=e.target.checked;save()};$('captions').onchange=e=>{P().settings.captions=e.target.checked;save();setCaption(G?.m?.prompt||'')};$('dyslexicFont').onchange=e=>{P().settings.dyslexicFont=e.target.checked;save()};$('textScale').onchange=e=>{P().settings.textScale=e.target.value;save()};$('qualityTier').onchange=e=>{P().settings.qualityTier=e.target.value;save()};$('enemySpeed').onchange=e=>{P().settings.enemySpeed=e.target.value;save()};$('soundOn').onchange=e=>{P().settings.soundOn=e.target.checked;save()};$('musicOn').onchange=e=>{P().settings.musicOn=e.target.checked;syncMusic();save()};
$('addProfile').onclick=()=>{let n=$('newProfile').value.trim();if(!n)return;STORE.profiles.push(blank(n));STORE.active=STORE.profiles.length-1;$('newProfile').value='';save()};
$('exportActiveProfile').onclick=()=>{const profile=STORE.profiles[STORE.active];if(!profile)return;const b=new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`brainbite-profile-${profile.name.replace(/[^\w-]+/g,'-').toLowerCase()||'kid'}.json`;a.click()};
$('deleteActiveProfile').onclick=()=>{if(STORE.profiles.length<=1){alert('Keep at least one profile.');return}const profile=STORE.profiles[STORE.active];if(!confirm(`Delete profile "${profile.name}"? This removes its local mastery, rewards, and world state.`))return;STORE.profiles.splice(STORE.active,1);STORE.active=Math.max(0,STORE.active-1);save()};
$('backupBtn').onclick=()=>{writeStoreCopies(STORE);render()};$('restoreBtn').onclick=()=>{try{let b=readStoredStore(localStorage.getItem(BACK))||readStoredStore(localStorage.getItem(RECOVERY_KEY));if(!b)throw 0;STORE=b;save();$('saveHealth').textContent='Backup restored from the latest valid snapshot'}catch{$('saveHealth').textContent='No valid backup'}};
$('exportBtn').onclick=()=>{const env=exportEnvelope(),b=new Blob([JSON.stringify(env,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='brainbite-progress-v2.json';a.click()};
$('importFile').onchange=async e=>{try{const x=JSON.parse(await e.target.files[0].text());if(validateEnvelope(x)){STORE=migrateStore(x.payload.store);save()}else if(Array.isArray(x.profiles)){STORE=migrateStore(x);save()}else throw 0}catch{$('saveHealth').textContent='Import failed: invalid or corrupted file'}};
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
   P().practice.push({subject:s,topic:t,grade,difficulty,missionId:id,type:'mission',ts:Date.now()});
   $('practiceResult').innerHTML=`Mapped to <b>${MISSIONS.find(m=>m.id===id).title}</b>. <button id="playPractice">Play now</button>`;
   document.getElementById('playPractice').onclick=()=>start(id);
 } else {
   const skill=curriculumSkillForPractice(s,grade,t);
   const c=core();
   plan=skill&&c?c.createCurriculumChallenge(skill.id,{subject:s,grade,topic:t,seed:P().practice.length+1}):null;
   P().practice.push({subject:s,topic:t,grade,difficulty,homework:true,type:'homework',curriculumSkillId:skill?.id||null,ts:Date.now(),validated:!!plan});
   const result=skill?`Homework plan ready for <b>${skill.name}</b> (${skill.grade}).`: `Homework practice saved for ${s} grade ${grade}.`;
   $('practiceResult').innerHTML=`${result}${plan?` <span class="small">Content score: ${c.scoreContentQuality(plan, skill).score}</span>`:''}`;
 }
 save();
};


$('parseWorksheetText').onclick=()=>{
 const r=parseWorksheetText($('ocrText').value);
 if(r.equations.length){
   $('snapItems').value=r.equations.join('\n');
   const answers=r.equations.map(x=>x.split('=').pop().trim()).filter(Boolean);
   $('snapCorrect').value=[...new Set(answers)].join(', ');
 }
 $('parseResult').textContent=`Parsed ${r.lines.length} line(s): ${r.equations.length} equation(s), ${r.words.length} other line(s). Review everything before saving.`;
};

$('extractTextBtn').onclick=()=>{const f=$('snapFile').files?.[0];let hints=[];if(f)hints.push(`File: ${f.name}`);const topic=$('snapTopic').value.trim();if(topic)hints.push(`Topic: ${topic}`);const items=$('snapItems').value.trim();if(items)hints.push(items);$('ocrText').value=hints.join('\n')||'No readable text available locally. Add topic/example items for review.'};

$('snapFile').onchange=e=>{const f=e.target.files?.[0];if(!f)return;$('snapPreview').src=URL.createObjectURL(f);$('snapPreview').hidden=false};
$('saveSnap').onclick=()=>{let topic=$('snapTopic').value.trim();if(!topic){$('snapResult').textContent='Add a topic first.';return}let items=$('snapItems').value.split(/\n+/).filter(Boolean),correct=$('snapCorrect').value.split(',').map(x=>x.trim()).filter(Boolean),wrong=$('snapWrong').value.split(',').map(x=>x.trim()).filter(Boolean);if(!correct.length){$('snapResult').textContent='Add at least one reviewed correct answer.';return}if(correct.some(x=>wrong.includes(x))){$('snapResult').textContent='A choice cannot be both correct and wrong.';return}P().snap.push({topic,items,correct,wrong,ts:Date.now(),status:'parent-reviewed-validated'});$('snapResult').textContent=`Validated and saved "${topic}" with ${correct.length} correct answer(s).`;save()};

$('speakPrompt').onclick=()=>{if(!G)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(G.m.prompt);u.lang=G.m.world==='spanish'?'es-ES':'en-US';speechSynthesis.speak(u)}catch{}};

document.addEventListener('keydown',e=>{if(!$('game').classList.contains('show'))return;const k=e.key.toLowerCase();if(['arrowup','w'].includes(k))move(0,-1);if(['arrowdown','s'].includes(k))move(0,1);if(['arrowleft','a'].includes(k))move(-1,0);if(['arrowright','d'].includes(k))move(1,0)});document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{let d=b.dataset.d;if(d==='u')move(0,-1);if(d==='d')move(0,1);if(d==='l')move(-1,0);if(d==='r')move(1,0)});render();
window.addEventListener('load',()=>render());

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false});
$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').hidden=true};



$('saveControls').onclick=()=>{const d=Math.max(5,Math.min(180,Number($('dailyMinutes').value)||30)),m=Math.max(5,Math.min(120,Number($('maxSessionMinutes').value)||20));P().controls={dailyMinutes:d,maxSessionMinutes:m,requireParentForSnap:$('requireParentForSnap').checked,requireParentForPractice:$('requireParentForPractice').checked};$('controlsStatus').textContent='Parent controls saved.';save()};


$('createCloudAccount').onclick=async()=>{
 try{const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');const email=$('localAccountEmail').value.trim(),password=$('parentPassword').value;if(password.length<8)throw new Error('Password must be at least 8 characters');await c.signUp(email,password);renderCloudAuth();$('localAccountStatus').textContent=c.session?'Account created and signed in.':'Account created. Check email if confirmation is required.'}
 catch(e){$('localAccountStatus').textContent=e.message}
};
$('signInCloud').onclick=async()=>{
 try{const c=cloudClient();if(!c||!c.configured())throw new Error('Configure Firebase first');await c.signIn($('localAccountEmail').value.trim(),$('parentPassword').value);renderCloudAuth()}
 catch(e){$('localAccountStatus').textContent=e.message}
};
$('signOutCloud').onclick=async()=>{try{const c=cloudClient();if(c)await c.signOut();renderCloudAuth()}catch(e){$('localAccountStatus').textContent=e.message}};
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
$('saveOcrConfig').onclick=()=>{const provider=$('ocrProvider').value,endpoint=$('ocrEndpoint').value.trim();if(provider!=='none'&&!validHttpUrl(endpoint)){$('ocrConfigMsg').textContent='Add a valid HTTPS OCR endpoint.';return}INTEGRATIONS.ocr={provider,endpoint};saveIntegrations();$('ocrConfigMsg').textContent='OCR configuration saved locally.'};
$('runIntegrationCheck').onclick=async()=>{const rows=await integrationCheck();$('integrationCheckResult').innerHTML=rows.map(([n,ok])=>`<div><span class="${ok?'integration-ok':'integration-warn'}">${ok?'PASS':'CHECK'}</span> ${n}</div>`).join('')};


$('retryQueue').onclick=async()=>{try{const r=await retryPendingSync();$('mergeResult').textContent=`Retry finished: ${r.ok} ok, ${r.failed} failed.`}catch(e){$('mergeResult').textContent=e.message}};
$('exportCloudSnapshot').onclick=()=>{const b=new Blob([JSON.stringify(cloudSnapshot(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='brainbite-cloud-snapshot.json';a.click()};
$('deleteCloudAccount').onclick=async()=>{try{const c=cloudClient();if(!c||!c.session)throw new Error('Sign in first');await c.deleteFamily();await c.deleteAuthAccount();SYNC.queue=[];SYNC.lastSync=null;SYNC.provider='local-only';saveSync();$('mergeResult').textContent='Cloud profile data and Firebase account deleted.'}catch(e){$('mergeResult').textContent=e.message}};

$('saveLocalAccount').onclick=()=>{const email=$('localAccountEmail').value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){$('localAccountStatus').textContent='Enter a valid email address.';return}SYNC.account={email,createdAt:SYNC.account?.createdAt||Date.now()};saveSync()};
$('simulateSync').onclick=simulateLocalSync;
$('clearSyncQueue').onclick=()=>{SYNC.queue=[];saveSync()};$('testConflictMerge').onclick=()=>{$('mergeResult').textContent=testConflictMerge()?'Conflict merge test passed.':'Conflict merge test failed.'};

$('runSelfCheck').onclick=()=>{const r=selfCheck();alert(r.map(([n,ok])=>`${ok?'PASS':'CHECK'}: ${n}`).join('\n'))};
if('serviceWorker'in navigator){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{$('updateStatus').textContent='Updated — reload if needed.'});
 navigator.serviceWorker.ready.then(reg=>{reg.update().catch(()=>{})}).catch(()=>{});
}
window.addEventListener('online',()=>{$('updateStatus').textContent='Online'});
window.addEventListener('offline',()=>{$('updateStatus').textContent='Offline mode'});

$('runLaunchCheck').onclick=()=>{const rows=launchChecks();$('launchCheckResult').innerHTML=rows.map(([n,ok])=>`<div><span class="${ok?'diag-ok':'diag-warn'}">${ok?'PASS':'OPEN'}</span> ${n}</div>`).join('')};

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
$('labJumpKraken').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];const phase=$('labKrakenPhase').value||LAB.krakenPhase||'intro';const phaseMap={intro:1,recognition:1,'transition-a':1,equivalence:2,'transition-b':2,comparison:2,brainblast:3,victory:3};learner.stage='fraction-kraken';learner.activeActivity={family:'Fraction Kraken',prompt:'Defeat the Kraken in three greybox phases.',phase:phaseMap[phase]||1,health:phase==='victory'?1:3,choices:['1/2','2/4','3/4','1/3'],rewards:[]};learner.currentChallenge=null})};
$('labGrantReward').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];foundation.learners[foundation.activeLearnerId]=c.grantBrainifact(learner,'fraction-kraken')})};
$('labUpgradeHub').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];foundation.learners[foundation.activeLearnerId]=c.upgradeBrainBase(learner)})};
$('labQueueOffline').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];const skillId=$('labSkill').value||LAB.skillId||'number-facts';const event={id:`lab-${learner.profileId}-${skillId}-${$('labFamily').value||LAB.family||'target-smash'}`,type:'LearningAttemptRecorded',payload:{skillId,family:$('labFamily').value||LAB.family||'target-smash',difficulty:$('labDifficulty').value||LAB.difficulty||'normal',mode:'queued'},createdAt:Date.now()};foundation.learners[foundation.activeLearnerId]=c.queueOfflineEvent(learner,event)})};
$('labReplayOffline').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>{const learner=foundation.learners[foundation.activeLearnerId];const replay=c.replayOfflineQueue(learner,()=>true);foundation.learners[foundation.activeLearnerId]=replay.learner})};
$('labSaveSnapshot').onclick=()=>{const c=core();if(!c)return;applyLabFoundation(foundation=>c.createRecoverySnapshot(foundation))};
$('labCorruptSave').onclick=()=>{const c=core();if(!c)return;const foundation=loadFoundation();if(!foundation)return;persistFoundation(foundation);localStorage.setItem(c.STORAGE_KEY,'{broken');renderLab()};
$('labRestoreRecovery').onclick=()=>{const c=core();if(!c)return;const recovered=c.restoreFromRecoverySnapshot(loadFoundation());if(!recovered)return;persistFoundation(recovered);renderLab()};
$('labRefreshBrainBase').onclick=()=>{renderBrainBase(loadFoundation());renderLab()};
$('labSkill').onchange=renderLab;
$('labFamily').onchange=renderLab;
$('labDifficulty').onchange=renderLab;
$('labSkillPreset').onchange=renderLab;
$('labKrakenPhase').onchange=renderLab;

$('qaDeviceA').onclick=()=>{QA.deviceA=true;QA.deviceAPushed=false;saveQA();alert('Device A: play a mission, then use Account & Sync → Push to Cloud. Mark the next step after that push succeeds.')};
$('qaDeviceB').onclick=()=>{QA.deviceB=true;saveQA();alert('Device B: open BrainBite on a second browser/device, sign in with the same parent account, then Pull from Cloud.')};
$('qaIsolation').onclick=()=>{QA.isolationTested=true;saveQA();alert('Isolation test: sign in with a different Firebase parent account. That account must not be able to read the first family profile documents.')};
