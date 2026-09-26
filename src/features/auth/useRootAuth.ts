import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { perfSpan } from "@/src/performance/diagnostics/core";
import {
  getSessionSnapshot, initializeSession, refreshSession, subscribeSession,
} from "./rbzSession";
import { sessionUserId } from "./rbzSessionStorage";
import { hasOnboardingDraft, subscribeOnboardingDraft } from "./onboarding/rbzOnboardingDraft";

export function useRootAuth() {
  const [auth, setAuth] = useState({
    ready: false, authToken: "", authUserId: "", loggedIn: false, onboardingPending: false,
  });

  useEffect(() => {
    let mounted = true;
    let pending = false;
    let ready = false;
    let revision = 0;
    const commit = () => {
      if (!mounted) return;
      const session = getSessionSnapshot();
      const next = {
        ready, authToken: session.token, authUserId: sessionUserId(session.user),
        loggedIn: !!session.token, onboardingPending: pending,
      };
      // Profile-only updates must not rerender the entire navigation tree.
      setAuth(prev => Object.keys(next).every(key =>
        prev[key as keyof typeof prev] === next[key as keyof typeof next]) ? prev : next);
    };
    const sync = async (foreground = false) => {
      const stopAuthStorage = perfSpan("startup.auth-storage");
      const current = ++revision;
      try {
        const [, draft] = await Promise.all([
          foreground ? refreshSession() : initializeSession(),
          hasOnboardingDraft(foreground),
        ]);
        if (current === revision) pending = draft;
      } catch {
        // A transient native read failure on resume must not sign out a live
        // session. Initial failure retains the existing logged-out fallback.
      } finally {
        stopAuthStorage();
        ready = true;
        commit();
      }
    };
    const unsubscribeSession = subscribeSession(commit);
    const unsubscribeDraft = subscribeOnboardingDraft(value => {
      revision++;
      pending = value;
      commit();
    });
    let previousState = AppState.currentState;
    const appState = AppState.addEventListener("change", next => {
      const resumed = next === "active" && /inactive|background/.test(previousState);
      previousState = next;
      if (resumed) void sync(true);
    });
    void sync();
    return () => {
      mounted = false;
      unsubscribeSession();
      unsubscribeDraft();
      appState.remove();
    };
  }, []);

  return auth;
}
