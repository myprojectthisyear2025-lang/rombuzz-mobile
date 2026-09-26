/* global __dirname */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
const rendererPath = require.resolve("../../node_modules/expo-module-scripts/node_modules/jest-expo/node_modules/react-test-renderer");
const React = require("node:module").createRequire(rendererPath)("react"), renderer = require(rendererPath), { act } = renderer;
global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, "../..");
function deferred() { let resolve, reject; const promise = new Promise((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject}; }
function createHarness() {
  let focused = true, now = 1000000, tree, seq = 0, fetcher = async () => ({});
  const requests=[], storage=new Map(), modules=new Map(), timers=new Map(), socketEvents=[], alerts=[], routes=[];
  const focusListeners=new Set(), appListeners=new Set(), sessionListeners=new Set(), nativeEvents=new Map(), socketListeners=new Map();
  let session={token:"token",user:{id:"alice",firstName:"Alice"}};
  const listen=(map,name,fn)=>{if(!map.has(name))map.set(name,new Set());map.get(name).add(fn);return {remove:()=>map.get(name).delete(fn)};};
  const socketGate={promise:null};
  const socket={connected:true,on:(n,f)=>listen(socketListeners,n,f),off:(n,f)=>socketListeners.get(n)?.delete(f),emit:(...args)=>socketEvents.push(args)};
  const AppState={currentState:"active",addEventListener:(_,f)=>{appListeners.add(f);return{remove:()=>appListeners.delete(f)};}};
  const navigation={isFocused:()=>focused,replace:p=>routes.push(p),push:p=>routes.push(p)};
  const schedule=(fn,delay=0)=>{const id=++seq;timers.set(id,{fn,due:now+delay});return id;};
  const mocks={
    react:React,
    "react-native":{AppState,Alert:{alert:(...a)=>alerts.push(a)},DeviceEventEmitter:{addListener:(n,f)=>listen(nativeEvents,n,f),emit:(n,p)=>nativeEvents.get(n)?.forEach(f=>f(p))}},
    "@react-navigation/native":{useNavigation:()=>navigation,useIsFocused:()=>React.useSyncExternalStore(f=>{focusListeners.add(f);return()=>focusListeners.delete(f);},()=>focused)},
    "expo-router":{useRouter:()=>navigation},
    "expo-secure-store":{getItemAsync:async key=>key==="RBZ_TOKEN"?session.token:storage.get(key)||null,setItemAsync:async(k,v)=>storage.set(k,v)},
    "@react-native-async-storage/async-storage":{getItem:async k=>storage.get(k)||null,setItem:async(k,v)=>storage.set(k,v),removeItem:async k=>storage.delete(k)},
    "@/src/config/api":{API_BASE:"https://example.invalid/api"},
    "@/src/features/auth/rbzSession":{getSessionSnapshot:()=>session,subscribeSession:f=>{sessionListeners.add(f);return()=>sessionListeners.delete(f);}},
    "@/src/performance/api/rbzApiClient":{rbzGetAuthToken:async()=>session.token,rbzGetCurrentUser:async()=>session.user},
    "@/src/performance/diagnostics/core":{perfState(){},perfTap(){}},
    "@/src/performance/diagnostics/cache":{observeCacheReader:(_,fn)=>fn},
    "@/src/lib/socket":{getSocket:async()=>{if(socketGate.promise)await socketGate.promise;return socket;}},
    "@/src/features/chat/thread/chatUnavailableCache":{clearUnavailableChatLocalState:async()=>{}},
  };
  function load(file) {
    const absolute=path.resolve(root,file); if(modules.has(absolute))return modules.get(absolute).exports;
    const module={exports:{}}; modules.set(absolute,module);
    const js=ts.transpileModule(fs.readFileSync(absolute,"utf8"),{fileName:absolute,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
    const localRequire=name=>{
      if(Object.hasOwn(mocks,name))return mocks[name];
      if(!name.startsWith(".")&&!name.startsWith("@/"))throw new Error("Unmocked: "+name);
      const base=name.startsWith("@/")?path.join(root,name.slice(2)):path.resolve(path.dirname(absolute),name);
      const target=[base,base+".ts",base+".tsx"].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
      if(!target)throw new Error("Unresolved: "+name);return load(target);
    };
    vm.runInThisContext("(function(require,module,exports,fetch,setTimeout,clearTimeout,requestAnimationFrame,cancelAnimationFrame){"+js+"\n})",{filename:absolute})(localRequire,module,module.exports,
      async(url,options={})=>{requests.push({url,...options});const data=await fetcher(url,options);return{ok:true,status:200,json:async()=>data,...data?.response};},schedule,id=>timers.delete(id),fn=>schedule(fn),id=>timers.delete(id));
    return module.exports;
  }
  return{load,mocks,requests,storage,socket,socketEvents,socketListeners,socketGate,alerts,routes,timers,
    setFetch:fn=>{fetcher=fn;},
    async mount(Component){await act(async()=>{tree=renderer.create(React.createElement(Component));});},
    async unmount(){await act(async()=>tree?.unmount());},
    async focus(value){await act(async()=>{focused=value;focusListeners.forEach(f=>f());});},
    async appState(value){await act(async()=>{AppState.currentState=value;appListeners.forEach(f=>f(value));});},
    async session(value){await act(async()=>{session=value;sessionListeners.forEach(f=>f());});},
    async emit(name,payload){await act(async()=>{socketListeners.get(name)?.forEach(f=>f(payload));});},
    async advance(ms){await act(async()=>{now+=ms;for(const[id,t]of[...timers])if(t.due<=now){timers.delete(id);t.fn();}});},
  };
}
module.exports={createHarness,React,act,deferred};
