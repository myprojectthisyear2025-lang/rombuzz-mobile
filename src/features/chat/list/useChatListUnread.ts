/** Chat list consumes the shared unread owner; only explicit refresh requests a read. */
import { useCallback, useEffect } from "react";
import { rbzGetCurrentUser } from "@/src/performance/api/rbzApiClient";
import { chatUnread } from "../unread/chatUnread";
import type { ChatListState } from "./useChatListState";

export function useChatListUnread({ setUser }: Pick<ChatListState, "setUser">) {
  useEffect(() => {
    let alive = true;
    void rbzGetCurrentUser().then(user => { if (alive && user) setUser(user); }).catch(() => {});
    return () => { alive = false; };
  }, [setUser]);
  return useCallback(() => chatUnread.refresh(true), []);
}
