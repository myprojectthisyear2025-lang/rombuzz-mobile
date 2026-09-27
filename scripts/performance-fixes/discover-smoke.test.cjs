const {test}=require('node:test'),assert=require('node:assert/strict');
const {React,act,deferred}=require('./harness.cjs');
const {screenHarness}=require('./screenHarness.cjs');
function setup(){
  const h=screenHarness(),gps=deferred(),snapshots=[];
  h.mocks['expo-router'].useLocalSearchParams=()=>({});
  h.mocks['@/src/features/discover/useDiscoverVisuals']={useDiscoverVisuals:()=>({colors:{},styles:{}})};
  h.mocks['@/src/features/discover/DiscoverCardActions']={default:'Actions',__esModule:true};
  h.mocks['@/src/features/discover/DiscoverScrollableBio']={default:'Bio',__esModule:true};
  h.mocks['@/src/features/discover/discoverFilterStorage']={loadSavedDiscoverFilters:async defaults=>defaults,saveDiscoverFilters:async()=>{}};
  const chain=()=>{const proxy=new Proxy({},{get:()=>()=>proxy});return proxy;};
  h.mocks['react-native-gesture-handler']={Gesture:{Pan:chain},GestureDetector:'Gesture',GestureHandlerRootView:'Deck'};
  h.mocks['react-native-reanimated']={__esModule:true,default:{View:'AnimatedView'},Extrapolate:{CLAMP:'clamp'},
    interpolate:()=>0,useSharedValue:value=>React.useRef({value}).current,useAnimatedStyle:f=>f(),withSpring:v=>v,withTiming:v=>v,runOnJS:f=>f};
  h.mocks['expo-location']={Accuracy:{Balanced:1},requestForegroundPermissionsAsync:async()=>({status:'granted'}),
    getLastKnownPositionAsync:async()=>({coords:{latitude:1,longitude:1}}),getCurrentPositionAsync:()=>gps.promise,reverseGeocodeAsync:async()=>[]};
  const date=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z');
  const url=(asset,sig)=>`https://test.r2.cloudflarestorage.com/${asset}.jpg?X-Amz-Date=${date}&X-Amz-Expires=3600&X-Amz-Signature=${sig}`;
  const user={id:'candidate',avatar:url('a','old'),media:[{url:url('b','old'),privacy:'public'}]};
  h.mocks['@/src/features/performance/useCachedDiscoverDeck']={useCachedDiscoverDeck:()=>cache};
  const cache={hydrateCachedDiscoverDeck:async input=>({hit:!input.lookingFor,users:input.lookingFor?[]:[user]}),saveCachedDiscoverDeck:async()=>{},preloadDiscoverImages(){}};
  h.mocks['@/src/performance/diagnostics/screens'].usePerfContent=(_name,_ready,count)=>snapshots.push(count);
  const Screen=h.load('app/(tabs)/discover.tsx').default;
  const top=()=>h.tree.root.findByType('Gesture').findByType('Image');
  return {h,gps,user,url,Screen,top,snapshots};
}
test('actual Discover cache stays mounted with same photo during refresh and sequential changed GPS; no empty commits or refresh UI',async()=>{
  const {h,gps,user,url,Screen,top,snapshots}=setup(),first=deferred(),second=deferred();
  h.setFetch(()=>h.requests.length===1?first.promise:second.promise);
  await h.mount(Screen);
  const mounted=top();
  await act(async()=>mounted.parent.props.onPress());
  assert.equal(top().props.source.uri,user.media[0].url);
  const start=snapshots.length;
  assert.equal(h.tree.root.findAllByType('Spinner').length,0);
  assert.doesNotMatch(JSON.stringify(h.tree.toJSON()),/Refreshing nearby/);
  await act(async()=>first.resolve({users:[{...user,avatar:url('a','fresh'),media:[{id:'photo',url:url('b','fresh'),privacy:'public'}]}]}));
  assert.equal(top(),mounted);
  assert.equal(top().props.source.uri,user.media[0].url,'valid cached URL does not reload for a new signature');
  await act(async()=>gps.resolve({coords:{latitude:2,longitude:2}}));
  assert.equal(h.requests.length,2);
  assert.match(h.requests[1].url,/lat=2/);
  assert.equal(top(),mounted);
  await act(async()=>second.resolve({users:[{...user,city:'Updated'}]}));
  assert.equal(top(),mounted);
  assert.ok(snapshots.slice(start).every(count=>count>0));
  await h.unmount();
});
test('failed or malformed Discover refresh retains the card; replaced filters abort and exclude old content',async()=>{
  const {h,Screen,top}=setup(),pending=deferred();
  h.setFetch(()=>pending.promise);
  await h.mount(Screen);const mounted=top();
  await act(async()=>pending.resolve({unexpected:true}));
  assert.equal(top(),mounted);
  const newer=deferred();h.setFetch(()=>newer.promise);
  const filter=h.tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(t=>t.children.includes('Long-term')));
  // Pick the first actual filter chip after All (labels may evolve).
  const chips=h.tree.root.findByType('ScrollView').findAllByType('Pressable');
  await act(async()=> (filter||chips[1]).props.onPress());
  assert.equal(h.tree.root.findAllByType('Deck').length,0);
  assert.equal(h.tree.root.findAllByType('Spinner').length,1);
  await h.focus(false);
  assert.equal(h.requests.at(-1).signal.aborted,true);
  await act(async()=>newer.resolve({users:[{id:'late',avatar:'late.jpg'}]}));
  assert.equal(h.tree.root.findAllByType('Deck').length,0);
  await h.unmount();
});
test('network failure preserves the cached Discover card and its selected photo',async()=>{
  const {h,Screen,top}=setup(),pending=deferred();
  h.setFetch(()=>pending.promise);
  await h.mount(Screen);const mounted=top();
  await act(async()=>mounted.parent.props.onPress());
  const uri=top().props.source.uri;
  await act(async()=>pending.reject(new Error('Offline')));
  assert.equal(top(),mounted);assert.equal(top().props.source.uri,uri);
  await h.unmount();
});
