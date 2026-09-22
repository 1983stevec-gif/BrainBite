import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.cwd());
const DEFAULT_PORT = 4318;
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

export function createBrainBiteServer({ port = Number(process.env.PORT || DEFAULT_PORT), host = '127.0.0.1' } = {}) {
 const server=createServer((request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://localhost');
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
