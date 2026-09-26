const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, act, React, deferred } = require("./harness.cjs");

const micro = "app/(tabs)/microbuzz.tsx";
const reels = "src/components/letsbuzz/LetsBuzzReels.tsx";
const profile = "app/(tabs)/(root)/profile.tsx";
const fixture = id => ({ id, userId: "peer", caption: "kind:reel intent:letsbuzz scope:public", mediaUrl: `https://example.invalid/${id}.mp4` });
const intervals = h => [...h.timers.values()].filter(timer => timer.interval);
const calls = (h, path) => h.requests.filter(request => request.url.includes(path));

test("retained updates compose while hidden and flush on focus without remounting", async () => {
  const h = createHarness();
  const { useScreenActivity } = h.load("src/features/lifecycle/useScreenActivity.ts");
  const { useRetainedState } = h.load("src/features/lifecycle/useRetainedState.ts");
  let update, value, renders = 0, mounts = 0;
  function Probe() {
    [value, update] = useRetainedState(useScreenActivity(), 0);
    renders++;
    React.useEffect(() => { mounts++; }, []);
    return null;
  }
  await h.mount(Probe);
  await h.focus(false);
  const before = renders;
  await act(async () => { update(n => n + 1); update(n => n + 2); });
  assert.equal(renders, before);
  assert.equal(value, 0);
  await h.focus(true);
  assert.equal(value, 3);
  assert.equal(mounts, 1);
  await h.appState("background");
  await act(async () => update(n => n + 4));
  await h.appState("active");
  assert.equal(value, 7);
  await h.unmount();
  await act(async () => update(99));
  assert.equal(value, 7);
});

test("a pending MicroBuzz tick cannot resurrect the timer after background or unmount", async () => {
  const h = createHarness();
  const pending = deferred();
  const { useScreenActivity } = h.load("src/features/lifecycle/useScreenActivity.ts");
  const { useMicroBuzzLiveWork } = h.load("src/features/microbuzz/useMicroBuzzLiveWork.ts");
  let ticks = 0, cancelled = 0;
  function Probe() {
    useMicroBuzzLiveWork(true, useScreenActivity(), () => { ticks++; return pending.promise; }, () => { cancelled++; });
    return null;
  }
  await h.mount(Probe);
  assert.equal(intervals(h).length, 1);
  await h.appState("background");
  assert.equal(intervals(h).length, 0);
  await act(async () => pending.resolve());
  await h.advance(60_000);
  assert.equal(ticks, 1);
  await h.appState("active");
  assert.equal(ticks, 2);
  await h.unmount();
  assert.equal(intervals(h).length, 0);
  assert.equal(cancelled, 2);
});

test("MicroBuzz stops idle timers/animation loops and buffers offscreen socket events", async () => {
  const h = createHarness({ focused: false });
  await h.mount(micro);
  assert.equal(intervals(h).length, 0);
  assert.equal(h.loops.filter(loop => loop.running).length, 0);
  assert.equal(h.find("MatchCelebrateOverlay").props.visible, false);
  await h.focus(true);
  assert.equal(intervals(h).length, 2);
  assert.equal(h.loops.filter(loop => loop.running).length, 4);
  await h.focus(false);
  const before = h.renders;
  await h.emit("buzz_request", { fromId: "peer", firstName: "Sam" });
  await h.emit("match", { otherUserId: "peer", otherName: "Sam" });
  await h.advance(45 * 60_000);
  assert.equal(h.renders, before);
  assert.equal(h.metrics.haptics, 0);
  assert.equal(intervals(h).length, 0);
  assert.equal(h.loops.filter(loop => loop.running).length, 0);
  await h.focus(true);
  assert.equal(h.find("MatchCelebrateOverlay").props.matchUser.id, "peer");
  assert.equal(h.find("MatchCelebrateOverlay").props.visible, true);
  await h.appState("background");
  assert.equal(h.find("MatchCelebrateOverlay").props.visible, false);
  assert.equal(intervals(h).length, 0);
  assert.equal(h.loops.filter(loop => loop.running).length, 0);
  await h.unmount();
  assert.ok([...h.socketListeners.values()].every(set => set.size === 0));
});

test("MicroBuzz focus/reconnect queue reads coalesce and preserve newer socket changes", async () => {
  const h = createHarness();
  const pending = deferred();
  h.setFetch(async () => pending.promise);
  const { useScreenActivity } = h.load("src/features/lifecycle/useScreenActivity.ts");
  const { useMicroBuzzQueue } = h.load("src/features/microbuzz/useMicroBuzzQueue.ts");
  let queue, renders = 0, first, second;
  function Probe() { queue = useMicroBuzzQueue(useScreenActivity()); renders++; return null; }
  await h.mount(Probe);
  await act(async () => { first = queue.load(); second = queue.load(); });
  assert.equal(first, second);
  assert.equal(h.requests.length, 1);
  await h.focus(false);
  const before = renders;
  await act(async () => {
    queue.enqueue({ fromId: "new" });
    queue.remove("old");
    pending.resolve({ requests: [{ fromId: "old" }, { fromId: "kept" }] });
    await first;
  });
  assert.equal(renders, before);
  await h.focus(true);
  assert.deepEqual(queue.requests.map(request => request.fromId), ["kept", "new"]);
  await h.unmount();
});

test("an interrupted Reel refresh resumes without remounting the cached list", async () => {
  const h = createHarness();
  const old = deferred(), fresh = deferred();
  let count = 0;
  h.feed.items = [fixture("one"), fixture("two")];
  h.setFetch(async url => url.includes("/feed/letsbuzz") ? (++count === 1 ? old.promise : fresh.promise) : { user: h.savedUser });
  await h.mount(reels);
  const list = h.find("FlatList");
  await act(async () => list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: 800 } } }));
  await h.focus(false);
  await h.focus(true);
  assert.equal(h.find("FlatList"), list);
  await act(async () => fresh.resolve({ items: h.feed.items }));
  await act(async () => old.resolve({ items: [] }));
  await h.focus(false);
  await h.focus(true);
  assert.equal(count, 2);
  assert.equal(h.find("FlatList"), list);
  assert.equal([...h.videos].find(v => v.props.source.uri.endsWith("two.mp4")).props.shouldPlay, true);
  await h.unmount();
});

test("Reel player ref entries are removed and positions survive a native player remount", async () => {
  const h = createHarness();
  const { ReelVideoPlayer } = h.load("src/components/letsbuzz/ReelVideoPlayer.tsx");
  const players = { current: {} }, positions = new Map();
  const Probe = () => React.createElement(ReelVideoPlayer, { id: "one", uri: "one.mp4", playing: true, muted: true, players, positions });
  await h.mount(Probe);
  assert.ok(players.current.one);
  players.current.one.props.onPlaybackStatusUpdate({ isLoaded: true, positionMillis: 2000 });
  await h.unmount();
  assert.deepEqual(Object.keys(players.current), []);
  await h.mount(Probe);
  assert.equal(players.current.one.props.positionMillis, 2000);
  assert.equal(players.current.one.props.isMuted, true);
  await h.unmount();
});

test("Profile disposes voice playback on blur and rejects a late audio creation after unmount", async () => {
  const h = createHarness();
  Object.assign(h.savedUser, { favorites: ["voice:https://example.invalid/voice.m4a"], voiceDurationSec: 5 });
  await h.mount(profile);
  await act(async () => h.find("ProfileTabBar").props.onChange("info"));
  await act(async () => h.find("ProfileInfoTab").props.playVoice());
  assert.equal(h.metrics.sounds[0].plays, 1);
  await h.focus(false);
  assert.equal(h.metrics.sounds[0].unloaded, true);
  await h.focus(true);
  assert.equal(h.find("ProfileInfoTab").props.playing, false);
  const pending = deferred();
  h.audioGate.promise = pending.promise;
  let playback;
  await act(async () => { playback = h.find("ProfileInfoTab").props.playVoice(); });
  await h.unmount();
  await act(async () => { pending.resolve(); await playback; });
  assert.equal(h.metrics.sounds[1].plays, 0);
  assert.equal(h.metrics.sounds[1].unloaded, true);
});

test("explicit live MicroBuzz preserves foreground presence but stops hidden radar and background polling", async () => {
  const h = createHarness();
  await h.mount(micro);
  await act(async () => h.find("MicroBuzzPresenceCard").props.onSelfiePress());
  assert.ok(h.find("CameraView"));
  await h.appState("background");
  assert.equal(h.tree.root.findAllByType("CameraView").length, 0);
  await h.appState("active");
  assert.ok(h.find("CameraView"));
  const capture = h.tree.root.findAllByType("Pressable").find(node => node.findAllByType("Icon").some(icon => icon.props.name === "radio-button-on"));
  await act(async () => capture.props.onPress());
  await act(async () => h.find("MicroBuzzPresenceCard").props.onGoLive());
  assert.equal(h.find("MicroBuzzPresenceCard").props.isActive, true);
  const pendingScan = deferred();
  h.setFetch(async url => url.includes("/nearby") ? pendingScan.promise : { success: true, r2Key: "selfie-key" });
  await h.emit("microbuzz_update", {});
  const scanRequest = calls(h, "/nearby").at(-1);
  await h.focus(false);
  assert.equal(scanRequest.signal.aborted, true);
  const before = h.renders, scans = calls(h, "/nearby").length, heartbeats = calls(h, "/activate").length;
  await act(async () => pendingScan.resolve({ users: [{ id: "late" }] }));
  await h.advance(5000);
  assert.equal(h.renders, before);
  assert.equal(calls(h, "/nearby").length, scans);
  assert.ok(calls(h, "/activate").length > heartbeats);
  assert.equal(intervals(h).length, 1);
  await h.appState("background");
  const locations = h.metrics.locations, requests = h.requests.length;
  await h.advance(10 * 60_000);
  assert.equal(intervals(h).length, 0);
  assert.equal(h.metrics.locations, locations);
  assert.equal(h.requests.length, requests);
  await h.appState("active");
  await h.focus(true);
  assert.equal(h.find("MicroBuzzPresenceCard").props.isActive, true);
  assert.equal(h.find("MicroBuzzPresenceCard").props.selfieUri, "file:///selfie.jpg");
  assert.ok(calls(h, "/nearby").length > scans);
  assert.equal(calls(h, "/deactivate").length, 0);
  await act(async () => h.find("MicroBuzzPresenceCard").props.onStop());
  assert.equal(calls(h, "/deactivate").length, 1);
  await h.unmount();
});

test("Reels dispose native players on blur/background, retaining list, index and playback position", async () => {
  const h = createHarness({ focused: false });
  h.feed.items = [fixture("one"), fixture("two"), fixture("three")];
  await h.mount(reels);
  assert.equal(h.requests.length, 0);
  assert.equal(h.videos.size, 0);
  await h.focus(true);
  const list = h.find("FlatList");
  await act(async () => list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: 800 } } }));
  const video = [...h.videos].find(v => v.props.source.uri.endsWith("two.mp4"));
  video.props.onPlaybackStatusUpdate({ isLoaded: true, positionMillis: 4200 });
  const count = h.videos.size, feedReads = calls(h, "/feed/letsbuzz").length;
  await h.focus(false);
  assert.equal(h.videos.size, 0);
  assert.ok(h.unloaded.length >= count);
  assert.equal(h.find("FlatList"), list);
  const before = h.renders, gifts = h.metrics.giftReads;
  await h.emit("comment:new", { postId: "two" });
  await h.emit("buzz:gift:new", { postId: "two" });
  await h.advance(45 * 60_000);
  assert.equal(h.renders, before);
  assert.equal(h.metrics.giftReads, gifts);
  await h.focus(true);
  const restored = [...h.videos].find(v => v.props.source.uri.endsWith("two.mp4"));
  assert.equal(restored.props.positionMillis, 4200);
  assert.equal(restored.props.shouldPlay, true);
  assert.equal(calls(h, "/feed/letsbuzz").length, feedReads);
  assert.ok(h.metrics.giftReads > gifts);
  await h.appState("background");
  assert.equal(h.videos.size, 0);
  await h.appState("active");
  assert.ok(h.videos.size > 0);
  await h.unmount();
  assert.equal(h.videos.size, 0);
  assert.ok([...h.socketListeners.values()].every(set => set.size === 0));
});

test("Reels abort an unfinished feed on blur and reject a late socket attachment after unmount", async () => {
  const h = createHarness();
  const pending = deferred(), socket = deferred();
  h.socketGate.promise = socket.promise;
  h.setFetch(async url => url.includes("/feed/letsbuzz") ? pending.promise : { user: h.savedUser });
  await h.mount(reels);
  const request = calls(h, "/feed/letsbuzz")[0];
  assert.ok(request);
  await h.focus(false);
  assert.equal(request.signal.aborted, true);
  const before = h.renders;
  await act(async () => pending.resolve({ items: [fixture("late")] }));
  assert.equal(h.renders, before);
  assert.equal(h.videos.size, 0);
  await h.unmount();
  await act(async () => socket.resolve());
  assert.equal(h.socketListeners.size, 0);
});

test("Profile only rotates guidance in foreground and refreshes once per entry/TTL", async () => {
  const h = createHarness({ focused: false });
  await h.mount(profile);
  assert.equal(h.profile.fetches, 0);
  assert.equal(intervals(h).length, 0);
  await h.focus(true);
  assert.equal(h.profile.fetches, 1);
  assert.equal(intervals(h).length, 1);
  await h.focus(false);
  const before = h.renders;
  await h.advance(31_000);
  assert.equal(h.renders, before);
  await h.focus(true);
  assert.equal(h.profile.fetches, 1);
  await h.appState("background");
  await h.advance(60_000);
  assert.equal(intervals(h).length, 0);
  await h.appState("active");
  assert.equal(h.profile.fetches, 2);
  await h.unmount();
  assert.equal(intervals(h).length, 0);
});

test("Profile retains a late refresh without an offscreen render or duplicate request", async () => {
  const h = createHarness();
  const pending = deferred();
  h.profile.fresh = () => pending.promise;
  await h.mount(profile);
  assert.equal(h.profile.fetches, 1);
  await h.focus(false);
  await h.focus(true);
  assert.equal(h.profile.fetches, 1);
  await h.focus(false);
  const before = h.renders;
  await act(async () => pending.resolve({ ...h.savedUser, firstName: "Updated" }));
  assert.equal(h.renders, before);
  await h.focus(true);
  assert.equal(h.profile.fetches, 1);
  assert.equal(h.find("ProfileIdentityHero").props.fullName, "Updated Lee");
  await h.unmount();
});

test("an explicit Profile refresh reads after an older automatic refresh", async () => {
  const h = createHarness();
  const pending = deferred();
  h.profile.fresh = () => pending.promise;
  await h.mount(profile);
  let refresh;
  const control = h.tree.root.findAllByType("ScrollView").find(view => view.props.refreshControl)?.props.refreshControl;
  assert.ok(control);
  await act(async () => { refresh = control.props.onRefresh(); });
  assert.equal(h.profile.fetches, 1);
  h.profile.fresh = { ...h.savedUser, firstName: "After save" };
  await act(async () => { pending.resolve(h.savedUser); await refresh; });
  assert.equal(h.profile.fetches, 2);
  assert.equal(h.find("ProfileIdentityHero").props.fullName, "After save Lee");
  await h.unmount();
});

test("a Profile voice metadata probe finishing after blur unloads without starting a backfill", async () => {
  const h = createHarness();
  const pending = deferred();
  h.savedUser.favorites = ["voice:https://example.invalid/voice.m4a"];
  h.audioGate.promise = pending.promise;
  await h.mount(profile);
  await h.focus(false);
  const before = h.renders;
  await act(async () => pending.resolve());
  assert.ok(h.metrics.sounds.length > 0);
  assert.ok(h.metrics.sounds.every(sound => sound.unloaded));
  assert.equal(h.renders, before);
  assert.equal(h.requests.filter(request => request.method === "PUT").length, 0);
  await h.focus(true);
  assert.ok(h.requests.some(request => request.method === "PUT"));
  await h.unmount();
  assert.ok(h.metrics.sounds.every(sound => sound.unloaded));
});
