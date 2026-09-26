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
const listeners = new Set<(value: RbzSession) => void>();

// Serializing storage work prevents a cold read/migration from overwriting a
// login, and prevents an in-flight profile write from surviving logout.
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
}

function publish(next: RbzSession) {
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
    refresh = serialize(async () => publish(await readSessionStorage()))
      .finally(() => { refresh = null; });
  }
  return refresh;
}

export function setSession(token: string, user: any): Promise<RbzSession> {
  return serialize(async () => {
    try {
      await persistSessionUser(user || null);
      await SecureStore.setItemAsync("RBZ_TOKEN", token);
      return publish({ token, user: user || null });
    } catch (error) {
      // Never leave a previous token paired with a partially written new user.
      await removeSessionStorage();
      publish({ token: "", user: null });
      throw error;
    }
  });
}

export async function persistCurrentUser(user: any) {
  await initializeSession();
  return serialize(async () => {
    if (!session.token || !user) return;
    const currentId = sessionUserId(session.user);
    const incomingId = sessionUserId(user);
    if (currentId && incomingId && currentId !== incomingId) return;
    // Some account responses contain only changed fields; retain identity.
    const next = currentId && !incomingId ? { ...session.user, ...user } : user;
    await persistSessionUser(next);
    publish({ ...session, user: next });
  });
}

// expectedToken protects a newly logged-in account from a late 401 belonging
// to the previous session. Logout intentionally omits the argument.
export function clearSession(expectedToken?: string): Promise<boolean> {
  return serialize(async () => {
    if (!initialized && expectedToken !== undefined) session = await readSessionStorage();
    if (expectedToken !== undefined && session.token !== expectedToken) return false;
    await removeSessionStorage();
    publish({ token: "", user: null });
    return true;
  });
}

export async function getCurrentUser() { return (await initializeSession()).user; }
