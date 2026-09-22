/** Quick image dimension + file presence check for MATCH proof vs targets */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['docs/references/home-dashboard-target.jpg', 'docs/references/spike/home-live.png'],
  ['docs/references/battle-hud-target.jpg', 'docs/references/spike/battle-live.png'],
];

function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return null;
}

function pngSize(buf) {
  if (buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const rows = [];
for (const [targetRel, liveRel] of pairs) {
  const tPath = path.join(root, targetRel);
  const lPath = path.join(root, liveRel);
  const tBuf = fs.readFileSync(tPath);
  const lBuf = fs.readFileSync(lPath);
  const t = jpegSize(tBuf) || pngSize(tBuf);
  const l = pngSize(lBuf) || jpegSize(lBuf);
  rows.push({
    target: targetRel,
    live: liveRel,
    targetBytes: tBuf.length,
    liveBytes: lBuf.length,
    targetSize: t,
    liveSize: l,
    bothPresent: true,
  });
}
console.log(JSON.stringify(rows, null, 2));
const ok = rows.every((r) => r.targetSize && r.liveSize && r.liveBytes > 10_000);
console.log(ok ? 'UI_PROOF_ASSETS PASS' : 'UI_PROOF_ASSETS FAIL');
process.exit(ok ? 0 : 1);
