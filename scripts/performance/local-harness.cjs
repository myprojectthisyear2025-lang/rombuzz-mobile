/** Path: scripts/performance/local-harness.cjs
 * Purpose: Run the latest backend with synthetic credentials and disposable loopback Mongo; never read .env. */
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const backendRoot = path.resolve(process.env.PERF_BACKEND_ROOT || 'C:/projects/rombuzz/Rombuzz_main/server');
const backendRequire = createRequire(path.join(backendRoot, 'package.json'));
const secret = 'performance-synthetic-local-only';
async function start(uri, diagnostics) {
  if (!/^mongodb:\/\/127\.0\.0\.1:/.test(uri)) throw new Error('Only disposable loopback Mongo is allowed');
  const port = await new Promise(resolve => {
    const server = net.createServer(); server.listen(0, '127.0.0.1', () => {
      const port = server.address().port; server.close(() => resolve(port));
    });
  });
  const traces = [], other = [];
  const env = {
    PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP,
    NODE_ENV: 'test', PORT: String(port), MONGO_URI: uri, JWT_SECRET: secret,
    DOTENV_CONFIG_PATH: path.join(__dirname, 'nonexistent-env'),
    PERF_DIAGNOSTICS: String(diagnostics), PERF_SAMPLE_RATE: '1',
    DISABLE_BACKGROUND_JOBS: 'true', SENTRY_DSN: '',
    RESEND_API_KEY: 're_synthetic_test_only',
    R2_BUCKET_NAME: 'synthetic-test', R2_ACCESS_KEY_ID: 'synthetic', R2_SECRET_ACCESS_KEY: 'synthetic',
    R2_ENDPOINT: 'http://127.0.0.1:1',
    AGORA_APP_ID: '00000000000000000000000000000000', AGORA_APP_CERTIFICATE: '11111111111111111111111111111111',
  };
  const child = spawn(process.execPath, ['-r', path.join(__dirname, 'no-env.cjs'), 'index.js'], { cwd: backendRoot, windowsHide: true,
    env, stdio: ['ignore', 'pipe', 'pipe'] });
  let pending = '', started = false;
  child.stdout.on('data', chunk => {
    pending += chunk;
    const lines = pending.split(/\r?\n/); pending = lines.pop();
    for (const line of lines) {
      if (line.includes('API running on port')) started = true;
      if (line.startsWith('[PERF] ')) { try { traces.push(JSON.parse(line.slice(7))); } catch {} }
    }
  });
  child.stderr.on('data', chunk => { other.push(String(chunk)); if (other.length > 10) other.shift(); });
  const deadline = Date.now() + 90000;
  while (!started) {
    if (child.exitCode !== null || Date.now() > deadline) {
      child.kill(); throw new Error('Local backend failed to start: ' + other.join('').slice(-1800));
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return { child, traces, url: `http://127.0.0.1:${port}` };
}
async function stop(server) {
  if (server?.child && server.child.exitCode === null) {
    await new Promise(resolve => { server.child.once('exit', resolve); server.child.kill(); });
  }
}
const token = id => backendRequire('jsonwebtoken').sign({ id }, secret);
const outputRoot = path.resolve(__dirname, '../../docs/performance/evidence');
function save(name, value) {
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, name), JSON.stringify({
    path: `docs/performance/evidence/${name}`, purpose: 'Measured local synthetic performance evidence; no production data', ...value,
  }, null, 2) + '\n');
}
module.exports = { backendRoot, backendRequire, start, stop, token, save };
