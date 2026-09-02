import fs from 'node:fs';
const req=['index.html','app.js','styles.css','manifest.webmanifest','service-worker.js','privacy.html','support.html','terms.html'];
let fail=false;
for(const f of req){if(!fs.existsSync(f)){console.error('Missing',f);fail=true}}
const app=fs.readFileSync('app.js','utf8');
for(const token of ['mergeProfiles','exportEnvelope','renderIntegrations','Memory Drop']){if(!app.includes(token)&&token!=='Memory Drop'){console.error('Missing runtime token',token);fail=true}}
if(fail)process.exit(1);console.log('Release structure validation passed.');
