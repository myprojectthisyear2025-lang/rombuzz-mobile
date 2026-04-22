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
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const RBZ = {
  c1: "#b1123c",
  c3: "#e9486a",
  c4: "#eb5656ff",
  white: "#ffffff",
};

type DailyStreakResponse = {
  streak: {
    count: number;
    lastCheckIn: string | null;
  };
  checkedToday: boolean;
};

const REWARD_DAYS = [1, 3, 7, 14, 30, 50];

function getNextRewardDay(count: number) {
  return REWARD_DAYS.find((d) => d > count) ?? null;
}

export default function BuzzStreakCard() {
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [checkedToday, setCheckedToday] = useState(false);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
  });


 const loadStreak = async () => {
  try {
    setLoading(true);

    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    const res = await fetch(`${API_BASE}/streak/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json()) as DailyStreakResponse;

    setCount(data.streak?.count ?? 0);
    setCheckedToday(!!data.checkedToday);
  } catch (e) {
    console.log("BuzzStreak load failed", e);
  } finally {
    setLoading(false);
  }
};


 const checkInToday = async () => {
  try {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    await fetch(`${API_BASE}/streak/checkin`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await loadStreak();
  } catch (e) {
    console.log("BuzzStreak check-in failed", e);
  }
};


  useEffect(() => {
    loadStreak();
  }, []);

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator />
      </View>
    );
  }

  const nextRewardDay = getNextRewardDay(count);
  const progress =
    nextRewardDay !== null ? Math.min(count / nextRewardDay, 1) : 1;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
      <LinearGradient
        colors={[RBZ.c3, RBZ.c4]}
        style={{
          borderRadius: 20,
          padding: 16,
        }}
      >
        <Text style={{ color: RBZ.white, fontWeight: "900", fontSize: 16 }}>
          🔥 BuzzStreak — Day {count} ({todayLabel})
        </Text>

        {/* Progress bar */}
        <View
          style={{
            marginTop: 12,
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

        <Text style={{ marginTop: 8, color: RBZ.white }}>
          {nextRewardDay
            ? `${nextRewardDay - count} days to your next milestone`
            : "You’re on fire 🔥"}
        </Text>

        <Pressable
          disabled={checkedToday}
          onPress={checkInToday}
          style={{
            marginTop: 12,
            backgroundColor: checkedToday ? "rgba(255,255,255,0.6)" : RBZ.white,
            paddingVertical: 10,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: RBZ.c3,
              fontWeight: "900",
            }}
          >
            {checkedToday ? "Checked in today" : "Check In Today"}
          </Text>
        </Pressable>

        <Text
          style={{
            marginTop: 8,
            color: "rgba(255,255,255,0.9)",
            fontSize: 12,
          }}
        >
          Tap to start your BuzzStreak 🔥
        </Text>
      </LinearGradient>
    </View>
  );
}