import fs from 'node:fs';
const rules=fs.readFileSync('firebase/firestore.rules','utf8');
const checks=[
  'rules_version = \'2\'',
  'request.auth != null',
  'request.auth.uid == familyId',
  'resource.data.ownerId == request.auth.uid',
  'request.resource.data.ownerId == request.auth.uid',
  'allow read, write: if false'
];
let fail=false;
for(const token of checks){if(!rules.includes(token)){console.error('Missing security rule token:',token);fail=true}}
if(/allow\s+read,\s*write:\s*if\s*request\.auth\s*!=\s*null\s*;/.test(rules)){console.error('Overbroad authenticated rule detected');fail=true}
if(fail)process.exit(1);console.log('Firebase ownership and default-deny rules validated.');
