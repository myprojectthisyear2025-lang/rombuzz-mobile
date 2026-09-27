export type NotificationItem = { id: string; toId: string; read?: boolean; type: string; message: string; createdAt: string | Date; [key: string]: any };
export type NotificationState = { items: NotificationItem[]; unread: number; loaded: boolean; busy: boolean };
const empty = (): NotificationState => ({ items: [], unread: 0, loaded: false, busy: false });
export function normalizeNotifications(data: any): NotificationItem[] {
  const list = Array.isArray(data) ? data : data?.notifications || [];
  const rows = new Map<string, NotificationItem>();
  for (const n of list) {
    const id = String(n?.id || n?._id || "");
    if (id) rows.set(id, { ...n, id, toId: String(n.toId || n.to || ""), type: n.type || "system", message: String(n.message || ""), createdAt: n.createdAt || new Date(0).toISOString() });
  }
  return [...rows.values()].sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
type Dependencies = {
  read: (path: string, signal: AbortSignal) => Promise<any>;
  readCache: (userId: string) => Promise<{ items?: NotificationItem[]; unread?: number } | null>;
  writeCache: (userId: string, state: NotificationState) => Promise<any>;
};
export function createNotificationStore(deps: Dependencies) {
  let state = empty(), userId = "", token = "", generation = 0, foreground = false, visible = false;
  let flight: { controller: AbortController; list: boolean; promise: Promise<void> } | null = null;
  let hydration: Promise<void> = Promise.resolve(), revision = 0, listFreshAt = 0, countFreshAt = 0;
  const listeners = new Set<() => void>();
  const publish = (next: NotificationState, persist = true) => {
    state = next; listeners.forEach(fn => fn());
    if (persist && userId) void deps.writeCache(userId, next).catch(() => {});
  };
  const cancel = () => { flight?.controller.abort(); flight = null; if(state.busy) publish({...state,busy:false},false); };
  const setItems = (update: (items: NotificationItem[]) => NotificationItem[]) => {
    revision++; cancel();
    const items = update(state.items);
    publish({ ...state, items, unread: Math.max(0, state.unread + items.filter(n=>!n.read).length - state.items.filter(n=>!n.read).length) });
  };
  const refresh = (force = false): Promise<void> => {
    if (!foreground || !userId || !token) return Promise.resolve();
    const list = visible;
    if (flight && (flight.list || !list)) return flight.promise;
    if (flight) cancel(); // A visible list also supplies the badge count.
    const freshAt = list ? listFreshAt : countFreshAt;
    if (!force && freshAt && Date.now() - freshAt < 30_000 && (!list || state.loaded)) return Promise.resolve();
    const controller = new AbortController(), ownGeneration = generation, version = revision;
    const valid = () => generation === ownGeneration && revision === version && !controller.signal.aborted && foreground;
    publish({ ...state, busy: list }, false);
    const run = async () => {
      await hydration;
      if (!valid()) return;
      try {
        let data = await deps.read(list ? "/notifications?view=mobile" : "/notifications/unread-count", controller.signal);
        if (!valid()) return;
        // Old deployments do not implement the count endpoint. Their full list
        // is fetched once through this same owner and seeds the screen cache.
        if (!list && data?.unsupported) data = await deps.read("/notifications?view=mobile", controller.signal);
        if (!valid()) return;
        if (Array.isArray(data) || Array.isArray(data?.notifications)) {
          const items = normalizeNotifications(data);
          publish({ items, unread: items.filter(n=>!n.read).length, loaded: true, busy: false });
          listFreshAt = Date.now();
        } else if (!list && Number.isFinite(data?.total)) publish({ ...state, unread: Math.max(0,data.total), busy:false });
        else throw Error("Invalid notifications response");
        countFreshAt = Date.now();
      } catch { /* Preserve cache on transient failures; explicit refresh retries. */ }
      finally { if (flight?.controller === controller) { flight = null; publish({...state,busy:false},false); } }
    };
    const promise = run(); flight = { controller, list, promise }; return promise;
  };
  return {
    getSnapshot: () => state,
    getOwner: () => ({ userId, token }),
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    configure(nextUserId: string, nextToken: string) {
      if (nextUserId === userId && nextToken === token) return;
      generation++; cancel(); userId = nextUserId; token = nextToken; listFreshAt = 0; countFreshAt = 0; revision = 0; publish(empty(), false);
      const own = generation, version = revision;
      hydration = userId ? deps.readCache(userId).then(cached => {
        if (generation !== own || revision !== version || !cached) return;
        const items = normalizeNotifications(cached.items || []).filter(n => n.toId === userId);
        publish({ items, unread: Math.max(0, Number(cached.unread ?? items.filter(n=>!n.read).length) || 0), loaded: false, busy: state.busy }, false);
      }).catch(()=>{}) : Promise.resolve();
    },
    setForeground(value: boolean) { foreground = value; if (!value) cancel(); else void refresh(true); },
    setVisible(value: boolean) { visible = value; if (!value && flight?.list) cancel(); if (value) void refresh(); },
    refresh,
    setItems,
    receive(raw: any) {
      const item = normalizeNotifications([raw])[0];
      if (!item || (item.toId && item.toId !== userId) || state.items.some(n=>n.id===item.id)) return;
      revision++;
      // Keep in-memory realtime correctness even when the UI is backgrounded.
      // A read started before this event cannot replace it with an older list.
      cancel();
      publish({ ...state, items: normalizeNotifications([item,...state.items]), unread: state.unread + (item.read ? 0 : 1) });
      if (foreground) void refresh(true);
    },
  };
}
