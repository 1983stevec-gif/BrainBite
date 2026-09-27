export function evidenceCheckForBranch(branch) {
  return branch === 'main' ? 'check:evidence' : 'check:evidence:ci';
}
