const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness,act,deferred}=require('./harness.cjs');
const row=(id,type='image')=>({id,url:'https://example.invalid/'+id,mediaType:type,createdAtMs:100,giftLocked:false,giftPriceBC:0,fromId:'bob',toId:'alice',unlockedBy:[],thumbnailUrl:''});
test('shared/purchased normalization excludes ephemeral and preserves unlocked purchases and legacy video',()=>{
  const h=createHarness(),{chatMediaRows}=h.load('src/features/chat/mediaHub/chatMediaRows.ts');
  const messages=[{id:'photo',url:'https://example.invalid/image'}, {id:'gift',url:'https://example.invalid/gift',gift:{priceBC:20,locked:false,unlockedBy:['alice']}}, {id:'once',url:'https://example.invalid/once',ephemeral:{maxViews:1}}, {id:'legacy',text:'::RBZ::'+JSON.stringify({url:'https://example.invalid/video',type:'video'})}, {id:'deleted',url:'https://example.invalid/deleted',deleted:true}];
  assert.equal(chatMediaRows(messages,'shared').length,2);assert.equal(chatMediaRows(messages,'shared').find(r=>r.id==='legacy').mediaType,'video');
  assert.equal(chatMediaRows(messages,'purchased')[0].giftPriceBC,20);
});
test('identical page readers share HTTP; cancelling one retains the other; last cancellation aborts',async()=>{
  const h=createHarness(),gate=deferred();h.setFetch(()=>gate.promise);
  const {requestMediaPage}=h.load('src/features/chat/mediaHub/chatMediaRequest.ts');
  const a=new AbortController(),b=new AbortController();
  const p=requestMediaPage('token','alice_bob','shared','image',null,a.signal),q=requestMediaPage('token','alice_bob','shared','image',null,b.signal);
  assert.equal(h.requests.length,1);a.abort();await assert.rejects(p,{name:'AbortError'});assert.equal(h.requests[0].signal.aborted,false);
  gate.resolve({items:[row('1')],hasMore:false,nextCursor:null});assert.equal((await q).items.length,1);
  const next=deferred();h.setFetch(()=>next.promise);const c=new AbortController();
  const r=requestMediaPage('token','alice_bob','shared','image',null,c.signal);c.abort();await assert.rejects(r,{name:'AbortError'});assert.equal(h.requests[1].signal.aborted,true);
  next.resolve({items:[],hasMore:false,nextCursor:null});
});
test('old-server fallback is bounded room paging and does not mask access errors',async()=>{
  const h=createHarness(),{requestMediaPage}=h.load('src/features/chat/mediaHub/chatMediaRequest.ts');
  h.setFetch(url=>url.includes('/media?')?{response:{ok:false,status:404,json:async()=>{throw Error('HTML');}}}:{messages:[{id:'old',url:'https://example.invalid/old'}],hasMore:true,nextCursor:'old'});
  const p=await requestMediaPage('token','alice_bob','shared','image',null,new AbortController().signal);
  assert.equal(p.nextCursor,'room:old');assert.match(h.requests[1].url,/\?limit=40$/);
  await requestMediaPage('token','alice_bob','shared','image',p.nextCursor,new AbortController().signal);assert.equal(h.requests.length,3);assert.match(h.requests[2].url,/limit=40&before=old/);
  h.setFetch(()=>({response:{ok:false,status:404,json:async()=>({error:'user_not_found'})}}));
  await assert.rejects(requestMediaPage('token','alice_other','shared','image',null,new AbortController().signal),/user_not_found/);assert.equal(h.requests.length,4);
});
test('cache first, focus abort, late response, duplicate paging, socket filtering and deletion',async()=>{
  const h=createHarness(); let current;
  h.storage.set('RBZ_MEDIA_V1:alice:alice_bob:shared',JSON.stringify([row('cached')]));
  const gate=deferred();h.setFetch(()=>gate.promise);
  const {useChatMedia}=h.load('src/features/chat/mediaHub/useChatMedia.ts');
  await h.mount(()=>{current=useChatMedia('bob','shared','image');return null;});
  assert.equal(current.rows[0].id,'cached');assert.equal(h.requests.length,1);
  await h.focus(false);assert.equal(h.requests[0].signal.aborted,true);
  await act(async()=>gate.resolve({items:[row('late')],counts:{image:1,video:0},hasMore:false,nextCursor:null}));assert.equal(current.rows[0].id,'cached');
  h.setFetch(()=>({items:[row('head')],counts:{image:2,video:0},hasMore:true,nextCursor:'next'}));await h.focus(true);
  const older=deferred();h.setFetch(()=>older.promise);await act(async()=>{void current.loadMore();void current.loadMore();});assert.equal(h.requests.length,3);
  await h.emit('chat:message',{id:'unrelated',from:'carol',to:'alice',url:'https://example.invalid/no'});assert.equal(h.requests.length,3);
  await h.emit('message:delete',{id:'head',roomId:'alice_bob'});assert.ok(!current.rows.some(r=>r.id==='head'));assert.equal(h.requests[2].signal.aborted,true);
  await act(async()=>older.resolve({items:[row('head')],hasMore:false,nextCursor:null}));assert.ok(!current.rows.some(r=>r.id==='head'));
  await h.appState('background');const count=h.requests.length;await h.emit('chat:message',{id:'hidden',from:'bob',to:'alice',url:'https://example.invalid/yes'});assert.equal(h.requests.length,count);
  await h.unmount();assert.ok([...h.socketListeners.values()].every(set=>set.size===0));
});
test('account change never shows the previous account media',async()=>{
  const h=createHarness();let current;h.setFetch(()=>({items:[row('alice-only')],counts:{image:1,video:0},hasMore:false,nextCursor:null}));
  const {useChatMedia}=h.load('src/features/chat/mediaHub/useChatMedia.ts');await h.mount(()=>{current=useChatMedia('bob','shared','image');return null;});
  const gate=deferred();h.setFetch(()=>gate.promise);await h.session({token:'carol-token',user:{id:'carol'}});assert.equal(current.rows.length,0);
  await h.unmount();await act(async()=>gate.resolve({items:[],hasMore:false,nextCursor:null}));
});
