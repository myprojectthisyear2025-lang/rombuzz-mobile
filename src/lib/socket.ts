/**
 * ============================================================
 * File: src/lib/socket.ts
 * Purpose: Global Socket.IO singleton for RomBuzz Mobile
 * ============================================================
 */

import { SOCKET_URL } from "@/src/config/api";
import * as SecureStore from "expo-secure-store";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

type NotificationPayload = any;

const notificationListeners = new Set<(n: NotificationPayload) => void>();
const NOTIFICATIONS_FALLBACK = "/(tabs)/notifications";

export function onNotification(cb: (n: NotificationPayload) => void) {
  notificationListeners.add(cb);
  return () => notificationListeners.delete(cb);
}

function emitNotification(n: NotificationPayload) {
  notificationListeners.forEach((cb) => {
    try {
      cb(n);
    } catch {}
  });
}

function firstNonEmpty(...values: any[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function encodeRouteParam(value: string) {
  return encodeURIComponent(String(value || "").trim());
}

export function normalizeNotificationHref(raw?: string) {
  if (!raw || !raw.trim()) return NOTIFICATIONS_FALLBACK;

  let fixed = raw.trim();
  if (!fixed.startsWith("/")) fixed = `/${fixed}`;

  if (fixed === "/discover") return "/(tabs)/discover";
  if (fixed === "/letsbuzz") return "/(tabs)/letsbuzz";
  if (fixed === "/notifications") return NOTIFICATIONS_FALLBACK;

  if (fixed.startsWith("/chat/")) {
    const peerId = fixed.replace("/chat/", "").split("?")[0];
    return peerId ? `/chat/${encodeRouteParam(peerId)}` : NOTIFICATIONS_FALLBACK;
  }

  if (fixed.startsWith("/viewprofile/")) {
    const withoutPrefix = fixed.replace("/viewprofile/", "");
    const [userPart, qs] = withoutPrefix.split("?");
    const params = new URLSearchParams(qs || "");
    const post = params.get("post");

    if (post) return `/(tabs)/letsbuzz?post=${encodeRouteParam(post)}`;
    if (userPart) return `/view-profile?id=${encodeRouteParam(userPart)}`;
    return NOTIFICATIONS_FALLBACK;
  }

  return fixed;
}

export function resolveNotificationHref(input: any) {
  const data =
    input?.data && typeof input.data === "object" && !Array.isArray(input.data)
      ? input.data
      : input || {};

  const type = firstNonEmpty(data.notificationType, data.type, input?.type).toLowerCase();
  const peerId = firstNonEmpty(data.peerId, data.chatPeerId);
  const userId = firstNonEmpty(
    data.userId,
    data.profileId,
    data.fromId,
    data.actorId,
    input?.fromId
  );
  const postId = firstNonEmpty(data.postId, data.entityId, input?.postId, input?.entityId);
  const explicitHref = firstNonEmpty(data.href, data.path, data.route, input?.href);

  if (peerId && (type === "message" || type === "chat" || data.screen === "chat")) {
    return `/chat/${encodeRouteParam(peerId)}`;
  }

  if (type === "wingman") return "/(tabs)/discover";

  const via = firstNonEmpty(data.via, input?.via).toLowerCase();

  // ------------------------------------------------------------------
  // MATCH REQUEST vs REAL MATCH
  // ------------------------------------------------------------------
  // Pending discover like / match request:
  //   type: "buzz"
  //   via:  "discover_like"
  // Must open DISCOVER PROFILE, not matched-only view-profile.
  if (type === "buzz") {
    if (via === "discover_like") {
      if (userId) return `/discover-profile?id=${encodeRouteParam(userId)}`;
      return NOTIFICATIONS_FALLBACK;
    }

    // Other buzz types can still go to matched profile if they are true matched interactions.
    if (userId) return `/view-profile?id=${encodeRouteParam(userId)}`;
    return NOTIFICATIONS_FALLBACK;
  }

  // Real mutual match notification
  if (type === "match") {
    if (userId) return `/view-profile?id=${encodeRouteParam(userId)}`;
    return NOTIFICATIONS_FALLBACK;
  }

  if (
    type === "like" ||
    type === "gift" ||
    type === "comment" ||
    type === "reaction" ||
    type === "new_post" ||
    type === "share"
  ) {
    if (postId) return `/(tabs)/letsbuzz?post=${encodeRouteParam(postId)}`;

    // A plain like is still pre-match, so it should open discover-profile.
    if (userId && type === "like") {
      return `/discover-profile?id=${encodeRouteParam(userId)}`;
    }

    if (userId && (type === "gift" || type === "new_post")) {
      return `/view-profile?id=${encodeRouteParam(userId)}`;
    }

    return type === "reaction" ? NOTIFICATIONS_FALLBACK : "/(tabs)/letsbuzz";
  }

  if (explicitHref) return normalizeNotificationHref(explicitHref);

  if (userId && (data.entity === "profile" || data.screen === "profile")) {
    return `/view-profile?id=${encodeRouteParam(userId)}`;
  }

  return NOTIFICATIONS_FALLBACK;
}

async function getUserIdSafe(): Promise<string> {
  try {
    const raw = await SecureStore.getItemAsync("RBZ_USER");
    if (!raw) return "";
    const u = JSON.parse(raw);
    return u?.id || u?._id || "";
  } catch {
    return "";
  }
}

export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) {
    return socket;
  }

  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
  });

  socket.on("connect", async () => {
    const uid = await getUserIdSafe();
    if (uid) {
      socket?.emit("user:register", uid);
    }
  });

  socket.on("disconnect", () => {});

  socket.on("notification", (payload) => {
    emitNotification(payload);
  });

  socket.on("notification:new_post", (payload) => {
    emitNotification(payload);
  });

  return socket;
}

export async function resetSocket() {
  try {
    socket?.disconnect();
  } catch {}
  socket = null;
}
