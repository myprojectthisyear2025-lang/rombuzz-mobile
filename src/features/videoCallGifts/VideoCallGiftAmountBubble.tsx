/**
 * ============================================================================
 * 📁 File: src/features/videoCallGifts/VideoCallGiftAmountBubble.tsx
 * 🎥🎁 Purpose: Compact amount entry bubble for video-call BuzzCoin send/request.
 *
 * Used by:
 *   - VideoCallGiftOverlay.tsx
 *
 * Notes:
 *   - This is not a full-screen modal.
 *   - It floats over the active video call.
 *   - Request notes are capped at 100 characters.
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Mode = "send" | "request";

type Props = {
  visible: boolean;
  mode: Mode;
  loading?: boolean;
  errorMessage?: string;
  walletBalanceBC?: number | null;
  walletLoading?: boolean;
  onSubmit: (args: { amountBC: number; note: string }) => void;
  onClose: () => void;
  onBuyBuzzCoin?: () => void;
  style?: StyleProp<ViewStyle>;
};

const PRESET_AMOUNTS = [25, 50, 100, 250];

export default function VideoCallGiftAmountBubble({
  visible,
  mode,
  loading = false,
  errorMessage = "",
  walletBalanceBC = null,
  walletLoading = false,
  onSubmit,
  onClose,
  onBuyBuzzCoin,
  style,
}: Props) {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");

  const isRequest = mode === "request";

  const amountBC = useMemo(() => {
    const raw = customAmount.trim() ? Number(customAmount) : selectedAmount;
    return Math.floor(Number(raw) || 0);
  }, [customAmount, selectedAmount]);

  const canSubmit = amountBC > 0 && !loading;

  if (!visible) return null;

   const title = isRequest ? "Request BuzzCoin" : "Send BuzzCoin";
  const submitLabel = isRequest ? "Send request" : "Send gift";
  const helper = isRequest
    ? "Ask for BC without interrupting the call."
    : "Send BC directly to creator earnings.";

  const walletText =
    walletLoading
      ? "..."
      : typeof walletBalanceBC === "number"
        ? `${Math.max(0, Math.floor(walletBalanceBC)).toLocaleString()} BC`
        : "-- BC";

  const lowerError = String(errorMessage || "").toLowerCase();
  const isFundsError =
    lowerError.includes("insufficient") ||
    lowerError.includes("not enough") ||
    lowerError.includes("balance");

  return (
    <View pointerEvents="box-none" style={[styles.wrap, style]}>
        <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.helper}>{helper}</Text>
          </View>

          <View style={styles.headerRight}>
            {!isRequest ? (
              <View style={styles.walletPill}>
                <Text style={styles.walletLabel}>Funds</Text>
                <Text style={styles.walletValue}>{walletText}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={17} color="#7f1d3a" />
            </Pressable>
          </View>
        </View>

        <View style={styles.amountRow}>
          {PRESET_AMOUNTS.map((amount) => {
            const active = !customAmount.trim() && selectedAmount === amount;

            return (
              <Pressable
                key={amount}
                onPress={() => {
                  setCustomAmount("");
                  setSelectedAmount(amount);
                }}
                style={[styles.amountChip, active ? styles.amountChipActive : null]}
              >
                <Text style={[styles.amountChipText, active ? styles.amountChipTextActive : null]}>
                  {amount}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.customRow}>
                <TextInput
            value={customAmount}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
              setCustomAmount(cleaned);
            }}
            placeholder="Custom BC"
            placeholderTextColor="rgba(177,18,60,0.48)"
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.bcLabel}>BC</Text>
        </View>

        {isRequest ? (
          <View style={styles.noteBox}>
        <TextInput
              value={note}
              onChangeText={(text) => setNote(text.slice(0, 100))}
              placeholder="Optional note, max 100 characters"
              placeholderTextColor="rgba(177,18,60,0.48)"
              multiline
              maxLength={100}
              style={styles.noteInput}
            />
            <Text style={styles.counter}>{note.length}/100</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>

            {isFundsError && onBuyBuzzCoin ? (
              <View style={styles.errorActions}>
                <Pressable onPress={onClose} style={styles.cancelSmall}>
                  <Text style={styles.cancelSmallText}>Cancel</Text>
                </Pressable>

                <Pressable onPress={onBuyBuzzCoin} style={styles.buySmall}>
                  <Text style={styles.buySmallText}>Buy BuzzCoin</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          disabled={!canSubmit}
          onPress={() => {
            Keyboard.dismiss();
            onSubmit({ amountBC, note });
          }}
          style={[styles.submitBtn, !canSubmit ? styles.submitDisabled : null]}
        >
          <LinearGradient
            colors={isRequest ? ["#6d28d9", "#2563eb"] : ["#ff4d7d", "#b5179e"]}
            style={styles.submitGradient}
          >
            <Ionicons
              name={isRequest ? "hand-left" : "gift"}
              size={18}
              color="#fff"
            />
            <Text style={styles.submitText}>
              {loading ? "Sending..." : submitLabel}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 22,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 26,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
   headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  walletPill: {
    minWidth: 82,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,77,125,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,125,0.28)",
    alignItems: "flex-end",
  },
  walletLabel: {
    color: "rgba(31,16,32,0.50)",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  walletValue: {
    marginTop: 1,
    color: "#b1123c",
    fontSize: 12,
    fontWeight: "900",
  },
  title: {
    color: "#1f1020",
    fontSize: 17,
    fontWeight: "900",
  },
  helper: {
    marginTop: 3,
    color: "rgba(31,16,32,0.58)",
    fontSize: 12,
    fontWeight: "700",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.10)",
  },
  amountRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  amountChip: {
    flex: 1,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.07)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.12)",
  },
  amountChipActive: {
    backgroundColor: "rgba(255,77,125,0.18)",
    borderColor: "rgba(255,77,125,0.70)",
  },
  amountChipText: {
    color: "rgba(31,16,32,0.70)",
    fontSize: 13,
    fontWeight: "900",
  },
   amountChipTextActive: {
    color: "#b1123c",
  },
   customRow: {
    marginTop: 10,
    height: 46,
    borderRadius: 18,
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,77,125,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,125,0.38)",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#b1123c",
    fontSize: 16,
    fontWeight: "900",
    paddingVertical: 0,
  },
  bcLabel: {
    color: "#b1123c",
    fontSize: 13,
    fontWeight: "900",
  },
  noteBox: {
    marginTop: 8,
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: "rgba(255,77,125,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,125,0.38)",
  },
  noteInput: {
    color: "#b1123c",
    fontSize: 14,
    fontWeight: "800",
    minHeight: 32,
    textAlignVertical: "top",
    padding: 0,
  },
  counter: {
    position: "absolute",
    right: 12,
    bottom: 7,
    color: "rgba(177,18,60,0.60)",
    fontSize: 11,
    fontWeight: "800",
  },
  errorBox: {
    marginTop: 10,
    borderRadius: 18,
    padding: 10,
    backgroundColor: "rgba(239,68,68,0.16)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  errorActions: {
    marginTop: 9,
    flexDirection: "row",
    gap: 8,
  },
  cancelSmall: {
    flex: 1,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  cancelSmallText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  buySmall: {
    flex: 1.5,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4d7d",
  },
  buySmallText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
   submitBtn: {
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitGradient: {
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});