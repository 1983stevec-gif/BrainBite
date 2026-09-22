import { validateFirebaseRulesFile } from './validate-firebase-security.mjs';

const errors = validateFirebaseRulesFile();
if (errors.length) {
  for (const error of errors) console.error(`Firebase rules structure: ${error}`);
  process.exit(1);
}

console.log('Firebase rules structure and security contract validated.');
