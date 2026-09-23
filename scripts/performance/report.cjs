/** Path: scripts/performance/report.cjs
 * Purpose: Generate statistics and paired waterfalls from captured measurements, preserving clock and overlap boundaries. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('docs/performance');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'evidence/local-baseline.json'), 'utf8'));
const traces = new Map(baseline.traces.map(t => [t.requestId, t]));
const fmt = value => Number.isFinite(value) ? value.toFixed(2) : 'Unavailable';
const quantile = (values, p = .5) => {
  const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
  return sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] : NaN;
};
function union(spans, category) {
  let result = 0, end = 0;
  for (const s of spans.filter(s => s.category === category).sort((a,b)=>a.startMs-b.startMs)) {
    result += Math.max(0, s.startMs+s.durationMs-Math.max(end,s.startMs)); end = Math.max(end,s.startMs+s.durationMs);
  }
  return result;
}
function partition(trace) {
  const points = [...new Set([0, trace.headersMs, ...trace.spans.flatMap(s => [s.startMs, Math.min(trace.headersMs,s.startMs+s.durationMs)])])]
    .filter(x=>x>=0&&x<=trace.headersMs).sort((a,b)=>a-b);
  const order = ['serialize','hydrate','mongo-command','mongo','auth','middleware','logic','handler'];
  const totals = {};
  for(let i=1;i<points.length;i++) {
    const mid=(points[i]+points[i-1])/2;
    const category=order.find(c=>trace.spans.some(s=>s.category===c&&s.startMs<=mid&&s.startMs+s.durationMs>=mid)) || 'dispatch-response-gaps';
    totals[category]=(totals[category]||0)+points[i]-points[i-1];
  }
  return totals;
}
const names = [...new Set(baseline.records.map(r=>r.experience))];
const summary = [], selected = [];
let table = `<!-- Path: docs/performance/baseline.md; Purpose: Generated real local synthetic API baseline. -->\n# Measured local baseline\n\nCaptured ${baseline.capturedAt}. ${baseline.environment}.\n\n401 users, 20 matches, 120 posts, 500 initial embedded messages, 80 notifications. Media URLs are synthetic references: no media was downloaded. API timings are **Node loopback HTTP**, not native screen/tap timings. Read flows: 15 warm serial samples; chat send: 7; call actions: 5. First access is excluded from warm statistics, retained below.\n\n| Experience/API | n | HTTP body p50 | p95 | Backend p50 | Mongoose union p50 | Driver union p50 | Hydration p50 | Queries | Bytes |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
for (const name of names) {
  const samples=baseline.records.filter(r=>r.experience===name&&r.iteration>0&&r.status===200);
  const measurements=samples.map(r=>({...r, trace:traces.get(r.requestId)}));
  const median=key=>quantile(measurements.map(key));
  const row={experience:name,n:samples.length,clientMs:median(r=>r.clientBodyMs),p95Ms:quantile(samples.map(r=>r.clientBodyMs),.95),
    backendMs:median(r=>r.trace?.headersMs),mongoMs:median(r=>r.trace?.mongoUnionMs),
    driverMs:median(r=>r.trace?union(r.trace.spans,'mongo-command'):NaN),
    hydrateMs:median(r=>r.trace?union(r.trace.spans,'hydrate'):NaN),queries:median(r=>r.trace?.queryCount),bytes:median(r=>r.bytes)};
  summary.push(row);
  table+=`| ${name} | ${row.n} | ${fmt(row.clientMs)} | ${fmt(row.p95Ms)} | ${fmt(row.backendMs)} | ${fmt(row.mongoMs)} | ${fmt(row.driverMs)} | ${fmt(row.hydrateMs)} | ${row.queries} | ${row.bytes} |\n`;
  if (samples.length) selected.push([...measurements].sort((a,b)=>a.clientBodyMs-b.clientBodyMs)[Math.floor(samples.length/2)]);
}
table+='\nMilliseconds throughout. Mongoose includes pool wait, driver/network, BSON/materialization, hydration and query hooks. Driver time includes wire/server time; it is not pure database CPU. Hydration and driver spans are **inside** Mongoose spans. Auth also includes user queries. These columns must not be added. Independent column medians do not describe one request.\n\n## First access and parse cost\n\n| Flow | First HTTP body ms | Warm JSON parse p50 ms | Statuses |\n|---|---:|---:|---|\n';
for(const name of names) {
  const all=baseline.records.filter(r=>r.experience===name);
  table+=`| ${name} | ${fmt(all[0]?.clientBodyMs)} | ${fmt(quantile(all.filter(r=>r.iteration>0).map(r=>r.parseMs)))} | ${[...new Set(all.map(r=>r.status))].join(',')} |\n`;
}
table+='\nClient intervals include synthetic token/request-option preparation and JavaScript scheduling around fetch; socket connection timing also includes client setup. They are not pure wire transit.\n\nFirst access is route/JIT/pool warming in an already running local process, **not** a Render cold start.\n\n## Existing-index execution statistics\n\n| Synthetic query | Returned | Docs examined | Keys examined | DB execution ms | Index / stages |\n|---|---:|---:|---:|---:|---|\n';
for(const p of baseline.plans) table+=`| ${p.name} | ${p.returned} | ${p.docsExamined} | ${p.keysExamined} | ${p.executionMs} | ${p.indexes.join(', ')} / ${p.stages.join(' → ')} |\n`;
table+='\nExplain is bounded to 1,000 ms, run only on this disposable fixture after baseline requests. These are the identified query shapes; the post owner/sort example is a representative query, not the active gallery feed. No Atlas/production explain was run. A zero executionMs is Mongo’s integer-millisecond result, not evidence of zero work.\n\n## Diagnostic overhead\n\n60 warm samples per mode/route, interleaved order, identical fixture, two local backend processes. Enabled mode samples 100% and writes detailed records.\n\n| Route | Off p50 | On p50 | Difference | Off p95 | On p95 |\n|---|---:|---:|---:|---:|---:|\n';
for(const route of ['/','/api/profile/full']) {
  const off=baseline.overhead.filter(r=>r.route===route&&!r.enabled).map(r=>r.durationMs);
  const on=baseline.overhead.filter(r=>r.route===route&&r.enabled).map(r=>r.durationMs);
  table+=`| ${route} | ${fmt(quantile(off))} | ${fmt(quantile(on))} | ${fmt(quantile(on)-quantile(off))} | ${fmt(quantile(off,.95))} | ${fmt(quantile(on,.95))} |\n`;
}
table+=`\nThese are noisy local A/B observations, not a production overhead guarantee. Disabled mode installs no Mongoose/Express wrappers and emits no timing headers or diagnostic logs. Mobile device overhead remains unavailable.\n\nSocket connect (10 local authenticated WebSocket connections): p50 **${fmt(quantile(baseline.sockets.map(s=>s.durationMs)))} ms**, p95 **${fmt(quantile(baseline.sockets.map(s=>s.durationMs),.95))} ms**. Sender HTTP initiation → peer Socket.IO message callback (8 sends): p50 **${fmt(quantile(baseline.deliveries.map(s=>s.senderStartToPeerSocketMs)))} ms**. Neither measures native chat bubble visibility.\n`;
fs.writeFileSync(path.join(root,'baseline.md'),table);
let operations='<!-- Path: docs/performance/operations.md; Purpose: Generated middleware and database-operation rankings from measured requests. -->\n# Operation detail\n\nWarm successful requests only. Inclusive spans overlap; do not sum these medians. Middleware and auth use interval union per request. Logical database rows use the longest named operation per request, avoiding a short duplicate lookup hiding the expensive one.\n\n| Flow | Auth inclusive p50 ms | Other middleware p50 ms | Serialization p50 ms | Header to finish p50 ms |\n|---|---:|---:|---:|---:|\n';
const operationRows=[];
for(const name of names) {
  const ts=baseline.records.filter(r=>r.experience===name&&r.iteration>0&&r.status===200).map(r=>traces.get(r.requestId)).filter(Boolean);
  operations+=`| ${name} | ${fmt(quantile(ts.map(t=>union(t.spans,'auth'))))} | ${fmt(quantile(ts.map(t=>union(t.spans,'middleware'))))} | ${fmt(quantile(ts.map(t=>union(t.spans,'serialize'))))} | ${fmt(quantile(ts.map(t=>t.finishMs-t.headersMs)))} |\n`;
  const labels=[...new Set(ts.flatMap(t=>t.spans.filter(s=>s.category==='mongo').map(s=>s.name)))];
  for(const label of labels) {
    const lists=ts.map(t=>t.spans.filter(s=>s.category==='mongo'&&s.name===label));
    operationRows.push({flow:name,name:label,maxMs:quantile(lists.map(s=>Math.max(...s.map(x=>x.durationMs)))),count:quantile(lists.map(s=>s.length))});
  }
}
operations+='\nBody parsing, CORS, installed validation/rate limiting and error/logging middleware are covered when they execute. No standalone rate-limiter was exercised by these successful flows; absent work is not a measured zero. Auth includes its user lookup. Header-to-finish includes response flushing and diagnostic preparation; finish does not mean bytes have arrived at the device.\n\n## Longest logical Mongo operations\n\n| Flow | Logical operation | Calls per request p50 | Longest call per request p50 ms |\n|---|---|---:|---:|\n';
for(const r of operationRows.sort((a,b)=>b.maxMs-a.maxMs).slice(0,20)) operations+=`| ${r.flow} | ${r.name} | ${r.count} | ${fmt(r.maxMs)} |\n`;
operations+='\nLogical query duration is not Mongo server execution time. Use the driver/hydration spans and bounded executionStats in baseline.md to distinguish these layers. Detailed driver commands, query offsets, process CPU/ELU context and overlap remain in evidence/local-baseline.json. No query predicates, raw command documents or response bodies are captured.\n';
fs.writeFileSync(path.join(root,'operations.md'),operations);
let waterfall='<!-- Path: docs/performance/waterfalls.md; Purpose: Paired real-request timelines and nonoverlapping accounting. -->\n# Paired request waterfalls\n\nEach flow below uses one warm request at the middle rank of client duration. Every interval is from that request. Server offsets use its own monotonic clock. The client-to-server offset is unknown; no false wall-clock alignment is attempted. Tap, navigation, React/native content display and media display are unavailable without a device capture.\n\n';
const visual=[];
for(const r of selected.filter(r=>['discover','notifications','matches-inbox','chat-open','shared-purchased-media','unread','letsbuzz-posts-reels','video-call-start'].includes(r.experience))) {
  const t=r.trace;if(!t)continue;
  const groups=partition(t);
  waterfall+=`## ${r.experience}\n\nRequest ID: \`${r.requestId}\`. HTTP to headers: **${fmt(r.clientHeadersMs)} ms**; through body: **${fmt(r.clientBodyMs)} ms**; subsequent JSON parse: **${fmt(r.parseMs)} ms**.\n\n| Nonoverlapping backend interval category | ms |\n|---|---:|\n`;
  for(const [category,value] of Object.entries(groups)) waterfall+=`| ${category} | ${fmt(value)} |\n`;
  waterfall+=`| **Backend to headers** | **${fmt(t.headersMs)}** |\n| Client body total minus backend | ${fmt(r.clientBodyMs-t.headersMs)} |\n\n`;
  const longest=[...t.spans].filter(s=>s.category==='mongo'||s.category==='hydrate'||s.category==='logic').sort((a,b)=>b.durationMs-a.durationMs).slice(0,5);
  waterfall+='Longest inclusive spans (do not add to the table): '+longest.map(s=>`${s.name}: ${fmt(s.durationMs)} ms at server +${fmt(s.startMs)}`).join('; ')+'.\n\n';
  visual.push({experience:r.experience,backendMs:t.headersMs,clientMs:r.clientBodyMs,spans:t.spans});
}
waterfall+='`mongo` in the nonoverlapping table means remaining Mongoose time after driver and hydration intervals. `auth` excludes its nested Mongo spans. `handler` is elapsed route work without a finer label; it is not proven CPU time. `dispatch-response-gaps` includes uncovered Express dispatch, response preparation and instrumentation. Process-wide event-loop diagnostics in raw traces are contextual and cannot be charged exclusively to this request. Approximate non-server time includes local scheduling/transport/body transfer; it is not a geographic RTT measurement.\n';
fs.writeFileSync(path.join(root,'waterfalls.md'),waterfall);
fs.writeFileSync(path.join(root,'evidence/summary.json'),JSON.stringify({path:'docs/performance/evidence/summary.json',purpose:'Generated warm local measurements',summary},null,2));
const html=`<!doctype html><!-- Path: docs/performance/waterfall.html; Purpose: Interactive measured backend intervals with honest clock boundaries. -->
<html lang="en"><meta charset="utf-8"><title>RomBuzz measured waterfall</title>
<style>body{font:15px system-ui;margin:32px;background:#fafafa;color:#172033}select{padding:8px}svg{width:100%;background:white}text{font:12px system-ui}p{max-width:980px}</style>
<h1>RomBuzz · local synthetic waterfall</h1><p>Backend time starts at Express ingress. Bars overlap: auth contains database work; Mongoose contains driver and hydration work. Client and server clocks are not aligned. Device tap-to-display and CDN timings are unavailable.</p><select id="flow"></select><p id="total"></p><svg id="chart" role="img" aria-label="Backend timing waterfall"></svg>
<script>const data=${JSON.stringify(visual).replaceAll('<','\\u003c')};const select=document.getElementById('flow');data.forEach((d,i)=>{const o=document.createElement('option');o.value=i;o.textContent=d.experience;select.append(o)});function draw(){const d=data[select.value||0],svg=document.getElementById('chart');svg.replaceChildren();svg.setAttribute('viewBox','0 0 1100 '+(d.spans.length*23+35));document.getElementById('total').textContent='Backend: '+d.backendMs.toFixed(2)+' ms · Node loopback through body: '+d.clientMs.toFixed(2)+' ms';const colors={auth:'#b1123c',mongo:'#315acb','mongo-command':'#5e88ea',hydrate:'#b97f13',logic:'#137c62',serialize:'#923ed5',middleware:'#78828d',handler:'#b8bfc9'};function add(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;svg.append(n);return n}d.spans.slice().sort((a,b)=>a.startMs-b.startMs).forEach((s,i)=>{const y=i*23+24;add('text',{x:5,y:y+12},s.name);const rect=add('rect',{x:260+s.startMs/d.backendMs*710,y,width:Math.max(1,s.durationMs/d.backendMs*710),height:15,fill:colors[s.category]||'#555'});const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=s.category+' / '+s.durationMs.toFixed(3)+' ms at +'+s.startMs.toFixed(3);rect.append(title);add('text',{x:990,y:y+12},s.durationMs.toFixed(2)+' ms')});add('text',{x:260,y:14},'0 ms');add('text',{x:915,y:14},d.backendMs.toFixed(2)+' ms')}select.onchange=draw;draw();</script></html>`;
fs.writeFileSync(path.join(root,'waterfall.html'),html);
console.log('Generated baseline, paired waterfalls and interactive HTML from actual records.');
