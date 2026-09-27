import { perfSpan } from "../diagnostics/core";
/**
 * ============================================================
 * 📁 File: src/performance/api/rbzApiClient.ts
 * 🎯 Purpose: Shared lightweight API client for perceived-speed work
 *
 * Fixes:
 *  - avoids repeated SecureStore token reads in every screen/helper
 *  - keeps fetch handling consistent
 *  - clears bad/expired auth tokens once the backend rejects them
 *  - emits one shared auth-expired event so the app can redirect to login
 *  - safely handles corrupted cached user JSON
 *  - does not replace your backend stack
 * ============================================================
 */

import { API_BASE } from "@/src/config/api";
import {
  clearSession, initializeSession, refreshSession,
} from "@/src/features/auth/rbzSession";
import { DeviceEventEmitter } from "react-native";

export const RBZ_AUTH_EXPIRED_EVENT = "rbz:auth:expired";

export async function rbzGetAuthToken(force = false) {
  return (await (force ? refreshSession() : initializeSession())).token;
}

export async function rbzGetCurrentUser(force = false) {
  return (await (force ? refreshSession() : initializeSession())).user;
}

export async function rbzClearStoredAuth() {
  await clearSession();
}

export async function rbzApiJson<T = any>(
  path: string,
  options?: RequestInit & { auth?: boolean }
): Promise<T> {
  const needsAuth = options?.auth !== false;
  const token = needsAuth ? await rbzGetAuthToken() : "";

  if (needsAuth && !token) {
    throw new Error("NO_TOKEN");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(needsAuth ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const text = await response.text();
  const stopParse = perfSpan("json.parse.shared-api");
  const json = text ? safeJson(text) : {};
  stopParse();

  if (!response.ok) {
    const message =
      typeof json?.message === "string"
        ? json.message
        : typeof json?.error === "string"
        ? json.error
        : text || `HTTP ${response.status}`;

    if (needsAuth && rbzIsExpiredAuthError(response.status, message)) {
      await rbzHandleExpiredAuth(message, token);
    }

    throw Object.assign(new Error(message), { status: response.status });
  }

  return json as T;
}

function rbzIsExpiredAuthError(status: number, message: string) {
  const lower = String(message || "").toLowerCase();

  return (
    status === 401 ||
    lower.includes("invalid or expired token") ||
    lower.includes("jwt expired") ||
    lower.includes("invalid token") ||
    lower.includes("unauthorized")
  );
}

async function rbzHandleExpiredAuth(message: string, token: string) {
  if (await clearSession(token)) {
    DeviceEventEmitter.emit(RBZ_AUTH_EXPIRED_EVENT, {
      message: message || "Invalid or expired token",
    });
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
