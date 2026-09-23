/** Path: scripts/performance/regional-probe.cjs
 * Purpose: Run on an actual regional host to separate measured socket phases from backend Server-Timing. */
const https = require('node:https');
const http = require('node:http');
const { performance } = require('node:perf_hooks');
const origin = process.env.PERF_API_ORIGIN;
const route = process.env.PERF_PROBE_PATH || '/api/gifts/catalog';
const region = process.env.PERF_REGION;
if (!origin || !['US', 'India', 'Singapore', 'Japan', 'South-Korea', 'Nepal'].includes(region)) {
  throw new Error('Set PERF_API_ORIGIN and an explicit supported PERF_REGION on the actual regional runner');
}
const url = new URL(route, origin);
if (url.origin !== new URL(origin).origin) throw new Error('Probe path must remain on the specified origin');
if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1') throw new Error('HTTPS required outside loopback');
const bearer = process.env.PERF_TEST_TOKEN || '';
if (/[\r\n]/.test(bearer)) throw new Error('Invalid credential format');
const count = Math.min(100, Math.max(1, Number(process.env.PERF_SAMPLES) || 20));
const transport = url.protocol === 'https:' ? https : http;
const agent = new transport.Agent({ keepAlive: true });
async function sample(iteration) {
  return new Promise((resolve, reject) => {
    const start = performance.now(), times = {}, elapsed = () => performance.now() - start;
    const request = transport.request(url, { agent, method: 'GET',
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} }, response => {
      times.headers = elapsed();
      let bytes = 0;
      response.on('data', chunk => { bytes += chunk.length; });
      response.on('error', reject);
      response.on('end', () => {
        const total = elapsed(), timing = String(response.headers['server-timing'] || '');
        const match = timing.match(/(?:^|,)\s*total;dur=([\d.]+)/);
        const backendMs = match ? Number(match[1]) : null;
        resolve({ kind: 'regional-http', region, iteration, capturedAt: new Date().toISOString(),
          status: response.statusCode, reusedSocket: request.reusedSocket,
          dnsMs: times.lookup === undefined ? null : times.lookup - times.socket,
          tcpMs: times.connect === undefined ? null : times.connect - (times.lookup ?? times.socket),
          tlsMs: times.tls === undefined ? null : times.tls - times.connect,
          headersMs: times.headers, totalMs: total, backendMs,
          nonServerToHeadersMs: backendMs === null ? null : times.headers - backendMs,
          bytes, requestId: /^[a-f0-9-]{36}$/.test(response.headers['x-perf-request-id'] || '') ? response.headers['x-perf-request-id'] : null });
      });
    });
    request.on('socket', socket => {
      times.socket = elapsed();
      if (socket.connecting) {
        socket.once('lookup', () => { times.lookup = elapsed(); });
        socket.once('connect', () => { times.connect = elapsed(); });
        socket.once('secureConnect', () => { times.tls = elapsed(); });
      }
    });
    request.on('error', () => reject(new Error('Probe failed; check connectivity and test credentials locally')));
    request.setTimeout(60000, () => request.destroy(new Error('timeout')));
    request.end();
  });
}
(async () => {
  try { for (let i = 0; i < count; i++) { console.log(JSON.stringify(await sample(i))); await new Promise(r => setTimeout(r, 500)); } }
  finally { agent.destroy(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
