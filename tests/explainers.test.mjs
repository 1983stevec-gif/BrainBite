import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { explain } = require('../content/explainers.js');

test('even/odd explainer counts pairs and the leftover', () => {
  const odd = explain({ prompt: 'Bite all even numbers.', chosen: '7' });
  assert.equal(odd.kind, 'pairs');
  assert.match(odd.text, /7 makes 3 pairs with 1 left over, so 7 is odd/);
  assert.equal((odd.svg.match(/<circle/g) || []).length, 7);
  const even = explain({ skill: 'odd-numbers', chosen: '8' });
  assert.match(even.text, /8 makes 4 pairs with none left over, so 8 is even/);
});

test('prime explainer shows an equal-rows array for composites', () => {
  const result = explain({ prompt: 'Bite all prime numbers.', chosen: '9' });
  assert.equal(result.kind, 'array');
  assert.match(result.text, /9 = 3 × 3/);
  assert.equal((result.svg.match(/<circle/g) || []).length, 9);
  assert.equal(explain({ prompt: 'prime', chosen: '7' }), null);
});

test('fraction explainer shades numerator parts of the denominator', () => {
  const result = explain({ prompt: 'Find fractions equal to one half', chosen: '3/4' });
  assert.equal(result.kind, 'fraction');
  assert.equal((result.svg.match(/<rect/g) || []).length, 4);
  assert.equal((result.svg.match(/fill="#f0b429"/g) || []).length, 3);
});

test('explainers never emit inline styles or script, and escape the label', () => {
  for (const input of [{ prompt: 'even', chosen: '5' }, { prompt: 'prime', chosen: '12' }, { chosen: '2/5' }]) {
    const { svg } = explain(input);
    assert.doesNotMatch(svg, /style=|<script|on\w+=/i);
  }
});

test('unknown topics and non-numeric answers fall back to text-only feedback', () => {
  assert.equal(explain({ prompt: 'Bite the nouns', chosen: 'dog' }), null);
  assert.equal(explain({ prompt: 'Bite all even numbers.', chosen: '400' }), null);
  assert.equal(explain({}), null);
});
