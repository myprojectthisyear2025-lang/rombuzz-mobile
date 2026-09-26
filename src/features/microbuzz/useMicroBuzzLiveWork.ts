import { useEffect } from "react";
import { useLatestCallback, type ScreenActivity } from "../lifecycle/useScreenActivity";

// A user who explicitly went live remains visible while using other screens.
// Only that presence heartbeat survives blur; radar scans are visible-only.
export function useMicroBuzzLiveWork(
  live: boolean,
  activity: ScreenActivity,
  tick: () => Promise<void>,
  cancelScan: () => void,
) {
  const run = useLatestCallback(tick);
  const cancel = useLatestCallback(cancelScan);
  useEffect(() => {
    if (!live || !activity.foreground) return;
    void run();
    const timer = setInterval(() => { void run(); }, activity.active ? 2000 : 5000);
    return () => { clearInterval(timer); cancel(); };
  }, [live, activity.active, activity.foreground, run, cancel]);
}
