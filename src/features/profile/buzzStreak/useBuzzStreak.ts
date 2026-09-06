/**
 * Path: src/features/profile/buzzStreak/useBuzzStreak.ts
 * Purpose: Preserves BuzzStreak cache, API, optimistic check-in, and rollback behavior.
 * Used by: ProfileBuzzStreakCard.tsx.
 */

import { API_BASE } from "@/src/config/api";
import * as SecureStore from "expo-secure-store";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BUZZ_STREAK_CACHE_KEY,
  CachedBuzzStreak,
  DEFAULT_REWARD_AMOUNT_BC,
  DEFAULT_REWARD_EVERY_DAYS,
  DailyStreakResponse,
  getCycleDay,
  getNextCycleDay,
  getTodayKey,
  normalizeStreakPayload,
} from "./buzzStreakModel";

async function readCachedBuzzStreak() {
  try {
    const raw =
      await SecureStore.getItemAsync(
        BUZZ_STREAK_CACHE_KEY
      );

    if (!raw) return null;

    const parsed =
      JSON.parse(
        raw
      ) as CachedBuzzStreak;

    return {
      ...parsed,
      checkedToday:
        parsed.lastCheckIn ===
        getTodayKey(),
    };
  } catch {
    return null;
  }
}

async function writeCachedBuzzStreak(
  next: CachedBuzzStreak
) {
  try {
    await SecureStore.setItemAsync(
      BUZZ_STREAK_CACHE_KEY,
      JSON.stringify(next)
    );
  } catch {
    // Cache failure must never block Profile.
  }
}

export default function useBuzzStreak() {
  const [loading, setLoading] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  const [checkingIn, setCheckingIn] =
    useState(false);

  const [count, setCount] =
    useState(0);

  const [
    checkedToday,
    setCheckedToday,
  ] = useState(false);

  const [
    rewardEveryDays,
    setRewardEveryDays,
  ] = useState(
    DEFAULT_REWARD_EVERY_DAYS
  );

  const [
    rewardAmountBC,
    setRewardAmountBC,
  ] = useState(
    DEFAULT_REWARD_AMOUNT_BC
  );

  const [
    rewardFlashBC,
    setRewardFlashBC,
  ] = useState(0);

  const applyCachedState = (
    next: CachedBuzzStreak
  ) => {
    setCount(next.count);

    setCheckedToday(
      next.checkedToday
    );

    setRewardEveryDays(
      next.rewardEveryDays
    );

    setRewardAmountBC(
      next.rewardAmountBC
    );
  };

  const loadCachedStreak =
    async () => {
      const cached =
        await readCachedBuzzStreak();

      if (cached) {
        applyCachedState(cached);
      }

      setHydrated(true);
      setLoading(false);
    };

  const loadStreak = async (
    opts?: {
      background?: boolean;
    }
  ) => {
    const background =
      !!opts?.background;

    try {
      if (
        !background &&
        !hydrated
      ) {
        setLoading(true);
      }

      const token =
        await SecureStore.getItemAsync(
          "RBZ_TOKEN"
        );

      if (!token) return;

      const res = await fetch(
        `${API_BASE}/streak/get`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        (await res.json()) as
          DailyStreakResponse;

      if (!res.ok) {
        throw new Error(
          (data as any)?.error ||
            "Failed to load BuzzStreak"
        );
      }

      const next =
        normalizeStreakPayload(
          data
        );

      applyCachedState(next);

      await writeCachedBuzzStreak(
        next
      );
    } catch (e) {
      console.log(
        "BuzzStreak load failed",
        e
      );
    } finally {
      setHydrated(true);
      setLoading(false);
    }
  };

  const checkInToday =
    async () => {
      if (
        checkedToday ||
        checkingIn
      ) {
        return;
      }

      const previous = {
        count,
        checkedToday,
        rewardEveryDays,
        rewardAmountBC,
      };

      try {
        setCheckingIn(true);
        setRewardFlashBC(0);

        setCount(
          Math.max(
            1,
            count + 1
          )
        );

        setCheckedToday(true);

        const token =
          await SecureStore.getItemAsync(
            "RBZ_TOKEN"
          );

        if (!token) {
          throw new Error(
            "Missing token"
          );
        }

        const res = await fetch(
          `${API_BASE}/streak/checkin`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          (await res.json()) as
            DailyStreakResponse;

        if (!res.ok) {
          throw new Error(
            (data as any)?.error ||
              "Failed to check in"
          );
        }

        const next =
          normalizeStreakPayload(
            data
          );

        applyCachedState(next);

        await writeCachedBuzzStreak(
          next
        );

        if (
          data?.rewarded &&
          data?.reward?.amountBC
        ) {
          setRewardFlashBC(
            Number(
              data.reward.amountBC ||
                0
            )
          );
        }
      } catch (e) {
        console.log(
          "BuzzStreak check-in failed",
          e
        );

        setCount(previous.count);

        setCheckedToday(
          previous.checkedToday
        );

        setRewardEveryDays(
          previous.rewardEveryDays
        );

        setRewardAmountBC(
          previous.rewardAmountBC
        );
      } finally {
        setCheckingIn(false);
      }
    };

  useEffect(() => {
    loadCachedStreak();

    loadStreak({
      background: true,
    });
  }, []);

  const cycleDay = useMemo(
    () =>
      getCycleDay(
        count,
        rewardEveryDays
      ),
    [count, rewardEveryDays]
  );

  const nextCycleDay =
    useMemo(
      () =>
        getNextCycleDay(
          count,
          rewardEveryDays
        ),
      [count, rewardEveryDays]
    );

  const progress = Math.min(
    cycleDay / rewardEveryDays,
    1
  );

  const daysLeft =
    cycleDay >= rewardEveryDays
      ? rewardEveryDays
      : rewardEveryDays -
        cycleDay;

  const subtitle = checkedToday
    ? `You're checked in. ${daysLeft} day${daysLeft === 1 ? "" : "s"} until your next ${rewardAmountBC} BC reward.`
    : count <= 0
      ? `Start today. Check in ${rewardEveryDays} days straight to earn ${rewardAmountBC} BC.`
      : `Check in today for Day ${nextCycleDay} of ${rewardEveryDays}. ${daysLeft} day${daysLeft === 1 ? "" : "s"} to ${rewardAmountBC} BC.`;

  const buttonLabel = checkingIn
    ? "Checking in..."
    : checkedToday
      ? "Checked in today"
      : `Check in for Day ${nextCycleDay} of ${rewardEveryDays}`;

  return {
    loading,
    hydrated,
    checkingIn,
    checkedToday,
    rewardEveryDays,
    rewardAmountBC,
    rewardFlashBC,
    cycleDay,
    progress,
    subtitle,
    buttonLabel,

    todayLabel:
      new Date().toLocaleDateString(
        undefined,
        {
          weekday: "long",
        }
      ),

    checkInToday,
  };
}