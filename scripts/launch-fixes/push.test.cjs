const test=require("node:test"),assert=require("node:assert/strict");
const {createHarness,act,React,renderer}=require("../auth-tests/harness.cjs");
const flush=()=>new Promise(r=>setImmediate(r));
async function until(check){for(let i=0;i<100&&!check();i++)await act(flush);assert.ok(check(),"push queue settled as expected");}
function setup(options){
 const h=createHarness(options),events=new Map(),requests=[];let rotation,respond,permission="granted",prefs={push:true,messages:true},token="ExpoPushToken[device-1]",asks=0,generated=0;
 h.mocks["react-native"].Platform={OS:"android"};
 h.mocks["react-native"].DeviceEventEmitter={addListener:(name,fn)=>{events.set(name,fn);return{remove:()=>events.delete(name)};},emit:(name,payload)=>events.get(name)?.(payload)};
 h.mocks["expo-constants"]={appOwnership:"standalone",expoConfig:{extra:{eas:{projectId:"synthetic-project"}}}};
 const native={AndroidImportance:{MAX:5},setNotificationChannelAsync:async()=>{},getPermissionsAsync:async()=>({status:permission,canAskAgain:true}),requestPermissionsAsync:async()=>{asks++;return{status:permission};},getExpoPushTokenAsync:async()=>{generated++;return{data:token};},addPushTokenListener:fn=>{rotation=fn;return{remove(){}};},dismissAllNotificationsAsync:async()=>{}};
 h.setFetch(async(url,options)=>{const row={url,method:options.method||"GET",auth:options.headers.Authorization,token:options.body?JSON.parse(options.body).token:null};requests.push(row);const custom=await respond?.(row);return custom||{ok:true,json:async()=>({settings:{notifications:prefs}})};});
 return {h,native,requests,events,get rotation(){return rotation;},setResponder:fn=>respond=fn,setPermission:v=>permission=v,setToken:v=>token=v,setPrefs:v=>prefs=v,get asks(){return asks;},get generated(){return generated;}};
}
async function mount(t,s){let tree;const push=s.h.load("src/features/notifications/usePushRegistration.ts");function Probe(){push.usePushRegistration(s.native,true);return null;}
 await act(async()=>{tree=renderer.create(React.createElement(Probe));});t.after(()=>act(async()=>tree.unmount()));return push;}

test("push registration reconciles server every foreground, rotates tokens, and removes A before assigning B",async t=>{
 const s=setup();await s.h.session.setSession("token-A",{id:"A"});const push=await mount(t,s);
 await until(()=>s.h.secure.has("RBZ_PUSH_OWNER_V2"));
 assert.equal(push.shouldPresentPush({recipientId:"A",type:"message"}),true);assert.equal(push.shouldPresentPush({recipientId:"B",type:"message"}),false);
 s.h.changeAppState("active");await until(()=>s.requests.filter(r=>r.method==="POST").length===2);
 s.setToken("ExpoPushToken[device-2]");s.rotation();await until(()=>s.requests.some(r=>r.method==="POST"&&r.token.endsWith("2]")));
 await until(()=>JSON.parse(s.h.secure.get("RBZ_PUSH_OWNER_V2")).pushToken.endsWith("2]"));
 await s.h.session.setSession("token-B",{id:"B"});await until(()=>JSON.parse(s.h.secure.get("RBZ_PUSH_OWNER_V2")||"null")?.userId==="B");
 const writes=s.requests.filter(r=>r.method!=="GET");const b=writes.findIndex(r=>r.method==="POST"&&r.auth==="Bearer token-B");
 assert.ok(writes.slice(0,b).some(r=>r.method==="DELETE"&&r.auth==="Bearer token-A"&&r.token.endsWith("2]")));
 assert.equal(push.shouldPresentPush({recipientId:"A",type:"message"}),false);
 push.setPushPreferences({push:true,messages:false},s.h.session.getSessionGeneration());assert.equal(push.shouldPresentPush({recipientId:"B",type:"message"}),false);
 await s.h.session.clearSession();assert.equal(push.shouldPresentPush({recipientId:"B",type:"match"}),false);await until(()=>!s.h.secure.has("RBZ_PUSH_OWNER_V2"));
});

test("OS denial and saved push-off never generate/register a token or automatically re-prompt denial",async t=>{
 const s=setup();s.setPermission("denied");await s.h.session.setSession("token-A",{id:"A"});const push=await mount(t,s);
 await until(()=>s.requests.some(r=>r.url.endsWith("/settings")));await act(flush);
 assert.equal(s.generated,0);assert.equal(s.asks,0);assert.equal(s.requests.filter(r=>r.method==="POST").length,0);
 s.setPermission("granted");s.setPrefs({push:false});s.h.changeAppState("active");await act(flush);await act(flush);
 assert.equal(s.generated,0);assert.equal(push.shouldPresentPush({recipientId:"A",type:"match"}),false);
});

test("late registration for A is removed after logout before B registration",async t=>{
 const s=setup();let release,started=false;const gate=new Promise(r=>release=r);let posted=false;
 s.h.setFetch(async(url,options)=>{const method=options.method||"GET";s.requests.push({url,method,auth:options.headers.Authorization});
 if(method==="POST"&&!posted){posted=true;started=true;await gate;}return{ok:true,json:async()=>({settings:{notifications:{push:true}}})};});
 await s.h.session.setSession("token-A",{id:"A"});await mount(t,s);await until(()=>started);
 await s.h.session.clearSession();await s.h.session.setSession("token-B",{id:"B"});release();
 await until(()=>JSON.parse(s.h.secure.get("RBZ_PUSH_OWNER_V2")||"null")?.userId==="B");
 const writes=s.requests.filter(r=>r.method!=="GET");assert.deepEqual(writes.map(r=>r.method+" "+r.auth),["POST Bearer token-A","DELETE Bearer token-A","POST Bearer token-B"]);
});

const oldOwner={authToken:"token-A",userId:"A",pushToken:"ExpoPushToken[old-device]"};
const rejected=(status,error)=>({ok:false,status,json:async()=>({error})});
test("terminal old-account DELETE rejections retire the unusable credential and allow B to register",async t=>{
 for(const [status,code] of [[401,"Account not found"],[403,"Account scheduled for deletion"],[403,"ACCOUNT_BANNED"],[403,"ACCOUNT_DEACTIVATED"]]){
  await t.test(code,async t=>{
   const s=setup();s.h.secure.set("RBZ_PUSH_OWNER_V2",JSON.stringify(oldOwner));
   s.setResponder(row=>row.method==="DELETE"?rejected(status,code):null);
   await s.h.session.setSession("token-B",{id:"B"});await mount(t,s);
   await until(()=>s.h.secure.has("RBZ_PUSH_TOKEN_CURRENT"));
   assert.equal(JSON.parse(s.h.secure.get("RBZ_PUSH_OWNER_V2")).userId,"B");
   assert.equal(s.h.secure.has("RBZ_PUSH_CLEANUP_V1"),false);
   assert.deepEqual(s.requests.filter(r=>r.method==="DELETE").map(r=>r.auth),["Bearer token-A"]);
   assert.equal(s.requests.filter(r=>r.method==="POST"&&r.auth==="Bearer token-B").length,1);
  });
 }
});

test("retryable old DELETE failures persist separately while B registers; cleanup survives restart and uses A's credential",async t=>{
 for(const kind of ["network","server","unknown-403","suspension"]){
  await t.test(kind,async t=>{
   const s=setup();s.h.secure.set("RBZ_PUSH_OWNER_V2",JSON.stringify(oldOwner));
   s.setResponder(row=>{if(row.method!=="DELETE")return null;if(kind==="network")throw Error("offline");return rejected(kind==="server"?503:403,kind==="suspension"?"ACCOUNT SUSPENDED":"unexpected");});
   await s.h.session.setSession("token-B",{id:"B"});await mount(t,s);
   await until(()=>s.h.secure.has("RBZ_PUSH_TOKEN_CURRENT"));
   assert.equal(JSON.parse(s.h.secure.get("RBZ_PUSH_OWNER_V2")).userId,"B");
   assert.deepEqual(JSON.parse(s.h.secure.get("RBZ_PUSH_CLEANUP_V1")),[oldOwner]);
   const restarted=setup({secure:s.h.secure,cache:s.h.cache});await restarted.h.session.initializeSession();await mount(t,restarted);
   await until(()=>restarted.requests.some(r=>r.method==="POST"));
   assert.equal(restarted.h.secure.has("RBZ_PUSH_CLEANUP_V1"),false);
   const deletes=restarted.requests.filter(r=>r.method==="DELETE");assert.equal(deletes.length,1);
   assert.equal(deletes[0].auth,"Bearer token-A");assert.equal(deletes[0].token,oldOwner.pushToken);
  });
 }
});

test("a successful exclusive claim retires failed cleanup for that token; a rejected POST never does",async t=>{
 const s=setup();s.h.secure.set("RBZ_PUSH_OWNER_V2",JSON.stringify(oldOwner));s.setToken(oldOwner.pushToken);
 let postOk=false;s.setResponder(row=>row.method==="DELETE"?rejected(503,"unavailable"):row.method==="POST"&&!postOk?rejected(403,"ACCOUNT_BANNED"):null);
 await s.h.session.setSession("token-B",{id:"B"});await mount(t,s);
 await until(()=>s.requests.some(r=>r.method==="POST"));await act(flush);
 assert.deepEqual(JSON.parse(s.h.secure.get("RBZ_PUSH_CLEANUP_V1")),[oldOwner]);assert.equal(s.h.secure.has("RBZ_PUSH_TOKEN_CURRENT"),false);
 postOk=true;s.h.changeAppState("active");await until(()=>s.h.secure.has("RBZ_PUSH_TOKEN_CURRENT"));
 assert.equal(s.h.secure.has("RBZ_PUSH_CLEANUP_V1"),false);
 assert.ok(s.requests.filter(r=>r.method==="DELETE").every(r=>r.auth==="Bearer token-A"));
});

test("a hung old-owner DELETE times out and preserves cleanup without preventing B registration",async t=>{
 t.mock.timers.enable({apis:["setTimeout"]});
 const s=setup();s.h.secure.set("RBZ_PUSH_OWNER_V2",JSON.stringify(oldOwner));let signal;
 s.h.setFetch(async(url,options)=>{
  if(options.method==="DELETE")return new Promise((_,reject)=>{signal=options.signal;signal.addEventListener("abort",()=>reject(Error("timed out")),{once:true});});
  s.requests.push({url,method:options.method||"GET",auth:options.headers.Authorization});
  return{ok:true,json:async()=>({settings:{notifications:{push:true}}})};
 });
 await s.h.session.setSession("token-B",{id:"B"});await mount(t,s);await until(()=>!!signal);
 assert.equal(s.requests.some(r=>r.method==="POST"),false);
 await act(async()=>t.mock.timers.tick(15000));await until(()=>s.h.secure.has("RBZ_PUSH_TOKEN_CURRENT"));
 assert.equal(signal.aborted,true);assert.deepEqual(JSON.parse(s.h.secure.get("RBZ_PUSH_CLEANUP_V1")),[oldOwner]);
 assert.equal(JSON.parse(s.h.secure.get("RBZ_PUSH_OWNER_V2")).userId,"B");
});
