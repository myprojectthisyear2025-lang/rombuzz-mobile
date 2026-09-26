import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import { API_BASE } from "@/src/config/api";
import { clearSession } from "@/src/features/auth/rbzSession";
import { RBZ_AUTH_EXPIRED_EVENT } from "@/src/performance/api/rbzApiClient";
import { createUnreadStore, type UnreadSession } from "./createUnreadStore";

const cacheKey = (userId: string) => `RBZ_CHAT_UNREAD_V1:${userId}`;
export async function unreadRequest(owner: UnreadSession, path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers, Authorization: `Bearer ${owner.token}` },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && await clearSession(owner.token)) {
      DeviceEventEmitter.emit(RBZ_AUTH_EXPIRED_EVENT, { message: "Session expired" });
    }
    throw new Error(json?.error || json?.message || `HTTP ${response.status}`);
  }
  if (!json) throw new Error("Invalid unread response");
  return json;
}

export const chatUnread = createUnreadStore({
  fetchSummary: (owner, signal) => unreadRequest(owner, "/chat/unread-summary", { signal }),
  readCache: async userId => {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    const cached = raw ? JSON.parse(raw) : null;
    return cached?.userId === userId ? cached.summary : null;
  },
  writeCache: (userId, summary) => AsyncStorage.setItem(cacheKey(userId), JSON.stringify({ userId, summary })),
});

export function markChatRead(peerId: string) {
  return chatUnread.mutate(`read:${peerId}`, owner => unreadRequest(owner, "/chat/mark-read", {
    method: "POST", body: JSON.stringify({ peerId }),
  }), () => chatUnread.clearPeer(peerId));
}

// The current mobile UI has no mark-all button. Keep this single-owner action
// available without adding a new trigger or changing the backend contract.
export function markAllChatsRead() {
  return chatUnread.mutate("read:all", owner => unreadRequest(owner, "/chat/mark-all-read", {
    method: "POST", body: "{}",
  }), () => { chatUnread.apply({ byPeer: {} }); });
}
