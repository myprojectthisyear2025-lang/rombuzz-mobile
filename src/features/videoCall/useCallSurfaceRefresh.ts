/** Rebinds video views after layout handoffs without recreating the RTC engine. */
import { useEffect, useRef, useState } from "react";
import { AppState, useWindowDimensions } from "react-native";

export default function useCallSurfaceRefresh(
  enabled: boolean,
  inPip: boolean,
  onRefresh: () => void,
) {
  const { width, height } = useWindowDimensions();
  const [revision, setRevision] = useState(0);
  const latest = useRef(onRefresh);
  latest.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        latest.current();
        setRevision((value) => value + 1);
      }, 120);
    };

    refresh();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, [enabled, inPip, width, height]);

  return revision;
}