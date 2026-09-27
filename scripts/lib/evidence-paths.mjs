// Where evidence-producing scripts write. By default every run writes into the
// git-ignored .playwright-results/ folder, so running the gate never dirties the tree
// that check:evidence requires to be clean. `npm run evidence:refresh` (or
// BRAINBITE_PROMOTE_EVIDENCE=1) writes to the tracked locations on purpose.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const promoteEvidence = process.env.BRAINBITE_PROMOTE_EVIDENCE === '1' || process.argv.includes('--promote');
const scratch = path.join(repoRoot, '.playwright-results');

/** Screenshot/report folder that otherwise lives in docs/references/spike. */
export const referenceCaptureDir = promoteEvidence ? path.join(repoRoot, 'docs', 'references', 'spike') : path.join(scratch, 'captures');
/** Folder for release-evidence reports such as smoke-report.json. */
export const releaseEvidenceDir = promoteEvidence ? path.join(repoRoot, 'release-evidence') : scratch;
