//C:\projects\rombuzz-mobile\hooks\useIdleDetector.ts


import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, PanResponder } from "react-native";
import { useNavStore } from "../src/store/navStore";

const IDLE_TIMEOUT = 6000; // 6 seconds

export function useIdleDetector() {
  const setIdle = useNavStore((s) => s.setIdle);

  // ✅ Correct timeout type for React Native
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);

    setIdle(false);

    timer.current = setTimeout(() => {
      setIdle(true);
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    resetTimer();

    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") {
          resetTimer();
        }
      }
    );

    return () => {
      if (timer.current) clearTimeout(timer.current);
      subscription.remove();
    };
  }, []);

  // Touch detector (keeps app "active" while user interacts)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => {
      resetTimer();
      return false;
    },
  });

  return panResponder.panHandlers;
}
