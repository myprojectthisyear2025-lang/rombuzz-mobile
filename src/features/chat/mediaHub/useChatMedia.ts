import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/src/features/auth/rbzSession";
import { useLatestCallback, useScreenActivity } from "@/src/features/lifecycle/useScreenActivity";
import { getSocket } from "@/src/lib/socket";
import { readCachedChatThread } from "@/src/features/chat/thread/rbzChatThreadCache";
import { ChatMediaKind, ChatMediaRow, chatMediaRow, chatMediaRows } from "./chatMediaRows";
import { requestMediaPage } from "./chatMediaRequest";
import { preserveChatVideoPreview } from "../sharedMedia/chatVideoPreviewSource";

type Type = "image" | "video";
type State = { rows: ChatMediaRow[]; counts: { image: number; video: number }; more: Record<Type, boolean>; cursors: Record<Type, string | null> };
const empty = (): State => ({ rows: [], counts: { image: 0, video: 0 }, more: { image: true, video: true }, cursors: { image: null, video: null } });
const cache = new Map<string, State>();
const sort = (a: ChatMediaRow, b: ChatMediaRow) => b.createdAtMs - a.createdAtMs || b.id.localeCompare(a.id);

export function useChatMedia(peerId: string, kind: ChatMediaKind, mediaType: Type) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const myId = String(session.user?.id || session.user?._id || "");
  const roomId = useMemo(() => [myId, peerId].sort().join("_"), [myId, peerId]);
  const key = `RBZ_MEDIA_V1:${myId}:${roomId}:${kind}`;
  const currentKey = useRef(key); currentKey.current = key;
  const { active, isActive } = useScreenActivity();
  const [state, setState] = useState<State>(() => cache.get(key) || empty());
  const [scope, setScope] = useState(key);
  if (scope !== key) { setScope(key); setState(cache.get(key) || empty()); }
  const stateRef = useRef(state); stateRef.current = state;
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null), revision = useRef(0);
  const publish = useLatestCallback((next: State) => {
    stateRef.current = next; cache.set(key, next);
    if (cache.size > 20) cache.delete(cache.keys().next().value!);
    setState(next);
    // Persist previews only. Paging always reconciles with the server on entry.
    void AsyncStorage.setItem(key, JSON.stringify(next.rows.slice(0, 90))).catch(() => {});
  });
  const load = useLatestCallback(async (more = false) => {
    if (!isActive() || !myId || !peerId || !session.token || request.current || (more && !stateRef.current.more[mediaType])) return;
    const controller = new AbortController(), version = revision.current;
    request.current = controller; setBusy(true); setError("");
    const valid = () => !controller.signal.aborted && isActive() && request.current === controller && revision.current === version;
    try {
      const page = await requestMediaPage(session.token, roomId, kind, mediaType, more ? stateRef.current.cursors[mediaType] : null, controller.signal);
      if (!valid()) return;
      const previous = stateRef.current;
      const rows = new Map(previous.rows.map(row => [row.id, row]));
      // Replace the refreshed head while retaining already loaded older pages.
      if (!more) {
        const oldest = page.items.at(-1)?.createdAtMs ?? 0;
        for (const row of rows.values()) if (row.mediaType === mediaType && (!page.hasMore || row.createdAtMs >= oldest)) rows.delete(row.id);
      }
      const previousById = new Map(previous.rows.map(row => [row.id, row]));
      page.items.forEach(row => rows.set(row.id, kind === "shared" ? preserveChatVideoPreview(previousById.get(row.id), row) : row));
      const merged = [...rows.values()].sort(sort);
      publish({ rows: merged, counts: page.counts || { image: merged.filter(row => row.mediaType === "image").length, video: merged.filter(row => row.mediaType === "video").length }, more: { ...previous.more, [mediaType]: page.hasMore }, cursors: { ...previous.cursors, [mediaType]: page.nextCursor } });
    } catch (e: any) { if (valid()) setError(e?.message || "Unable to load media"); }
    finally { if (request.current === controller) { request.current = null; if (isActive()) setBusy(false); } }
  });
  const setRows = useCallback((update: (rows: ChatMediaRow[]) => ChatMediaRow[]) => {
    if (currentKey.current !== key) return;
    revision.current++; request.current?.abort(); request.current = null; setBusy(false);
    const previous = stateRef.current, rows = update(previous.rows);
    const counts = { ...previous.counts };
    for (const type of ["image", "video"] as const) counts[type] = Math.max(0, counts[type] + rows.filter(r => r.mediaType === type).length - previous.rows.filter(r => r.mediaType === type).length);
    publish({ ...previous, rows, counts });
  }, [key, publish]);
  useEffect(() => {
    if (!active || !myId || !peerId) return;
    let alive = true;
    const initial = cache.get(key) || empty(); setState(initial); stateRef.current = initial;
    setBusy(!initial.rows.some(row => row.mediaType === mediaType));
    const version = revision.current;
    void (async () => {
      if (!initial.rows.length) {
        let rows: ChatMediaRow[] = [];
        try {
          const raw = await AsyncStorage.getItem(key);
          if (raw) rows = JSON.parse(raw);
          else {
            const cached = await readCachedChatThread(roomId);
            rows = chatMediaRows((cached?.messages || []).filter((m: any) => !m.hiddenFor?.includes(myId)), kind);
          }
        } catch {}
        if (!alive || !isActive() || revision.current !== version) return;
        if (Array.isArray(rows) && rows.length) publish({ ...empty(), rows, counts: { image: rows.filter(r => r.mediaType === "image").length, video: rows.filter(r => r.mediaType === "video").length } });
      }
      if (alive && isActive()) void load();
    })();
    return () => { alive = false; request.current?.abort(); request.current = null; };
  }, [active, key, myId, peerId, roomId, kind, mediaType, session.token, isActive, publish, load]);

  useEffect(() => {
    if (!active || !myId || !session.token) return;
    let alive = true, cleanup = () => {};
    // This screen consumes personal/room events; it does not take ownership of
    // the retained thread's join/leave subscription.
    void getSocket().then(socket => {
      if (!alive || !isActive() || !socket) return;
      const belongs = (event: any) => event?.roomId ? String(event.roomId) === roomId :
        [String(event?.from || ""), String(event?.to || "")].sort().join("_") === roomId;
      const incoming = (event: any) => {
        const message = event?.message || event;
        if (!isActive() || !(belongs(event) || belongs(message))) return;
        const incomingRow = chatMediaRow(message);
        if (!incomingRow || (incomingRow.giftLocked || incomingRow.giftPriceBC > 0) !== (kind === "purchased")) return;
        const row = kind === "shared" ? preserveChatVideoPreview(stateRef.current.rows.find(r => r.id === incomingRow.id), incomingRow) : incomingRow;
        if (JSON.stringify(stateRef.current.rows.find(r => r.id === row.id)) === JSON.stringify(row)) return;
        setRows(rows => [...rows.filter(r => r.id !== row.id), row].sort(sort));
        void load();
      };
      const deleted = (event: any) => {
        if (!isActive() || !belongs(event)) return;
        const id = String(event?.msgId || event?.id || "");
        if (stateRef.current.rows.some(row => row.id === id)) setRows(rows => rows.filter(row => row.id !== id));
      };
      const reconnect = () => { if (isActive()) void load(); };
      const events: [string, (event: any) => void][] = [["connect", reconnect], ["chat:message", incoming], ["message", incoming], ["chat:gift:unlocked", incoming], ["message:delete", deleted], ["chat:delete", deleted]];
      events.forEach(([event, handler]) => socket.on(event, handler));
      cleanup = () => events.forEach(([event, handler]) => socket.off(event, handler));
    }).catch(() => {});
    return () => { alive = false; cleanup(); };
  }, [active, myId, session.token, roomId, kind, isActive, load, setRows]);
  return { rows: state.rows, counts: state.counts, loading: busy && !state.rows.some(r => r.mediaType === mediaType), busy, error, hasMore: state.more[mediaType], load: () => load(), loadMore: () => load(true), setRows, myId, roomId, active };
}
