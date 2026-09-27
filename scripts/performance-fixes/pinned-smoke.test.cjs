const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness,React,act,deferred}=require('./harness.cjs');
const {screenHarness}=require('./screenHarness.cjs');
const pinned=(id,extra={})=>({id,from:'alice',to:'bob',text:id,pinned:true,pinnedAt:1700000000000,...extra});
function setup(){
  const h=createHarness();let state,setPeer;
  const {usePinnedMessages}=h.load('src/features/chat/pinned/usePinnedMessages.ts');
  const Component=()=>{const[peer,change]=React.useState('bob');setPeer=change;state=usePinnedMessages(peer);return null;};
  return {h,Component,get state(){return state;},change:peer=>act(async()=>setPeer(peer))};
}
test('actual pinned screen renders cached media labels and keeps navigation to the original message',async()=>{
  const h=screenHarness();h.mocks['expo-router'].useLocalSearchParams=()=>({peerId:'bob',name:'Bob'});
  h.storage.set('RBZ_PINNED_V1:alice:alice_bob',JSON.stringify([pinned('video',{mediaType:'video'})]));h.setFetch(()=>deferred().promise);
  await h.mount(h.load('app/chat/pinned/[peerId].tsx').default);
  assert.match(JSON.stringify(h.tree.toJSON()),/Video/);assert.doesNotMatch(JSON.stringify(h.tree.toJSON()),/Loading pinned/);
  const card=h.tree.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(t=>t.children.includes('Video')));
  await act(async()=>card.props.onPress());assert.equal(h.routes[0].params.focusMsgId,'video');await h.unmount();
});
test('cached pins outside the thread window open while exactly one focused request reconciles',async()=>{
  const s=setup(),gate=deferred();s.h.storage.set('RBZ_PINNED_V1:alice:alice_bob',JSON.stringify([pinned('old')]));
  s.h.setFetch(()=>gate.promise);await s.h.mount(s.Component);
  assert.deepEqual(s.state.items.map(m=>m.id),['old']);assert.equal(s.state.loading,false);
  assert.equal(s.h.requests.length,1);assert.match(s.h.requests[0].url,/\/pinned$/);
  await act(async()=>gate.resolve({messages:[pinned('fresh')]}));assert.equal(s.state.items[0].id,'fresh');
  await s.h.unmount();s.h.setFetch(()=>deferred().promise);await s.h.mount(s.Component);
  assert.equal(s.state.items[0].id,'fresh');assert.equal(s.state.loading,false);await s.h.unmount();
});
test('pins retain media, replies, reactions and order; hidden/deleted/temp/unpinned rows cannot leak',()=>{
  const {pinnedMessages}=createHarness().load('src/features/chat/pinned/pinnedMessages.ts');
  const media=pinned('media',{url:'r2/key.jpg',mediaType:'image',replyTo:{id:'reply',text:'context'},reactions:{alice:'heart'},pinnedAt:1800000000000});
  const rows=pinnedMessages([pinned('old'),media,pinned('hidden',{hiddenFor:['alice']}),pinned('deleted',{deleted:true}),pinned('temp',{_temp:true}),pinned('off',{pinned:false})],'alice');
  assert.deepEqual(rows,[media,pinned('old')]);
});
test('socket unpin/delete wins over slow response; other rooms cannot alter pins; blur cancels and detaches',async()=>{
  const s=setup(),gate=deferred();s.h.setFetch(()=>gate.promise);await s.h.mount(s.Component);
  await s.h.emit('message:pin',{roomId:'alice_bob',message:pinned('a')});
  await s.h.emit('chat:pin',{roomId:'alice_bob',message:pinned('a',{pinned:false})});
  await s.h.emit('message:pin',{roomId:'alice_other',message:pinned('wrong')});
  await s.h.emit('message:delete',{roomId:'alice_bob',msgId:'deleted'});
  await act(async()=>gate.resolve({messages:[pinned('a'),pinned('deleted'),pinned('b')]}));
  assert.deepEqual(s.state.items.map(m=>m.id),['b']);
  await s.h.focus(false);assert.equal(s.h.requests[0].signal.aborted,true);
  assert.equal([...s.h.socketListeners.values()].reduce((n,v)=>n+v.size,0),0);await s.h.unmount();
});
test('leaving or switching peer/account during a slow read rejects late results and late socket wiring',async()=>{
  const s=setup(),gate=deferred(),socket=deferred();s.h.setFetch(()=>gate.promise);s.h.socketGate.promise=socket.promise;
  await s.h.mount(s.Component);await s.change('carol');assert.equal(s.h.requests[0].signal.aborted,true);assert.equal(s.state.items.length,0);
  await s.h.session({token:'different',user:{id:'dave'}});assert.equal(s.state.items.length,0);
  await s.h.focus(false);await act(async()=>{gate.resolve({messages:[pinned('late')]});socket.resolve();});
  assert.equal(s.state.items.length,0);assert.equal(s.h.socketListeners.size,0);await s.h.unmount();
});
test('old backend compatibility falls back only for absent route, never access errors; failure keeps cache',async()=>{
  const h=createHarness(),{requestPinnedMessages}=h.load('src/features/chat/pinned/pinnedMessages.ts');
  h.setFetch(url=>url.endsWith('/pinned')?{response:{ok:false,status:404}}:[pinned('legacy')]);
  assert.equal((await requestPinnedMessages('alice_bob','token',new AbortController().signal))[0].id,'legacy');assert.equal(h.requests.length,2);
  h.setFetch(()=>({error:'user_not_found',response:{ok:false,status:404}}));
  await assert.rejects(requestPinnedMessages('alice_bob','token',new AbortController().signal));assert.equal(h.requests.length,3);
  const s=setup(),gate=deferred();s.h.storage.set('RBZ_PINNED_V1:alice:alice_bob',JSON.stringify([pinned('cached')]));s.h.setFetch(()=>gate.promise);
  await s.h.mount(s.Component);await act(async()=>gate.reject(Error('Offline')));assert.equal(s.state.items[0].id,'cached');await s.h.unmount();
});
test('late disk cache cannot overwrite fresh pins, and cached empty results are usable',async()=>{
  const s=setup(),disk=deferred();s.h.mocks['@react-native-async-storage/async-storage'].getItem=()=>disk.promise;
  s.h.setFetch(async()=>({messages:[pinned('fresh')]}));await s.h.mount(s.Component);
  await act(async()=>disk.resolve(JSON.stringify([pinned('stale')])));assert.equal(s.state.items[0].id,'fresh');await s.h.unmount();
  const empty=setup();empty.h.storage.set('RBZ_PINNED_V1:alice:alice_bob','[]');empty.h.setFetch(()=>deferred().promise);await empty.h.mount(empty.Component);
  assert.equal(empty.state.loading,false);assert.deepEqual(empty.state.items,[]);await empty.h.unmount();
});
