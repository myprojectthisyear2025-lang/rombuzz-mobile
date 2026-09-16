/* global __dirname */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "../..");
const hookRoot = "src/features/chat/window/hooks/";

function createState(initial) {
  let value = initial;
  return {
    get value() {
      return value;
    },
    set(next) {
      value = typeof next === "function" ? next(value) : next;
    },
  };
}

// These hooks need state only. Re-render explicitly after a setter, as React
// would do. Native rendering/effects belong in the device checklist.
function createHookRuntime() {
  const slots = [];
  let cursor = 0;
  return {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) {
          slots[index] = createState(
            typeof initial === "function" ? initial() : initial,
          );
        }
        return [slots[index].value, slots[index].set];
      },
    },
    render(callback) {
      cursor = 0;
      return callback();
    },
  };
}

function response(body, ok = true) {
  return { ok, json: async () => body };
}

function createHarness(extraMocks = {}) {
  const runtime = createHookRuntime();
  const requests = [];
  const alerts = [];
  const responses = [];
  const logs = [];
  const tokenKeys = [];
  const cache = new Map();
  const mocks = {
    react: runtime.react,
    "react-native": { Alert: { alert: (...args) => alerts.push(args) } },
    "expo-secure-store": {
      getItemAsync: async (key) => {
        tokenKeys.push(key);
        return "test-token";
      },
    },
    "expo-constants": {
      default: { appOwnership: "standalone" },
      __esModule: true,
    },
    "@/src/config/api": { API_BASE: "https://example.invalid/api" },
    ...extraMocks,
  };
  const fetch = async (url, options) => {
    requests.push({ url, ...options });
    if (!responses.length) throw new Error("No test response queued");
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return typeof next === "function" ? next(url, options) : next;
  };

  function load(relativePath) {
    const filename = path.resolve(projectRoot, relativePath);
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText;
    const module = { exports: {} };
    cache.set(filename, module);
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      let resolved;
      if (specifier.startsWith("@/"))
        resolved = path.join(projectRoot, specifier.slice(2));
      else if (specifier.startsWith("."))
        resolved = path.resolve(path.dirname(filename), specifier);
      else throw new Error(`Unmocked dependency: ${specifier}`);
      const candidate = [resolved, `${resolved}.ts`, `${resolved}.tsx`].find(
        (entry) => fs.existsSync(entry) && fs.statSync(entry).isFile(),
      );
      if (!candidate)
        throw new Error(`Cannot resolve ${specifier} from ${filename}`);
      return load(candidate);
    };
    const evaluate = vm.runInThisContext(
      `(function(require, module, exports, fetch, console) {${compiled}\n})`,
      { filename },
    );
    evaluate(localRequire, module, module.exports, fetch, {
      log: (...args) => logs.push(args),
    });
    return module.exports;
  }

  return {
    load,
    hook: (name) => load(`${hookRoot}${name}.ts`)[name],
    render: runtime.render,
    requests,
    alerts,
    responses,
    logs,
    tokenKeys,
  };
}

const participants = { myId: "alice", peerId: "bob", roomId: "alice_bob" };
const message = (overrides = {}) => ({
  id: "message-1",
  from: "alice",
  to: "bob",
  type: "text",
  text: "Original",
  ...overrides,
});

module.exports = {
  createHarness,
  createState,
  message,
  participants,
  response,
};
