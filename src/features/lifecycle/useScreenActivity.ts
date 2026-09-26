import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export function useScreenActivity() {
  const focused = useIsFocused();
  const navigation = useNavigation();
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      setForeground(state === "active");
    });
    return () => subscription.remove();
  }, []);

  // Async completions consult the actual lifecycle, including the gap before
  // React commits the blur/background render.
  const isForeground = useCallback(() => AppState.currentState === "active", []);
  const isActive = useCallback(() => navigation.isFocused() && isForeground(), [navigation, isForeground]);
  return { active: focused && foreground, foreground, isActive, isForeground };
}

export type ScreenActivity = ReturnType<typeof useScreenActivity>;

// Effects can own a lifecycle without restarting whenever their work updates
// screen state. The callback still sees the latest form/session values.
export function useLatestCallback<T extends (...args: any[]) => any>(callback: T): T {
  const latest = useRef(callback);
  latest.current = callback;
  return useCallback(((...args: Parameters<T>) => latest.current(...args)) as T, []);
}
