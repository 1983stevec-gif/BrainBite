import fs from 'node:fs';
const rules=fs.readFileSync('firebase/firestore.rules','utf8');
const required=['request.auth != null','request.auth.uid == familyId','ownerId'];
let fail=false;
for(const t of required){if(!rules.includes(t)){console.error('Missing Firebase rule token:',t);fail=true}}
if(fail)process.exit(1);console.log('Firebase security rules structure validated.');
