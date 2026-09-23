/** Path: scripts/performance/overhead.cjs
 * Purpose: Interleave warm enabled/disabled requests against identical local data; report noise, not assumed zero overhead. */
const { performance } = require('node:perf_hooks');
const { start, stop, token } = require('./local-harness.cjs');
async function measureOverhead(uri, instrumented) {
  const control = await start(uri, false);
  const rows = [];
  try {
    for (const route of ['/', '/api/profile/full']) {
      for (let i = 0; i < 70; i++) {
        const order = i % 2 ? [control, instrumented] : [instrumented, control];
        for (const server of order) {
          const begin = performance.now();
          const r = await fetch(server.url + route, { headers: { Authorization: `Bearer ${token('perf0')}` } });
          await r.text();
          if (i >= 10) rows.push({ route, enabled: server === instrumented, durationMs: performance.now() - begin, status: r.status });
          if (server === control && r.headers.has('server-timing')) throw new Error('Disabled server added diagnostic headers');
        }
      }
    }
  } finally { await stop(control); }
  return rows;
}
module.exports = { measureOverhead };
