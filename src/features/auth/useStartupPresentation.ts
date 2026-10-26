/**
 * Path: src/features/auth/useStartupPresentation.ts
 * Purpose: Keep the native launch screen until startup content is ready.
 */

import * as NativeSplash from "expo-splash-screen";
import { useEffect } from "react";

const splashHeld = NativeSplash.preventAutoHideAsync().catch(() => false);

export function hideStartupSplash() {
  void splashHeld
    .then(() => NativeSplash.hideAsync())
    .catch(() => {});
}

export function useStartupPresentation(
  ready: boolean,
  segments: readonly string[]
) {
  const current = segments.join("/");
  const isStartup = current === "" || current === "index";

  useEffect(() => {
    if (!ready || isStartup) return;

    // Let the destination commit before uncovering it.
    const frame = requestAnimationFrame(hideStartupSplash);
    return () => cancelAnimationFrame(frame);
  }, [ready, isStartup, current]);
}