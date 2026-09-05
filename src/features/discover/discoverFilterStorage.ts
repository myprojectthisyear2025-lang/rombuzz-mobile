/**
 * ============================================================================
 * 📁 File: src/features/discover/discoverFilterStorage.ts
 * 🎯 Purpose: Persist each RomBuzz user's latest applied Discover filters.
 *
 * Filters are stored in AsyncStorage because they are app preferences,
 * not sensitive authentication data. Storage is scoped per signed-in user
 * so accounts using the same device do not share Discover preferences.
 * ============================================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { lookingForKeyFromValue } from "../../constants/lookingFor";

const FILTER_KEY_PREFIX = "RBZ_DISCOVER_FILTERS_V1";

async function getCurrentUserStorageId(): Promise<string> {
  try {
    const rawUser = await SecureStore.getItemAsync("RBZ_USER");

    if (!rawUser) return "anonymous";

    const user = JSON.parse(rawUser);

    const id = String(
      user?.id ||
      user?._id ||
      user?.email ||
      "anonymous"
    ).trim();

    return id || "anonymous";
  } catch {
    return "anonymous";
  }
}

async function getStorageKey(): Promise<string> {
  const userId = await getCurrentUserStorageId();

  return `${FILTER_KEY_PREFIX}:${userId}`;
}

export async function loadSavedDiscoverFilters<T>(
  fallback: T
): Promise<T> {
  try {
    const key = await getStorageKey();
    const raw = await AsyncStorage.getItem(key);

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }

    return {
      ...(fallback as any),
      ...parsed,
    } as T;
  } catch {
    return fallback;
  }
}

export async function saveDiscoverFilters(
  filters: unknown
): Promise<void> {
  try {
    const key = await getStorageKey();

    await AsyncStorage.setItem(
      key,
      JSON.stringify(filters)
    );
  } catch (error) {
    console.warn(
      "⚠️ Failed to save Discover filters:",
      error
    );
  }
}

/**
 * Keeps the saved Discover Looking For filter aligned when the user
 * explicitly changes their Looking For preference from Profile.
 *
 * Other Discover filters remain untouched.
 */
export async function syncProfileLookingForToDiscover(
  value?: string | null
): Promise<void> {
  try {
    const key = await getStorageKey();
    const raw = await AsyncStorage.getItem(key);

    const existing =
      raw && typeof raw === "string"
        ? JSON.parse(raw)
        : {};

    const normalized = lookingForKeyFromValue(value);

    const next = {
      ...existing,
      lookingFor: normalized ? [normalized] : [],
    };

    await AsyncStorage.setItem(
      key,
      JSON.stringify(next)
    );
  } catch (error) {
    console.warn(
      "⚠️ Failed to sync Profile Looking For to Discover:",
      error
    );
  }
}

export async function clearSavedDiscoverFilters(): Promise<void> {
  try {
    const key = await getStorageKey();
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(
      "⚠️ Failed to clear Discover filters:",
      error
    );
  }
}