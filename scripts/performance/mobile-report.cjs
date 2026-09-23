/** Path: scripts/performance/mobile-report.cjs
 * Purpose: Turn an exported bounded native capture into a readable observed timeline without inventing missing phases. */
const fs = require('node:fs');
const capturePath = process.argv[2];
if (!capturePath) throw new Error('Usage: node scripts/performance/mobile-report.cjs capture.json');
const raw = fs.readFileSync(capturePath, 'utf8').replace(/^\[PERF\]\s*/, '');
const capture = JSON.parse(raw);
if (!Array.isArray(capture.events)) throw new Error('Expected __RBZ_PERF__.snapshot() export');
const n = value => Number.isFinite(value) ? value.toFixed(2) : 'Unavailable';
const safe = value => String(value || '').replace(/[^\w .:/-]/g, '').slice(0, 100);
console.log('Observed native JS timeline. Frame opportunities are proxies, not proof of pixels. Dropped records: ' + (capture.dropped || 0));
console.log('| JS ms | Kind | Screen/foreground | Detail | Duration ms | Server request |');
console.log('|---:|---|---|---|---:|---|');
for (const e of capture.events) {
  console.log(`| ${n(e.atMs)} | ${safe(e.kind)} | ${safe(e.screen || e.foreground)} | ${safe(e.event || e.route || e.name || e.role)} | ${n(e.durationMs ?? e.actualDurationMs ?? e.elapsedMs)} | ${safe(e.serverRequest)} |`);
}
