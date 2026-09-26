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
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function createHarness({ foreground = true, focused = true } = {}) {
  const modules = new Map(), storage = new Map(), timers = new Map(), events = [], requests = [], listeners = new Map();
  const sessionListeners = new Set(), appListeners = new Set(), focusListeners = new Set();
  let session = { token: "token-a", user: { id: "a" } }, timerId = 0, now = 1_000_000;
  let fetchHandler = async () => ({ total: 0, byPeer: {} });
  let cacheReader = key => storage.get(key) || null;
  const socketGate = { promise: null };
  const socket = { connected: false, emit() {},
    on: (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    off: (name, fn) => { if (!fn) throw new Error("Removing unrelated socket listeners"); listeners.get(name)?.delete(fn); },
  };
  const AppState = { currentState: foreground ? "active" : "background", addEventListener: (_, fn) => {
    appListeners.add(fn); return { remove: () => appListeners.delete(fn) };
  } };
  const mocks = {
    react: React,
    "react-native": { AppState, DeviceEventEmitter: { emit: (name, payload) => events.push({ name, payload }) } },
    "@react-native-async-storage/async-storage": { getItem: async key => cacheReader(key), setItem: async (key, value) => storage.set(key, value) },
    "@react-navigation/native": {
      useIsFocused: () => React.useSyncExternalStore(fn => { focusListeners.add(fn); return () => focusListeners.delete(fn); }, () => focused),
      useNavigation: () => navigation,
    },
    "@/src/config/api": { API_BASE: "https://example.invalid/api" },
    "@/src/features/auth/rbzSession": {
      getSessionSnapshot: () => session,
      subscribeSession: fn => { sessionListeners.add(fn); return () => sessionListeners.delete(fn); },
      clearSession: async token => {
        if (session.token !== token) return false;
        session = { token: "", user: null }; sessionListeners.forEach(fn => fn(session)); return true;
      },
    },
    "@/src/performance/api/rbzApiClient": { RBZ_AUTH_EXPIRED_EVENT: "rbz:auth:expired", rbzGetCurrentUser: async () => session.user },
    "@/src/lib/socket": { getSocket: async () => { if (socketGate.promise) await socketGate.promise; return socket; } },
  };
  const navigation = { isFocused: () => focused };
  function load(file) {
    const absolute = path.resolve(root, file);
    if (modules.has(absolute)) return modules.get(absolute).exports;
    const compiled = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      fileName: absolute, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} }; modules.set(absolute, module);
    const localRequire = name => {
      if (mocks[name]) return mocks[name];
      const resolved = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(path.dirname(absolute), name);
      return load(fs.existsSync(resolved) ? resolved : resolved + ".ts");
    };
    class TestDate extends Date { static now() { return now; } }
    vm.runInThisContext("(function(require,module,exports,fetch,setTimeout,clearTimeout,Date){" + compiled + "\n})", { filename: absolute })(
      localRequire, module, module.exports, async (url, options) => {
        requests.push({ url, ...options });
        const result = await fetchHandler(url, options);
        return { ok: true, status: 200, json: async () => result, ...result?.response };
      }, (fn, ms) => { const id = ++timerId; timers.set(id, { fn, due: now + ms }); return id; }, id => timers.delete(id), TestDate,
    );
    return module.exports;
  }
  const api = load("src/features/chat/unread/chatUnread.ts");
  const { useChatUnreadLifecycle } = load("src/features/chat/unread/useChatUnreadLifecycle.ts");
  const { useUnreadSummary } = load("src/features/chat/unread/useUnreadSummary.ts");
  function Owner({ children, enabled = true }) { useChatUnreadLifecycle(enabled); return children || null; }
  let tree;
  return {
    ...api, load, requests, storage, events, timers, socket, socketGate, listeners, sessionListeners, appListeners,
    useUnreadSummary,
    setFetch: fn => { fetchHandler = fn; }, setCacheReader: fn => { cacheReader = fn; },
    async mount(Component = Owner) { await act(async () => { tree = renderer.create(React.createElement(Component)); }); },
    async unmount() { if (tree) await act(async () => tree.unmount()); },
    async emit(name, payload) { await act(async () => { listeners.get(name)?.forEach(fn => fn(payload)); }); },
    async setSession(value) { await act(async () => { session = value; sessionListeners.forEach(fn => fn(value)); }); },
    async appState(value) { await act(async () => { AppState.currentState = value; appListeners.forEach(fn => fn(value)); }); },
    async focus(value) { await act(async () => { focused = value; focusListeners.forEach(fn => fn()); }); },
    async advance(ms) { await act(async () => {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.fn(); }
    }); },
    Owner,
  };
}
module.exports = { createHarness, React, act, deferred };
