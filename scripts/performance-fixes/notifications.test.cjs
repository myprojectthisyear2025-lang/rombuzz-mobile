const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness,deferred,act}=require('./harness.cjs');
const item=(id,read=false,toId='alice')=>({id,read,toId,type:'comment',message:id,createdAt:'2026-01-01'});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){
  const {createNotificationStore}=createHarness().load('src/features/notifications/createNotificationStore.ts');
  const calls=[],writes=[];let fetcher=async()=>({notifications:[item('one'),item('two')]});
  const store=createNotificationStore({read:(path,signal)=>{calls.push({path,signal});return fetcher(path,signal);},readCache:async()=>({items:[item('cached')],unread:1}),writeCache:async(id,state)=>writes.push({id,state})});
  return{store,calls,writes,fetch:fn=>{fetcher=fn;}};
}
test('one list owns startup/screen/refresh; hidden badge reads use only count endpoint',async()=>{
  const h=setup();const gate=deferred();h.fetch(()=>gate.promise);
  h.store.configure('alice','token');h.store.setVisible(true);h.store.setForeground(true);const a=h.store.refresh(true),b=h.store.refresh(true);assert.equal(a,b);
  await tick();assert.equal(h.calls.length,1);assert.equal(h.calls[0].path,'/notifications?view=mobile');assert.equal(h.store.getSnapshot().items[0].id,'cached');
  gate.resolve({notifications:[item('one')]});await a;assert.equal(h.store.getSnapshot().unread,1);
  h.store.setVisible(false);h.fetch(()=>({total:3}));await h.store.refresh(true);assert.equal(h.calls[1].path,'/notifications/unread-count');assert.equal(h.store.getSnapshot().unread,3);
});
test('background and screen exit abort reads; obsolete results and accounts cannot overwrite state',async()=>{
  const h=setup(),gate=deferred();h.fetch(()=>gate.promise);h.store.configure('alice','token');h.store.setVisible(true);h.store.setForeground(true);await tick();
  h.store.setVisible(false);assert.equal(h.calls[0].signal.aborted,true);gate.resolve({notifications:[item('late')]});await tick();assert.equal(h.store.getSnapshot().items[0].id,'cached');
  const next=deferred();h.fetch(()=>next.promise);h.store.setVisible(true);await tick();h.store.setForeground(false);assert.equal(h.calls[1].signal.aborted,true);
  await h.store.refresh(true);assert.equal(h.calls.length,2);h.store.configure('bob','new-token');next.resolve({notifications:[item('old-account')]});await tick();assert.equal(h.store.getSnapshot().items.length,0);
});
test('socket aliases count once and stale HTTP cannot erase arrivals or optimistic mutations',async()=>{
  const h=setup(),gate=deferred();h.fetch(()=>gate.promise);h.store.configure('alice','token');h.store.setVisible(true);h.store.setForeground(true);await tick();
  h.store.setForeground(false);h.store.receive(item('new'));h.store.receive(item('new'));h.store.receive(item('other',false,'bob'));assert.equal(h.store.getSnapshot().unread,2);
  gate.resolve({notifications:[item('cached')]});await tick();assert.equal(h.store.getSnapshot().items.length,2);
  h.store.setItems(rows=>rows.map(n=>({...n,read:true})));assert.equal(h.store.getSnapshot().unread,0);
  h.store.setItems(rows=>rows.filter(n=>n.id!=='new'));assert.equal(h.store.getSnapshot().items.length,1);
});
test('old backend count fallback shares the list cache and retains all 192 notifications',async()=>{
  const h=setup();h.fetch(path=>path.endsWith('unread-count')?{unsupported:true}:{notifications:Array.from({length:192},(_,i)=>item('n'+i,i%3===0))});
  h.store.configure('alice','token');h.store.setForeground(true);await h.store.refresh(true);
  assert.equal(h.calls.length,2);assert.equal(h.store.getSnapshot().items.length,192);assert.equal(h.store.getSnapshot().unread,128);
  h.store.setVisible(true);await tick();assert.equal(h.calls.length,2);
});
test('actual hooks retain hidden UI, clean up late socket setup, and reject old account mutation closures',async()=>{
  const h=createHarness(),listeners=new Set();let current,renders=0;
  h.mocks['@/src/lib/socket'].onNotification=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
  h.mocks['@/src/performance/cache/rbzCache']={rbzCacheGet:async(_key,fallback)=>({hit:false,value:fallback}),rbzCacheSet:async()=>{}};
  h.mocks['@/src/performance/api/rbzApiClient'].rbzApiJson=async()=>({notifications:[item('initial')]});
  h.setFetch(()=>({total:1}));
  const {useNotificationLifecycle,useNotifications}=h.load('src/features/notifications/notificationState.ts');
  await h.mount(()=>{useNotificationLifecycle(true);current=useNotifications();renders++;return null;});
  assert.equal(current.items[0].id,'initial');const oldMutation=current.setItems;
  await h.focus(false);const hiddenRenders=renders;
  await act(async()=>listeners.forEach(fn=>fn(item('hidden-arrival'))));assert.equal(renders,hiddenRenders);assert.equal(current.items.length,1);
  await h.focus(true);assert.equal(current.items.length,2);
  await h.session({token:'bob-token',user:{id:'bob'}});
  await act(async()=>oldMutation(()=>[item('old-account-injection')]));assert.ok(!current.items.some(n=>n.id==='old-account-injection'));
  await h.unmount();assert.equal(listeners.size,0);
  const delayed=createHarness(),gate=deferred();let subscribed=0;delayed.socketGate.promise=gate.promise;
  delayed.mocks['@/src/lib/socket'].onNotification=()=>{subscribed++;return()=>{};};
  delayed.mocks['@/src/performance/cache/rbzCache']={rbzCacheGet:async(_key,fallback)=>({hit:false,value:fallback}),rbzCacheSet:async()=>{}};
  delayed.setFetch(()=>({total:0}));const lifecycle=delayed.load('src/features/notifications/notificationState.ts').useNotificationLifecycle;
  await delayed.mount(()=>{lifecycle(true);return null;});await delayed.unmount();await act(async()=>gate.resolve());assert.equal(subscribed,0);
});
