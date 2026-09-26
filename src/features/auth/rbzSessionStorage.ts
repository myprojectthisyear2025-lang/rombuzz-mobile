import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// The JWT stays in SecureStore. Profile data follows the existing AsyncStorage
// cache policy; RBZ_USER retains both identity aliases for legacy ID readers.
export const RBZ_SESSION_USER_KEY = "RBZ_SESSION_USER_V1";

export function sessionUserId(user: any): string {
  return String(user?.id || user?._id || "").trim();
}

function parseUser(raw: string | null): any | null {
  try {
    const user = raw ? JSON.parse(raw) : null;
    return user && typeof user === "object" && !Array.isArray(user) ? user : null;
  } catch {
    return null;
  }
}

export async function persistSessionUser(user: any) {
  const id = sessionUserId(user);
  const identity = JSON.stringify({ id, _id: id, rbzSessionVersion: 1 });
  // IDs from Mongo are small. Never silently truncate an unexpected identity.
  if (identity.length > 512) throw new Error("Invalid session user ID");
  await AsyncStorage.setItem(RBZ_SESSION_USER_KEY, JSON.stringify(user));
  await SecureStore.setItemAsync("RBZ_USER", identity);
}

export async function readSessionStorage() {
  const [primaryToken, legacyToken, rawIdentity] = await Promise.all([
    SecureStore.getItemAsync("RBZ_TOKEN"),
    SecureStore.getItemAsync("token"),
    SecureStore.getItemAsync("RBZ_USER"),
  ]);
  const token = primaryToken || legacyToken || "";
  if (!token) return { token: "", user: null };
  if (!primaryToken && legacyToken) {
    await SecureStore.setItemAsync("RBZ_TOKEN", legacyToken);
  }
  const identity = parseUser(rawIdentity);
  if (!identity) {
    if (rawIdentity) await SecureStore.deleteItemAsync("RBZ_USER");
    return { token, user: null };
  }
  if (identity.rbzSessionVersion !== 1) {
    // Save the entire legacy user before replacing its secure copy. A failed
    // migration leaves the original readable and retries on the next refresh.
    await persistSessionUser(identity).catch(() => {});
    return { token, user: identity };
  }
  const cached = parseUser(await AsyncStorage.getItem(RBZ_SESSION_USER_KEY));
  const user = cached && sessionUserId(cached) === sessionUserId(identity)
    ? cached : identity;
  return { token, user };
}

export async function removeSessionStorage() {
  await Promise.allSettled([
    SecureStore.deleteItemAsync("RBZ_TOKEN"),
    SecureStore.deleteItemAsync("token"),
    SecureStore.deleteItemAsync("RBZ_USER"),
    SecureStore.deleteItemAsync("user"),
    AsyncStorage.removeItem(RBZ_SESSION_USER_KEY),
  ]);
}
