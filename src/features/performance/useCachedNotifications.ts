/**
 * ============================================================
 * 📁 File: src/features/performance/useCachedNotifications.ts
 * 🎯 Purpose: Cached/stale-first notifications for RomBuzz mobile
 *
 * Goal:
 *  - Notifications screen renders instantly with cached data
 *  - Fresh backend data refreshes quietly
 *  - Bottom notification badge stays synced through cache + event
 * ============================================================
 */

import { rbzApiJson } from "@/src/performance/api/rbzApiClient";
import {
  rbzCacheGet,
  rbzCacheSet,
} from "@/src/performance/cache/rbzCache";
import * as SecureStore from "expo-secure-store";
import { DeviceEventEmitter } from "react-native";

export type CachedNotificationItem = {
  id: string;
  read?: boolean;
  type?: string;
  createdAt?: string | Date;
  [key: string]: any;
};

const NOTIFICATIONS_CACHE_KEY = "RBZ_PERF_NOTIFICATIONS";
const NOTIF_UNREAD_TOTAL_KEY = "RBZ_notif_unread_total";

const emptyNotifications: CachedNotificationItem[] = [];

function normalizeNotifications(data: any): CachedNotificationItem[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.notifications)
    ? data.notifications
    : [];

  return [...list].sort(
    (a: CachedNotificationItem, b: CachedNotificationItem) =>
      new Date(b?.createdAt || 0).getTime() -
      new Date(a?.createdAt || 0).getTime()
  );
}

function unreadTotal(list: CachedNotificationItem[]) {
  return (Array.isArray(list) ? list : []).reduce((acc, n) => {
    return !n?.read ? acc + 1 : acc;
  }, 0);
}

async function publishUnreadTotal(total: number) {
  const safeTotal = Math.max(0, Number(total || 0) || 0);

  try {
    await SecureStore.setItemAsync(NOTIF_UNREAD_TOTAL_KEY, String(safeTotal));
  } catch {}

  try {
    DeviceEventEmitter.emit("rbz:notif:unread-total", { total: safeTotal });
  } catch {}
}

export function useCachedNotifications() {
  const readCachedNotifications = async () => {
    const cached = await rbzCacheGet<CachedNotificationItem[]>(
      NOTIFICATIONS_CACHE_KEY,
      emptyNotifications
    );

    return {
      notifications: normalizeNotifications(cached.value),
      savedAt: cached.savedAt,
      hit: cached.hit,
    };
  };

  const writeCachedNotifications = async (notifications: CachedNotificationItem[]) => {
    const normalized = normalizeNotifications(notifications);

    await rbzCacheSet<CachedNotificationItem[]>(
      NOTIFICATIONS_CACHE_KEY,
      normalized
    );

    await publishUnreadTotal(unreadTotal(normalized));

    return normalized;
  };

  const fetchNotificationsFresh = async () => {
    const data = await rbzApiJson<any>("/notifications");
    const normalized = normalizeNotifications(data);

    await writeCachedNotifications(normalized);

    return normalized;
  };

  return {
    readCachedNotifications,
    writeCachedNotifications,
    fetchNotificationsFresh,
  };
}