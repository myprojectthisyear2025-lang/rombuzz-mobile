import { useCallback, useRef, type SetStateAction } from "react";
import { useRetainedState } from "@/src/features/lifecycle/useRetainedState";
import type { ScreenActivity } from "@/src/features/lifecycle/useScreenActivity";
import type { Msg } from "./chatTypes";

/** Retain socket edits offscreen, including when the hidden thread unmounts. */
export function useChatThreadMessages(activity: ScreenActivity) {
  const latest = useRef<Msg[]>([]);
  const [messages, commit] = useRetainedState<Msg[]>(activity, []);
  const setMessages = useCallback((update: SetStateAction<Msg[]>) => {
    commit(previous => {
      const next = typeof update === "function" ? update(previous) : update;
      latest.current = next;
      return next;
    });
  }, [commit]);
  const getCurrentMessages = useCallback(() => latest.current, []);
  return { messages, setMessages, getCurrentMessages };
}
