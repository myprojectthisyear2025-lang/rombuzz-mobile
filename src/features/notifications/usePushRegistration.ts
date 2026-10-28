/** Serializes device token ownership across logout, rotation, permission changes and account switches. */
import { API_BASE } from "@/src/config/api";
import { getSessionGeneration, getSessionSnapshot, isSessionCurrent, subscribeSession } from "@/src/features/auth/rbzSession";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { AppState, DeviceEventEmitter, Platform } from "react-native";
import { forgetTransferredPushCleanup, queuePushCleanup, syncPushOwner as register, retryPushCleanup, type PushOwner as Owner } from "./pushTokenCleanup";

const OWNER_KEY = "RBZ_PUSH_OWNER_V2";
const TOKEN_KEY = "RBZ_PUSH_TOKEN_CURRENT";
export const PUSH_PREFERENCES_CHANGED = "rbz:push-preferences-changed";
let queue = Promise.resolve();
let preferenceOwner = -1;
let preferences: Record<string, boolean> = {};
export function setPushPreferences(next: Record<string, boolean>, owner: number) {
  if (!isSessionCurrent(owner)) return;
  preferences = next; preferenceOwner = owner;
}
export function shouldPresentPush(data: any) {
  const session = getSessionSnapshot();
  const id = String(session.user?.id || session.user?._id || "");
  if (!session.token || !id || String(data?.recipientId || data?.receiverId || "") !== id) return false;
  const prefs = preferenceOwner === getSessionGeneration() ? preferences : session.user?.settings?.notifications || {};
  const type = String(data?.type || data?.notificationType || "");
  const category = /message|video_call/.test(type) ? "messages" : /match|buzz/.test(type) ? "buzz"
    : /wingman/.test(type) ? "wingman" : "likes";
  return prefs.push !== false && prefs[category] !== false;
}

export function usePushRegistration(Notifications: any, enabled: boolean) {
  useEffect(() => {
    if (!Notifications) return;
    let alive = true;
    const pushAvailable = Platform.OS !== "android" ||
      Constants.expoConfig?.extra?.androidPushEnabled !== false;
    const enqueue = (ask = false) => {
      const generation = getSessionGeneration();
      const session = getSessionSnapshot();
      const userId = String(session.user?.id || session.user?._id || "");
      const valid = () => alive && enabled && pushAvailable && isSessionCurrent(generation) && !!userId;
      queue = queue.catch(() => {}).then(async () => {
        let previous: Owner | null = null;
        try { previous = JSON.parse(await SecureStore.getItemAsync(OWNER_KEY) || "null"); } catch {}
        // Adopt the old installation token only to reconcile its authenticated owner.
        if (!previous && session.token && userId) {
          const legacy = await SecureStore.getItemAsync(TOKEN_KEY);
          if (legacy) {
            previous = { authToken: session.token, userId, pushToken: legacy };
            await SecureStore.setItemAsync(OWNER_KEY, JSON.stringify(previous));
          }
        }
        if (previous && (!valid() || previous.userId !== userId || previous.authToken !== session.token)) {
          await queuePushCleanup(previous);
          await SecureStore.deleteItemAsync(OWNER_KEY);
          previous = null;
        }
        await retryPushCleanup();
        if (!valid()) return;
        // Read server preferences before asking the OS or reusing any saved token.
        const response = await fetch(`${API_BASE}/settings`, { headers: { Authorization: `Bearer ${session.token}` } });
        if (!response.ok) throw new Error("Push preferences unavailable");
        const prefs = (await response.json())?.settings?.notifications || {};
        if (!valid()) return;
        setPushPreferences(prefs, generation);
        if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("default", {
          name: "RomBuzz", importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250], lightColor: "#b1123c",
        });
        if (!valid()) return;
        let permission = await Notifications.getPermissionsAsync();
        if (prefs.push !== false && valid() && (ask || permission.status === "undetermined") && permission.canAskAgain !== false) {
          permission = await Notifications.requestPermissionsAsync();
        }
        if (!valid()) return;
        if (permission.status !== "granted" || prefs.push === false) {
          const token = previous?.pushToken || await SecureStore.getItemAsync(TOKEN_KEY);
          if (token) await queuePushCleanup({ authToken: session.token, userId, pushToken: token });
          await SecureStore.deleteItemAsync(OWNER_KEY);
          await retryPushCleanup();
          return;
        }
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (!projectId) throw new Error("Expo project ID unavailable");
        const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId }))?.data;
        if (!valid() || !pushToken) return;
        const next = { authToken: session.token, userId, pushToken };
        if (previous && previous.pushToken !== pushToken) {
          await queuePushCleanup(previous);
          await retryPushCleanup();
        }
        // Persist the pending owner before the request: failed logout cleanup must survive restart.
        await SecureStore.setItemAsync(OWNER_KEY, JSON.stringify(next));
        if (!valid()) {
          await queuePushCleanup(next); await SecureStore.deleteItemAsync(OWNER_KEY); await retryPushCleanup(); return;
        }
        // Always reconcile with the server; a local synced marker is not server truth.
        await register(next, "POST");
        await forgetTransferredPushCleanup(pushToken);
        if (!valid()) { await queuePushCleanup(next); await SecureStore.deleteItemAsync(OWNER_KEY); await retryPushCleanup(); return; }
        await SecureStore.setItemAsync(TOKEN_KEY, pushToken);
        await SecureStore.setItemAsync(OWNER_KEY, JSON.stringify(next));
      }).catch(() => { console.warn("Push registration could not complete; retrying on next foreground or preference change."); });
    };
    let observedGeneration = getSessionGeneration();
    const unsubscribe = subscribeSession(() => {
      if (observedGeneration === getSessionGeneration()) return;
      observedGeneration = getSessionGeneration();
      void Notifications.dismissAllNotificationsAsync().catch(() => {});
      enqueue();
    });
    const app = AppState.addEventListener("change", state => { if (state === "active") enqueue(); });
    const rotation = Notifications.addPushTokenListener(() => enqueue());
    const preference = DeviceEventEmitter.addListener(PUSH_PREFERENCES_CHANGED, ({ askPermission } = {}) => enqueue(!!askPermission));
    enqueue();
    return () => { alive = false; unsubscribe(); app.remove(); rotation.remove(); preference.remove(); };
  }, [Notifications, enabled]);
}
