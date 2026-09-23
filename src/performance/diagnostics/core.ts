/** Path: src/performance/diagnostics/core.ts
 * Purpose: Bounded opt-in diagnostic events, monotonic visits and manual export without production logging. */
export const PERF_ENABLED = process.env.EXPO_PUBLIC_PERF_DIAGNOSTICS === "true" &&
  (__DEV__ || process.env.EXPO_PUBLIC_PERF_ALLOW_RELEASE === "true");
export const perfNow = () => performance.now();
type Fields = Record<string, string | number | boolean | null | undefined>;
export type PerfEvent = Fields & { kind: string; atMs: number };
const origin = perfNow();
const events: PerfEvent[] = [];
let dropped = 0, sequence = 0;
let foreground = "startup";
const visits = new Map<string, { id: string; start: number; tapped: boolean }>();
const once = new Set<string>();
const sources = new Map<string, string>();
export function perfState(screen: string, source: "cache" | "fresh" | "optimistic") {
  if (!PERF_ENABLED) return;
  sources.set(screen, source);
  perfMark(screen, `${source}-state-scheduled`);
}
export const perfDataSource = (screen: string) => sources.get(screen) || "unknown";
export const perfId = () => `p${++sequence}`;
export function perfRecord(kind: string, fields: Fields = {}) {
  if (!PERF_ENABLED) return;
  if (events.length >= 3000) { dropped++; return; }
  events.push({ ...fields, kind, atMs: perfNow() - origin });
}
export function perfVisit(screen: string) {
  let visit = visits.get(screen);
  if (!visit) { visit = { id: perfId(), start: perfNow(), tapped: false }; visits.set(screen, visit); }
  return visit;
}
export function perfTap(screen: string) {
  if (!PERF_ENABLED) return;
  const visit = { id: perfId(), start: perfNow(), tapped: true };
  visits.set(screen, visit);
  perfRecord("interaction", { screen, visit: visit.id, event: "tap" });
  perfRecord("navigation", { screen, visit: visit.id, event: "handler-begins" });
}
export function perfFocus(screen: string) {
  if (!PERF_ENABLED) return;
  const old = visits.get(screen);
  if (!old?.tapped || perfNow() - old.start > 10000) {
    visits.set(screen, { id: perfId(), start: perfNow(), tapped: false });
  }
  foreground = screen;
  perfMark(screen, "focused");
  perfVisit(screen).tapped = false;
}
export function perfMark(screen: string, event: string, fields: Fields = {}) {
  if (!PERF_ENABLED) return;
  const visit = perfVisit(screen);
  perfRecord("milestone", { ...fields, screen, visit: visit.id, event, elapsedMs: perfNow() - visit.start });
}
export function perfMarkOnce(screen: string, event: string, fields: Fields = {}) {
  if (!PERF_ENABLED) return;
  const key = `${perfVisit(screen).id}:${event}`;
  if (once.has(key)) return;
  if (once.size >= 3000) return;
  once.add(key); perfMark(screen, event, fields);
}
export function perfForeground() {
  return { foreground, visit: perfVisit(foreground).id };
}
export function perfSpan(name: string, fields: Fields = {}) {
  if (!PERF_ENABLED) return (_extra?: Fields) => {};
  const start = perfNow(), scope = perfForeground();
  return (extra: Fields = {}) => perfRecord("span", { ...scope, ...fields, ...extra, name, durationMs: perfNow() - start });
}
export const perfCapture = {
  snapshot: () => ({ schema: 1, clock: "monotonic-js", dropped, events: [...events] }),
  clear: () => { events.length = 0; dropped = 0; once.clear(); },
  flush: () => {
    console.log("[PERF] " + JSON.stringify(perfCapture.snapshot()));
    perfCapture.clear();
  },
};
if (PERF_ENABLED) {
  (globalThis as any).__RBZ_PERF__ = perfCapture;
  perfMark("startup", "js-diagnostics-loaded");
}
