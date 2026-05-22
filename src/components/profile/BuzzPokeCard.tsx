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
 * - Sends normal free buzz via POST /buzz
 * - Long press opens premium Buzz picker
 * - Paid Buzzes require confirmation unless remembered
 * - Paid Buzzes send through POST /premium-buzz/send
 * - Respects backend cooldown
 * - Sends streak/time state back to parent via onMetaChange
 * ============================================================
 */

import BuzzTypePicker from "@/src/components/buzz/BuzzTypePicker";
import PaidBuzzConfirmSheet from "@/src/components/buzz/PaidBuzzConfirmSheet";
import PremiumBuzzSenderBurst from "@/src/components/buzz/PremiumBuzzSenderBurst";
import { useBuzzCoinBalance } from "@/src/components/buzz/useBuzzCoinBalance";
import { useBuzzSelection } from "@/src/components/buzz/useBuzzSelection";
import { API_BASE } from "@/src/config/api";
import {
  formatBuzzPrice,
  getNormalBuzzType,
  type BuzzType,
} from "@/src/config/buzzTypes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  muted: "#6b7280",
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
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [buzzing, setBuzzing] = useState(false);
  const [paidBuzzing, setPaidBuzzing] = useState(false);
  const [retryLeft, setRetryLeft] = useState(0);
  const [streak, setStreak] = useState<StreakPayload>({
    count: 0,
    lastBuzz: null,
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingBuzzType, setPendingBuzzType] = useState<BuzzType | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [senderBurstType, setSenderBurstType] = useState<BuzzType | null>(null);

  const {
    selectedBuzzType,
    selectedBuzzTypeId,
    quickSendPaidBuzz,
    saveSelection,
  } = useBuzzSelection(userId);

  const {
    spendableBalance,
    balanceLoading,
    loadSpendableBalance,
    updateSpendableBalanceFromPayload,
  } = useBuzzCoinBalance();

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

  useEffect(() => {
    if (!matched) return;
    loadSpendableBalance();
  }, [loadSpendableBalance, matched]);

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

  const showSenderBurst = useCallback((type: BuzzType) => {
    setSenderBurstType(type);

    setTimeout(() => {
      setSenderBurstType(null);
    }, 2200);
  }, []);

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

  const openBuyBuzzCoin = useCallback(() => {
    setConfirmOpen(false);
    setPendingBuzzType(null);
    setRememberChoice(false);
    setPickerOpen(false);

    router.push("/premium" as any);
  }, [router]);

  const sendPaidBuzz = useCallback(
    async (type: BuzzType, rememberAfterSend: boolean) => {
      if (!matched || !userId) return;
      if (!type.isPaid) {
        await sendBuzz();
        return;
      }

      if (paidBuzzing) return;
      if (retryLeft > 0) return;

      try {
        setPaidBuzzing(true);

        const token = await getToken();
        if (!token) {
          Alert.alert("Session expired", "Please log in again.");
          return;
        }

        const res = await fetch(`${API_BASE}/premium-buzz/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: userId,
            buzzType: type.id,
          }),
        });

        const data = await res.json().catch(() => ({}));

        updateSpendableBalanceFromPayload(data);

        if (res.status === 402 || data?.code === "INSUFFICIENT_BUZZCOIN") {
          setConfirmOpen(true);
          setPendingBuzzType(type);
          return;
        }

        if (res.status === 429) {
          const retryInMs = Number(data?.retryInMs || 3000);
          const retrySeconds = Math.max(1, Math.ceil(retryInMs / 1000));
          setRetryLeft(retrySeconds);
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error || "Failed to send premium Buzz");
        }

        if (rememberAfterSend) {
          await saveSelection(type, true);
        }

        const nextCount = Number(data?.streak || streakCount || 0);
        const nextLastBuzz = new Date().toISOString();

        setStreak((prev) => ({
          ...prev,
          count: nextCount,
          lastBuzz: nextLastBuzz,
        }));

        emitMeta(nextCount, nextLastBuzz);
        showSenderBurst(type);
        setRetryLeft(3);

        setConfirmOpen(false);
        setPendingBuzzType(null);
        setRememberChoice(false);
      } catch (err: any) {
        Alert.alert(
          "Premium Buzz failed",
          err?.message || "Something went wrong."
        );
      } finally {
        setPaidBuzzing(false);
      }
    },
    [
      emitMeta,
      getToken,
      matched,
      paidBuzzing,
      retryLeft,
      saveSelection,
      sendBuzz,
      showSenderBurst,
      streakCount,
      updateSpendableBalanceFromPayload,
      userId,
    ]
  );

  const handleMainPress = useCallback(() => {
    if (!selectedBuzzType.isPaid) {
      sendBuzz();
      return;
    }

    if (quickSendPaidBuzz) {
      sendPaidBuzz(selectedBuzzType, true);
      return;
    }

    setPendingBuzzType(selectedBuzzType);
    setRememberChoice(false);
    setConfirmOpen(true);
  }, [quickSendPaidBuzz, selectedBuzzType, sendBuzz, sendPaidBuzz]);

  const handleLongPress = useCallback(() => {
    loadSpendableBalance();
    setPickerOpen(true);
  }, [loadSpendableBalance]);

  const handleSelectBuzzType = useCallback(
    async (type: BuzzType) => {
      setPickerOpen(false);

      if (!type.isPaid) {
        await saveSelection(getNormalBuzzType(), false);
        return;
      }

      setPendingBuzzType(type);
      setRememberChoice(false);
      setConfirmOpen(true);
    },
    [saveSelection]
  );

  const handleCancelConfirm = useCallback(() => {
    if (paidBuzzing) return;

    setConfirmOpen(false);
    setPendingBuzzType(null);
    setRememberChoice(false);
  }, [paidBuzzing]);

  const handleSendConfirmedPaidBuzz = useCallback(() => {
    if (!pendingBuzzType) return;
    sendPaidBuzz(pendingBuzzType, rememberChoice);
  }, [pendingBuzzType, rememberChoice, sendPaidBuzz]);

  if (!matched) return null;

  const buttonDisabled =
    buzzing || paidBuzzing || retryLeft > 0 || loading;

  const buttonText = buzzing
    ? "Buzzing..."
    : paidBuzzing
    ? "Sending..."
    : loading
    ? "Loading..."
    : retryLeft > 0
    ? `Retry ${retryLeft}s`
    : selectedBuzzType.isPaid
    ? `${selectedBuzzType.emoji} ${selectedBuzzType.shortLabel}`
    : "Buzz";

  return (
    <View style={styles.slot}>
      <Pressable
        onPress={handleMainPress}
        onLongPress={handleLongPress}
        delayLongPress={260}
        disabled={buttonDisabled}
        style={({ pressed }) => [
          styles.buttonWrap,
          pressed && !buttonDisabled ? { opacity: 0.94 } : null,
        ]}
      >
        <LinearGradient
          colors={
            buttonDisabled
              ? ["#d1d5db", "#9ca3af"]
              : selectedBuzzType.isPaid
              ? (selectedBuzzType.gradient as any)
              : [RBZ.c2, RBZ.c4]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {buzzing || paidBuzzing || loading ? (
            <ActivityIndicator size="small" color={RBZ.white} />
          ) : selectedBuzzType.isPaid ? (
            <Text style={styles.buttonEmoji}>{selectedBuzzType.emoji}</Text>
          ) : (
            <Ionicons
              name={retryLeft > 0 ? "time-outline" : "flash"}
              size={18}
              color={RBZ.white}
            />
          )}

          <View style={styles.buttonTextWrap}>
            <Text numberOfLines={1} style={styles.buttonText}>
              {buttonText}
            </Text>

            {selectedBuzzType.isPaid && !buttonDisabled ? (
              <Text numberOfLines={1} style={styles.buttonSubText}>
                {formatBuzzPrice(selectedBuzzType)}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </Pressable>

      <BuzzTypePicker
        visible={pickerOpen}
        selectedBuzzTypeId={selectedBuzzTypeId}
        spendableBalance={spendableBalance}
        balanceLoading={balanceLoading}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectBuzzType}
      />

      <PaidBuzzConfirmSheet
        visible={confirmOpen}
        buzzType={pendingBuzzType}
        spendableBalance={spendableBalance}
        rememberChoice={rememberChoice}
        sending={paidBuzzing}
        onRememberChoiceChange={setRememberChoice}
        onCancel={handleCancelConfirm}
        onSend={handleSendConfirmedPaidBuzz}
        onBuyBuzzCoin={openBuyBuzzCoin}
      />

      <PremiumBuzzSenderBurst
        visible={!!senderBurstType}
        buzzType={senderBurstType}
      />
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
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  buttonEmoji: {
    fontSize: 17,
  },
  buttonTextWrap: {
    minWidth: 0,
    alignItems: "center",
  },
  buttonText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 14,
    maxWidth: 78,
  },
  buttonSubText: {
    marginTop: -1,
    color: "rgba(255,255,255,0.86)",
    fontWeight: "800",
    fontSize: 10,
    maxWidth: 78,
  },
});