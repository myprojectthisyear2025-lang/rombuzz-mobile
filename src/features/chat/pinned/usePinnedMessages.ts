import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/src/features/auth/rbzSession";
import { useScreenActivity } from "@/src/features/lifecycle/useScreenActivity";
import { readCachedChatThread } from "@/src/features/chat/thread/rbzChatThreadCache";
import { getSocket } from "@/src/lib/socket";
import { pinnedMessages, requestPinnedMessages } from "./pinnedMessages";

const cache = new Map<string, any[]>();
export function usePinnedMessages(peerId: string) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const myId = String(session.user?.id || session.user?._id || "");
  const roomId = [myId, peerId].sort().join("_");
  const key = `RBZ_PINNED_V1:${myId}:${roomId}`;
  const { active, isActive } = useScreenActivity();
  const [state, setState] = useState(() => ({ key, items: cache.get(key) || [], loading: !cache.has(key), error: "" }));
  const current = useRef(key); current.current = key;
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!active || !myId || !peerId || !session.token) return;
    const controller = new AbortController();
    let alive = true, settled = false, items = cache.get(key) || [], cleanup = () => {};
    const updates = new Map<string, any>();
    const valid = () => alive && !controller.signal.aborted && isActive() && current.current === key && getSessionSnapshot().token === session.token;
    const merge = (rows: any[]) => {
      const byId = new Map(rows.map(row => [String(row.id), row]));
      updates.forEach((row, id) => byId.set(id, { ...byId.get(id), ...row }));
      return pinnedMessages([...byId.values()], myId);
    };
    const publish = (rows: any[], loading = false, error = "") => {
      if (!valid()) return;
      items = rows;
      setState({ key, items, loading, error });
    };
    const remember = (rows: any[]) => {
      cache.set(key, rows);
      if (cache.size > 20) cache.delete(cache.keys().next().value!);
      void AsyncStorage.setItem(key, JSON.stringify(rows)).catch(() => {});
    };
    publish(items, !cache.has(key));
    // Disk hydration and HTTP proceed together; slow storage cannot delay HTTP.
    void (async () => {
      const [raw, thread] = await Promise.all([
        AsyncStorage.getItem(key).catch(() => null), readCachedChatThread(roomId).catch(() => null),
      ]);
      if (!valid() || settled) return;
      let saved: any[] | null = null;
      try { const parsed = raw ? JSON.parse(raw) : null; if (Array.isArray(parsed)) saved = parsed; } catch {}
      const byId = new Map((cache.get(key) || saved || []).map(row => [String(row.id), row]));
      // Thread cache is partial: update known IDs, never infer missing old pins
      // are unpinned just because they are outside its last 250 messages.
      (thread?.messages || []).forEach(row => byId.set(String(row.id), row));
      const rows = merge([...byId.values()]);
      if (saved || cache.has(key) || rows.length) publish(rows);
    })();
    void requestPinnedMessages(roomId, session.token, controller.signal).then(rows => {
      if (!valid()) return;
      settled = true; const next = merge(rows); publish(next); remember(next);
    }).catch(error => {
      if (!valid()) return;
      // A failed network read must not suppress still-pending usable disk data.
      if ([401, 403, 404, 409].includes(error.status)) { settled = true; items = []; remember([]); }
      publish(items, false, error.message);
    });
    void getSocket().then(socket => {
      if (!valid() || !socket) return;
      const belongs = (event: any, msg: any) => event?.roomId ? String(event.roomId) === roomId :
        [String(msg?.from || ""), String(msg?.to || "")].sort().join("_") === roomId;
      const update = (event: any) => {
        const msg = event?.message || event;
        if (!valid() || !belongs(event, msg) || !msg?.id) return;
        const id = String(msg.id);
        updates.set(id, { ...updates.get(id), ...msg });
        const next = merge(items); publish(next); remember(next);
      };
      const deleted = (event: any) => {
        if (event?.scope === "me" && event?.userId && String(event.userId) !== myId) return;
        update({ ...event, message: { id: event?.msgId || event?.id, deleted: true } });
      };
      const reconnect = () => { if (valid()) setRetry(value => value + 1); };
      const events: [string, (event: any) => void][] = [["message:pin", update], ["chat:pin", update], ["message:delete", deleted], ["chat:delete", deleted], ["connect", reconnect]];
      events.forEach(([name, handler]) => socket.on(name, handler));
      cleanup = () => events.forEach(([name, handler]) => socket.off(name, handler));
    }).catch(() => {});
    return () => { alive = false; controller.abort(); cleanup(); };
  }, [active, isActive, key, myId, peerId, roomId, session.token, retry]);
  const visible = state.key === key ? state : { items: cache.get(key) || [], loading: !cache.has(key), error: "" };
  return { ...visible, myId, reload: () => setRetry(value => value + 1) };
}
