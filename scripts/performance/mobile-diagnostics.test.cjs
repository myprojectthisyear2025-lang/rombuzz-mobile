/** Path: scripts/performance/mobile-diagnostics.test.cjs
 * Purpose: Exercise mobile fetch redaction, bounded capture and error/body preservation without a native device. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(enabled, fakeFetch, env = {}) {
  const modules = {};
  const sandbox = { console, performance, URL, Response, fetch: fakeFetch, __DEV__: true,
    process: { env: { EXPO_PUBLIC_PERF_DIAGNOSTICS: String(enabled), ...env } } };
  const context = vm.createContext(sandbox);
  function module(name) {
    if (modules[name]) return modules[name];
    const source = fs.readFileSync(`src/performance/diagnostics/${name}.ts`, 'utf8');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const exports = {};
    const require = id => id === '@/src/config/api' ? { API_BASE: 'https://api.example.test/api' } : module(id.replace('./', ''));
    vm.runInContext(`(function(require,exports){${js}\n})`, context)(require, exports);
    modules[name] = exports; return exports;
  }
  return { core: module('core'), network: module('network'), sandbox };
}
test('mobile captures one wrapper, preserves fetch input and scrubs query/path data', async () => {
  const input = 'https://api.example.test/api/users/private-user?token=secret';
  let passed;
  const { core, network, sandbox } = load(true, async (url, options) => {
    passed = [url, options];
    return new Response('{"ok":true}', { headers: { 'server-timing': 'total;dur=4.2, auth;dur=1.1',
      'x-perf-request-id': '12345678-1234-1234-1234-123456789abc' } });
  });
  network.installNetworkDiagnostics(); const installed = sandbox.fetch; network.installNetworkDiagnostics();
  assert.equal(installed, sandbox.fetch);
  const options = { headers: { Authorization: 'Bearer secret' } };
  const response = await sandbox.fetch(input, options);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(passed[0], input); assert.equal(passed[1], options);
  await (await sandbox.fetch(input, options)).text();
  const snapshot = core.perfCapture.snapshot();
  assert.ok(snapshot.events.some(e => e.kind === 'http-start' && e.duplicateOf));
  assert.ok(snapshot.events.some(e => e.kind === 'http-headers' && e.backendMs === 4.2));
  assert.ok(!JSON.stringify(snapshot).includes('secret'));
  assert.ok(!JSON.stringify(snapshot).includes('private-user'));
  for (let i = 0; i < 4000; i++) core.perfRecord('synthetic');
  assert.equal(core.perfCapture.snapshot().events.length, 3000);
  assert.ok(core.perfCapture.snapshot().dropped > 0);
});
test('disabled mobile leaves fetch untouched and collects nothing', () => {
  const original = () => {};
  const { core, network, sandbox } = load(false, original);
  network.installNetworkDiagnostics(); core.perfRecord('ignored');
  assert.equal(sandbox.fetch, original); assert.equal(core.perfCapture.snapshot().events.length, 0);
});

test('disabled content observation adds no focus subscription or React effects', () => {
  const source = fs.readFileSync('src/performance/diagnostics/screens.tsx', 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React,
  } }).outputText;
  const exports = {};
  const unexpected = () => { throw new Error('Disabled diagnostics subscribed to React'); };
  const imports = { './core': { PERF_ENABLED: false },
    '@react-navigation/native': { useIsFocused: unexpected },
    react: { useEffect: unexpected, useLayoutEffect: unexpected, useRef: unexpected } };
  vm.runInNewContext(`(function(require,exports){${js}\n})`)(id => imports[id], exports);
  exports.usePerfContent('synthetic-screen', true, 3);
  const component = () => null;
  assert.equal(exports.withPerfScreen(component, 'synthetic-screen'), component);
});

test('optional gift origins cannot break startup and both configured origin names are supported', async () => {
  const { core, network, sandbox } = load(true, async () => new Response('{}'), {
    EXPO_PUBLIC_API_BASE_URL: 'invalid-optional-origin', EXPO_PUBLIC_API_URL: 'https://gifts.example.test',
  });
  network.installNetworkDiagnostics();
  await (await sandbox.fetch('https://gifts.example.test/api/gifts/catalog')).json();
  assert.ok(core.perfCapture.snapshot().events.some(e => e.kind === 'http-start' && e.route === '/api/gifts/catalog'));
});
test('fetch and body failures remain failures with sanitized diagnostics', async () => {
  const failure = new Error('private-error-detail');
  const { core, network, sandbox } = load(true, async () => { throw failure; });
  network.installNetworkDiagnostics();
  await assert.rejects(sandbox.fetch('https://api.example.test/api/discover'), e => e === failure);
  assert.ok(!JSON.stringify(core.perfCapture.snapshot()).includes('private-error-detail'));
});
