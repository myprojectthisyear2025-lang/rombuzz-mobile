// Path: scripts/settings-tests/harness.cjs
// Purpose: Render real Settings components with isolated native, storage, and network boundaries.
/* global __dirname */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
// Expo's existing test dependency matches this application's React 19.1.
const rendererPath = require.resolve("../../node_modules/expo-module-scripts/node_modules/jest-expo/node_modules/react-test-renderer");
const React = require("node:module").createRequire(rendererPath)("react");
const renderer = require(rendererPath);
const { act } = renderer;
global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, "../..");

function createHarness({ mode = "light" } = {}) {
  const requests = [], replies = [], storageWrites = [], deletedKeys = [], routes = [];
  const cache = new Map(), listeners = new Map();
  const stored = new Map([["RBZ_USER", JSON.stringify({ email: "member@example.com" })], ["RBZ_TOKEN", "test-token"]]);
  const themeContext = React.createContext(null);
  const tour = { pending: false, cleared: 0 };
  const native = Object.fromEntries([
    "ActivityIndicator", "View", "Text", "TextInput", "Pressable", "Switch", "Image",
    "ScrollView", "KeyboardAvoidingView", "TouchableOpacity", "Modal",
  ].map(name => [name, name]));
  Object.assign(native, {
    Platform: { OS: "ios" },
    Keyboard: { dismiss() {} },
    StyleSheet: { create: value => value, hairlineWidth: 0.5 },
    Linking: { openURL: async url => routes.push(url) },
    DeviceEventEmitter: {
      emit: name => listeners.get(name)?.forEach(fn => fn()),
      addListener(name, fn) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(fn);
        return { remove: () => listeners.get(name).delete(fn) };
      },
    },
  });
  const request = async (url, options = {}) => {
    requests.push({ url, ...options });
    if (!replies.length) throw new Error("No mock response queued");
    const reply = replies.shift();
    if (reply instanceof Error) throw reply;
    return typeof reply === "function" ? reply() : reply;
  };
  const mocks = {
    react: React,
    "react-native": native,
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }) },
    "expo-router": { useRouter: () => ({
      push: route => routes.push(route), replace: route => routes.push(route),
      back: () => routes.push("back"), canGoBack: () => true,
    }) },
    "expo-secure-store": {
      getItemAsync: async key => stored.get(key) ?? null,
      setItemAsync: async (key, value) => { stored.set(key, value); storageWrites.push([key, value]); },
      deleteItemAsync: async key => { deletedKeys.push(key); stored.delete(key); },
    },
    "@react-native-async-storage/async-storage": { getItem: async key => stored.get(key) ?? null },
  };
  const virtual = {
    "src/design/RomBuzzThemeProvider": { useRomBuzzTheme: () => React.useContext(themeContext) },
    "src/design/rombuzzTypography": {
      RBZFont: Object.fromEntries(["regular", "medium", "semiBold", "bold", "extraBold"].map(name => [name, "Manrope_" + name])),
      useRomBuzzTypography: () => true,
    },
    "src/config/api": { API_BASE: "https://example.invalid/api" },
    "src/lib/_rbzApi": { rbzFetch: request },
    "src/performance/api/rbzApiClient": { rbzGetCurrentUser: async () => ({ id: "member" }) },
    "src/features/onboarding/firstSignupTourStorage": {
      shouldShowFirstSignupTour: async () => tour.pending,
      clearFirstSignupTourPending: async () => { tour.cleared++; },
    },
  };
  function load(relative) {
    const absolute = path.resolve(root, relative);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const source = fs.readFileSync(absolute, "utf8");
    const compiled = ts.transpileModule(source, {
      fileName: absolute,
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const module = { exports: {} };
    cache.set(absolute, module);
    function localRequire(specifier) {
      if (mocks[specifier]) return mocks[specifier];
      const resolved = specifier.startsWith("@/") ? path.resolve(root, specifier.slice(2))
        : specifier.startsWith(".") ? path.resolve(path.dirname(absolute), specifier) : null;
      if (!resolved) throw new Error("Unmocked dependency: " + specifier);
      const key = path.relative(root, resolved).replaceAll(path.sep, "/");
      if (virtual[key]) return virtual[key];
      const candidate = [resolved, resolved + ".ts", resolved + ".tsx"].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
      if (!candidate) throw new Error("Missing dependency: " + specifier);
      return load(candidate);
    }
    vm.runInThisContext("(function(require,module,exports,fetch,requestAnimationFrame,process){" + compiled + "\n})", { filename: absolute })(
      localRequire, module, module.exports, async (url, options) => {
        const data = await request(url, options);
        return { ok: data?.ok !== false, status: data?.status ?? 200, json: async () => data };
      }, fn => fn(), { env: {} },
    );
    return module.exports;
  }
  const getColors = load("src/design/rombuzzTheme.ts").getRomBuzzColors;
  let currentMode = mode, tree, Component;
  const DialogProvider = load("src/components/settings/SettingsDialog.tsx").SettingsDialogProvider;
  function rootElement() {
    const theme = {
      colors: getColors(currentMode), mode: currentMode,
      setMode: async next => { currentMode = next; tree.update(rootElement()); },
    };
    return React.createElement(themeContext.Provider, { value: theme },
      React.createElement(DialogProvider, null, React.createElement(Component)));
  }
  async function mount(screen) {
    Component = typeof screen === "function" ? screen : load("app/(tabs)/settings/" + screen + ".tsx").default;
    await act(async () => { tree = renderer.create(rootElement()); });
  }
  const all = type => tree.root.findAllByType(type);
  const text = node => typeof node === "string" ? node : (node?.children ?? []).map(text).join("");
  const button = label => {
    const scope = all("Modal").find(node => node.props.visible) ?? tree.root;
    return scope.findAllByType("Pressable").concat(scope.findAllByType("TouchableOpacity")).find(node =>
      node.props.accessibilityLabel === label || text(node) === label);
  };
  const input = label => all("TextInput").find(node => node.props.accessibilityLabel === label);
  async function press(label) {
    const node = button(label);
    if (!node) throw new Error("Missing button: " + label);
    if (node.props.disabled) throw new Error("Disabled button: " + label);
    await act(async () => { await node.props.onPress(); });
  }
  async function enter(label, value) {
    const node = input(label);
    if (!node) throw new Error("Missing input: " + label);
    await act(async () => { node.props.onChangeText(value); });
  }
  return {
    load, mount, press, enter, all, button, input, text, requests, replies, routes, stored, tour,
    storageWrites, deletedKeys, get tree() { return tree; }, get colors() { return getColors(currentMode); },
    async unmount() { if (tree) await act(async () => tree.unmount()); },
  };
}
module.exports = { createHarness, act, React };
