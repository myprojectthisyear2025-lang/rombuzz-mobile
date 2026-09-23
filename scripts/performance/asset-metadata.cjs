/** Path: scripts/performance/asset-metadata.cjs
 * Purpose: Record byte sizes and PNG-header dimensions of current bundled Home assets, without changing images. */
const fs = require('node:fs');
const { save } = require('./local-harness.cjs');
const files = ['assets/images/logo.png', 'assets/images/rombuzz-home-discover.png', 'assets/images/rombuzz-home-microbuzz.png'];
const assets = files.map(file => {
  const data = fs.readFileSync(file);
  if (data.toString('ascii', 1, 4) !== 'PNG') throw new Error('Expected PNG asset');
  return { file, bytes: data.length, width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
});
save('assets.json', { capturedAt: new Date().toISOString(),
  purpose: 'Bundled file sizes and PNG-header dimensions; not native decode, CDN delivery or visible timing', assets });
console.log(JSON.stringify(assets));
