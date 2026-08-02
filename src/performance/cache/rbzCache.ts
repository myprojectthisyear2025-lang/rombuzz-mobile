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

type CacheEnvelope<T> = {
  value: T;
  savedAt: number;
};

const memory = new Map<string, CacheEnvelope<any>>();

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
  try {
    const mem = memory.get(key);
    if (mem) {
      return { value: mem.value as T, savedAt: mem.savedAt, hit: true };
    }

    // Performance caches can be much larger than SecureStore's safe payload
    // size. AsyncStorage is the primary persistent store for these JSON blobs.
    let raw = await AsyncStorage.getItem(key);

    // One-time migration for smaller cache entries written by older builds.
    if (!raw) {
      const legacyRaw = await SecureStore.getItemAsync(key).catch(() => null);

      if (legacyRaw) {
        raw = legacyRaw;

        AsyncStorage.setItem(key, legacyRaw).catch(() => {});
        SecureStore.deleteItemAsync(key).catch(() => {});
      }
    }

    if (!raw) {
      return {
        value: fallback,
        savedAt: 0,
        hit: false,
      };
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;

    if (!parsed || typeof parsed !== "object" || !("value" in parsed)) {
      return {
        value: fallback,
        savedAt: 0,
        hit: false,
      };
    }

    const savedAt = Number(parsed.savedAt || 0) || 0;

    const envelope: CacheEnvelope<T> = {
      value: parsed.value,
      savedAt,
    };

    memory.set(key, envelope);

    return {
      value: parsed.value,
      savedAt,
      hit: true,
    };
  } catch {
    return {
      value: fallback,
      savedAt: 0,
      hit: false,
    };
  }
}

export async function rbzCacheSet<T>(key: string, value: T) {
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
  try {
    memory.delete(key);

    await Promise.allSettled([
      AsyncStorage.removeItem(key),
      SecureStore.deleteItemAsync(key),
    ]);
  } catch {}
}

export function rbzCachePrime<T>(key: string, value: T) {
  memory.set(key, { value, savedAt: Date.now() });
}

export function rbzCacheIsFresh(savedAt: number, ttlMs: number) {
  if (!savedAt || !ttlMs) return false;
  return Date.now() - savedAt < ttlMs;
}