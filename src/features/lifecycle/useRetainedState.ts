import { useCallback, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ScreenActivity } from "./useScreenActivity";

// For necessary async completions and realtime events: keep the latest data
// while hidden, then commit it on return. Timers/requests still need their own
// lifecycle gates; this does not keep invisible work running to hide its cost.
export function useRetainedState<T>(
  { active, isActive }: Pick<ScreenActivity, "active" | "isActive">,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [value, render] = useState(initial);
  const latest = useRef(value);
  const mounted = useRef(true);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useLayoutEffect(() => {
    if (active) render(latest.current);
  }, [active]);
  const set = useCallback<Dispatch<SetStateAction<T>>>(next => {
    if (!mounted.current) return;
    latest.current = typeof next === "function"
      ? (next as (previous: T) => T)(latest.current) : next;
    if (isActive()) render(latest.current);
  }, [isActive]);
  return [value, set];
}
