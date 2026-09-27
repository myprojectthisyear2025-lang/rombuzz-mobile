import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { API_BASE } from "@/src/config/api";
import { getSessionSnapshot, subscribeSession } from "@/src/features/auth/rbzSession";
import { useScreenActivity } from "@/src/features/lifecycle/useScreenActivity";
import { getSocket, onNotification } from "@/src/lib/socket";
import { rbzApiJson } from "@/src/performance/api/rbzApiClient";
import { rbzCacheGet, rbzCacheSet } from "@/src/performance/cache/rbzCache";
import { perfState } from "@/src/performance/diagnostics/core";
import { createNotificationStore, NotificationItem } from "./createNotificationStore";

export const notificationStore = createNotificationStore({
  async read(path, signal) {
    if (path.endsWith("/unread-count")) {
      const response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${getSessionSnapshot().token}` }, signal });
      const body = await response.json().catch(()=>null);
      if (response.status === 404 && !body?.error) return { unsupported: true };
      if (!response.ok) throw Error(body?.error || "Notifications count failed");
      return body;
    }
    const data = await rbzApiJson(path, { signal });
    if (!signal.aborted) perfState("notifications", "fresh");
    return data;
  },
  async readCache(userId) {
    const cached = await rbzCacheGet<{ items?: NotificationItem[]; unread?: number }>(`RBZ_NOTIFICATIONS_V2:${userId}`, {});
    if (cached.hit) { perfState("notifications", "cache"); return cached.value; }
    const legacy = await rbzCacheGet<NotificationItem[]>("RBZ_PERF_NOTIFICATIONS", []);
    return { items: legacy.value.filter(n=>String(n.toId || n.to || "")===userId) };
  },
  async writeCache(userId, state) {
    await rbzCacheSet(`RBZ_NOTIFICATIONS_V2:${userId}`, { items: state.items, unread: state.unread });
  },
});
export function useNotificationLifecycle(enabled: boolean) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const userId = String(session.user?.id || session.user?._id || "");
  useEffect(() => {
    notificationStore.configure(enabled ? userId : "", enabled ? session.token || "" : "");
    notificationStore.setForeground(enabled && AppState.currentState === "active");
    const app = AppState.addEventListener("change", state => notificationStore.setForeground(enabled && state === "active"));
    let alive = true, cleanup = () => {};
    if (enabled && session.token && userId) void getSocket().then(socket => {
      if (!alive) return;
      const unsub = onNotification(notificationStore.receive);
      const reconnect = () => { void notificationStore.refresh(true); };
      socket.on("connect", reconnect);
      cleanup = () => { unsub(); socket.off("connect", reconnect); };
    }).catch(()=>{});
    return () => { alive = false; app.remove(); cleanup(); notificationStore.setForeground(false); };
  }, [enabled, userId, session.token]);
}
export function useNotificationUnread() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  return useSyncExternalStore(notificationStore.subscribe, () => notificationStore.getOwner().token === session.token ? notificationStore.getSnapshot().unread : 0);
}
const noSubscription = () => () => {};
const emptyState = { items: [] as NotificationItem[], unread: 0, busy: false, loaded: false };
export function useNotifications() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const { active } = useScreenActivity();
  const retained = useRef(notificationStore.getSnapshot());
  const snapshot = useCallback(() => {
    if (notificationStore.getOwner().token !== session.token) return emptyState;
    if (active) retained.current = notificationStore.getSnapshot();
    return retained.current;
  }, [active, session.token]);
  const state = useSyncExternalStore(active ? notificationStore.subscribe : noSubscription, snapshot);
  useEffect(() => { notificationStore.setVisible(active); return () => notificationStore.setVisible(false); }, [active]);
  const setItems = useCallback((update: (items: NotificationItem[]) => NotificationItem[]) => {
    if (getSessionSnapshot().token === session.token) notificationStore.setItems(update);
  }, [session.token]);
  return { ...state, active, refresh: () => notificationStore.refresh(true), setItems };
}
