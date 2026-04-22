/**
 * ============================================================
 * 📁 File: src/components/profile/BuzzPokeCard.tsx
 * 🎯 Purpose: Compact matched-user Buzz/Poke action for View Profile
 *
 * UI RULE:
 * - This component renders ONLY the Buzz button
 * - Parent screen (view-profile.tsx) renders streak/time under name
 *
 * BEHAVIOR:
 * - Visible only for matched users
 * - Loads directed streak from GET /matchstreak/:otherUserId
 * - Sends buzz via POST /buzz
 * - Respects backend cooldown (3 seconds)
 * - Sends streak/time state back to parent via onMetaChange
 * ============================================================
 */

import { API_BASE } from "@/src/config/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
};

export type BuzzPokeMeta = {
  count: number;
  lastBuzz: string | null;
  lastBuzzLabel: string;
};

type Props = {
  userId: string;
  matched: boolean;
  onMetaChange?: (meta: BuzzPokeMeta) => void;
};

type StreakPayload = {
  from?: string;
  to?: string;
  count?: number;
  lastBuzz?: string | null;
  createdAt?: string | null;
};

function formatLastBuzz(value?: string | null) {
  if (!value) return "No buzz yet";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No buzz yet";

  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));

  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function BuzzPokeCard({
  userId,
  matched,
  onMetaChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [buzzing, setBuzzing] = useState(false);
  const [retryLeft, setRetryLeft] = useState(0);
  const [streak, setStreak] = useState<StreakPayload>({
    count: 0,
    lastBuzz: null,
  });

  const streakCount = Number(streak?.count || 0);

  const lastBuzzLabel = useMemo(() => {
    return formatLastBuzz(streak?.lastBuzz || null);
  }, [streak?.lastBuzz]);

  useEffect(() => {
    if (retryLeft <= 0) return;
    const t = setTimeout(() => {
      setRetryLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [retryLeft]);

  const getToken = useCallback(async () => {
    return await SecureStore.getItemAsync("RBZ_TOKEN");
  }, []);

  const emitMeta = useCallback(
    (count: number, lastBuzz: string | null) => {
      onMetaChange?.({
        count,
        lastBuzz,
        lastBuzzLabel: formatLastBuzz(lastBuzz),
      });
    },
    [onMetaChange]
  );

  const loadStreak = useCallback(async () => {
    if (!matched || !userId) {
      setStreak({ count: 0, lastBuzz: null });
      emitMeta(0, null);
      return;
    }

    try {
      setLoading(true);

      const token = await getToken();
      if (!token) {
        setStreak({ count: 0, lastBuzz: null });
        emitMeta(0, null);
        return;
      }

      const res = await fetch(
        `${API_BASE}/matchstreak/${encodeURIComponent(String(userId))}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load buzz streak");
      }

      const payload = data?.streak || {};
      const nextCount = Number(payload?.count || 0);
      const nextLastBuzz = payload?.lastBuzz || null;

      setStreak({
        count: nextCount,
        lastBuzz: nextLastBuzz,
        from: payload?.from,
        to: payload?.to,
        createdAt: payload?.createdAt,
      });

      emitMeta(nextCount, nextLastBuzz);
    } catch {
      setStreak({ count: 0, lastBuzz: null });
      emitMeta(0, null);
    } finally {
      setLoading(false);
    }
  }, [emitMeta, getToken, matched, userId]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const sendBuzz = useCallback(async () => {
    if (!matched || !userId) return;
    if (buzzing) return;
    if (retryLeft > 0) return;

    try {
      setBuzzing(true);

      const token = await getToken();
      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        return;
      }

      const res = await fetch(`${API_BASE}/buzz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: userId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        const retryInMs = Number(data?.retryInMs || 3000);
        const retrySeconds = Math.max(1, Math.ceil(retryInMs / 1000));
        setRetryLeft(retrySeconds);
        return;
      }

      if (!res.ok) {
        if (res.status === 409) {
          Alert.alert("Not matched", "Buzz is only available for matched users.");
          return;
        }
        throw new Error(data?.error || "Failed to buzz");
      }

      const nextCount = Number(data?.streak || 0);
      const nextLastBuzz = new Date().toISOString();

      setStreak((prev) => ({
        ...prev,
        count: nextCount,
        lastBuzz: nextLastBuzz,
      }));

      emitMeta(nextCount, nextLastBuzz);
      setRetryLeft(3);
    } catch (err: any) {
      Alert.alert("Buzz failed", err?.message || "Something went wrong.");
    } finally {
      setBuzzing(false);
    }
  }, [buzzing, emitMeta, getToken, matched, retryLeft, userId]);

  if (!matched) return null;

  return (
    <View style={styles.slot}>
      <Pressable
        onPress={sendBuzz}
        disabled={buzzing || retryLeft > 0 || loading}
        style={({ pressed }) => [
          styles.buttonWrap,
          pressed && !buzzing && retryLeft <= 0 ? { opacity: 0.94 } : null,
        ]}
      >
        <LinearGradient
          colors={
            buzzing || retryLeft > 0 || loading
              ? ["#d1d5db", "#9ca3af"]
              : [RBZ.c2, RBZ.c4]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {buzzing || loading ? (
            <ActivityIndicator size="small" color={RBZ.white} />
          ) : (
            <Ionicons
              name={retryLeft > 0 ? "time-outline" : "flash"}
              size={18}
              color={RBZ.white}
            />
          )}

          <Text style={styles.buttonText}>
            {buzzing
              ? "Buzzing..."
              : loading
              ? "Loading..."
              : retryLeft > 0
              ? `Retry ${retryLeft}s`
              : "Buzz"}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 122,
    alignItems: "stretch",
  },
  buttonWrap: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 15,
  },
});