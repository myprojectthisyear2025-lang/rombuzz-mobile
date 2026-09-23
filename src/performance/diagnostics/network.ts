/** Path: src/performance/diagnostics/network.ts
 * Purpose: Observe existing API fetch/body consumption without changing headers, retries, cache or authentication. */
import { API_BASE } from "@/src/config/api";
import { PERF_ENABLED, perfForeground, perfId, perfNow, perfRecord } from "./core";
const staticParts = new Set(("api discover users me profile full feed letsbuzz notifications matches likes status " +
  "social-stats social liked likedYou viewedYou buzzedYou chat rooms unread-summary mark-read mark-all-read " +
  "microbuzz nearby activate deactivate heartbeat session queue gifts catalog wallet summary transactions ledger " +
  "video-calls config start accept reject end token stream playback stories pinned viewed unlock react pin " +
  "buzz posts reels app-version latest android ios presence prefs safety push-token media settings account").split(" "));
export function safeRoute(raw: string) {
  try { return new URL(raw).pathname.split("/").map(p => staticParts.has(p) ? p : p ? ":id" : "").join("/"); }
  catch { return "unclassified"; }
}
export function parseServerTiming(raw: string | null) {
  const result: Record<string, number> = {};
  for (const item of (raw || "").split(",")) {
    const match = item.trim().match(/^([\w-]+);\s*dur=([\d.]+)/);
    if (match && ["total", "auth", "middleware", "mongo", "hydrate", "logic", "serialize"].includes(match[1])) {
      const value = Number(match[2]);
      if (Number.isFinite(value)) result[match[1]] = value;
    }
  }
  return result;
}
export function installNetworkDiagnostics() {
  if (!PERF_ENABLED || (globalThis as any).__RBZ_PERF_FETCH__) return;
  const original = globalThis.fetch;
  const origins = new Set([API_BASE, process.env.EXPO_PUBLIC_API_BASE_URL, process.env.EXPO_PUBLIC_API_URL].flatMap(u => {
    try { return u ? [new URL(u).origin] : []; } catch { return []; }
  }));
  const recent = new Map<string, { id: string; at: number; pending: boolean }>();
  const wrapped: typeof fetch = async (input, init) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? String(input) : input.url;
    let target: URL;
    try { target = new URL(raw); } catch { return original(input, init); }
    if (!origins.has(target.origin)) return original(input, init);
    const request = perfId(), start = perfNow(), scope = perfForeground();
    const method = (init?.method || (typeof input === "object" && "method" in input ? input.method : "GET")).toUpperCase();
    const route = safeRoute(raw), key = `${method}:${raw}`;
    const previous = recent.get(key);
    // Exact URLs are used only inside bounded memory; no URL/query/token is exported.
    const duplicate = method === "GET" && previous && start - previous.at < 2000 ? previous : null;
    const entry = { id: request, at: start, pending: true };
    if (recent.size >= 256) recent.delete(recent.keys().next().value!);
    recent.set(key, entry);
    const fields = { ...scope, request, method, route };
    perfRecord("http-start", { ...fields, duplicateOf: duplicate?.id, overlap: duplicate?.pending });
    try {
      const response = await original(input, init);
      const headersMs = perfNow() - start;
      const timings = parseServerTiming(response.headers.get("server-timing"));
      const candidate = response.headers.get("x-perf-request-id");
      const serverRequest = candidate && /^[a-f0-9-]{36}$/.test(candidate) ? candidate : undefined;
      const shared = { ...fields, serverRequest, status: response.status, backendMs: timings.total };
      perfRecord("http-headers", { ...shared, durationMs: headersMs,
        nonServerToHeadersMs: timings.total === undefined ? undefined : headersMs - timings.total,
        mongoMs: timings.mongo, hydrateMs: timings.hydrate, authMs: timings.auth, serializeMs: timings.serialize });
      for (const type of ["text", "json"] as const) {
        const consume = response[type].bind(response);
        response[type] = async () => {
          const bodyStart = perfNow();
          try {
            const value = await consume();
            perfRecord("http-body", { ...shared, consumer: type, durationMs: perfNow() - bodyStart,
              clientTotalMs: perfNow() - start,
              // JS string length, deliberately not mislabeled as wire bytes.
              characters: typeof value === "string" ? value.length : undefined });
            return value;
          } catch (error) { perfRecord("http-body-error", shared); throw error; }
        };
      }
      return response;
    } catch (error) { perfRecord("http-error", { ...fields, durationMs: perfNow() - start }); throw error; }
    finally { entry.pending = false; }
  };
  globalThis.fetch = wrapped;
  (globalThis as any).__RBZ_PERF_FETCH__ = true;
}
