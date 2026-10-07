import assert from 'node:assert/strict';
import test from 'node:test';

import { extractWorksheetText } from '../integrations/ocr-provider.js';

const originalFetch = globalThis.fetch;

function worksheet() {
  return new Blob(['worksheet'], { type: 'text/plain' });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('OCR rejects insecure or credential-bearing endpoints before uploading a worksheet', async () => {
  await assert.rejects(
    extractWorksheetText(worksheet(), { provider: 'custom', endpoint: 'http://ocr.example.test/read' }),
    /must use HTTPS/,
  );
  await assert.rejects(
    extractWorksheetText(worksheet(), { provider: 'custom', endpoint: 'https://user:pass@ocr.example.test/read' }),
    /must not include credentials/,
  );
});

test('OCR sends a bounded request and returns only a string text field', async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ text: 'Recognized answers' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  assert.equal(
    await extractWorksheetText(worksheet(), { provider: 'custom', endpoint: 'https://ocr.example.test/read' }),
    'Recognized answers',
  );
  assert.equal(request.url, 'https://ocr.example.test/read');
  assert.equal(request.options.method, 'POST');
  assert.ok(request.options.body instanceof FormData);
  assert.ok(request.options.signal instanceof AbortSignal);
});

test('OCR rejects malformed and oversized responses', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ text: 42 }), { status: 200 });
  await assert.rejects(
    extractWorksheetText(worksheet(), { provider: 'custom', endpoint: 'https://ocr.example.test/read' }),
    /did not contain text/,
  );

  globalThis.fetch = async () => new Response('x'.repeat(256 * 1024 + 1), { status: 200 });
  await assert.rejects(
    extractWorksheetText(worksheet(), { provider: 'custom', endpoint: 'https://ocr.example.test/read' }),
    /too large/,
  );
});

test('OCR maps an aborted request to a stable timeout error', async () => {
  globalThis.fetch = async (_url, { signal }) => await new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('aborted', 'AbortError'));
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });

  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback) => {
    callback();
    return 0;
  };
  try {
    await assert.rejects(
      extractWorksheetText(worksheet(), { provider: 'custom', endpoint: 'https://ocr.example.test/read' }),
      /timed out/,
    );
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
});
