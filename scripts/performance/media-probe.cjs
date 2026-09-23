/** Path: scripts/performance/media-probe.cjs
 * Purpose: Explicit opt-in measurement of a supplied synthetic media URL, without logging URL/signature or media bytes. */
const { performance } = require('node:perf_hooks');
async function main() {
  const url = new URL(process.env.PERF_MEDIA_URL || '');
  if (url.protocol !== 'https:') throw new Error('Provide an HTTPS synthetic media URL in PERF_MEDIA_URL');
  const provider = url.hostname.includes('cloudinary') ? 'cloudinary' :
    /r2\.(cloudflarestorage\.com|dev)$/.test(url.hostname) ? 'r2' :
    /cloudflarestream|videodelivery/.test(url.hostname) ? 'cloudflare-stream' : 'other';
  const begin = performance.now();
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  const headersMs = performance.now() - begin;
  const reader = response.body?.getReader();
  let bytes = 0, truncated = false;
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes >= 8 * 1024 * 1024) { truncated = true; await reader.cancel(); break; }
  }
  const headers = {};
  for (const name of ['content-type', 'content-length', 'cache-control', 'age', 'cf-cache-status', 'vary']) {
    headers[name] = response.headers.get(name)?.slice(0, 200) || null;
  }
  console.log(JSON.stringify({ kind: 'media-delivery', capturedAt: new Date().toISOString(), provider,
    status: response.status, headersMs, totalMs: performance.now() - begin, bytesRead: bytes, truncated, headers,
    note: 'HTTP delivery only; image dimensions/decode/display require the native media event capture.' }));
}
main().catch(() => { console.error('Media probe failed; inspect connectivity or supplied URL locally.'); process.exitCode = 1; });
