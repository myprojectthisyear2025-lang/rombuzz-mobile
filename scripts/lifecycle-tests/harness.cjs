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
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function createHarness({ focused = true, state = "active" } = {}) {
  let tree, now = 1_000_000, sequence = 0, renders = 0;
  const modules = new Map(), timers = new Map(), focusListeners = new Set(), appListeners = new Set();
  const requests = [], loops = [], videos = new Set(), unloaded = [], socketListeners = new Map(), scrolls = [];
  const savedUser = { id: "me", firstName: "Alex", lastName: "Lee", media: [], favorites: [], voiceDurationSec: 0 };
  const profile = { cached: savedUser, fresh: savedUser, reads: 0, fetches: 0 };
  const feed = { items: [], reads: 0 };
  const socketGate = { promise: null };
  const audioGate = { promise: null };
  const metrics = { locations: 0, haptics: 0, giftReads: 0, sounds: [], storedUsers: [] };
  let fetchHandler = async url => {
    if (url.includes("/feed/letsbuzz")) return { items: feed.items };
    if (url.endsWith("/users/me")) return { user: savedUser };
    if (url.endsWith("/microbuzz/incoming")) return { requests: [] };
    if (url.includes("/microbuzz/nearby")) return { users: [] };
    if (url.endsWith("/microbuzz/selfie")) return { r2Key: "selfie-key", url: "selfie-url" };
    if (url.includes("/microbuzz/")) return { success: true };
    throw new Error("Unexpected request: " + url);
  };
  const socket = {
    on(name, fn) { if (!socketListeners.has(name)) socketListeners.set(name, new Set()); socketListeners.get(name).add(fn); },
    off(name, fn) { socketListeners.get(name)?.delete(fn); }, emit() {},
  };
  const schedule = (fn, ms = 0, interval = false) => {
    const id = ++sequence; timers.set(id, { fn, due: now + ms, ms, interval }); return id;
  };
  class Value {
    constructor(value) { this.value = value; this.listeners = new Set(); }
    setValue(value) { this.value = value; }
    interpolate() { return this.value; }
    addListener(fn) { this.listeners.add(fn); return fn; }
    removeListener(fn) { this.listeners.delete(fn); }
    stopAnimation() {}
  }
  const animation = () => ({ start(done) { done?.({ finished: true }); }, stop() {} });
  const Animated = {
    Value, View: "AnimatedView", Text: "AnimatedText", ScrollView: "ScrollView",
    timing: animation, sequence: animation, spring: animation, parallel: animation,
    loop() { const loop = { running: false, start() { this.running = true; }, stop() { this.running = false; } }; loops.push(loop); return loop; },
  };
  const Video = React.forwardRef((props, ref) => {
    const instance = React.useRef({ props, pauseAsync: async () => {}, unloadAsync: async () => {} }).current;
    instance.props = props;
    React.useImperativeHandle(ref, () => instance, [instance]);
    React.useEffect(() => { videos.add(instance); return () => { videos.delete(instance); unloaded.push(instance); }; }, [instance]);
    return React.createElement("Video", props);
  });
  Video.displayName = "MockVideo";
  const CameraView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ takePictureAsync: async () => ({ uri: "file:///selfie.jpg" }) }), []);
    return React.createElement("CameraView", props);
  });
  CameraView.displayName = "MockCameraView";
  const FlatList = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ scrollToIndex: options => scrolls.push(options) }), []);
    return React.createElement("FlatList", props, props.data.map((item, index) =>
      React.createElement(React.Fragment, { key: item.id }, props.renderItem({ item, index }))));
  });
  FlatList.displayName = "MockFlatList";
  const AppState = { currentState: state, addEventListener: (_, fn) => {
    appListeners.add(fn); return { remove: () => appListeners.delete(fn) };
  } };
  const navigation = { isFocused: () => focused };
  const colors = new Proxy({}, { get: () => "#333333" });
  const cachedProfile = {
    readCachedProfile: async () => { profile.reads++; return { user: profile.cached }; },
    fetchProfileFresh: async () => { profile.fetches++; return { user: typeof profile.fresh === "function" ? await profile.fresh() : profile.fresh }; },
    writeCachedProfile: async user => { profile.cached = user; },
  };
  const native = Object.fromEntries(["View", "Text", "Pressable", "TouchableOpacity", "ScrollView", "RefreshControl", "Image", "StatusBar", "ActivityIndicator", "Modal"].map(name => [name, name]));
  Object.assign(native, { Animated, FlatList, AppState, Platform: { OS: "android", select: choices => choices.android || choices.default },
    Modal: props => React.createElement("Modal", props, props.visible ? props.children : null),
    StyleSheet: { create: value => value, absoluteFillObject: {}, hairlineWidth: 0.5 },
    Dimensions: { get: () => ({ width: 400, height: 800 }) }, Alert: { alert() {} },
  });
  const mocks = {
    react: React, "react-native": native,
    "@react-navigation/native": {
      useNavigation: () => navigation,
      useIsFocused: () => React.useSyncExternalStore(fn => { focusListeners.add(fn); return () => focusListeners.delete(fn); }, () => focused),
    },
    "expo-router": { useRouter: () => navigation, useLocalSearchParams: () => ({}) },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "expo-linear-gradient": { LinearGradient: "Gradient" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }) },
    "expo-camera": { CameraView, useCameraPermissions: () => [{ granted: true }, async () => ({ granted: true })] },
    "expo-location": { Accuracy: { Balanced: 1 }, getForegroundPermissionsAsync: async () => ({ status: "granted" }),
      getCurrentPositionAsync: async () => { metrics.locations++; return { coords: { latitude: 1, longitude: 2 } }; },
    },
    "expo-haptics": { ImpactFeedbackStyle: {}, NotificationFeedbackType: {},
      notificationAsync: async () => { metrics.haptics++; }, impactAsync: async () => {},
    },
    "expo-secure-store": {
      getItemAsync: async key => key === "RBZ_USER" ? JSON.stringify(savedUser) : key === "RBZ_TOKEN" ? "token" : "true",
      setItemAsync: async () => {},
    },
    "expo-av": { ResizeMode: { CONTAIN: "contain" }, Audio: { Sound: {
      createAsync: async () => {
        if (audioGate.promise) await audioGate.promise;
        const sound = { unloaded: false, plays: 0, playAsync: async () => { sound.plays++; },
          unloadAsync: async () => { sound.unloaded = true; }, setOnPlaybackStatusUpdate() {} };
        metrics.sounds.push(sound); return { sound, status: { isLoaded: true, durationMillis: 5000 } };
      },
    } } },
    "expo-image-picker": {},
  };
  const virtual = {
    "src/config/api": { API_BASE: "https://example.invalid/api" },
    "src/config/uploadMedia": { uploadRomBuzzMedia: async () => ({}) },
    "src/design/RomBuzzThemeProvider": { useRomBuzzTheme: () => ({ colors }) },
    "src/design/rombuzzTypography": { RBZFont: {}, useRomBuzzTypography: () => true },
    "src/features/auth/rbzSession": { getCurrentUser: async () => savedUser, persistCurrentUser: async u => metrics.storedUsers.push(u), clearSession: async () => {} },
    "src/performance/api/rbzApiClient": { rbzGetCurrentUser: async () => savedUser },
    "src/features/discover/discoverFilterStorage": { loadSavedDiscoverFilters: async () => ({ gender: "everyone" }) },
    "src/features/performance/useCachedProfile": { useCachedProfile: () => cachedProfile },
    "src/features/performance/letsbuzz/rbzLetsBuzzFeedCache": {
      readCachedLetsBuzzFeed: async () => { feed.reads++; return feed; },
      readCachedLetsBuzzMeId: async () => "me", writeCachedLetsBuzzMeId: async () => {},
      writeCachedLetsBuzzFeed: async () => {}, preloadLetsBuzzFeedImages() {},
    },
    "src/performance/diagnostics/core": { perfState() {} },
    "src/performance/diagnostics/media": { diagnosticVideo: () => Video, diagnosticImage: () => "Image" },
    "src/performance/diagnostics/screens": {
      usePerfContent() { renders++; }, withPerfScreen: Screen => Screen,
    },
    "src/lib/socket": { getSocket: async () => { if (socketGate.promise) await socketGate.promise; return socket; } },
    "src/api/gifts": { getGiftSummary: async () => { metrics.giftReads++; return { totalCount: 3 }; } },
  };
  const real = /^(app\/|src\/features\/lifecycle\/|src\/features\/microbuzz\/(use|microBuzz)|src\/components\/letsbuzz\/(LetsBuzzReels$|ReelVideoPlayer$|letsBuzzReelMedia$)|src\/components\/profile\/profileGallery)/;
  function load(file) {
    const absolute = path.resolve(root, file);
    if (modules.has(absolute)) return modules.get(absolute).exports;
    const compiled = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      fileName: absolute, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} }; modules.set(absolute, module);
    const localRequire = specifier => {
      if (mocks[specifier]) return mocks[specifier];
      const resolved = specifier.startsWith("@/") ? path.resolve(root, specifier.slice(2))
        : specifier.startsWith(".") ? path.resolve(path.dirname(absolute), specifier) : null;
      if (!resolved) throw new Error("Unmocked dependency: " + specifier);
      const key = path.relative(root, resolved).replaceAll(path.sep, "/");
      if (virtual[key]) return virtual[key];
      if (!real.test(key)) return { __esModule: true, default: path.basename(key) };
      const candidate = [resolved, resolved + ".ts", resolved + ".tsx"].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      return load(candidate);
    };
    class TestDate extends Date { static now() { return now; } }
    vm.runInThisContext("(function(require,module,exports,fetch,setTimeout,clearTimeout,setInterval,clearInterval,Date,FormData){" + compiled + "\n})", { filename: absolute })(
      localRequire, module, module.exports, async (url, options = {}) => {
        requests.push({ url, ...options });
        const json = await fetchHandler(url, options);
        return { ok: true, json: async () => json };
      }, (fn, ms) => schedule(fn, ms), id => timers.delete(id), (fn, ms) => schedule(fn, ms, true), id => timers.delete(id), TestDate,
      class FormData { append() {} },
    );
    return module.exports;
  }
  return {
    load, requests, timers, loops, videos, unloaded, socketListeners, socketGate, audioGate, scrolls, metrics, profile, feed, savedUser,
    get tree() { return tree; }, get renders() { return renders; },
    setFetch: fn => { fetchHandler = fn; },
    async mount(file) {
      const Screen = typeof file === "function" ? file : load(file).default;
      await act(async () => { tree = renderer.create(React.createElement(Screen)); });
    },
    async unmount() { if (tree) await act(async () => tree.unmount()); },
    async focus(value) { await act(async () => { focused = value; focusListeners.forEach(fn => fn()); }); },
    async appState(value) { await act(async () => { AppState.currentState = value; appListeners.forEach(fn => fn(value)); }); },
    async emit(name, value) { await act(async () => { socketListeners.get(name)?.forEach(fn => fn(value)); }); },
    async advance(ms) {
      await act(async () => {
        const end = now + ms;
        for (let steps = 0; steps < 10000; steps++) {
          const due = [...timers].filter(([, timer]) => timer.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
          if (!due) break;
          const [id, timer] = due; now = timer.due;
          if (timer.interval) timer.due += timer.ms; else timers.delete(id);
          await timer.fn();
        }
        now = end;
      });
    },
    find: name => tree.root.findByType(name),
  };
}
module.exports = { createHarness, act, React, deferred };
