import { perfCacheRead } from "../diagnostics/cache";
/**
 * ============================================================
 * 📁 File: src/performance/cache/rbzCache.ts
 * 🎯 Purpose: Small stale-first cache helper for RomBuzz mobile
 *
 * Rules:
 *  - SecureStore persists across launches
 *  - in-memory cache avoids repeated JSON parsing during one app session
 *  - never throws into screens
 * ============================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { getSessionSnapshot, getSessionGeneration, isSessionCurrent, subscribeSession } from "@/src/features/auth/rbzSession";
import { sessionUserId } from "@/src/features/auth/rbzSessionStorage";

type CacheEnvelope<T> = {
  value: T;
  savedAt: number;
};

const memory = new Map<string, CacheEnvelope<any>>();
let memoryOwner = getSessionGeneration();
subscribeSession(() => {
  if (memoryOwner !== getSessionGeneration()) memory.clear();
  memoryOwner = getSessionGeneration();
});

// Never adopt legacy unowned cache entries. Same-account caches survive restart.
function privateKey(key: string) {
  const session = getSessionSnapshot();
  const id = sessionUserId(session.user);
  return session.token && id ? `RBZ_PRIVATE_V1:${id}:${key}` : "";
}

export function rbzCacheKey(...parts: Array<string | number | null | undefined>) {
  return parts
    .filter((p) => p !== null && p !== undefined && String(p).trim())
    .map((p) => String(p).trim())
    .join(":");
}

export async function rbzCacheGet<T>(
  key: string,
  fallback: T
): Promise<{ value: T; savedAt: number; hit: boolean }> {
  const done = perfCacheRead(key);
  const owner = getSessionGeneration();
  key = privateKey(key);
  if (!key) return done({ value: fallback, savedAt: 0, hit: false }, "persistent-miss");
  try {
    const mem = memory.get(key);
    if (mem) {
      return done({ value: mem.value as T, savedAt: mem.savedAt, hit: true }, "memory");
    }

    // Performance caches can be much larger than SecureStore's safe payload
    // size. AsyncStorage is the primary persistent store for these JSON blobs.
    let raw = await AsyncStorage.getItem(key);

    if (!raw || !isSessionCurrent(owner)) {
      return done({
        value: fallback,
        savedAt: 0,
        hit: false,
      }, "persistent-miss");
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;

    if (!parsed || typeof parsed !== "object" || !("value" in parsed)) {
      return done({
        value: fallback,
        savedAt: 0,
        hit: false,
      }, "invalid");
    }

    const savedAt = Number(parsed.savedAt || 0) || 0;

    const envelope: CacheEnvelope<T> = {
      value: parsed.value,
      savedAt,
    };

    memory.set(key, envelope);

    return done({
      value: parsed.value,
      savedAt,
      hit: true,
    }, "persistent");
  } catch {
    return done({
      value: fallback,
      savedAt: 0,
      hit: false,
    }, "error");
  }
}

export async function rbzCacheSet<T>(key: string, value: T) {
  key = privateKey(key);
  if (!key) return;
  try {
    const envelope: CacheEnvelope<T> = {
      value,
      savedAt: Date.now(),
    };

    const raw = JSON.stringify(envelope);

    memory.set(key, envelope);
    await AsyncStorage.setItem(key, raw);

    // Remove any legacy SecureStore copy without delaying the screen.
    SecureStore.deleteItemAsync(key).catch(() => {});
  } catch {}
}

export async function rbzCacheRemove(key: string) {
  key = privateKey(key);
  if (!key) return;
  try {
    memory.delete(key);

    await Promise.allSettled([
      AsyncStorage.removeItem(key),
      SecureStore.deleteItemAsync(key),
    ]);
  } catch {}
}

export function rbzCachePrime<T>(key: string, value: T) {
  key = privateKey(key);
  if (!key) return;
  memory.set(key, { value, savedAt: Date.now() });
}

export function rbzCacheIsFresh(savedAt: number, ttlMs: number) {
  if (!savedAt || !ttlMs) return false;
  return Date.now() - savedAt < ttlMs;
}
