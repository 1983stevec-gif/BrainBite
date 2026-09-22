import { createBrainBiteServer } from '../scripts/serve.mjs';

export default async function globalSetup() {
  if (process.env.BRAINBITE_REUSE_TEST_SERVER === '1') return undefined;
  const port = Number(process.env.BRAINBITE_TEST_PORT || 4318);
  const server = await createBrainBiteServer({ port });
  return async () => {
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
  };
}
