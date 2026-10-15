import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer, get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.cwd());
const DEFAULT_PORT = 4318;
const PROVENANCE_PATH = '/.brainbite-test-provenance';
const PROVENANCE_SCHEMA = 'brainbite.test-server-provenance.v1';
const port = Number(process.env.PORT || DEFAULT_PORT);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wav': 'audio/wav',
  '.webmanifest': 'application/manifest+json',
};

function indexFingerprint() {
  return createHash('sha256').update(readFileSync(resolve(root, 'index.html'))).digest('hex');
}

export async function verifyBrainBiteServer({ baseURL, timeoutMs = 2000 } = {}) {
  const expected = indexFingerprint();
  const endpoint = new URL(PROVENANCE_PATH, `${baseURL.replace(/\/$/, '')}/`);
  let response;
  try {
    response = await new Promise((resolveResponse, reject) => {
      const request = (endpoint.protocol === 'https:' ? httpsGet : httpGet)(endpoint, incoming => {
        const chunks = [];
        let bytes = 0;
        incoming.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > 64 * 1024) request.destroy(new Error('provenance response exceeded 64 KiB'));
          else chunks.push(chunk);
        });
        incoming.on('end', () => resolveResponse({
          ok: incoming.statusCode >= 200 && incoming.statusCode < 300,
          body: Buffer.concat(chunks).toString('utf8'),
        }));
      });
      request.setTimeout(timeoutMs, () => request.destroy(new Error(`timed out after ${timeoutMs}ms`)));
      request.on('error', reject);
    });
  } catch (error) {
    throw new Error(`BrainBite server provenance check failed at ${endpoint}: ${error.message}`);
  }

  let provenance = null;
  try {
    provenance = JSON.parse(response.body);
  } catch {
    // A generic/stale server may return index.html for every path. That is not provenance.
  }
  const actual = provenance?.indexHtmlSha256;
  if (!response.ok || provenance?.schema !== PROVENANCE_SCHEMA || actual !== expected) {
    throw new Error(
      `BrainBite server provenance mismatch at ${endpoint}: expected local index.html SHA-256 ${expected}, `
      + `received ${actual || 'no valid provenance'}. Stop the stale server or point the test at this checkout.`,
    );
  }
  return { endpoint: endpoint.href, indexHtmlSha256: expected };
}

export function createBrainBiteServer({ port = Number(process.env.PORT || DEFAULT_PORT), host = '127.0.0.1' } = {}) {
 const server=createServer((request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://localhost');
    if (url.pathname === PROVENANCE_PATH) {
      const body = JSON.stringify({ schema: PROVENANCE_SCHEMA, indexHtmlSha256: indexFingerprint() });
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      }).end(body);
      return;
    }
    const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = resolve(root, `.${normalize(requested)}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = statSync(file);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
 });
 return new Promise((resolve,reject)=>{
   server.once('error',reject);
   server.listen(port,host,()=>{server.off('error',reject);resolve(server)});
 });
}

async function runCli(){
 const server=await createBrainBiteServer({port});
 console.log(`BrainBite test server listening on http://127.0.0.1:${port}`);
 const shutdown=()=>{
   server.close(()=>process.exit(0));
   server.closeAllConnections?.();
   setTimeout(()=>process.exit(0),1000).unref();
 };
 process.once('SIGINT',shutdown);
 process.once('SIGTERM',shutdown);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))runCli().catch(error=>{console.error(error);process.exit(1)});
