import { createBrainBiteServer, verifyBrainBiteServer } from '../scripts/serve.mjs';

export default async function globalSetup() {
  const port = Number(process.env.BRAINBITE_TEST_PORT || 4318);
  if (process.env.BRAINBITE_REUSE_TEST_SERVER === '1') {
    const provenance = await verifyBrainBiteServer({ baseURL: `http://127.0.0.1:${port}` });
    console.log(`Reusing verified BrainBite server (${provenance.indexHtmlSha256})`);
    return undefined;
  }
  const server = await createBrainBiteServer({ port });
  return async () => {
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
  };
}
