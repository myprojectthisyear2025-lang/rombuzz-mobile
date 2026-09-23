/** Path: scripts/performance/local-device-server.cjs
 * Purpose: Keep the latest backend and disposable synthetic Mongo running for a subsequent native-device capture. */
const { backendRequire, start, stop, save } = require('./local-harness.cjs');
const { seed } = require('./seed.cjs');
const mongoose = backendRequire('mongoose');
const { MongoMemoryReplSet } = backendRequire('mongodb-memory-server');
let mongo, server, stopping = false;
async function cleanup() {
  if (stopping) return;
  stopping = true;
  await stop(server); await mongoose.disconnect(); if (mongo) await mongo.stop();
}
async function main() {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 }, instanceOpts: [{ ip: '127.0.0.1' }] });
  await mongoose.connect(mongo.getUri('rombuzz_perf_device'), { autoIndex: false, autoCreate: false });
  await seed(mongoose);
  const hash = await backendRequire('bcrypt').hash('RomBuzzPerf-local-2026!', 10);
  await backendRequire('./models/User').updateMany({ id: { $in: ['perf0', 'perf1'] } }, {
    $set: { passwordHash: hash, hasOnboarded: true, profileComplete: true, isVerified: true },
  });
  server = await start(mongo.getUri('rombuzz_perf_device'), true);
  if (process.env.PERF_DEVICE_SMOKE === 'true') {
    const statuses = [];
    for (const id of ['perf0', 'perf1']) {
      const response = await fetch(server.url + '/api/auth/login', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: id + '@example.test', password: 'RomBuzzPerf-local-2026!' }) });
      const value = await response.json();
      if (response.status !== 200 || value.status !== 'ok' || !value.token) throw new Error('Fixture login failed');
      statuses.push({ status: response.status, profileComplete: value.user.profileComplete === true });
    }
    save('device-fixture-smoke.json', { capturedAt: new Date().toISOString(),
      purpose: 'Disposable device-fixture login smoke check; no native device was connected', statuses });
    console.log('Both synthetic fixture accounts completed normal login.');
    await cleanup(); return;
  }
  const port = new URL(server.url).port;
  console.log(`Synthetic backend ready. Android forwarding: adb reverse tcp:4000 tcp:${port}`);
  console.log('Test accounts: perf0@example.test and perf1@example.test. Password: RomBuzzPerf-local-2026!');
  console.log('No real media is served. Use owned synthetic fixtures for media capture. Press Ctrl+C to stop.');
  // Export only the bounded safe records, not backend console output or credentials.
  const timer = setInterval(() => {
    for (const record of server.traces.splice(0)) console.log('[PERF] ' + JSON.stringify(record));
  }, 1000);
  process.once('SIGINT', async () => { clearInterval(timer); await cleanup(); });
  process.once('SIGTERM', async () => { clearInterval(timer); await cleanup(); });
}
main().catch(async () => { console.error('Local fixture startup failed.'); await cleanup(); process.exitCode = 1; });
