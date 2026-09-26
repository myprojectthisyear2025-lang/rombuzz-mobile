/* global __dirname */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const rendererPath = require.resolve("../../node_modules/expo-module-scripts/node_modules/jest-expo/node_modules/react-test-renderer");
const React = require("node:module").createRequire(rendererPath)("react");
const renderer = require(rendererPath);
const { act } = renderer;
global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, "../..");

function createHarness({ secure = new Map(), cache = new Map() } = {}) {
  const reads = [], writes = [], spans = [], events = [], modules = new Map();
  const appListeners = new Set();
  const faults = { read: null, write: null, cacheWrite: null };
  let fetchImpl = async () => { throw new Error("Unexpected network request"); };
  const AppState = {
    currentState: "active",
    addEventListener: (_, callback) => {
      appListeners.add(callback);
      return { remove: () => appListeners.delete(callback) };
    },
  };
  const sockets = [];
  const mocks = {
    react: React,
    "react-native": { AppState, DeviceEventEmitter: {
      emit: (...args) => events.push(args),
    } },
    "expo-secure-store": {
      getItemAsync: async key => { reads.push(key); if (faults.read) await faults.read(key); return secure.get(key) ?? null; },
      setItemAsync: async (key, value) => {
        if (faults.write) await faults.write(key, value);
        writes.push([key, value]); secure.set(key, value);
      },
      deleteItemAsync: async key => { secure.delete(key); },
    },
    "@react-native-async-storage/async-storage": {
      getItem: async key => cache.get(key) ?? null,
      setItem: async (key, value) => {
        if (faults.cacheWrite) await faults.cacheWrite(key, value);
        cache.set(key, value);
      },
      removeItem: async key => { cache.delete(key); },
    },
    "socket.io-client": { io: (_, options) => {
      const socket = { auth: options.auth, connected: true, disconnects: 0, connects: 0,
        on() {}, emit() {},
        disconnect() { this.connected = false; this.disconnects++; return this; },
        connect() { this.connected = true; this.connects++; return this; },
      };
      sockets.push(socket); return socket;
    } },
  };
  const virtual = {
    "src/config/api": { API_BASE: "https://example.invalid/api", SOCKET_URL: "https://example.invalid" },
    "src/performance/diagnostics/core": { perfSpan: name => { spans.push(name); return () => {}; } },
    "src/performance/diagnostics/socket": { observeSocket() {} },
    "src/features/chat/thread/chatUnavailableCache": { clearUnavailableChatLocalState() {} },
    "src/features/chat/thread/chatAvailability": { emitChatPeerUnavailable() {} },
  };
  function load(file) {
    const absolute = path.resolve(root, file);
    if (modules.has(absolute)) return modules.get(absolute).exports;
    const compiled = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      fileName: absolute,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} }; modules.set(absolute, module);
    const localRequire = specifier => {
      if (mocks[specifier]) return mocks[specifier];
      const resolved = specifier.startsWith("@/") ? path.resolve(root, specifier.slice(2))
        : specifier.startsWith(".") ? path.resolve(path.dirname(absolute), specifier) : null;
      if (!resolved) throw new Error("Unmocked dependency: " + specifier);
      const key = path.relative(root, resolved).replaceAll(path.sep, "/");
      if (virtual[key]) return virtual[key];
      const candidate = [resolved, resolved + ".ts", resolved + ".tsx"].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      if (!candidate) throw new Error("Missing dependency: " + specifier);
      return load(candidate);
    };
    vm.runInThisContext("(function(require,module,exports,fetch,setInterval){" + compiled + "\n})", { filename: absolute })(
      localRequire, module, module.exports, (...args) => fetchImpl(...args),
      () => { throw new Error("Auth must not install a polling timer"); },
    );
    return module.exports;
  }
  return {
    load, secure, cache, reads, writes, spans, events, faults, sockets, appListeners,
    session: load("src/features/auth/rbzSession.ts"),
    draft: load("src/features/auth/onboarding/rbzOnboardingDraft.ts"),
    setFetch: fn => { fetchImpl = fn; },
    changeAppState: state => { AppState.currentState = state; appListeners.forEach(fn => fn(state)); },
    async mountAuth() {
      const { useRootAuth } = load("src/features/auth/useRootAuth.ts");
      let value, renders = 0, tree;
      function Probe() { value = useRootAuth(); renders++; return null; }
      await act(async () => { tree = renderer.create(React.createElement(Probe)); });
      return {
        get value() { return value; }, get renders() { return renders; },
        rerender: () => act(async () => { tree.update(React.createElement(Probe)); }),
        unmount: () => act(async () => { tree.unmount(); }),
      };
    },
  };
}
module.exports = { createHarness, act };
