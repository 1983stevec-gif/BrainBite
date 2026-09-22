import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('BrainBase exposes a truthful, accessible Bubble Reef preview gateway', () => {
  assert.match(html, /class="bb-world-gateway"/);
  assert.match(html, /Internal preview/);
  assert.match(html, /<details class="bb-world-gateway-card">/);
  assert.match(html, /aria-label="Bubble Reef concept preview/);
  assert.match(html, /does not launch a mission/);
  assert.match(html, /id="bubbleReefLivePreviewBtn"/);
  assert.match(html, /id="bubbleReefLivePreviewStatus"/);
  assert.match(readFileSync(new URL('../app.js', import.meta.url), 'utf8'), /setProfile\?\.\('bubble-reef'\)/);
  assert.match(readFileSync(new URL('../app.js', import.meta.url), 'utf8'), /currentContentGateMode\(\)!=='internal-review'/);
  assert.match(css, /\.bb-world-gateway\{/);
  assert.match(css, /@media\(max-width:520px\)/);
});
