const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness,deferred}=require('./harness.cjs');
test('Discover request owner joins identical reads, cancels replaced filters, and drops late/hidden results',async()=>{
  const h=createHarness(),{createDiscoverRequestOwner}=h.load('src/features/discover/discoverRequestOwner.ts');
  let active=true;const owner=createDiscoverRequestOwner(()=>active),gate=deferred(),applied=[];let reads=0,signal;
  const first=owner.run('strict',async(s,valid)=>{reads++;signal=s;await gate.promise;if(valid())applied.push('strict');});
  const duplicate=owner.run('strict',async()=>{reads++;});assert.equal(first,duplicate);await Promise.resolve();assert.equal(reads,1);
  await owner.run('expanded',async(_s,valid)=>{if(valid())applied.push('expanded');});assert.equal(signal.aborted,true);
  gate.resolve();await first;assert.deepEqual(applied,['expanded']);
  active=false;await owner.run('hidden',async()=>{reads++;});assert.equal(reads,1);
});
test('Discover GPS deadline timers clean up on completion and cancellation',async()=>{
  const h=createHarness(),{discoverTimeout}=h.load('src/features/discover/discoverRequestOwner.ts');
  assert.equal(await discoverTimeout(Promise.resolve(5),3500,null),5);assert.equal(h.timers.size,0);
  const gate=deferred(),abort=new AbortController();const pending=discoverTimeout(gate.promise,3500,null,abort.signal);assert.equal(h.timers.size,1);abort.abort();assert.equal(await pending,null);assert.equal(h.timers.size,0);gate.resolve(6);
});
test('Discover caches isolate accounts and filters, persist exhaustion, and prefetch each URI once',async()=>{
  const h=createHarness(),prefetch=[];h.mocks['react-native'].Image={prefetch:async uri=>{prefetch.push(uri);return true;}};
  const cache=h.load('src/features/performance/useCachedDiscoverDeck.ts');
  const input={filters:{gender:'female',ageMin:21},lookingFor:'long-term',phase:'strict',expanded:false};
  const users=[{id:'u',avatar:'https://example.invalid/a.jpg',media:[{url:'https://example.invalid/b.jpg',privacy:'public'}]}];
  await cache.saveDiscoverDeckCache(input,users);assert.equal((await cache.hydrateDiscoverDeckCache(input)).users.length,1);
  assert.equal((await cache.hydrateDiscoverDeckCache({...input,filters:{gender:'male'}})).hit,false);
  await cache.saveDiscoverDeckCache(input,[]);const empty=await cache.hydrateDiscoverDeckCache(input);assert.equal(empty.hit,true);assert.equal(empty.users.length,0);
  await h.session({token:'bob',user:{id:'bob'}});assert.equal((await cache.hydrateLatestDiscoverDeckCache()).hit,false);
  cache.preloadDiscoverDeckImages(users);cache.preloadDiscoverDeckImages(users);assert.equal(prefetch.length,2);
});
