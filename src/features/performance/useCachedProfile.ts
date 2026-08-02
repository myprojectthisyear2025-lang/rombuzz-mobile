/**
 * ============================================================
 * 📁 File: src/features/performance/useCachedProfile.ts
 * 🎯 Purpose: Cached/stale-first Profile screen data
 *
 * Goal:
 *  - Profile opens instantly from cache
 *  - /profile/full refreshes quietly
 *  - RBZ_USER stays updated for layout/avatar/tab usage
 * ============================================================
 */

import {
  rbzApiJson,
  rbzPrimeCurrentUser,
} from "@/src/performance/api/rbzApiClient";
import {
  rbzCacheGet,
  rbzCacheSet,
} from "@/src/performance/cache/rbzCache";
import * as SecureStore from "expo-secure-store";
import { useMemo } from "react";

const PROFILE_FULL_CACHE_KEY = "RBZ_PERF_PROFILE_FULL";

type CachedProfile = {
  user: any | null;
};

export function useCachedProfile() {
  return useMemo(() => {
    const readCachedProfile = async () => {
      const cached = await rbzCacheGet<CachedProfile>(
        PROFILE_FULL_CACHE_KEY,
        { user: null }
      );

      return {
        user: cached.value?.user || null,
        savedAt: cached.savedAt,
        hit: cached.hit && !!cached.value?.user,
      };
    };

    const writeCachedProfile = async (user: any) => {
      if (!user) return null;

      await rbzCacheSet<CachedProfile>(PROFILE_FULL_CACHE_KEY, {
        user,
      });

      try {
        await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(user));
      } catch {}

      try {
        rbzPrimeCurrentUser(user);
      } catch {}

      return user;
    };

    const fetchProfileFresh = async () => {
      const data = await rbzApiJson<any>("/profile/full");
      const user = data?.user || null;

      if (user) {
        await writeCachedProfile(user);
      }

      return {
        user,
        raw: data,
      };
    };

    return {
      readCachedProfile,
      writeCachedProfile,
      fetchProfileFresh,
    };
  }, []);
}