/** Path: src/performance/diagnostics/cache.ts
 * Purpose: Time unchanged cache readers; redact identity-bearing keys and distinguish cache age from read latency. */
import { PERF_ENABLED, perfSpan } from "./core";
const labels = ["RBZ_PERF_CHAT_INBOX", "RBZ_PERF_NOTIFICATIONS", "RBZ_PERF_PROFILE_FULL", "RBZ_PERF_SOCIAL", "RBZ_PERF_VIEW_PROFILE"];
export function perfCacheRead(key: string) {
  const name = labels.find(label => key.startsWith(label)) || "cache.other";
  const stop = perfSpan("cache.read", { cache: name });
  return <T extends { hit: boolean; savedAt: number }>(result: T, tier: string) => {
    if (PERF_ENABLED) stop({ tier, hit: result.hit,
      ageMs: result.hit && result.savedAt > 0 ? Math.max(0, Date.now() - result.savedAt) : undefined });
    return result;
  };
}
export async function observeCache<T>(name: string, read: () => Promise<T>): Promise<T> {
  if (!PERF_ENABLED) return read();
  const stop = perfSpan("cache.read", { cache: name });
  try {
    const result = await read();
    const envelope = result as any;
    const hit = envelope?.hit ?? !!result;
    stop({ hit, ageMs: hit && envelope?.savedAt > 0 ? Math.max(0, Date.now() - envelope.savedAt) : undefined });
    return result;
  } catch (error) { stop({ failed: true }); throw error; }
}
export function observeCacheReader<T extends (...args: any[]) => Promise<any>>(name: string, read: T): T {
  return PERF_ENABLED ? ((...args: any[]) => observeCache(name, () => read(...args))) as T : read;
}
