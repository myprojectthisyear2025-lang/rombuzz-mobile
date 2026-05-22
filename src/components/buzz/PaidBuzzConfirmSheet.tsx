/**
 * ============================================================================
 * 📁 File: src/components/buzz/PaidBuzzConfirmSheet.tsx
 * 🎯 Purpose: Confirmation sheet before spending BuzzCoin on paid Buzzes
 *
 * Used by:
 * - src/components/profile/BuzzPokeCard.tsx
 *
 * What this does:
 * - Shows Buzz price.
 * - Shows user spendable balance.
 * - Lets user cancel or send.
 * - Lets user remember the paid Buzz for this match.
 * - Shows Buy BuzzCoin option when balance is not enough.
 * ============================================================================
 */

import { formatBuzzPrice, type BuzzType } from "@/src/config/buzzTypes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c2: "#d8345f",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  soft: "#f7f7fb",
  line: "rgba(17,24,39,0.10)",
};

type Props = {
  visible: boolean;
  buzzType: BuzzType | null;
  spendableBalance: number | null;
  rememberChoice: boolean;
  sending?: boolean;
  onRememberChoiceChange: (nextValue: boolean) => void;
  onCancel: () => void;
  onSend: () => void;
  onBuyBuzzCoin: () => void;
};

export default function PaidBuzzConfirmSheet({
  visible,
  buzzType,
  spendableBalance,
  rememberChoice,
  sending,
  onRememberChoiceChange,
  onCancel,
  onSend,
  onBuyBuzzCoin,
}: Props) {
  const insets = useSafeAreaInsets();

  const notEnough =
    !!buzzType &&
    buzzType.isPaid &&
    spendableBalance !== null &&
    spendableBalance < buzzType.price;

  return (
    <Modal
      visible={visible && !!buzzType}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!sending) onCancel();
      }}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={() => {
          if (!sending) onCancel();
        }}
      >
        <Pressable
          style={[
            styles.confirmCard,
            { marginBottom: Math.max(26, insets.bottom + 18) },
          ]}
          onPress={() => {}}
        >
          {buzzType ? (
            <>
              <LinearGradient colors={buzzType.gradient as any} style={styles.confirmHero}>
                <Text style={styles.confirmEmoji}>{buzzType.emoji}</Text>
              </LinearGradient>

              <Text style={styles.confirmTitle}>
                {notEnough ? "Not enough BuzzCoin" : buzzType.confirmTitle}
              </Text>

              <Text style={styles.confirmBody}>
                {notEnough
                  ? `${buzzType.label} costs ${buzzType.price} BC. Add BuzzCoin to send this premium Buzz.`
                  : buzzType.confirmBody}
              </Text>

              <View style={styles.costBox}>
                <View>
                  <Text style={styles.costLabel}>Cost</Text>
                  <Text style={styles.costValue}>{formatBuzzPrice(buzzType)}</Text>
                </View>

                <View style={styles.costDivider} />

                <View>
                  <Text style={styles.costLabel}>Balance</Text>
                  <Text style={styles.costValue}>
                    {spendableBalance === null ? "..." : `${spendableBalance} BC`}
                  </Text>
                </View>
              </View>

              {!notEnough ? (
                <Pressable
                  onPress={() => onRememberChoiceChange(!rememberChoice)}
                  style={styles.rememberRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberChoice && styles.checkboxChecked,
                    ]}
                  >
                    {rememberChoice ? (
                      <Ionicons name="checkmark" size={14} color={RBZ.white} />
                    ) : null}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.rememberTitle}>
                      Remember {buzzType.label} for this match
                    </Text>
                    <Text style={styles.rememberSub}>
                      Next tap sends instantly without asking again.
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              <View style={styles.confirmActions}>
                <Pressable
                  onPress={onCancel}
                  disabled={sending}
                  style={[styles.confirmButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={notEnough ? onBuyBuzzCoin : onSend}
                  disabled={sending}
                  style={[styles.confirmButton, styles.sendButton]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={RBZ.white} />
                  ) : (
                    <Text style={styles.sendButtonText}>
                      {notEnough ? "Buy BuzzCoin" : "Send"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    justifyContent: "flex-end",
  },
  confirmCard: {
    marginHorizontal: 16,
    borderRadius: 28,
    backgroundColor: RBZ.white,
    padding: 18,
    alignItems: "center",
  },
  confirmHero: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  confirmEmoji: {
    fontSize: 38,
  },
  confirmTitle: {
    color: RBZ.ink,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  confirmBody: {
    marginTop: 6,
    color: RBZ.muted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 19,
  },
  costBox: {
    width: "100%",
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  costLabel: {
    color: RBZ.muted,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  costValue: {
    marginTop: 2,
    color: RBZ.ink,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  costDivider: {
    width: 1,
    height: 34,
    backgroundColor: RBZ.line,
  },
  rememberRow: {
    width: "100%",
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.16)",
    backgroundColor: "rgba(216,52,95,0.04)",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(216,52,95,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.white,
  },
  checkboxChecked: {
    backgroundColor: RBZ.c2,
    borderColor: RBZ.c2,
  },
  rememberTitle: {
    color: RBZ.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  rememberSub: {
    marginTop: 2,
    color: RBZ.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  confirmActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(17,24,39,0.06)",
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  cancelButtonText: {
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  sendButton: {
    backgroundColor: RBZ.c2,
  },
  sendButtonText: {
    color: RBZ.white,
    fontSize: 14,
    fontWeight: "900",
  },
});