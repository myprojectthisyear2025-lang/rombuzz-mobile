/** Device-local, account-specific feature consent; an OS grant alone never enables GPS. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getSessionGeneration, getSessionSnapshot, isSessionCurrent } from "@/src/features/auth/rbzSession";
import { sessionUserId } from "@/src/features/auth/rbzSessionStorage";

export function createLocationConsent(
  key: string,
  valid: () => boolean,
  storage = AsyncStorage,
  requestPermission = Location.requestForegroundPermissionsAsync,
) {
  let enabled = false, revision = 0;
  let writes = Promise.resolve();
  const listeners = new Set<() => void>();
  const publish = (next: boolean) => { enabled = next; listeners.forEach(fn => fn()); };
  const persist = (next: boolean) => {
    writes = writes.catch(() => {}).then(() => storage.setItem(key, String(next)));
    return writes;
  };
  return {
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    getSnapshot: () => valid() && enabled,
    isEnabled: () => valid() && enabled,
    getRevision: () => revision,
    async load() {
      const version = revision;
      const raw = await storage.getItem(key).catch(() => null);
      if (valid() && version === revision) {
        if (enabled !== (raw === "true")) revision++;
        publish(raw === "true");
      }
    },
    async enable() {
      const version = ++revision;
      const permission = await requestPermission().catch(() => ({ status: "denied" }));
      if (!valid() || version !== revision) return false;
      const granted = permission.status === "granted";
      try { await persist(granted); } catch { publish(false); return false; }
      if (!valid() || version !== revision) return false;
      publish(granted);
      return valid() && enabled && version === revision;
    },
    async disable() {
      revision++;
      publish(false);
      await persist(false).catch(() => storage.removeItem(key).catch(() => {}));
    },
    dispose() { revision++; publish(false); },
  };
}

export function useLocationConsent(feature: "discover" | "microbuzz") {
  const owner = getSessionGeneration();
  const store = useMemo(() => {
    const id = sessionUserId(getSessionSnapshot().user);
    return createLocationConsent(`RBZ_LOCATION_CHOICE_V1:${id}:${feature}`, () => !!id && isSessionCurrent(owner));
  }, [feature, owner]);
  const enabled = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    void store.load();
    return () => store.dispose();
  }, [store]);
  return useMemo(() => ({ ...store, enabled }), [store, enabled]);
}
