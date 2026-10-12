const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, act, React, renderer } = require("../auth-tests/harness.cjs");
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const flush = () => new Promise(r => setImmediate(r));
const response = data => ({ ok: true, status: 200, text: async () => JSON.stringify(data), json: async () => data });
function harness(options) {
  const h = createHarness(options);
  h.virtual["src/performance/diagnostics/cache"] = { perfCacheRead: () => value => value, observeCacheReader: (_, fn) => fn };
  h.mocks["expo-location"] = { requestForegroundPermissionsAsync: async () => ({status:"granted"}) };
  h.mocks["react-native"].Image = { prefetch: async () => {} };
  h.mocks["react-native"].InteractionManager = { runAfterInteractions: fn => fn() };
  return h;
}
async function mount(t, hook) {
  let value, tree;
  function Probe(){ value = hook(); return null; }
  await act(async () => { tree = renderer.create(React.createElement(Probe)); });
  t.after(async () => { await act(async () => tree.unmount()); });
  return { get value(){return value;}, async render(){ await act(async () => tree.update(React.createElement(Probe))); } };
}

test("logout hides identity synchronously during blocked storage; restart rejects torn account writes", async () => {
  const h = harness(); await h.session.setSession("a.signatureA",{id:"A",avatar:"A.jpg"});
  const gate=deferred(); h.faults.cacheWrite=()=>gate.promise;
  const writing=h.session.persistCurrentUser({id:"A",avatar:"late.jpg"}); await flush();
  const logout=h.session.clearSession();
  assert.deepEqual(h.session.getSessionSnapshot(),{token:"",user:null});
  const login=h.session.setSession("b.signatureB",{id:"B"});
  gate.resolve(); await Promise.all([writing,logout,login]);
  assert.equal(h.session.getSessionSnapshot().user.id,"B");
  h.secure.set("RBZ_TOKEN","a.signatureA");
  const restarted=harness({secure:h.secure,cache:h.cache});
  assert.deepEqual(await restarted.session.initializeSession(),{token:"",user:null});
});

test("account caches ignore global entries, survive same-account restart, reject foreign identity and late callbacks", async t => {
  const h=harness(); await h.session.setSession("tokenA",{id:"A"});
  const {useCachedProfile}=h.load("src/features/performance/useCachedProfile.ts");
  const profile=await mount(t,useCachedProfile); const old=profile.value;
  const cache=h.load("src/performance/cache/rbzCache.ts");
  h.cache.set("RBZ_PERF_PROFILE_FULL",JSON.stringify({value:{user:{id:"A",religion:"old"}}}));
  assert.equal((await old.readCachedProfile()).hit,false);
  await old.writeCachedProfile({id:"A",avatar:"A.jpg"});
  const restarted=harness({secure:h.secure,cache:h.cache}); await restarted.session.initializeSession();
  assert.equal((await restarted.load("src/performance/cache/rbzCache.ts").rbzCacheGet("RBZ_PERF_PROFILE_FULL:A",null)).value.user.avatar,"A.jpg");
  const feed=h.load("src/features/performance/letsbuzz/rbzLetsBuzzFeedCache.ts");
  const owner=h.session.getSessionGeneration();
  await h.session.setSession("tokenB",{id:"B"}); await profile.render();
  assert.equal((await profile.value.readCachedProfile()).hit,false);
  await old.writeCachedProfile({id:"A",avatar:"late.jpg"});
  await feed.writeCachedLetsBuzzFeed([{id:"private-A"}],owner);
  assert.equal(await feed.readCachedLetsBuzzFeed(),null);
  await cache.rbzCacheSet("RBZ_PERF_PROFILE_FULL:B",{user:{id:"A"}});
  assert.equal((await profile.value.readCachedProfile()).hit,false);
  assert.equal(h.session.getSessionSnapshot().user.id,"B");
});

test("successful response started by A cannot return or persist after B signs in", async () => {
  const h=harness(); await h.session.setSession("A",{id:"A"});
  const gate=deferred(), started=deferred();
  h.setFetch(async()=>{started.resolve();await gate.promise;return response({user:{id:"A"}});});
  const pending=h.load("src/performance/api/rbzApiClient.ts").rbzApiJson("/profile/full");
  const rejected=assert.rejects(pending,/SESSION_CHANGED/);
  await started.promise; await h.session.setSession("B",{id:"B"}); gate.resolve(); await rejected;
  assert.equal(h.session.getSessionSnapshot().user.id,"B");
});

test("account switch during token lookup prevents dispatch with the previous token", async () => {
  const h=harness(); await h.session.setSession("A",{id:"A"});
  const previous=h.session.getSessionSnapshot(), gate=deferred(); let requests=0;
  h.session.initializeSession=async()=>{await gate.promise;return previous;};
  h.setFetch(async()=>{requests++;return response({});});
  const pending=h.load("src/performance/api/rbzApiClient.ts").rbzApiJson("/profile/full");
  const rejected=assert.rejects(pending,/SESSION_CHANGED/);
  await h.session.setSession("B",{id:"B"}); gate.resolve(); await rejected;
  assert.equal(requests,0);
});

test("OS grant alone does not enable location; disable wins over permission/load races and persists across relaunch",async()=>{
  const h=harness(), storage=h.mocks["@react-native-async-storage/async-storage"];
  const {createLocationConsent}=h.load("src/features/location/useLocationConsent.ts");
  let valid=true, asks=0; const permission=deferred();
  const choice=createLocationConsent("A:microbuzz",()=>valid,storage,async()=>{asks++;return permission.promise;});
  await choice.load(); assert.equal(choice.isEnabled(),false); assert.equal(asks,0);
  const pending=choice.enable(); await choice.disable(); permission.resolve({status:"granted"});
  assert.equal(await pending,false); assert.equal(choice.isEnabled(),false);
  const relaunched=createLocationConsent("A:microbuzz",()=>valid,storage,async()=>({status:"granted"}));
  await relaunched.load(); assert.equal(relaunched.isEnabled(),false);
  assert.equal(await relaunched.enable(),true); const ticket=relaunched.getRevision();
  await relaunched.disable(); await relaunched.enable(); assert.notEqual(ticket,relaunched.getRevision());
  valid=false; assert.equal(relaunched.isEnabled(),false);
  const b=createLocationConsent("B:microbuzz",()=>true,storage,async()=>({status:"denied"}));
  await b.load(); assert.equal(await b.enable(),false);
  const load=deferred(); const race=createLocationConsent("A:discover",()=>true,{...storage,getItem:()=>load.promise});
  const loading=race.load(); await race.disable(); load.resolve("true"); await loading;
  assert.equal(race.isEnabled(),false);
});

test("own and received messages update correct row once; older events and prior account handlers cannot overwrite",async()=>{
  const h=harness(); await h.session.setSession("A",{id:"A"});
  let rows=[{id:"B",lastMessageTime:1},{id:"C",lastMessageTime:2}], filtered;
  const {createChatListRealtimeHandlers}=h.load("src/features/chat/list/chatListRealtimeHandlers.ts");
  const handlers=createChatListRealtimeHandlers({myId:"A",activePeerRef:{current:"B"},setMatches:fn=>{rows=fn(rows);},setFiltered:value=>{filtered=value;}},{current:{}});
  const outgoing={id:"m1",from:"A",to:"B",text:"sent",time:1000};
  handlers.updateMessagePreview(outgoing); assert.equal(rows[0].id,"B"); assert.equal(rows[0].lastMessage.text,"sent");
  handlers.updateMessagePreview({...outgoing,text:"duplicate"}); assert.equal(rows[0].lastMessage.text,"sent");
  handlers.updateMessagePreview({message:{_id:"m2",from:{id:"B"},to:"A",type:"image",time:2000}});
  assert.equal(rows[0].lastMessage.type,"image"); assert.deepEqual(filtered,rows);
  handlers.updateMessagePreview({id:"old",from:"B",to:"A",time:500}); assert.equal(rows[0].lastMessage._id,"m2");
  await h.session.setSession("C",{id:"C"}); handlers.updateMessagePreview({id:"late",from:"B",to:"A",time:3000});
  assert.equal(rows[0].lastMessage._id,"m2");
});

test("socket hooks subscribe once, use current callbacks, reconcile delete/reconnect/resume, and clean up",async t=>{
  const h=harness(); await h.session.setSession("A",{id:"A"});
  const events=new Map(); let gets=0, refreshes=0, accepted=0;
  const socket={on:(name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);},off:(name,fn)=>events.get(name)?.delete(fn),emit:()=>{}};
  const emit=(name,payload)=>events.get(name)?.forEach(fn=>fn(payload));
  h.virtual["src/lib/socket"]={getSocket:async()=>{gets++;return socket;}};
  const {useVideoCallSocket}=h.load("src/features/videoCall/useVideoCallSocket.ts");
  let increment=1;
  const call=await mount(t,()=>useVideoCallSocket({onAccepted:()=>{accepted+=increment;}}));
  increment=10; await call.render(); emit("video-call:accepted",{call:{id:"call"}});
  assert.equal(accepted,10); assert.equal(events.get("video-call:accepted").size,1);
  const state={myId:"A",matches:[{id:"B"}],activePeerRef:{current:null},inboxEventRevisionRef:{current:0},setMatches:()=>{},setFiltered:()=>{},setOnlineMap:()=>{}};
  const {useChatListRealtime}=h.load("src/features/chat/list/useChatListRealtime.ts");
  const chat=await mount(t,()=>useChatListRealtime(state,async()=>{refreshes++;})); await chat.render();
  assert.equal(gets,2); assert.equal(events.get("chat:message").size,1);
  emit("message:delete",{}); emit("connect"); h.changeAppState("background");h.changeAppState("active");
  await new Promise(r=>setTimeout(r,160)); assert.equal(refreshes,1); assert.equal(state.inboxEventRevisionRef.current,3);
  await h.session.clearSession(); emit("chat:message",{id:"late"});
  await new Promise(r=>setTimeout(r,160)); assert.equal(refreshes,1);
});

test("system theme follows live appearance while an explicit saved choice survives",async t=>{
  const h=harness(); let change;
  h.mocks["react-native"].Appearance={getColorScheme:()=>"light",addChangeListener:fn=>{change=fn;return{remove(){}};}};
  const theme=h.load("src/design/RomBuzzThemeProvider.tsx"); let value,tree;
  function Probe(){value=theme.useRomBuzzTheme();return null;}
  await act(async()=>{tree=renderer.create(React.createElement(theme.RomBuzzThemeProvider,null,React.createElement(Probe)));});
  t.after(()=>act(async()=>tree.unmount()));
  assert.equal(value.mode,"system");assert.equal(value.resolvedTheme,"light");
  await act(async()=>change({colorScheme:"dark"})); assert.equal(value.resolvedTheme,"dark");
  await act(async()=>value.setMode("light")); await act(async()=>change({colorScheme:"dark"}));
  assert.equal(value.resolvedTheme,"light");assert.equal(h.secure.get("RBZ_APPEARANCE_MODE"),"light");
});

test("accepted call closes overlay and a duplicate incoming event cannot reopen it",async t=>{
  const h=harness(); await h.session.setSession("A",{id:"A"}); let handlers; const routes=[];
  h.mocks["react-native"]={...h.mocks["react-native"],ActivityIndicator:"ActivityIndicator",Alert:{alert(){}},Image:"Image",Modal:"Modal",Pressable:"Pressable",Text:"Text",View:"View",StyleSheet:{create:x=>x}};
  h.mocks["@expo/vector-icons"]={Ionicons:"Icon"};h.mocks["expo-linear-gradient"]={LinearGradient:"Gradient"};
  h.mocks["expo-router"]={useRouter:()=>({push:route=>routes.push(route)})};
  h.virtual["src/features/videoCall/useVideoCallSocket"]={useVideoCallSocket:next=>{handlers=next;}};
  h.virtual["src/features/videoCall/videoCallApi"]={acceptVideoCall:async()=>({call:{id:"call",channelName:"channel"},token:{}}),declineVideoCall:async()=>{}};
  const Overlay=h.load("src/features/videoCall/IncomingCallOverlay.tsx").default; let tree;
  await act(async()=>{tree=renderer.create(React.createElement(Overlay));});t.after(()=>act(async()=>tree.unmount()));
  const call={id:"call",status:"ringing",callerId:"B",receiverId:"A"};
  await act(async()=>handlers.onIncoming({call}));assert.equal(tree.root.findByType("Modal").props.visible,true);
  await act(async()=>tree.root.findAllByType("Pressable")[1].props.onPress());
  assert.equal(tree.root.findByType("Modal").props.visible,false);assert.equal(routes[0].params.callId,"call");
  await act(async()=>handlers.onIncoming({call})); assert.equal(tree.root.findByType("Modal").props.visible,false);
  await act(async()=>handlers.onAccepted({call:{...call,id:"other"}}));
  await act(async()=>handlers.onIncoming({call:{...call,id:"other"}}));assert.equal(tree.root.findByType("Modal").props.visible,false);
});


test("Meet in the Middle never uploads a GPS result after account switching",async t=>{
 const h=harness();await h.session.setSession("A",{id:"A"});const gps=deferred();let uploads=0;
 h.mocks["expo-location"]={Accuracy:{Balanced:1},requestForegroundPermissionsAsync:async()=>({status:"granted"}),getCurrentPositionAsync:()=>gps.promise};
 h.virtual["src/features/meetMiddle/meetMiddleApi"]={shareMeetMiddleLocation:async()=>{uploads++;return{};}};
 const {useMeetMiddleLocationShare}=h.load("src/features/meetMiddle/useMeetMiddleLocationShare.ts");const probe=await mount(t,()=>useMeetMiddleLocationShare("meet-id"));
 let pending;await act(async()=>{pending=probe.value.shareLocation();});await h.session.setSession("B",{id:"B"});
 await act(async()=>gps.resolve({coords:{latitude:40,longitude:50}}));await pending;assert.equal(uploads,0);
});
