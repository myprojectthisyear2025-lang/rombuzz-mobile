/** Path: src/performance/diagnostics/socket.ts
 * Purpose: Passive connection/reconnect timing and listener counts; no packet values or changed socket behavior. */
import type { Socket } from "socket.io-client";
import { PERF_ENABLED, perfNow, perfRecord } from "./core";
const observed = new WeakSet<Socket>();
const live = new Set<Socket>();
const names = ["chat:message", "direct:message", "chat:seen", "typing", "presence:online", "presence:offline", "notification", "chat:unread:update"];
export function observeSocket(socket: Socket) {
  if (!PERF_ENABLED || observed.has(socket)) return;
  observed.add(socket);
  let start = perfNow();
  const connected = () => {
    live.add(socket);
    perfRecord("socket-connect", { durationMs: perfNow() - start, liveConnections: live.size });
    for (const event of names) perfRecord("socket-listeners", { event, count: socket.listeners(event).length });
  };
  socket.on("connect", connected);
  socket.on("disconnect", () => { live.delete(socket); start = perfNow(); perfRecord("socket-disconnect"); });
  socket.on("connect_error", () => perfRecord("socket-connect-error", { durationMs: perfNow() - start }));
  socket.io.on("reconnect_attempt", () => { start = perfNow(); perfRecord("socket-reconnect-attempt"); });
  socket.io.on("reconnect", () => perfRecord("socket-reconnect", { durationMs: perfNow() - start }));
  if (socket.connected) connected();
}
