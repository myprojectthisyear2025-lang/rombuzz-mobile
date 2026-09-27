const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness.cjs');

function client() {
  const h = createHarness();
  h.setFetch(async () => ({ response: { text: async () => '{"ok":true}' } }));
  return { h, api: h.load('src/api/gifts.ts') };
}

test('current gift client constructs the production routes and bearer auth', async () => {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || 'https://rombuzz-api-ulyk.onrender.com';
  const { h, api } = client();
  await api.getGiftCatalog();
  await api.getBuzzCoinWallet();
  await api.getBuzzCoinLedger(12);
  await api.getGiftSummary({ receiverId: 'peer', targetId: 'a/b', includeTransactions: true });
  await api.getGiftTransactions({ role: 'sent', limit: 3 });
  assert.deepEqual(h.requests.map(r => r.url), [
    base + '/api/gifts/catalog', base + '/api/gifts/wallet', base + '/api/gifts/ledger?limit=12',
    base + '/api/gifts/summary?receiverId=peer&targetId=a%2Fb&includeTransactions=true',
    base + '/api/gifts/transactions?role=sent&limit=3',
  ]);
  assert.ok(h.requests.every(r => r.headers.Authorization === 'Bearer token'));
});

test('missing gift credentials fail before any network request', async () => {
  const { h, api } = client();
  await h.session({ token: '', user: null });
  await assert.rejects(api.getGiftCatalog(), /logged in/);
  assert.equal(h.requests.length, 0);
});

test('HTTP errors retain status/payload; native transport errors are distinct and never retried', async () => {
  const { h, api } = client();
  h.setFetch(async () => ({ response: { ok: false, status: 401, text: async () => '{"error":"unauthorized"}' } }));
  await assert.rejects(api.getBuzzCoinWallet(), e => e.status === 401 && e.code === 'unauthorized');
  const transport = new TypeError('Network request failed');
  h.setFetch(async () => { throw transport; });
  await assert.rejects(api.getGiftCatalog(), e => e === transport && e.status === undefined);
  assert.equal(h.requests.length, 2);
});

test('gift send keeps server price authority and does not retry an uncertain write', async () => {
  const { h, api } = client();
  h.setFetch(async () => { throw new TypeError('Network request failed'); });
  await assert.rejects(api.sendGift({ receiverId: 'peer', giftId: 'rose', placement: 'chat', targetType: 'chat', targetId: 'room', priceBC: 1 }), /Network request failed/);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].method, 'POST');
  const body = JSON.parse(h.requests[0].body);
  assert.equal(body.giftId, 'rose');
  assert.equal(Object.hasOwn(body, 'priceBC'), false);
});
