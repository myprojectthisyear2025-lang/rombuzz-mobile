/** Path: scripts/performance/local-baseline.cjs
 * Purpose: Real local HTTP/Mongo baseline, socket establishment and bounded explain on synthetic data only. */
const { performance } = require('node:perf_hooks');
const os = require('node:os');
const { Buffer } = require('node:buffer');
const { backendRequire, start, stop, token, save } = require('./local-harness.cjs');
const { seed } = require('./seed.cjs');
const { measureActions } = require('./actions.cjs');
const { measureOverhead } = require('./overhead.cjs');
const mongoose = backendRequire('mongoose');
const { MongoMemoryReplSet } = backendRequire('mongodb-memory-server');
const { io } = backendRequire('socket.io-client');
const flows = [
  ['health', '/'], ['discover', '/api/discover?lat=0&lng=0'], ['view-profile', '/api/users/perf1'],
  ['letsbuzz-posts-reels', '/api/feed/letsbuzz'], ['social-stats', '/api/social-stats'],
  ['notifications', '/api/notifications'], ['matches-inbox', '/api/matches'],
  ['chat-open', '/api/chat/rooms/perf0_perf1?limit=40'],
  ['chat-history', '/api/chat/rooms/perf0_perf1?limit=40&before=msg460'],
  ['shared-purchased-media', '/api/chat/rooms/perf0_perf1'],
  ['unread', '/api/chat/unread-summary'], ['microbuzz', '/api/microbuzz/nearby?lat=0&lng=0'],
  ['own-profile-gallery', '/api/profile/full'], ['gifts-catalog', '/api/gifts/catalog'],
  ['video-call-active', '/api/video-calls/active'],
];
async function main() {
  let mongo, server;
  const records = [], sockets = [];
  try {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 }, instanceOpts: [{ ip: '127.0.0.1' }] });
    const uri = mongo.getUri('rombuzz_perf_synthetic');
    await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
    const dataset = await seed(mongoose);
    const { models, ...datasetDescription } = dataset;
    server = await start(uri, true);
    for (const [experience, route] of flows) {
      for (let iteration = 0; iteration < 16; iteration++) {
        const begin = performance.now();
        const response = await fetch(server.url + route, { headers: { Authorization: `Bearer ${token('perf0')}` } });
        const headersMs = performance.now() - begin;
        const raw = await response.text();
        const bodyMs = performance.now() - begin;
        const parseStart = performance.now();
        const value = JSON.parse(raw);
        const parseMs = performance.now() - parseStart;
        records.push({ experience, iteration, status: response.status, clientHeadersMs: headersMs,
          clientBodyMs: bodyMs, parseMs, bytes: Buffer.byteLength(raw),
          requestId: response.headers.get('x-perf-request-id'), serverTiming: response.headers.get('server-timing'),
          count: Array.isArray(value) ? value.length : Array.isArray(value?.users) ? value.users.length :
            Array.isArray(value?.items) ? value.items.length : Array.isArray(value?.messages) ? value.messages.length : null });
      }
      console.log('Measured ' + experience);
    }
    for (let i = 0; i < 10; i++) {
      const begin = performance.now();
      const client = io(server.url, { transports: ['websocket'], forceNew: true, reconnection: false,
        auth: { token: token('perf0') } });
      try {
        await new Promise((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject);
          client.timeout(10000); });
        sockets.push({ kind: 'local-socket-connect', durationMs: performance.now() - begin });
      } finally { client.disconnect(); }
    }
    // Execution stats run only on the small fixture. No explain runs on application traffic.
    const plans = [];
    const queries = [
      ['User.findOne.id', models[0].findOne({ id: 'perf0' })],
      ['User.discover-base-filter', models[0].find({ id: { $nin: Array.from({ length: 21 }, (_, i) => `perf${i}`) },
        visibility: { $nin: ['invisible', 'pending_delete'] }, deleteStatus: { $ne: 'pending_delete' },
        'moderation.restrictions.discover': { $ne: true } }).limit(400)],
      ['Match.users', models[1].find({ users: 'perf0', status: 'matched' })],
      ['Post.owner-sort', models[2].find({ userId: { $in: ['perf1', 'perf2'] }, isActive: true }).sort({ createdAt: -1 })],
      ['ChatRoom.roomId', models[3].findOne({ roomId: 'perf0_perf1' })],
      ['ChatRoom.unread-participants', models[3].find({ participants: 'perf0' })],
    ];
    for (const [name, query] of queries) {
      const plan = await query.maxTimeMS(1000).explain('executionStats');
      const stages = [], indexes = [];
      const walk = v => { if (!v || typeof v !== 'object') return;
        if (v.stage) stages.push(v.stage); if (v.indexName) indexes.push(v.indexName);
        for (const child of Object.values(v)) if (typeof child === 'object') walk(child); };
      walk(plan.queryPlanner?.winningPlan);
      const s = plan.executionStats;
      plans.push({ name, returned: s.nReturned, docsExamined: s.totalDocsExamined,
        keysExamined: s.totalKeysExamined, executionMs: s.executionTimeMillis, stages, indexes });
    }
    const deliveries = await measureActions(server, records);
    const overhead = await measureOverhead(uri, server);
    await new Promise(resolve => setTimeout(resolve, 100));
    save('local-baseline.json', { capturedAt: new Date().toISOString(), environment: 'Windows loopback; synthetic Mongo replica set; Node ' + process.version,
      system: { platform: os.platform(), release: os.release(), arch: os.arch(), cpu: os.cpus()[0]?.model,
        logicalCpus: os.cpus().length, memoryBytes: os.totalmem(), mongoose: mongoose.version,
        mongo: (await mongoose.connection.db.admin().command({ buildInfo: 1 })).version },
      dataset: datasetDescription, note: 'iteration 0 is first route access, not a Render cold start; 1..15 are warm serial samples',
      records, traces: server.traces, sockets, plans, deliveries, overhead });
    console.log('Saved synthetic baseline (' + records.length + ' HTTP requests).');
  } finally { await stop(server); await mongoose.disconnect(); if (mongo) await mongo.stop(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
