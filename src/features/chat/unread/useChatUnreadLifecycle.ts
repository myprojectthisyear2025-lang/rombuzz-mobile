import { useLayoutEffect } from "react";
import { AppState } from "react-native";
import { getSessionSnapshot, subscribeSession } from "@/src/features/auth/rbzSession";
import { getSocket } from "@/src/lib/socket";
import { chatUnread } from "./chatUnread";

/** Mounted once above the root Stack, including when a thread covers tabs. */
export function useChatUnreadLifecycle(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) {
      chatUnread.setSession({ token: "", userId: "" });
      return;
    }
    let alive = true, connectedOnce = false;
    let socket: Awaited<ReturnType<typeof getSocket>> | null = null;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    const clearFallback = () => { if (fallback) clearTimeout(fallback); fallback = null; };
    const syncSession = () => {
      const session = getSessionSnapshot();
      const changed = chatUnread.setSession({ token: session.token, userId: String(session.user?.id || session.user?._id || "") });
      if (changed && session.token) void chatUnread.refresh();
      if (!session.token) clearFallback();
    };
    const reconcile = () => { if (chatUnread.hasPending()) void chatUnread.refresh(); };
    const onSummary = (summary: unknown) => {
      if (chatUnread.apply(summary)) clearFallback();
    };
    const onMessage = (message: unknown) => {
      if (!chatUnread.incoming(message) || !chatUnread.isForeground()) return;
      // Same fallback delay as the former layout. A server summary cancels it;
      // one owner and one in-flight read handle missing/delayed pushes.
      if (!fallback) fallback = setTimeout(() => { fallback = null; reconcile(); }, 650);
    };
    const onReaction = (reaction: unknown) => { chatUnread.incoming(reaction, true); };
    const onConnect = () => {
      // A reconnect joins an existing reconciliation; it does not invalidate
      // that request's data revision and cause a second sequential read.
      if (connectedOnce) void chatUnread.refresh(true);
      else reconcile();
      connectedOnce = true;
    };
    chatUnread.setForeground(AppState.currentState === "active");
    const unsubscribe = subscribeSession(syncSession);
    syncSession();
    reconcile();
    const appState = AppState.addEventListener("change", state => {
      const wasForeground = chatUnread.isForeground();
      chatUnread.setForeground(state === "active");
      if (state !== "active") clearFallback();
      else if (!wasForeground) reconcile();
    });
    void getSocket().then(connected => {
      if (!alive) return;
      socket = connected;
      connectedOnce = socket.connected;
      socket.on("connect", onConnect);
      socket.on("chat:unread:update", onSummary);
      socket.on("chat:message", onMessage);
      socket.on("direct:message", onMessage);
      socket.on("chat:reaction-preview", onReaction);
    }).catch(() => {});
    return () => {
      alive = false;
      unsubscribe();
      appState.remove();
      clearFallback();
      chatUnread.setForeground(false);
      socket?.off("connect", onConnect);
      socket?.off("chat:unread:update", onSummary);
      socket?.off("chat:message", onMessage);
      socket?.off("direct:message", onMessage);
      socket?.off("chat:reaction-preview", onReaction);
    };
  }, [enabled]);
}
