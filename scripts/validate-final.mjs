import fs from 'node:fs';
const req=['release/v12-manifest.json','docs/V12_FINAL_RELEASE_RUNBOOK.md','docs/V12_BUG_SEVERITY.md','firebase/firestore.rules'];
let fail=false;for(const f of req){if(!fs.existsSync(f)){console.error('Missing',f);fail=true}}
const manifest=JSON.parse(fs.readFileSync('release/v12-manifest.json','utf8'));
if(manifest.coreMissionCount!==30||manifest.bossCount!==3){console.error('Bad release manifest counts');fail=true}
if(fail)process.exit(1);console.log('Final hardening structure validated.');
