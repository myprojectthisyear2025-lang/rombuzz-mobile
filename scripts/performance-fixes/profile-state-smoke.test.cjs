const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness,React,act,deferred}=require('./harness.cjs');
const {screenHarness}=require('./screenHarness.cjs');
const bundle=(id,extra={})=>({complete:true,profile:{user:{id,firstName:id,...extra},matched:true}});
function setup(screen=false){
  const h=screen?screenHarness():createHarness(),requests=[],cache=new Map();let state,setRoute;
  h.mocks['@/src/features/performance/viewProfile/rbzViewProfileCache']={
    readCachedViewProfile:async id=>cache.get(id),clearCachedViewProfile:async id=>cache.delete(id),
    mergeStableViewProfile:(_old,fresh)=>fresh,
    fetchFreshViewProfile:(id,signal)=>{const gate=deferred();requests.push({id,signal,...gate});return gate.promise;},
  };
  let Screen;
  if(screen){
    h.mocks['expo-av']={Audio:{}};
    for(const path of ['components/media/RBZImageViewer','components/media/RBZVideoViewer','components/profile/ViewProfileGallery','components/profile/ViewProfileMediaActions','components/reporting/RBZReportSheet',
      'features/viewProfile/hero/ViewProfileHero','features/viewProfile/info/ViewProfileDetailsInfo','features/viewProfile/info/ViewProfileIntroInfo','features/viewProfile/info/ViewProfileLifestyleInfo','features/viewProfile/info/ViewProfilePersonalityInfo']) {
      h.mocks['@/src/'+path]={__esModule:true,default:path.split('/').at(-1)};
    }
    h.mocks['expo-router'].useLocalSearchParams=()=>state;
    Screen=h.load('app/(tabs)/view-profile.tsx').default;
  }
  const {useViewProfileRead}=h.load('src/features/viewProfile/useViewProfileRead.ts');
  const Reader=({route})=>{state=useViewProfileRead(route.id,route.profilePreviewMode==='after');return null;};
  const Component=()=>{const[route,change]=React.useState({id:'alice',profilePreviewMode:'after'});setRoute=change;
    if(screen){state=route;return React.createElement(Screen);}
    return React.createElement(Reader,{route});};
  return {h,Component,requests,cache,get state(){return state;},change:(id,mode='after')=>act(async()=>setRoute({id,profilePreviewMode:mode}))};
}
test('actual Preview screen: loaded user → new route → neutral loading → profile, without unavailable or previous user',async()=>{
  const s=setup(true);await s.h.mount(s.Component);
  assert.match(JSON.stringify(s.h.tree.toJSON()),/Loading profile/);
  await act(async()=>s.requests[0].resolve(bundle('alice')));
  assert.equal(s.h.tree.root.findByType('ViewProfileHero').props.fullName,'alice');
  await s.change('bob');
  const during=JSON.stringify(s.h.tree.toJSON());assert.match(during,/Loading profile/);assert.doesNotMatch(during,/Profile unavailable|ViewProfileHero/);
  await act(async()=>s.requests[1].resolve(bundle('bob')));
  assert.equal(s.h.tree.root.findByType('ViewProfileHero').props.fullName,'bob');await s.h.unmount();
});
test('usable cached profile remains ready through refresh and network failure; genuine unavailable revokes cache',async()=>{
  const s=setup();s.cache.set('alice',bundle('alice',{city:'cached'}));await s.h.mount(s.Component);
  assert.equal(s.state.status,'ready');assert.equal(s.state.profile.user.city,'cached');
  await act(async()=>s.requests[0].reject(Error('Offline')));assert.equal(s.state.status,'ready');
  let pending;await act(async()=>{pending=s.state.refresh();});
  await act(async()=>s.requests[1].reject(Object.assign(Error('Not found'),{status:404})));
  await pending;assert.equal(s.state.status,'unavailable');assert.equal(s.state.profile,null);assert.equal(s.cache.has('alice'),false);await s.h.unmount();
});
test('network failures without cache are errors, not unavailable, and retry can recover',async()=>{
  const s=setup();await s.h.mount(s.Component);await act(async()=>s.requests[0].reject(Error('Offline')));
  assert.equal(s.state.status,'error');let pending;await act(async()=>{pending=s.state.refresh();});assert.equal(s.state.status,'loading');
  await act(async()=>s.requests[1].resolve(bundle('alice')));await pending;assert.equal(s.state.status,'ready');await s.h.unmount();
});
test('rapid preview/user/account switches and blur abort requests; late failures cannot navigate or overwrite',async()=>{
  const s=setup();await s.h.mount(s.Component);await s.change('bob','before');assert.equal(s.requests[0].signal.aborted,true);
  await s.change('carol');assert.equal(s.requests[1].signal.aborted,true);
  await act(async()=>{s.requests[0].reject(Object.assign(Error('Not found'),{status:404}));s.requests[1].resolve(bundle('bob'));});assert.equal(s.state.status,'loading');
  await act(async()=>s.requests[2].resolve(bundle('carol')));assert.equal(s.state.profile.user.id,'carol');
  await s.h.session({token:'new',user:{id:'other'}});assert.equal(s.state.profile,null);assert.equal(s.state.status,'loading');
  await s.h.focus(false);assert.equal(s.requests[3].signal.aborted,true);await act(async()=>s.requests[3].resolve(bundle('carol')));
  assert.equal(s.state.profile,null);assert.equal(s.h.routes.length,0);assert.equal(s.h.alerts.length,0);await s.h.unmount();
});
test('fresh completion outruns slow disk hydration without cache replacing it',async()=>{
  const s=setup(),disk=deferred();s.h.mocks['@/src/features/performance/viewProfile/rbzViewProfileCache'].readCachedViewProfile=()=>disk.promise;
  await s.h.mount(s.Component);await act(async()=>s.requests[0].resolve(bundle('alice',{city:'fresh'})));
  await act(async()=>disk.resolve(bundle('alice',{city:'stale'})));assert.equal(s.state.profile.user.city,'fresh');await s.h.unmount();
});
test('View Profile cache is account scoped and an aborted response cannot write it',async()=>{
  const h=createHarness(),data=new Map();
  h.mocks['@/src/performance/cache/rbzCache']={rbzCacheKey:(...p)=>p.join(':'),rbzCacheGet:async key=>({hit:data.has(key),value:data.get(key)}),rbzCacheSet:async(k,v)=>data.set(k,v),rbzCacheRemove:async k=>data.delete(k)};
  const gate=deferred();h.mocks['@/src/performance/api/rbzApiClient'].rbzApiJson=()=>gate.promise;
  const api=h.load('src/features/performance/viewProfile/rbzViewProfileCache.ts');await api.writeCachedViewProfileFromUser({id:'peer',firstName:'Peer'});
  assert.ok(await api.readCachedViewProfile('peer'));await h.session({token:'bob',user:{id:'bob'}});assert.equal(await api.readCachedViewProfile('peer'),null);
  const abort=new AbortController(),pending=api.fetchFreshViewProfile('peer',abort.signal);abort.abort();gate.resolve(bundle('peer').profile);await pending;
  assert.equal(await api.readCachedViewProfile('peer'),null);
});
test('incomplete warmed profile stays neutral until gallery is known, including a confirmed zero',async()=>{
  const s=setup(true);s.cache.set('alice',{...bundle('alice',{media:[]}),complete:false});await s.h.mount(s.Component);
  assert.match(JSON.stringify(s.h.tree.toJSON()),/Loading profile/);assert.equal(s.h.tree.root.findAllByType('ViewProfileGallery').length,0);
  await act(async()=>s.requests[0].resolve(bundle('alice',{media:[{id:'photo',url:'photo.jpg',type:'image'}]})));
  assert.equal(s.h.tree.root.findByType('ViewProfileGallery').props.photos.length,1);
  await s.change('bob');assert.equal(s.h.tree.root.findAllByType('ViewProfileGallery').length,0);
  await act(async()=>s.requests[1].resolve(bundle('bob',{media:[]})));
  assert.equal(s.h.tree.root.findByType('ViewProfileGallery').props.photos.length,0);await s.h.unmount();
});
test('match warming neither fabricates empty media nor overwrites a full profile or its media URLs',async()=>{
  const h=createHarness(),data=new Map();
  h.mocks['@/src/performance/cache/rbzCache']={rbzCacheKey:(...p)=>p.join(':'),rbzCacheGet:async key=>({hit:data.has(key),value:data.get(key)}),rbzCacheSet:async(k,v)=>data.set(k,v)};
  const api=h.load('src/features/performance/viewProfile/rbzViewProfileCache.ts');
  const partial=await api.writeCachedViewProfileFromUser({id:'peer',firstName:'Peer'});assert.equal(partial.complete,false);assert.equal(partial.profile.user.media,undefined);
  h.mocks['@/src/performance/api/rbzApiClient'].rbzApiJson=async()=>bundle('peer',{media:[{id:'photo',url:'https://media.invalid/photo.jpg'}],bio:'Full bio'}).profile;
  const full=await api.fetchFreshViewProfile('peer');assert.equal(full.complete,true);
  const warmed=await api.writeCachedViewProfileFromUser({id:'peer',media:[],bio:''});assert.deepEqual(warmed,full);
});
