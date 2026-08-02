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
import * as SecureStore from "expo-secure-store";
import { DeviceEventEmitter } from "react-native";

let tokenMemory: string | null = null;
let tokenLoadedAt = 0;

let userMemory: any | null = null;
let userLoadedAt = 0;

const TOKEN_MEMORY_TTL_MS = 60_000;
const USER_MEMORY_TTL_MS = 60_000;

export const RBZ_AUTH_EXPIRED_EVENT = "rbz:auth:expired";

let authExpiredCleanupPromise: Promise<void> | null = null;

export async function rbzGetAuthToken(force = false) {
  const now = Date.now();

  if (!force && tokenMemory && now - tokenLoadedAt < TOKEN_MEMORY_TTL_MS) {
    return tokenMemory;
  }

  const token =
    (await SecureStore.getItemAsync("RBZ_TOKEN")) ||
    (await SecureStore.getItemAsync("token")) ||
    "";

  tokenMemory = token || "";
  tokenLoadedAt = now;

  return tokenMemory;
}

export async function rbzGetCurrentUser(force = false) {
  const now = Date.now();

  if (!force && userMemory && now - userLoadedAt < USER_MEMORY_TTL_MS) {
    return userMemory;
  }

  const raw = await SecureStore.getItemAsync("RBZ_USER");

  let user = null;

  try {
    user = raw ? JSON.parse(raw) : null;
  } catch {
    await SecureStore.deleteItemAsync("RBZ_USER");
    user = null;
  }

  userMemory = user;
  userLoadedAt = now;

  return userMemory;
}

export function rbzPrimeCurrentUser(user: any) {
  userMemory = user || null;
  userLoadedAt = Date.now();
}

export function rbzForgetAuthToken() {
  tokenMemory = null;
  tokenLoadedAt = 0;
  userMemory = null;
  userLoadedAt = 0;
}

export async function rbzClearStoredAuth() {
  rbzForgetAuthToken();

  await Promise.allSettled([
    SecureStore.deleteItemAsync("RBZ_TOKEN"),
    SecureStore.deleteItemAsync("token"),
    SecureStore.deleteItemAsync("RBZ_USER"),
    SecureStore.deleteItemAsync("user"),
  ]);
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
  const json = text ? safeJson(text) : {};

  if (!response.ok) {
    const message =
      typeof json?.message === "string"
        ? json.message
        : typeof json?.error === "string"
        ? json.error
        : text || `HTTP ${response.status}`;

    if (needsAuth && rbzIsExpiredAuthError(response.status, message)) {
      await rbzHandleExpiredAuth(message);
    }

    throw new Error(message);
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

async function rbzHandleExpiredAuth(message: string) {
  if (!authExpiredCleanupPromise) {
    authExpiredCleanupPromise = (async () => {
      await rbzClearStoredAuth();

      DeviceEventEmitter.emit(RBZ_AUTH_EXPIRED_EVENT, {
        message: message || "Invalid or expired token",
      });
    })().finally(() => {
      authExpiredCleanupPromise = null;
    });
  }

  await authExpiredCleanupPromise;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}