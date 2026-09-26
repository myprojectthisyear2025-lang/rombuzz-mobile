const {test}=require("node:test"), assert=require("node:assert/strict");
const {createHarness,React,act,deferred}=require("./harness.cjs");
const msg=(id,extra={})=>({id,from:"bob",to:"alice",text:id,time:new Date(1700000000000+Number(id.replace(/\D/g,""))*1000).toISOString(),...extra});
function thread(h) {
  const {useChatThreadFastOpen}=h.load("src/features/chat/thread/useChatThreadFastOpen.ts");
  const {useChatRealtime}=h.load("src/features/chat/window/realtime/useChatRealtime.ts");
  const {useScreenActivity}=h.load("src/features/lifecycle/useScreenActivity.ts");
  const {useChatThreadMessages}=h.load("src/features/chat/thread/useChatThreadMessages.ts");
  let state, scrolls=0; const settle=()=>scrolls++;
  function App(){const activity=useScreenActivity(),{messages,setMessages,getCurrentMessages}=useChatThreadMessages(activity),[loading,setLoading]=React.useState(true);
    const args={myId:"alice",peerId:"bob",roomId:"alice_bob",messages,setMessages,getCurrentMessages,loading,setLoading,settleToLatest:settle};
    state={messages,setMessages,...useChatThreadFastOpen(args),...useChatRealtime(args)};return null;}
  return{App,get state(){return state;},get scrolls(){return scrolls;}};
}
test("thread paints cache, aborts on cover, ignores late HTTP and retains socket mutations",async()=>{
  const h=createHarness(),pending=deferred();
  h.storage.set("RBZ_CHAT_THREAD_CACHE_V1:alice_bob",JSON.stringify({messages:[msg("m1"),msg("m2")]}));
  h.setFetch(()=>pending.promise);const t=thread(h);await h.mount(t.App);
  assert.equal(t.state.messages.length,2);assert.match(h.requests[0].url,/\?limit=40$/);
  await h.focus(false);assert.equal(h.requests[0].signal.aborted,true);
  const receipts=h.socketEvents.filter(e=>e[0]==="message:seen").length;
  await h.emit("chat:message",msg("m3"));await h.emit("message:edit",{id:"m1",text:"edited"});
  assert.equal(t.state.messages.length,2,"no hidden message render");
  assert.equal(h.socketEvents.filter(e=>e[0]==="message:seen").length,receipts);
  await act(async()=>pending.resolve({messages:[msg("m1"),msg("m2")],paginated:true,hasMore:false}));
  const fresh=deferred();h.setFetch(()=>fresh.promise);await h.focus(true);
  assert.equal(h.requests.length,2);assert.equal(t.state.messages.length,3);assert.equal(t.state.messages[0].text,"edited");
  await act(async()=>fresh.resolve({messages:[msg("m1",{text:"edited"}),msg("m2"),msg("m3")],paginated:true,hasMore:false}));
  assert.equal(t.state.messages.length,3);await h.unmount();
});
test("older history remains reachable, single-flight and cancellable without losing loaded pages",async()=>{
  const h=createHarness();h.setFetch(async()=>({messages:[msg("m3"),msg("m4")],paginated:true,hasMore:true,nextCursor:"m3"}));
  const t=thread(h);await h.mount(t.App);const older=deferred();h.setFetch(()=>older.promise);
  let request;await act(async()=>{request=t.state.loadOlderMessages();void t.state.loadOlderMessages();});
  assert.equal(h.requests.length,2);assert.match(h.requests[1].url,/before=m3/);
  await act(async()=>{older.resolve({messages:[msg("m1"),msg("m2")],paginated:true,hasMore:false});await request;});
  assert.deepEqual(t.state.messages.map(m=>m.id),["m1","m2","m3","m4"]);
  await h.focus(false);h.setFetch(async()=>({messages:[msg("m3"),msg("m4")],paginated:true,hasMore:true,nextCursor:"m3"}));await h.focus(true);
  assert.deepEqual(t.state.messages.map(m=>m.id),["m1","m2","m3","m4"]);
  const last=deferred();h.setFetch(()=>last.promise);await act(async()=>{request=t.state.loadOlderMessages();});
  await h.appState("background");assert.equal(h.requests.at(-1).signal.aborted,true);
  await act(async()=>{last.resolve({messages:[msg("obsolete")],paginated:true});await request;});
  assert.equal(t.state.messages.some(m=>m.id==="obsolete"),false);await h.unmount();
});
test("typing/seen stop on blur; reconnect rejoins; late socket setup cannot attach after unmount",async()=>{
  const h=createHarness();h.setFetch(async()=>({messages:[msg("m1")],paginated:true}));const t=thread(h);await h.mount(t.App);
  await act(async()=>{t.state.isTypingRef.current=true;t.state.emitTyping(true);});await h.focus(false);
  assert.equal(h.socketEvents.filter(e=>e[0]==="typing").at(-1)[1].typing,false);
  const seen=h.socketEvents.filter(e=>e[0]==="message:seen").length;await h.emit("connect");
  assert.equal(h.socketEvents.filter(e=>e[0]==="joinRoom").length,2);
  assert.equal(h.socketEvents.filter(e=>e[0]==="message:seen").length,seen);await h.unmount();
  const late=createHarness(),gate=deferred();late.socketGate.promise=gate.promise;const lt=thread(late);await late.mount(lt.App);await late.unmount();await act(async()=>gate.resolve());
  assert.equal(late.socketListeners.size,0);
});
test("identity is available synchronously and obsolete peer requests cannot update the header",async()=>{
  const h=createHarness(),pending=deferred();h.setFetch(()=>pending.promise);
  const {useChatIdentity}=h.load("src/features/chat/window/hooks/useChatIdentity.ts");let state;
  function App(){state=useChatIdentity({peerId:"bob",name:"Bob Cached"});return null;}
  await h.mount(App);assert.equal(state.myId,"alice");assert.equal(state.peerName,"Bob Cached");
  await h.focus(false);assert.equal(h.requests[0].signal.aborted,true);
  await act(async()=>pending.resolve({user:{firstName:"Wrong",lastName:"Late"}}));assert.equal(state.peerName,"Bob Cached");await h.unmount();
});

test("unmounting a covered thread persists buffered socket edits",async()=>{
  const h=createHarness();h.setFetch(async()=>({messages:[msg("m1"),msg("m2")],paginated:true}));
  const t=thread(h);await h.mount(t.App);await h.focus(false);await h.emit("message:edit",{id:"m1",text:"edited while hidden"});
  await h.emit("message:delete",{id:"m2"});await h.unmount();
  const cache=JSON.parse(h.storage.get("RBZ_CHAT_THREAD_CACHE_V1:alice_bob"));
  assert.equal(cache.messages.length,1);assert.equal(cache.messages[0].text,"edited while hidden");
});
