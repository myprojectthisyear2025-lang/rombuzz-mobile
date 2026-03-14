/**
 * ============================================================
 * 📁 File: src/lib/socket.ts
 * 🎯 Purpose: Global Socket.IO singleton for RomBuzz Mobile
 *
 * USED BY:
 *  - Chat list
 *  - Chat window
 *  - Notifications
 *  - Presence
 *
 * RULE:
 *  - ONE socket instance only
 *  - Reused everywhere
 *  - Extended safely (NO breaking changes)
 * ============================================================
 */

import { SOCKET_URL } from "@/src/config/api"; // ✅ SINGLE SOURCE OF TRUTH
import * as SecureStore from "expo-secure-store";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/* ============================================================
   🔔 Notification pub/sub (NON-INTRUSIVE)
   ============================================================ */

type NotificationPayload = any;

// Internal listeners for notifications screen
const notificationListeners = new Set<(n: NotificationPayload) => void>();

/**
 * Subscribe to real-time notifications
 * Used by notifications screen ONLY
 */
export function onNotification(cb: (n: NotificationPayload) => void) {
  notificationListeners.add(cb);
  return () => notificationListeners.delete(cb);
}

// Broadcast helper (internal use)
function emitNotification(n: NotificationPayload) {
  notificationListeners.forEach((cb) => {
    try {
      cb(n);
    } catch {}
  });
}

/* ============================================================
   🔐 Helpers
   ============================================================ */

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

/* ============================================================
   🔌 Socket singleton (SAFE + FIXED)
   ============================================================ */

/**
 * Get (or create) the single socket instance
 */
export async function getSocket(): Promise<Socket> {
  // Reuse active socket
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

  /* ============================================================
     🧠 Attach listeners ONCE (safe)
     ============================================================ */

  socket.on("connect", async () => {
    // 🔑 CRITICAL FIX:
    // Always register user on connect
    const uid = await getUserIdSafe();
    if (uid) {
      socket?.emit("user:register", uid);
    }
  });

  socket.on("disconnect", () => {
    // silent
  });

  // 🔔 Notifications (web parity)
  socket.on("notification", (payload) => {
    emitNotification(payload);
  });

  socket.on("notification:new_post", (payload) => {
    emitNotification(payload);
  });

  return socket;
}

/**
 * Fully reset socket (used on logout)
 */
export async function resetSocket() {
  try {
    socket?.disconnect();
  } catch {}
  socket = null;
}
