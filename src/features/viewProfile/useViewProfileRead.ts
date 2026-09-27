import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/src/features/auth/rbzSession";
import { useScreenActivity } from "@/src/features/lifecycle/useScreenActivity";
import { clearCachedViewProfile, fetchFreshViewProfile, mergeStableViewProfile, readCachedViewProfile } from "@/src/features/performance/viewProfile/rbzViewProfileCache";
import { perfState } from "@/src/performance/diagnostics/core";

type State = { scope: string; profile: any; status: "loading" | "ready" | "unavailable" | "error"; refreshing: boolean; error: string };
const initial = (scope: string): State => ({ scope, profile: null, status: "loading", refreshing: false, error: "" });
export function useViewProfileRead(userId: string, preview: boolean) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const scope = JSON.stringify([session.user?.id || session.user?._id || "", userId, preview]);
  const { active, isActive } = useScreenActivity();
  const [state, setState] = useState<State>(() => initial(scope));
  const stateRef = useRef(state); stateRef.current = state;
  const currentScope = useRef(scope); currentScope.current = scope;
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async (refresh = false) => {
    if (!isActive()) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const valid = () => !controller.signal.aborted && request.current === controller && isActive() && currentScope.current === scope && getSessionSnapshot().token === session.token;
    const publish = (next: State) => { if (valid()) { stateRef.current = next; setState(next); } };
    const previous = stateRef.current.scope === scope ? stateRef.current : initial(scope);
    publish({ ...previous, status: previous.profile ? "ready" : "loading", refreshing: refresh, error: "" });
    if (!userId) { publish({ ...initial(scope), status: "error", error: "Missing profile id" }); return; }
    let freshCommitted = false;
    const apply = (bundle: any, source: "cache" | "fresh") => {
      const id = String(bundle?.profile?.user?.id || bundle?.profile?.user?._id || "");
      if (!valid() || id !== userId) return false;
      const old = stateRef.current.scope === scope ? stateRef.current.profile : null;
      publish({ scope, profile: mergeStableViewProfile(old, bundle.profile), status: "ready", refreshing: source === "cache" && refresh, error: "" });
      perfState("view-profile", source);
      return true;
    };
    const cached = previous.profile ? Promise.resolve() : readCachedViewProfile(userId).then(bundle => {
      // Lightweight match rows cannot establish authoritative gallery counts
      // or missing profile fields. Keep the neutral initial presentation.
      if (!freshCommitted && bundle?.complete) apply(bundle, "cache");
    }).catch(() => {});
    try {
      const fresh = await fetchFreshViewProfile(userId, controller.signal);
      if (!valid()) return;
      if (!apply(fresh, "fresh")) throw new Error("Invalid profile response");
      freshCommitted = true;
    } catch (error: any) {
      if (!valid()) return;
      if ([403, 404, 410].includes(error?.status)) {
        freshCommitted = true;
        publish({ ...initial(scope), status: "unavailable" });
        void clearCachedViewProfile(userId);
      } else {
        await cached;
        if (!valid()) return;
        const current = stateRef.current;
        publish({ ...current, status: current.profile ? "ready" : "error", refreshing: false, error: error?.message || "Failed to load profile" });
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [isActive, scope, session.token, userId]);
  useEffect(() => {
    if (!active) return;
    void load();
    return () => { request.current?.abort(); request.current = null; };
  }, [active, load]);
  // Route/account changes get a neutral render before any effect can run.
  const visible = state.scope === scope ? state : initial(scope);
  return { ...visible, refresh: () => load(true) };
}
