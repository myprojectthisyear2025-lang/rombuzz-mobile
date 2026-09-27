const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, React, act, deferred } = require('./harness.cjs');

const signed = (date, sig, extra = '') => `https://media.r2.cloudflarestorage.com/photo.jpg?X-Amz-Date=${date}&X-Amz-Expires=3600&X-Amz-Signature=${sig}${extra}`;

test('profile URL merge retains usable R2 cache URLs but accepts expired signatures and changed Cloudinary queries', () => {
  const h = createHarness();
  const { preserveMediaUrl } = h.load('src/features/performance/viewProfile/preserveMediaUrl.ts');
  const now = Date.parse('2026-09-26T12:30:00Z');
  const old = signed('20260926T120000Z', 'old'), fresh = signed('20260926T123000Z', 'fresh');
  assert.equal(preserveMediaUrl(old, fresh, now), old);
  assert.equal(preserveMediaUrl(old, fresh, now + 31 * 60_000), fresh);
  assert.equal(preserveMediaUrl(old, fresh + '&width=100', now), fresh + '&width=100');
  const cloudinary = 'https://res.cloudinary.com/example/image/upload/sample.jpg';
  assert.equal(preserveMediaUrl(cloudinary + '?token=old', cloudinary + '?token=fresh', now), cloudinary + '?token=fresh');
  assert.equal(preserveMediaUrl(cloudinary, cloudinary, now), cloudinary);
});

test('actual View Profile merge can recover an expired cached media URL while keeping fresh metadata', () => {
  const h = createHarness();
  h.mocks['@/src/performance/cache/rbzCache'] = {};
  const { mergeStableViewProfile } = h.load('src/features/performance/viewProfile/rbzViewProfileCache.ts');
  const old = signed('20200101T000000Z', 'old'), fresh = signed('20260926T123000Z', 'fresh');
  const result = mergeStableViewProfile({ user: { avatar: old, media: [{ id: 'photo', url: old }] } },
    { user: { avatar: fresh, media: [{ id: 'photo', url: fresh, caption: 'updated', privacy: 'matches' }] } });
  assert.equal(result.user.avatar, fresh);
  assert.equal(result.user.media[0].url, fresh);
  assert.equal(result.user.media[0].caption, 'updated');
  assert.equal(result.user.media[0].privacy, 'matches');
});

function mediaHarness() {
  const h = createHarness(), videos = new Set(), scrolls = [];
  const NativeVideo = React.forwardRef((props, ref) => {
    const instance = React.useRef({ setPositionAsync: async () => {} }).current;
    instance.props = props;
    React.useImperativeHandle(ref, () => instance, [instance]);
    React.useEffect(() => { videos.add(instance); return () => videos.delete(instance); }, [instance]);
    return null;
  });
  NativeVideo.displayName = 'TestVideo';
  const FlatList = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ scrollToOffset: v => scrolls.push(v), scrollToIndex: v => scrolls.push(v) }), []);
    return React.createElement('List', null, props.data.map((item, index) => React.createElement(React.Fragment, { key: item.id }, props.renderItem({ item, index }))));
  });
  FlatList.displayName = 'TestList';
  Object.assign(h.mocks['react-native'], { View: 'View', Text: 'Text', Pressable: 'Pressable', ActivityIndicator: 'Spinner', StyleSheet: { create: x => x },
    FlatList, Dimensions: { get: () => ({ width: 400, height: 800 }) }, Platform: { OS: 'android' }, Modal: ({ children }) => children });
  const chain = () => { const p = new Proxy({}, { get: () => () => p }); return p; };
  h.mocks['react-native-gesture-handler'] = { Gesture: { Pan: chain, Pinch: chain, Simultaneous: () => ({}) }, GestureDetector: ({ children }) => children };
  h.mocks['react-native-reanimated'] = { __esModule: true, default: { FlatList, Image: 'Image' },
    useSharedValue: v => React.useRef({ value: v }).current, useAnimatedStyle: fn => fn(), withSpring: v => v, runOnJS: fn => fn };
  h.mocks['@expo/vector-icons'] = { Ionicons: 'Icon' };
  h.mocks['expo-av'] = { Video: NativeVideo, ResizeMode: { CONTAIN: 'contain' } };
  h.mocks['@/src/performance/diagnostics/media'] = { diagnosticVideo: () => NativeVideo };
  h.mocks['react-native-safe-area-context'] = { useSafeAreaInsets: () => ({ top: 20, bottom: 20 }) };
  return { h, videos, scrolls };
}

const props = { mediaWidth: 400, mediaHeight: 800, screenWidth: 400, screenHeight: 800, insets: { bottom: 20 }, onClose() {} };

test('gallery mounts only selected foreground player, retains position across background and cleans timers', async () => {
  const { h, videos, scrolls } = mediaHarness();
  const Viewer = h.load('src/components/profile/Gallery/GalleryVideoViewer.tsx').default;
  const items = [0, 1, 2].map(id => ({ id, type: 'video', url: `https://example.invalid/${id}.mp4` }));
  let select;
  await h.mount(() => {
    const [index, setIndex] = React.useState(0); select = setIndex;
    return React.createElement(Viewer, { ...props, items, index, activeIndex: index, onChangeIndex: setIndex });
  });
  assert.equal(videos.size, 1);
  await act(async () => [...videos][0].props.onPlaybackStatusUpdate({ isLoaded: true, positionMillis: 4321, durationMillis: 20000 }));
  await h.appState('background');
  assert.equal(videos.size, 0);
  assert.equal(h.timers.size, 0);
  await h.appState('active');
  assert.equal(videos.size, 1);
  assert.equal([...videos][0].props.positionMillis, 4321);
  await act(async () => select(1));
  assert.equal(videos.size, 1);
  assert.equal([...videos][0].props.source.uri, items[1].url);
  await act(async () => [...videos][0].props.onPlaybackStatusUpdate({ isLoaded: true, positionMillis: 20000, durationMillis: 20000, didJustFinish: true }));
  await h.advance(0);
  assert.equal([...videos][0].props.source.uri, items[2].url);
  assert.equal(scrolls.at(-1).offset, 1600);
  await h.focus(false);
  assert.equal(videos.size, 0);
  await h.unmount();
  assert.equal(h.timers.size, 0);
});

test('shared View Profile video viewer releases hidden players and timers, preserving paused progress on return', async () => {
  const { h, videos } = mediaHarness();
  const Viewer = h.load('src/components/media/RBZVideoViewer.tsx').default;
  const items = [0, 1, 2].map(id => ({ id, url: `https://example.invalid/${id}.mp4` }));
  let show;
  await h.mount(() => {
    const [visible, setVisible] = React.useState(true); show = setVisible;
    return React.createElement(Viewer, { visible, items, onClose: () => setVisible(false) });
  });
  assert.equal(videos.size, 1);
  const status = { isLoaded: true, isPlaying: false, positionMillis: 6543, durationMillis: 20000 };
  const oldCallback = [...videos][0].props.onPlaybackStatusUpdate;
  await act(async () => [...videos][0].props.onPlaybackStatusUpdate(status));
  await h.appState('background');
  assert.equal(videos.size, 0);
  assert.equal(h.timers.size, 0);
  await h.appState('active');
  assert.equal(videos.size, 1);
  assert.equal([...videos][0].props.positionMillis, 6543);
  assert.equal([...videos][0].props.shouldPlay, false);
  await act(async () => oldCallback({ ...status, positionMillis: 12 }));
  await h.appState('background');
  await h.appState('active');
  assert.equal([...videos][0].props.positionMillis, 6543, 'a retired native player cannot overwrite the resumed position');
  await act(async () => [...videos][0].props.onPlaybackStatusUpdate({ ...status, isPlaying: false, shouldPlay: true, isBuffering: true }));
  await h.appState('background');
  await h.appState('active');
  assert.equal([...videos][0].props.shouldPlay, true, 'buffering must preserve playback intent rather than become a user pause');
  await h.focus(false);
  assert.equal(videos.size, 0);
  assert.equal(h.timers.size, 0);
  await h.focus(true);
  assert.equal(videos.size, 1);
  await act(async () => show(false));
  assert.equal(videos.size, 0);
  assert.equal(h.timers.size, 0);
  await h.unmount();
});

test('only selected gallery Stream page resolves; blur aborts and late responses cannot mount a player', async () => {
  const { h, videos } = mediaHarness();
  const Viewer = h.load('src/components/profile/Gallery/GalleryVideoViewer.tsx').default;
  const pending = deferred(), requests = [];
  const apiFetch = (path, init) => { requests.push({ path, ...init }); return pending.promise; };
  const items = [0, 1, 2].map(id => ({ id, type: 'video', streamUid: `uid-${id}` }));
  await h.mount(() => React.createElement(Viewer, { ...props, items, index: 0, activeIndex: 0, onChangeIndex() {}, apiFetch }));
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/stream/uid-0/playback');
  await h.focus(false);
  assert.equal(requests[0].signal.aborted, true);
  await act(async () => pending.resolve({ playback: { hls: 'https://example.invalid/late.m3u8' } }));
  assert.equal(videos.size, 0);
  await h.unmount();
});

test('photo paging uses poster placeholders for neighbouring videos without native players', async () => {
  const { h, videos } = mediaHarness();
  const Viewer = h.load('src/components/profile/Gallery/GalleryPhotoViewer.tsx').default;
  const items = [{ id: 'photo', type: 'image', url: 'photo.jpg' }, { id: 'video', type: 'video', url: 'video.mp4', thumbnailUrl: 'poster.jpg' }];
  await h.mount(() => React.createElement(Viewer, { ...props, items, index: 0, activeIndex: 0, onChangeIndex() {} }));
  assert.equal(videos.size, 0);
  await h.unmount();
  assert.equal(h.timers.size, 0);
});
