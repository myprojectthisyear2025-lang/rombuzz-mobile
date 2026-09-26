/** One account's unread state, request ownership, and stale-response protection. */
export type UnreadSummary = { total: number; byPeer: Record<string, number> };
export type UnreadSession = { token: string; userId: string };
type Dependencies = {
  fetchSummary: (session: UnreadSession, signal: AbortSignal) => Promise<unknown>;
  readCache: (userId: string) => Promise<unknown>;
  writeCache: (userId: string, summary: UnreadSummary) => Promise<unknown>;
};
const EMPTY: UnreadSummary = { total: 0, byPeer: {} };

export function normalizeUnread(value: any): UnreadSummary | null {
  if (!value || !value.byPeer || typeof value.byPeer !== "object" || Array.isArray(value.byPeer)) return null;
  const byPeer: Record<string, number> = {};
  for (const [peer, raw] of Object.entries(value.byPeer)) {
    const count = Number(raw);
    if (Number.isFinite(count) && count > 0) Object.defineProperty(byPeer, peer, { value: Math.floor(count), enumerable: true, configurable: true, writable: true });
  }
  return { total: Object.values(byPeer).reduce((sum, n) => sum + n, 0), byPeer };
}
function same(a: UnreadSummary, b: UnreadSummary) {
  return a.total === b.total && Object.keys(a.byPeer).length === Object.keys(b.byPeer).length &&
    Object.keys(a.byPeer).every(peer => a.byPeer[peer] === b.byPeer[peer]);
}

export function createUnreadStore(deps: Dependencies) {
  let session: UnreadSession = { token: "", userId: "" };
  let raw = EMPTY, snapshot = EMPTY, revision = 0, dirty = true, foreground = false;
  let activePeer = "", activeOwner: object | null = null;
  let inFlight: { controller: AbortController; promise: Promise<void> } | null = null;
  let retryAfterFlight = false, mutationCount = 0;
  const mutations = new Map<string, Promise<any>>();
  const listeners = new Set<() => void>();
  const seen = new Map<string, number>();
  let cacheWrites = Promise.resolve();

  function publish(persist = true) {
    const byPeer = { ...raw.byPeer };
    delete byPeer[activePeer];
    const next = normalizeUnread({ byPeer })!;
    if (!same(snapshot, next)) {
      snapshot = next;
      listeners.forEach(listener => listener());
    }
    if (persist && session.userId) {
      const owner = session, value = raw;
      // A slow older write cannot overwrite a later summary for this account.
      cacheWrites = cacheWrites.then(async () => {
        if (owner === session) await deps.writeCache(owner.userId, value);
      }).catch(() => {});
    }
  }
  function apply(value: unknown, owner = session) {
    const next = normalizeUnread(value);
    if (owner !== session || !owner.token || !next) return false;
    revision++;
    dirty = false;
    raw = next;
    publish();
    return true;
  }
  function invalidate() { revision++; dirty = true; }
  function refresh(force = false): Promise<void> {
    if (force) dirty = true;
    if (!session.token || !foreground || mutationCount) return Promise.resolve();
    if (inFlight) {
      if (inFlight.controller.signal.aborted) retryAfterFlight = true;
      return inFlight.promise;
    }
    if (!dirty) return Promise.resolve();
    const owner = session, startedRevision = revision;
    const controller = new AbortController();
    const request = { controller, promise: Promise.resolve() };
    inFlight = request;
    request.promise = (async () => {
      try {
        const value = await deps.fetchSummary(owner, controller.signal);
        if (owner !== session || controller.signal.aborted) return;
        if (revision === startedRevision) {
          if (!apply(value, owner)) throw new Error("Invalid unread summary");
        } else if (dirty) {
          // A message/optimistic action arrived after this read started.
          retryAfterFlight = true;
        }
      } catch {
        // Keep cached state on transport/HTTP/parse failure. Retry on the next
        // lifecycle/event/manual trigger; never start an error polling loop.
      } finally {
        if (inFlight === request) {
          inFlight = null;
          const retry = retryAfterFlight;
          retryAfterFlight = false;
          if (retry && dirty) void refresh();
        }
      }
    })();
    return request.promise;
  }
  function setSession(next: UnreadSession) {
    if (session.token === next.token && session.userId === next.userId) return false;
    const previousUser = session.userId;
    inFlight?.controller.abort();
    inFlight = null;
    retryAfterFlight = false;
    session = next;
    mutationCount = 0;
    mutations.clear();
    seen.clear();
    if (previousUser) { activePeer = ""; activeOwner = null; }
    raw = EMPTY;
    invalidate();
    publish(false);
    if (!next.token || !next.userId) return true;
    const startedRevision = revision;
    void deps.readCache(next.userId).then(value => {
      const cached = normalizeUnread(value);
      if (session === next && revision === startedRevision && cached) {
        raw = cached;
        publish(false);
      }
    }).catch(() => {});
    return true;
  }
  function setForeground(value: boolean) {
    if (foreground === value) return;
    foreground = value;
    if (!value) inFlight?.controller.abort();
    // Foreground entry reconciles messages missed while suspended/disconnected.
    dirty = true;
  }
  function clearPeer(peerId: string, userId = session.userId) {
    if (!peerId || userId !== session.userId) return;
    const byPeer = { ...raw.byPeer };
    delete byPeer[peerId];
    raw = normalizeUnread({ byPeer })!;
    invalidate();
    publish();
  }
  function setPeerUnread(peerId: string, unread: boolean, userId = session.userId) {
    if (!peerId || userId !== session.userId) return;
    if (!unread) return clearPeer(peerId, userId);
    raw = normalizeUnread({ byPeer: { ...raw.byPeer, [peerId]: Math.max(1, raw.byPeer[peerId] || 0) } })!;
    invalidate();
    publish();
  }
  function enterPeer(peerId: string) {
    const owner = {};
    activeOwner = owner;
    activePeer = peerId;
    publish(false);
    return () => {
      if (activeOwner !== owner) return;
      activeOwner = null;
      activePeer = "";
      publish(false);
    };
  }
  function incoming(value: any, reaction = false) {
    const message = value?.message || value;
    const peer = String(reaction ? message?.peerId || message?.from || message?.reactorId || message?.userId || ""
      : message?.from || message?.fromId || message?.senderId || message?.userId || "");
    const id = String(message?.id || (reaction ? `${peer}:${message?.time || ""}:${message?.emoji || ""}` : ""));
    if (!session.token || !id || !peer || peer === session.userId || peer === activePeer) return false;
    if (message?.to && String(message.to) !== session.userId) return false;
    const key = `${reaction ? "reaction" : "message"}:${id}`, now = Date.now();
    if (seen.has(key) && now - seen.get(key)! < 8000) return false;
    for (const [old, time] of seen) if (now - time >= 8000) seen.delete(old);
    seen.set(key, now);
    raw = normalizeUnread({ byPeer: { ...raw.byPeer, [peer]: (raw.byPeer[peer] || 0) + 1 } })!;
    invalidate();
    publish();
    return true;
  }
  function mutate<T extends { summary?: unknown }>(key: string,
    work: (owner: UnreadSession) => Promise<T>, optimistic?: () => void): Promise<T> {
    const existing = mutations.get(key);
    if (existing) return existing;
    if (!session.token) return Promise.reject(new Error("NO_TOKEN"));
    const owner = session;
    mutationCount++;
    optimistic?.();
    const startedRevision = revision;
    const task = (async () => {
      try {
        const result = await work(owner);
        if (owner === session) {
          const summary = normalizeUnread(result.summary);
          if (summary && (revision === startedRevision || same(raw, summary))) apply(summary, owner);
          else dirty = true; // Missing summary/overlapping writes need one shared reconciliation.
        }
        return result;
      } catch (error) {
        if (owner === session) dirty = true;
        throw error;
      } finally {
        if (owner === session) {
          mutationCount--;
          mutations.delete(key);
          if (dirty) void refresh();
        }
      }
    })();
    mutations.set(key, task);
    return task;
  }
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot, getSession: () => session,
    hasPending: () => dirty, isForeground: () => foreground,
    setSession, setForeground, apply, invalidate, refresh, clearPeer, setPeerUnread, enterPeer, incoming, mutate,
  };
}
