import { useSyncExternalStore } from "react";
import { chatUnread } from "./chatUnread";

/** Consumption alone never fetches, attaches sockets, or reads storage. */
export function useUnreadSummary() {
  return useSyncExternalStore(chatUnread.subscribe, chatUnread.getSnapshot, chatUnread.getSnapshot);
}
