/** Path: scripts/performance/verify-evidence.cjs
 * Purpose: Reject missing request correlations, dropped spans, invalid timing boundaries and unsafe trace fields before reporting. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const data = JSON.parse(fs.readFileSync('docs/performance/evidence/local-baseline.json', 'utf8'));
const traces = new Map(data.traces.map(t => [t.requestId, t]));
assert.equal(traces.size, data.traces.length, 'Duplicate server request IDs');
for (const record of data.records) {
  assert.equal(record.status, 200, record.experience + ' failed');
  const trace = traces.get(record.requestId);
  assert.ok(trace, 'Missing server correlation');
  assert.ok(record.clientBodyMs >= record.clientHeadersMs && record.parseMs >= 0);
  assert.ok(trace.finishMs >= trace.headersMs && trace.headersMs >= 0);
  assert.equal(trace.droppedSpans, 0, 'Incomplete trace cannot support full accounting');
  for (const span of trace.spans) {
    assert.ok(span.startMs >= 0 && span.durationMs >= 0);
    assert.ok(span.startMs + span.durationMs <= trace.headersMs + 0.001, 'Post-response work entered critical path');
  }
  const headerTotal = Number(record.serverTiming.match(/total;dur=([\d.]+)/)?.[1]);
  assert.ok(Math.abs(headerTotal - trace.headersMs) <= 0.001);
}
assert.ok(data.overhead.every(r => r.status === 200));
for (const trace of data.traces) {
  const text = JSON.stringify(trace);
  for (const forbidden of ['Bearer ', 'Authorization', 'passwordHash', 'mongodb://', 'Synthetic message', 'perf0', 'perf1']) {
    assert.ok(!text.includes(forbidden), 'Unsafe trace value: ' + forbidden);
  }
}
console.log(`Verified ${data.records.length} paired HTTP measurements and ${data.overhead.length} retained A/B samples; no missing correlations or dropped spans.`);
