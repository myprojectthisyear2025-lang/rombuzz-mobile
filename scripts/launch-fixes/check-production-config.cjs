// Resolve only public Expo config and print a whitelist; never print credentials.
const {spawnSync}=require("node:child_process");
const assert=require("node:assert/strict");
const result=spawnSync(process.execPath,["node_modules/expo/bin/cli","config","--type","public","--json"],{encoding:"utf8",windowsHide:true,env:{...process.env,APP_VARIANT:"production"}});
if(result.error)throw result.error;
assert.equal(result.status,0,"Expo public config resolution failed");
const config=JSON.parse(result.stdout);
const blocked=config.android.blockedPermissions||[];
const required=["READ_MEDIA_IMAGES","READ_MEDIA_VIDEO","FOREGROUND_SERVICE_MEDIA_PROJECTION"];
assert.equal(config.android.package,"com.rombuzz.app");
for(const permission of required)assert.ok(blocked.some(value=>value.replace("android.permission.","")===permission),permission+" must stay blocked");
console.log(JSON.stringify({package:config.android.package,blockedPermissions:blocked,googleServicesFileConfigured:!!config.android.googleServicesFile,expoProjectIdConfigured:!!config.extra?.eas?.projectId,notificationsPluginConfigured:config.plugins.some(p=>(Array.isArray(p)?p[0]:p)==="expo-notifications"),artifactManifestVerified:false},null,2));
