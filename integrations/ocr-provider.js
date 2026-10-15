const MAX_RESPONSE_BYTES = 256 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

function validateEndpoint(endpoint) {
  let url;
  try {
    url = new URL(String(endpoint));
  } catch {
    throw new Error('OCR endpoint must be a valid HTTPS URL');
  }
  const localHttp = url.protocol === 'http:'
    && (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]');
  if (url.protocol !== 'https:' && !localHttp) {
    throw new Error('OCR endpoint must use HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('OCR endpoint must not include credentials');
  }
  return url.href;
}

async function readBoundedText(response) {
  if (!response.body?.getReader) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
      throw new Error('OCR response is too large');
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('OCR response is too large');
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally {
    reader.releaseLock();
  }
}

export async function extractWorksheetText(file, { provider = 'none', endpoint = '' } = {}) {
  if (provider === 'none') throw new Error('OCR provider not configured');
  if (provider !== 'custom') throw new Error('Unsupported OCR provider');
  if (!file || typeof file !== 'object') throw new Error('OCR requires a worksheet file');

  const url = validateEndpoint(endpoint);
  const form = new FormData();
  form.append('file', file);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response;
    try {
      response = await fetch(url, { method: 'POST', body: form, signal: controller.signal });
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('OCR request timed out');
      throw new Error('OCR request failed');
    }
    if (!response.ok) throw new Error('OCR request failed');

    let data;
    try {
      data = JSON.parse(await readBoundedText(response));
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') throw new Error('OCR request timed out');
      if (error?.message === 'OCR response is too large') throw error;
      throw new Error('OCR response was not valid JSON');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.text !== 'string') {
      throw new Error('OCR response did not contain text');
    }
    return data.text;
  } finally {
    clearTimeout(timeout);
  }
}
