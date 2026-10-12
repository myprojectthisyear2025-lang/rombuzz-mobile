/** Same-account profile caching; old hook instances cannot publish into a new session. */
import { useMemo } from "react";
import { rbzApiJson } from "@/src/performance/api/rbzApiClient";
import { rbzCacheGet, rbzCacheSet } from "@/src/performance/cache/rbzCache";
import { getSessionGeneration, getSessionSnapshot, isSessionCurrent, persistCurrentUser } from "@/src/features/auth/rbzSession";
import { sessionUserId } from "@/src/features/auth/rbzSessionStorage";

export function useCachedProfile() {
  const owner = getSessionGeneration();
  return useMemo(() => {
    const userId = sessionUserId(getSessionSnapshot().user);
    const valid = () => !!userId && isSessionCurrent(owner);
    const key = "RBZ_PERF_PROFILE_FULL:" + userId;
    const readCachedProfile = async () => {
      if (!valid()) return { user: null, savedAt: 0, hit: false };
      const cached = await rbzCacheGet<{ user: any }>(key, { user: null });
      const hit = valid() && cached.hit && sessionUserId(cached.value?.user) === userId;
      return { user: hit ? cached.value.user : null, savedAt: hit ? cached.savedAt : 0, hit };
    };
    const writeCachedProfile = async (user: any) => {
      if (!valid() || sessionUserId(user) !== userId) return null;
      await rbzCacheSet(key, { user });
      if (!valid()) return null;
      await persistCurrentUser(user, owner);
      return valid() ? user : null;
    };
    const fetchProfileFresh = async () => {
      if (!valid()) throw new Error("SESSION_CHANGED");
      const data = await rbzApiJson<any>("/profile/full");
      const user = await writeCachedProfile(data?.user);
      if (!valid()) throw new Error("SESSION_CHANGED");
      return { user, raw: data };
    };
    return { readCachedProfile, writeCachedProfile, fetchProfileFresh };
  }, [owner]);
}
