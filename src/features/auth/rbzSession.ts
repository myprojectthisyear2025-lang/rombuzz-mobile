import * as SecureStore from "expo-secure-store";
import {
  persistSessionUser, readSessionStorage, removeSessionStorage, sessionUserId,
} from "./rbzSessionStorage";

export type RbzSession = { token: string; user: any | null };
let session: RbzSession = { token: "", user: null };
let initialized = false;
let initialization: Promise<RbzSession> | null = null;
let refresh: Promise<RbzSession> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;
const listeners = new Set<(value: RbzSession) => void>();

// Serializing storage work prevents a cold read/migration from overwriting a
// login, and prevents an in-flight profile write from surviving logout.
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
}

function publish(next: RbzSession) {
  if (session.token !== next.token || sessionUserId(session.user) !== sessionUserId(next.user)) generation++;
  session = next;
  initialized = true;
  listeners.forEach(listener => {
    try { listener(session); } catch { console.warn("Session listener failed"); }
  });
  return session;
}

export function subscribeSession(listener: (value: RbzSession) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getSessionSnapshot() { return session; }
export function getSessionGeneration() { return generation; }
export function isSessionCurrent(owner: number) { return owner === generation && !!session.token; }

export function initializeSession(): Promise<RbzSession> {
  if (initialized) return Promise.resolve(session);
  if (!initialization) {
    initialization = refreshSession().finally(() => { initialization = null; });
  }
  return initialization;
}

// Explicitly called at startup and after returning from background, never on
// a timer or on navigation. Concurrent readers share the same native reads.
export function refreshSession(): Promise<RbzSession> {
  if (!refresh) {
    const owner = generation;
    refresh = serialize(async () => {
      const stored = await readSessionStorage();
      return owner === generation ? publish(stored) : session;
    })
      .finally(() => { refresh = null; });
  }
  return refresh;
}

export function setSession(token: string, user: any): Promise<RbzSession> {
  // Invalidate private UI and async work before any native storage operation.
  generation++;
  publish({ token: "", user: null });
  const owner = generation;
  return serialize(async () => {
    if (owner !== generation) return session;
    try {
      await persistSessionUser(user || null, token);
      await SecureStore.setItemAsync("RBZ_TOKEN", token);
      await SecureStore.deleteItemAsync("token");
      return owner === generation ? publish({ token, user: user || null }) : session;
    } catch (error) {
      // Never leave a previous token paired with a partially written new user.
      await removeSessionStorage();
      if (owner === generation) publish({ token: "", user: null });
      throw error;
    }
  });
}

export async function persistCurrentUser(user: any, owner = generation) {
  await initializeSession();
  return serialize(async () => {
    if (!isSessionCurrent(owner) || !user) return;
    const currentId = sessionUserId(session.user);
    const incomingId = sessionUserId(user);
    // Private profile writes must carry identity, including partial responses.
    if (!currentId || incomingId !== currentId) return;
    const next = { ...session.user, ...user };
    await persistSessionUser(next, session.token);
    if (isSessionCurrent(owner)) publish({ ...session, user: next });
  });
}

// expectedToken protects a newly logged-in account from a late 401 belonging
// to the previous session. Logout intentionally omits the argument.
export function clearSession(expectedToken?: string): Promise<boolean> {
  if (!initialized && expectedToken !== undefined) {
    return initializeSession().then(() => clearSession(expectedToken));
  }
  if (expectedToken !== undefined && session.token !== expectedToken) return Promise.resolve(false);
  generation++;
  publish({ token: "", user: null });
  return serialize(async () => {
    await removeSessionStorage();
    return true;
  });
}

export async function getCurrentUser() { return (await initializeSession()).user; }
