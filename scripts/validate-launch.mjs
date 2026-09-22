import fs from 'node:fs';
const required=['firebase/firestore.rules','firebase/SETUP_CHECKLIST.txt','privacy.html','terms.html','support.html','service-worker.js'];
let fail=false;
for(const f of required){if(!fs.existsSync(f)){console.error('Missing',f);fail=true}}

const app=fs.readFileSync('app.js','utf8');
for(const t of ['retryPendingSync','deleteAuthAccount','cloudStoreProjection','RETIRED_SCREEN_IDS','launchChecks']){if(!app.includes(t)){console.error('Missing runtime feature',t);fail=true}}
for(const retired of ['function parseWorksheetText','extractTextBtn','saveSnap']){if(app.includes(retired)){console.error('Retired worksheet runtime remains',retired);fail=true}}

const index=fs.readFileSync('index.html','utf8');
for(const href of ['privacy.html','support.html','terms.html']){
  if(!index.includes(`href="${href}"`)){console.error('Missing footer link',href);fail=true}
}

const pages=[
  ['support.html','BrainBite Support','Production contact required before launch'],
  ['privacy.html','BrainBite Privacy Policy','Legal review required before launch'],
  ['terms.html','BrainBite Terms of Use','Terms review required before launch'],
];
for(const [file,heading,flag] of pages){
  const text=fs.readFileSync(file,'utf8');
  if(!text.includes(heading)){console.error('Missing page heading',file,heading);fail=true}
  if(!text.includes(flag)){console.error('Missing launch flag',file,flag);fail=true}
}

if(fail)process.exit(1);
console.log('Launch candidate structure validated.');
