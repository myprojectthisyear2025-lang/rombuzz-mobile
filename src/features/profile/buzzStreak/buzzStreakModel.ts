/**
 * Path: src/features/profile/buzzStreak/buzzStreakModel.ts
 * Purpose: Existing BuzzStreak response/cache types and normalization helpers.
 * Used by: useBuzzStreak.ts.
 */

export type DailyStreakResponse = {
  success?: boolean;
  streak?: {
    count: number;
    lastCheckIn: string | null;
    rewardEveryDays?: number;
    rewardAmountBC?: number;
    nextRewardInDays?: number;
  };
  checkedToday?: boolean;
  alreadyCheckedIn?: boolean;
  missed?: boolean;
  rewarded?: boolean;
  reward?: {
    amountBC: number;
    streakDay: number;
    referenceId?: string;
  } | null;
  wallet?: {
    balanceBC?: number;
    spendableBalance?: number;
    pendingBC?: number;
    earnedBC?: number;
  } | null;
};

export type CachedBuzzStreak = {
  count: number;
  checkedToday: boolean;
  lastCheckIn: string | null;
  rewardEveryDays: number;
  rewardAmountBC: number;
  cachedAt: number;
};

export const BUZZ_STREAK_CACHE_KEY =
  "RBZ_BUZZSTREAK_CACHE_V1";

export const DEFAULT_REWARD_EVERY_DAYS = 7;
export const DEFAULT_REWARD_AMOUNT_BC = 100;

export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function normalizeStreakPayload(
  data: DailyStreakResponse
): CachedBuzzStreak {
  const streak = data?.streak ?? {
    count: 0,
    lastCheckIn: null,
    rewardEveryDays:
      DEFAULT_REWARD_EVERY_DAYS,
    rewardAmountBC:
      DEFAULT_REWARD_AMOUNT_BC,
    nextRewardInDays:
      DEFAULT_REWARD_EVERY_DAYS,
  };

  return {
    count: Math.max(
      0,
      Number(streak.count || 0)
    ),
    checkedToday:
      !!data?.checkedToday,
    lastCheckIn:
      streak.lastCheckIn || null,
    rewardEveryDays: Number(
      streak.rewardEveryDays ||
        DEFAULT_REWARD_EVERY_DAYS
    ),
    rewardAmountBC: Number(
      streak.rewardAmountBC ||
        DEFAULT_REWARD_AMOUNT_BC
    ),
    cachedAt: Date.now(),
  };
}

export function getCycleDay(
  count: number,
  rewardEveryDays: number
) {
  const safeCount = Math.max(
    0,
    Number(count || 0)
  );

  const safeRewardDays = Math.max(
    1,
    Number(
      rewardEveryDays ||
        DEFAULT_REWARD_EVERY_DAYS
    )
  );

  const remainder =
    safeCount % safeRewardDays;

  if (
    safeCount > 0 &&
    remainder === 0
  ) {
    return safeRewardDays;
  }

  return remainder;
}

export function getNextCycleDay(
  count: number,
  rewardEveryDays: number
) {
  const safeRewardDays = Math.max(
    1,
    Number(
      rewardEveryDays ||
        DEFAULT_REWARD_EVERY_DAYS
    )
  );

  const nextCount = Math.max(
    1,
    Number(count || 0) + 1
  );

  return (
    getCycleDay(
      nextCount,
      safeRewardDays
    ) || 1
  );
}