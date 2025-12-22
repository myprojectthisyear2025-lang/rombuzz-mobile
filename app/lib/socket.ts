/**
 * =====================================================================
 * 📁 File: app/lib/socket.ts
 * 🎯 Purpose: Shared Socket.IO client for RomBuzz Mobile
 *
 * - Connects to backend Socket.IO server with JWT token (RBZ_TOKEN)
 * - Reuses a single connection across the app
 * - Handles reconnect attempts
 * - Exported helper: ensureMobileSocketAuth() → Promise<Socket>
 *
 * NOTE:
 *   - Expects SOCKET_URL to be exported from `src/config/api`
 *     alongside API_BASE (same pattern as login.tsx).
 * =====================================================================
 */

import * as SecureStore from "expo-secure-store";
import io, { Socket } from "socket.io-client";
import { API_BASE, SOCKET_URL } from "../../src/config/api"; // SOCKET_URL must exist here

// Optional: if you haven't defined SOCKET_URL yet, you can implement it
// in src/config/api like:
// export const SOCKET_URL = API_BASE.replace(/\/api$/, "");

let socketPromise: Promise<Socket> | null = null;
let currentSocket: Socket | null = null;

const SOCKET_PATH = "/socket.io";

/**
 * Ensure a single authenticated Socket.IO connection.
 */
export async function ensureMobileSocketAuth(): Promise<Socket> {
  if (socketPromise && currentSocket) {
    return socketPromise;
  }

  socketPromise = (async () => {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    if (!token) {
      throw new Error("No RBZ_TOKEN found in SecureStore for socket auth.");
    }

    const url = SOCKET_URL ?? API_BASE.replace(/\/api\/?$/, "");

    const s: Socket = io(url, {
      transports: ["websocket"],
      path: SOCKET_PATH,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    currentSocket = s;

    return await new Promise<Socket>((resolve, reject) => {
      const onConnect = () => {
        cleanup();
        resolve(s);
      };

      const onError = (err: any) => {
        cleanup();
        try {
          s.close();
        } catch {}
        currentSocket = null;
        socketPromise = null;
        reject(err);
      };

      const cleanup = () => {
        s.off("connect", onConnect);
        s.off("connect_error", onError);
        s.off("error", onError);
      };

      s.on("connect", onConnect);
      s.on("connect_error", onError);
      s.on("error", onError);
    });
  })();

  return socketPromise;
}

/**
 * Optional helper if you ever need to force close on logout.
 */
export function disconnectMobileSocket() {
  if (currentSocket) {
    try {
      currentSocket.disconnect();
      currentSocket.close();
    } catch {}
  }
  currentSocket = null;
  socketPromise = null;
}
