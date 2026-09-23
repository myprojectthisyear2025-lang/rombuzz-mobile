/** Path: scripts/performance/instrumentation.test.cjs
 * Purpose: Verify real Express errors, privacy, concurrent request isolation, serialization and disabled behavior. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { backendRequire } = require('./local-harness.cjs');
process.env.PERF_DIAGNOSTICS = 'true';
const express = backendRequire('express');
const { requestTiming } = backendRequire('./performance/http');
const { instrumentExpress } = backendRequire('./performance/express');
const { begin, union, storage } = backendRequire('./performance/context');
test('union counts overlapping work once', () => {
  assert.equal(union([{ category: 'mongo', startMs: 0, durationMs: 10 },
    { category: 'mongo', startMs: 5, durationMs: 12 }], 'mongo'), 17);
});
test('requests preserve JSON, errors, headers and never log sensitive values', async t => {
  const app = express(), records = [];
  app.use(requestTiming); app.use(express.json());
  app.use(function validation(req, res, next) { if (req.body?.reject) return res.status(422).json({ error: 'validation' }); next(); });
  app.get('/item/:id', async (req, res) => {
    const stop = begin('synthetic.query', 'mongo');
    await new Promise(resolve => setTimeout(resolve, Number(req.query.delay) || 0));
    stop(); res.json({ ok: true, id: req.params.id });
  });
  app.get('/reject', async () => { throw new Error('synthetic failure'); });
  app.use(function onError(error, req, res, next) { res.status(503).json({ error: 'expected' }); });
  instrumentExpress(app); instrumentExpress(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const old = console.log;
  console.log = line => { if (String(line).startsWith('[PERF] ')) records.push(JSON.parse(line.slice(7))); };
  t.after(async () => { console.log = old; await new Promise(resolve => server.close(resolve)); });
  const url = 'http://127.0.0.1:' + server.address().port;
  const results = await Promise.all([20, 1, 8].map(async delay => {
    const res = await fetch(`${url}/item/private-user?delay=${delay}&token=do-not-log`, {
      headers: { Authorization: 'Bearer private-credential' },
    });
    assert.deepEqual(await res.json(), { ok: true, id: 'private-user' });
    assert.match(res.headers.get('server-timing'), /total;dur=/);
    return res.headers.get('x-perf-request-id');
  }));
  assert.equal(new Set(results).size, 3);
  const rejected = await fetch(url + '/reject'); assert.equal(rejected.status, 503);
  assert.deepEqual(await rejected.json(), { error: 'expected' });
  const invalid = await fetch(url + '/item/unused', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reject: true, password: 'secret-value' }) });
  assert.equal(invalid.status, 422); await invalid.text();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(records.length, 5);
  const serialized = JSON.stringify(records);
  for (const secret of ['private-user', 'do-not-log', 'private-credential', 'secret-value']) assert.ok(!serialized.includes(secret));
  assert.ok(records.slice(0, 3).every(r => r.queryCount === 1 && r.route === '/item/:id'));
  assert.ok(records.every(r => r.finishMs >= r.headersMs && r.spans.some(s => s.name === 'json.stringify')));
  assert.equal(storage.getStore(), undefined);
});
test('disabled middleware does not set headers, allocate request context or touch response methods', () => {
  const file = backendRequire.resolve('./performance/http');
  const code = `const {requestTiming}=require(${JSON.stringify(file)}); const res={}; let calls=0; requestTiming({},res,()=>calls++); if(calls!==1||Object.keys(res).length) process.exit(1);`;
  const result = spawnSync(process.execPath, ['-e', code], { env: { ...process.env, PERF_DIAGNOSTICS: 'false' }, windowsHide: true });
  assert.equal(result.status, 0, String(result.stderr));
});
