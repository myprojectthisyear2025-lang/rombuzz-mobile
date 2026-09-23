/** Path: src/performance/diagnostics/screens.tsx
 * Purpose: Focus-aware screen commits and React Profiler timings; frame callbacks are visibility proxies only. */
import React, { Profiler, useEffect, useLayoutEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { PERF_ENABLED, perfDataSource, perfFocus, perfMark, perfMarkOnce, perfRecord, perfVisit } from "./core";
export function withPerfScreen<P extends object>(Component: React.ComponentType<P>, screen: string) {
  if (!PERF_ENABLED) return Component;
  function Instrumented(props: P) {
    const focused = useIsFocused();
    useLayoutEffect(() => { if (focused) perfFocus(screen); }, [focused]);
    useEffect(() => {
      perfMark(screen, "mounted");
      return () => perfMark(screen, "unmounted");
    }, []);
    return <Profiler id={screen} onRender={(_id, phase, actualDuration, baseDuration, startTime, commitTime) => {
      perfRecord("react-render", { screen, visit: perfVisit(screen).id, focused, phase,
        actualDurationMs: actualDuration, baseDurationMs: baseDuration, startTime, commitTime });
    }}><Component {...props} /></Profiler>;
  }
  Instrumented.displayName = `Perf(${screen})`;
  return Instrumented;
}
function useObservedContent(screen: string, ready: boolean, count?: number, revision?: unknown) {
  const focused = useIsFocused();
  const commits = useRef(0);
  useEffect(() => {
    if (!PERF_ENABLED || !focused || !ready) return;
    commits.current++;
    const source = perfDataSource(screen);
    perfMark(screen, "data-commit", { count, commit: commits.current, source });
    perfMarkOnce(screen, "useful-content-commit", { count, source });
    if (source !== "unknown") perfMarkOnce(screen, `${source}-content-commit`, { count });
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => perfMarkOnce(screen, "useful-content-frame-opportunity", { count }));
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [screen, ready, count, focused, revision]);
}
// A fixed module-level flag keeps disabled diagnostics from adding focus subscriptions or effects.
export const usePerfContent: typeof useObservedContent = PERF_ENABLED ? useObservedContent : () => {};
