// Fails when a shipped text file carries a UTF-8 byte-order mark or double-encoded
// UTF-8 ("mojibake", e.g. "â˜…" where "★" was meant). Both have shipped before:
// styles.css rendered garbage glyphs in MATCH mode and the currency tiles.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TEXT = /\.(?:html|css|js|mjs|json|webmanifest|txt|svg)$/i;
const SKIP = /^(?:docs|tests|release|release-evidence|store-assets|scripts)\//;
// Lead bytes of common 2-4 byte sequences, re-read as Windows-1252 / Latin-1.
const MOJIBAKE = [/Ã[\u0080-¿‘-›ŒœŠšŽžŸ]/, /â€/, /â[˜—š„œ‹›]/, /ðŸ/, /ï¸/, /Â[ -¿]/];

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split(/\r?\n/)
  .filter((file) => file && TEXT.test(file) && !SKIP.test(file));
const failures = [];
for (const file of files) {
  const bytes = readFileSync(file);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) failures.push(`${file}: starts with a UTF-8 BOM`);
  const text = bytes.toString('utf8');
  text.split('\n').forEach((line, index) => {
    const hit = MOJIBAKE.find((pattern) => pattern.test(line));
    if (hit) failures.push(`${file}:${index + 1}: double-encoded UTF-8 near "${line.match(hit)[0]}"`);
  });
}
if (failures.length) {
  console.error(`check:encoding failed:\n${failures.map((f) => `  ${f}`).join('\n')}\nUse CSS escapes (e.g. content:'\\2605') or save the file as UTF-8 without BOM.`);
  process.exit(1);
}
console.log(`check:encoding: ${files.length} shipped text file(s), no BOM, no double-encoded UTF-8.`);
