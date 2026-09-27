/* BrainBite visual explainers.
 *
 * After a wrong answer the child sees *why* for a few seconds: pairs of dots for
 * even/odd, a factor array for primes, a bar split into equal parts for fractions.
 * Pure functions over the challenge data; they never decide correctness and never touch
 * learner evidence. SVG uses presentation attributes only (no style="..."), because the
 * content security policy allows no inline styles.
 */
(function (root) {
  'use strict';

  const INK = '#2a1a0c';
  const GOOD = '#2f9a3f';
  const ODD = '#d9480f';
  const PART = '#f0b429';
  const EMPTY = '#fff8e6';

  function svg(width, height, body, label) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeAttr(label)}">${body}</svg>`;
  }
  function escapeAttr(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function asInteger(value) {
    const text = String(value ?? '').trim();
    return /^\d{1,3}$/.test(text) ? Number(text) : null;
  }
  function asFraction(value) {
    const match = String(value ?? '').trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
    if (!match) return null;
    const [, numerator, denominator] = match.map(Number);
    return denominator > 0 && denominator <= 12 && numerator <= denominator * 2 ? { numerator, denominator } : null;
  }
  function smallestFactor(n) {
    for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return d;
    return null;
  }

  function pairsExplainer(n) {
    const pairs = Math.floor(n / 2);
    const leftover = n % 2;
    const r = 7;
    const gap = 20;
    const columns = pairs + leftover;
    const width = Math.max(40, columns * gap + 12);
    let body = '';
    for (let i = 0; i < pairs; i += 1) {
      const x = 12 + i * gap;
      body += `<rect x="${x - r - 2}" y="4" width="${2 * r + 4}" height="${2 * gap + 2}" rx="${r + 2}" fill="none" stroke="${GOOD}" stroke-width="2"/>`;
      body += `<circle cx="${x}" cy="${4 + r + 3}" r="${r}" fill="${GOOD}"/><circle cx="${x}" cy="${4 + r + 3 + gap}" r="${r}" fill="${GOOD}"/>`;
    }
    if (leftover) body += `<circle cx="${12 + pairs * gap}" cy="${4 + r + 3}" r="${r}" fill="${ODD}"/>`;
    const text = n === 1
      ? '1 has no partner to make a pair, so 1 is odd.'
      : leftover
      ? `${n} makes ${pairs} pair${pairs === 1 ? '' : 's'} with 1 left over, so ${n} is odd.`
      : `${n} makes ${pairs} pair${pairs === 1 ? '' : 's'} with none left over, so ${n} is even.`;
    return { kind: 'pairs', text, svg: svg(width, 2 * gap + 10, body, text) };
  }

  function arrayExplainer(n, factor) {
    const rows = factor;
    const cols = n / factor;
    const cell = 12;
    let body = '';
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) body += `<circle cx="${8 + x * cell}" cy="${8 + y * cell}" r="4.5" fill="${ODD}"/>`;
    }
    const text = `${n} = ${rows} × ${cols}. It splits into equal rows, so it is not prime.`;
    return { kind: 'array', text, svg: svg(cols * cell + 6, rows * cell + 6, body, text) };
  }

  function fractionExplainer({ numerator, denominator }) {
    const width = 200;
    const part = width / denominator;
    let body = '';
    for (let i = 0; i < denominator; i += 1) {
      body += `<rect x="${2 + i * part}" y="2" width="${part}" height="26" fill="${i < numerator ? PART : EMPTY}" stroke="${INK}" stroke-width="2"/>`;
    }
    const text = `${numerator}/${denominator} means ${numerator} of ${denominator} equal parts.`;
    return { kind: 'fraction', text, svg: svg(width + 4, 32, body, text) };
  }

  /**
   * @param {{prompt?: string, skill?: string, chosen: unknown}} input
   * @returns {{kind: string, text: string, svg: string} | null}
   */
  function explain({ prompt = '', skill = '', chosen } = {}) {
    const topic = `${skill} ${prompt}`.toLowerCase();
    const fraction = asFraction(chosen);
    if (fraction) return fractionExplainer(fraction);
    const n = asInteger(chosen);
    if (n === null || n > 40) return null;
    if (/\b(even|odd)\b/.test(topic)) return n > 0 ? pairsExplainer(n) : null;
    if (/prime/.test(topic)) {
      const factor = smallestFactor(n);
      if (factor && n <= 36) return arrayExplainer(n, factor);
      if (n === 1) return { kind: 'text', text: '1 has only one factor, so it is not prime.', svg: '' };
    }
    return null;
  }

  const api = Object.freeze({ explain });
  root.BrainBiteExplainers = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
