/** Path: scripts/performance/actions.cjs
 * Purpose: Measure synthetic chat send/delivery and video-call setup APIs without external users or RTC sessions. */
const { performance } = require('node:perf_hooks');
const { Buffer } = require('node:buffer');
const { backendRequire, token } = require('./local-harness.cjs');
async function measureActions(server, records) {
  const { io } = backendRequire('socket.io-client');
  const peer = io(server.url, { transports: ['websocket'], reconnection: false, auth: { token: token('perf1') } });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Synthetic socket timeout')), 10000);
    peer.once('connect', () => { clearTimeout(timer); resolve(); });
    peer.once('connect_error', error => { clearTimeout(timer); reject(error); });
  });
  async function post(experience, route, body, user, iteration) {
    const begin = performance.now();
    const response = await fetch(server.url + '/api' + route, { method: 'POST',
      headers: { Authorization: `Bearer ${token(user)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const clientHeadersMs = performance.now() - begin;
    const raw = await response.text(), clientBodyMs = performance.now() - begin;
    const parseStart = performance.now(), value = JSON.parse(raw), parseMs = performance.now() - parseStart;
    records.push({ experience, iteration, status: response.status, clientHeadersMs, clientBodyMs, parseMs,
      bytes: Buffer.byteLength(raw), requestId: response.headers.get('x-perf-request-id'),
      serverTiming: response.headers.get('server-timing') });
    return value;
  }
  const deliveries = [];
  try {
    for (let i = 0; i < 8; i++) {
      const begin = performance.now();
      const delivered = new Promise((resolve, reject) => {
        const timer = setTimeout(() => { peer.off('chat:message', listener); reject(new Error('Message delivery timeout')); }, 10000);
        function listener(message) {
          if (message.id !== `perf-send-${i}`) return;
          clearTimeout(timer); peer.off('chat:message', listener);
          resolve(performance.now() - begin);
        }
        peer.on('chat:message', listener);
      });
      await post('chat-send', '/chat/rooms/perf0_perf1', { id: `perf-send-${i}`, text: 'Synthetic measurement' }, 'perf0', i);
      deliveries.push({ iteration: i, senderStartToPeerSocketMs: await delivered });
      // Background unread work is existing behavior; wait before the next independent sample.
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    for (let i = 0; i < 6; i++) {
      const call = await post('video-call-start', '/video-calls/start', { peerId: 'perf1' }, 'perf0', i);
      if (!call.call?.id) continue;
      const id = call.call.id;
      await post('video-call-token', `/video-calls/${id}/token`, {}, 'perf0', i);
      await post('video-call-accept', `/video-calls/${id}/accept`, {}, 'perf1', i);
      await post('video-call-end', `/video-calls/${id}/end`, { reason: 'ended' }, 'perf0', i);
      // Separate call cycles from the existing asynchronous post-call/unread work.
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally { peer.disconnect(); }
  return deliveries;
}
module.exports = { measureActions };
