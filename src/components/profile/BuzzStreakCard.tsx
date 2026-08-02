/**
 * ============================================================
 * 📁 File: src/components/profile/BuzzStreakCard.tsx
 * 🎯 Purpose: Daily BuzzStreak card (mobile)
 *
 * Backend source of truth:
 *  - GET  /api/streak/get
 *  - POST /api/streak/checkin
 *
 * Rules:
 *  - NO frontend streak math
 *  - NO assumptions
 *  - Backend controls reset / miss / rewards
 * ============================================================
 */

import { API_BASE } from "@/src/config/api";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const RBZ = {
  c1: "#b1123c",
  c3: "#e9486a",
  c4: "#eb5656ff",
  white: "#ffffff",
};

type DailyStreakResponse = {
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

type CachedBuzzStreak = {
  count: number;
  checkedToday: boolean;
  lastCheckIn: string | null;
  rewardEveryDays: number;
  rewardAmountBC: number;
  cachedAt: number;
};

const CACHE_KEY = "RBZ_BUZZSTREAK_CACHE_V1";
const DEFAULT_REWARD_EVERY_DAYS = 7;
const DEFAULT_REWARD_AMOUNT_BC = 100;

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function normalizeStreakPayload(data: DailyStreakResponse): CachedBuzzStreak {
  const streak: NonNullable<DailyStreakResponse["streak"]> = data?.streak ?? {
    count: 0,
    lastCheckIn: null,
    rewardEveryDays: DEFAULT_REWARD_EVERY_DAYS,
    rewardAmountBC: DEFAULT_REWARD_AMOUNT_BC,
    nextRewardInDays: DEFAULT_REWARD_EVERY_DAYS,
  };

  return {
    count: Math.max(0, Number(streak.count || 0)),
    checkedToday: !!data?.checkedToday,
    lastCheckIn: streak.lastCheckIn || null,
    rewardEveryDays: Number(streak.rewardEveryDays || DEFAULT_REWARD_EVERY_DAYS),
    rewardAmountBC: Number(streak.rewardAmountBC || DEFAULT_REWARD_AMOUNT_BC),
    cachedAt: Date.now(),
  };
}

function getCycleDay(count: number, rewardEveryDays: number) {
  const safeCount = Math.max(0, Number(count || 0));
  const safeRewardDays = Math.max(1, Number(rewardEveryDays || DEFAULT_REWARD_EVERY_DAYS));
  const remainder = safeCount % safeRewardDays;

  if (safeCount > 0 && remainder === 0) return safeRewardDays;

  return remainder;
}

function getNextCycleDay(count: number, rewardEveryDays: number) {
  const safeRewardDays = Math.max(1, Number(rewardEveryDays || DEFAULT_REWARD_EVERY_DAYS));
  const nextCount = Math.max(1, Number(count || 0) + 1);

  return getCycleDay(nextCount, safeRewardDays) || 1;
}

async function readCachedBuzzStreak() {
  try {
    const raw = await SecureStore.getItemAsync(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedBuzzStreak;
    const today = getTodayKey();

    return {
      ...parsed,
      checkedToday: parsed.lastCheckIn === today,
    };
  } catch {
    return null;
  }
}

async function writeCachedBuzzStreak(next: CachedBuzzStreak) {
  try {
    await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(next));
  } catch {
    // cache failure should never block profile
  }
}

export default function BuzzStreakCard() {
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const [count, setCount] = useState(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [rewardEveryDays, setRewardEveryDays] = useState(DEFAULT_REWARD_EVERY_DAYS);
  const [rewardAmountBC, setRewardAmountBC] = useState(DEFAULT_REWARD_AMOUNT_BC);
  const [rewardFlashBC, setRewardFlashBC] = useState(0);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
  });

 const applyCachedState = (next: CachedBuzzStreak) => {
  setCount(next.count);
  setCheckedToday(next.checkedToday);
  setRewardEveryDays(next.rewardEveryDays);
  setRewardAmountBC(next.rewardAmountBC);
};

 const loadCachedStreak = async () => {
  const cached = await readCachedBuzzStreak();

  if (cached) {
    applyCachedState(cached);
  }

  setHydrated(true);
  setLoading(false);
};

 const loadStreak = async (opts?: { background?: boolean }) => {
  const background = !!opts?.background;

  try {
    if (!background && !hydrated) {
      setLoading(true);
    }

    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) return;

    const res = await fetch(`${API_BASE}/streak/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json()) as DailyStreakResponse;

    if (!res.ok) {
      throw new Error((data as any)?.error || "Failed to load BuzzStreak");
    }

    const next = normalizeStreakPayload(data);

    applyCachedState(next);
    await writeCachedBuzzStreak(next);
  } catch (e) {
    console.log("BuzzStreak load failed", e);
  } finally {
    setHydrated(true);
    setLoading(false);
  }
};


 const checkInToday = async () => {
  if (checkedToday || checkingIn) return;

  const previous = {
    count,
    checkedToday,
    rewardEveryDays,
    rewardAmountBC,
  };

  try {
    setCheckingIn(true);
    setRewardFlashBC(0);

    // Instant optimistic UI. Backend still decides the real streak.
    const optimisticCount = Math.max(1, count + 1);
    setCount(optimisticCount);
    setCheckedToday(true);

    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) throw new Error("Missing token");

    const res = await fetch(`${API_BASE}/streak/checkin`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json()) as DailyStreakResponse;

    if (!res.ok) {
      throw new Error((data as any)?.error || "Failed to check in");
    }

    const next = normalizeStreakPayload(data);

    applyCachedState(next);
    await writeCachedBuzzStreak(next);

    if (data?.rewarded && data?.reward?.amountBC) {
      setRewardFlashBC(Number(data.reward.amountBC || 0));
    }
  } catch (e) {
    console.log("BuzzStreak check-in failed", e);

    setCount(previous.count);
    setCheckedToday(previous.checkedToday);
    setRewardEveryDays(previous.rewardEveryDays);
    setRewardAmountBC(previous.rewardAmountBC);
  } finally {
    setCheckingIn(false);
  }
};


  useEffect(() => {
    loadCachedStreak();
    loadStreak({ background: true });
  }, []);

  const cycleDay = useMemo(
    () => getCycleDay(count, rewardEveryDays),
    [count, rewardEveryDays]
  );

  const nextCycleDay = useMemo(
    () => getNextCycleDay(count, rewardEveryDays),
    [count, rewardEveryDays]
  );

  const progress = Math.min(cycleDay / rewardEveryDays, 1);
  const daysLeft =
    cycleDay >= rewardEveryDays ? rewardEveryDays : rewardEveryDays - cycleDay;

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

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
       <LinearGradient
        colors={[RBZ.c3, RBZ.c4]}
        style={{
          borderRadius: 18,
          padding: 13,
        }}
      >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <View style={{ flex: 1 }}>
            <Text style={{ color: RBZ.white, fontWeight: "900", fontSize: 15 }}>
              🔥 BuzzStreak - Day {cycleDay || 0} of {rewardEveryDays}
            </Text>

            <Text
              style={{
                marginTop: 3,
                color: "rgba(255,255,255,0.92)",
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              Earn {rewardAmountBC} BC every {rewardEveryDays}-day streak
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.18)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
            }}
          >
            <Text style={{ color: RBZ.white, fontWeight: "900", fontSize: 12 }}>
              {todayLabel}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
              <View
          style={{
            marginTop: 11,
            height: 8,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.25)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: RBZ.white,
            }}
          />
        </View>

        <View
          style={{
            marginTop: 8,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: RBZ.white, fontWeight: "900", fontSize: 12 }}>
            Day {cycleDay} of {rewardEveryDays}
          </Text>
          <Text style={{ color: RBZ.white, fontWeight: "900", fontSize: 12 }}>
            Reward: {rewardAmountBC} BC
          </Text>
        </View>

        <Text style={{ marginTop: 8, color: RBZ.white, fontWeight: "700", fontSize: 12 }}>
          {subtitle}
        </Text>

        {rewardFlashBC > 0 && (
          <View
            style={{
              marginTop: 8,
              padding: 9,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.18)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
            }}
          >
            <Text style={{ color: RBZ.white, fontWeight: "900" }}>
              🎉 {rewardFlashBC} BC added to your spendable balance!
            </Text>
          </View>
        )}

            <Pressable
          disabled={checkedToday || checkingIn}
          onPress={checkInToday}
          style={{
            marginTop: 10,
            backgroundColor:
              checkedToday || checkingIn ? "rgba(255,255,255,0.62)" : RBZ.white,
            paddingVertical: 9,
            borderRadius: 13,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: RBZ.c3,
              fontWeight: "900",
            }}
          >
            {buttonLabel}
          </Text>
        </Pressable>

        <Text
          style={{
            marginTop: 8,
            color: "rgba(255,255,255,0.9)",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          Miss a day and your streak restarts from Day 1.
          {loading && !hydrated ? " Syncing…" : ""}
        </Text>
      </LinearGradient>
    </View>
  );
}