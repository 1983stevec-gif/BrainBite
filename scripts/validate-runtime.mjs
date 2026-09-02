import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('app.js','utf8');
const required=['Account & Sync','Parent Controls','Diagnostics','Snap-to-Game','Practice Lab','Spanish Portal'];
let fail=false;for(const x of required){if(!html.includes(x)){console.error('Missing UI:',x);fail=true}}
if(!js.includes('mergeProfiles')){console.error('Missing conflict merge');fail=true}
if(!js.includes('exportEnvelope')){console.error('Missing versioned export');fail=true}
if(fail)process.exit(1);console.log('Runtime structure validation passed.');
