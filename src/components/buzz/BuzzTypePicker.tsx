/**
 * ============================================================================
 * 📁 File: src/components/buzz/BuzzTypePicker.tsx
 * 🎯 Purpose: Premium Buzz picker bottom sheet for ViewProfile Buzz button
 *
 * Used by:
 * - src/components/profile/BuzzPokeCard.tsx
 *
 * What this does:
 * - Opens when user long-presses the Buzz button.
 * - Shows spendable BuzzCoin balance.
 * - Shows always-available Buzzes.
 * - Shows seasonal Buzzes only when available from buzzTypes.ts.
 * - Does NOT send Buzzes directly. It only returns the selected Buzz type.
 * ============================================================================
 */

import {
  formatBuzzPrice,
  getAvailableBuzzTypes,
  type BuzzType,
  type BuzzTypeId,
} from "@/src/config/buzzTypes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
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
  line: "rgba(17,24,39,0.10)",
  card: "#ffffff",
};

type Props = {
  visible: boolean;
  selectedBuzzTypeId: BuzzTypeId;
  spendableBalance: number | null;
  balanceLoading?: boolean;
  onClose: () => void;
  onSelect: (type: BuzzType) => void;
};

export default function BuzzTypePicker({
  visible,
  selectedBuzzTypeId,
  spendableBalance,
  balanceLoading,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();

  const availableBuzzTypes = useMemo(() => {
    return getAvailableBuzzTypes();
  }, []);

  const alwaysBuzzTypes = useMemo(() => {
    return availableBuzzTypes.filter((type) => type.category !== "seasonal");
  }, [availableBuzzTypes]);

  const seasonalBuzzTypes = useMemo(() => {
    return availableBuzzTypes.filter((type) => type.category === "seasonal");
  }, [availableBuzzTypes]);

  const renderBuzzRow = (type: BuzzType, seasonal = false) => {
    const selected = selectedBuzzTypeId === type.id;
    const disabled =
      type.isPaid && spendableBalance !== null && spendableBalance < type.price;

    return (
      <Pressable
        key={type.id}
        onPress={() => onSelect(type)}
        style={[
          styles.buzzRow,
          selected && styles.buzzRowSelected,
          disabled && styles.buzzRowDisabled,
        ]}
      >
        <LinearGradient colors={type.gradient as any} style={styles.buzzIconBubble}>
          <Text style={styles.buzzRowEmoji}>{type.emoji}</Text>
        </LinearGradient>

        <View style={styles.buzzRowMiddle}>
          <View style={styles.buzzRowTitleLine}>
            <Text style={styles.buzzRowTitle}>{type.label}</Text>

            {seasonal ? (
              <View style={styles.limitedPill}>
                <Text style={styles.limitedPillText}>LIMITED</Text>
              </View>
            ) : null}

            {selected ? (
              <Ionicons name="checkmark-circle" size={15} color={RBZ.c2} />
            ) : null}
          </View>

          <Text numberOfLines={2} style={styles.buzzRowDesc}>
            {type.description}
          </Text>

          {disabled ? (
            <Text style={styles.notEnoughText}>Not enough BuzzCoin</Text>
          ) : null}
        </View>

        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{formatBuzzPrice(type)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(18, insets.bottom + 12) }]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Choose Your Buzz</Text>
              <Text style={styles.sheetSubtitle}>
                Long press anytime to switch your Buzz.
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={RBZ.ink} />
            </Pressable>
          </View>

          <LinearGradient
            colors={["rgba(216,52,95,0.12)", "rgba(245,158,11,0.12)"]}
            style={styles.balanceCard}
          >
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet" size={16} color={RBZ.c2} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Spendable Balance</Text>
              <Text style={styles.balanceValue}>
                {balanceLoading
                  ? "Loading..."
                  : spendableBalance === null
                  ? "Unavailable"
                  : `${spendableBalance} BC`}
              </Text>
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.buzzListContent}
          >
            <Text style={styles.sectionTitle}>Always Available</Text>

            {alwaysBuzzTypes.map((type) => renderBuzzRow(type, false))}

            {seasonalBuzzTypes.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                  Limited Season
                </Text>

                {seasonalBuzzTypes.map((type) => renderBuzzRow(type, true))}
              </>
            ) : null}
          </ScrollView>
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
  sheet: {
    maxHeight: "82%",
    backgroundColor: RBZ.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.14)",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: {
    color: RBZ.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  sheetSubtitle: {
    marginTop: 3,
    color: RBZ.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(17,24,39,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
  },
  balanceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: RBZ.white,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceLabel: {
    color: RBZ.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  balanceValue: {
    marginTop: 1,
    color: RBZ.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  buzzListContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: RBZ.ink,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buzzRow: {
    minHeight: 82,
    borderRadius: 20,
    backgroundColor: RBZ.card,
    borderWidth: 1,
    borderColor: RBZ.line,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  buzzRowSelected: {
    borderColor: "rgba(216,52,95,0.45)",
    backgroundColor: "rgba(216,52,95,0.04)",
  },
  buzzRowDisabled: {
    opacity: 0.54,
  },
  buzzIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  buzzRowEmoji: {
    fontSize: 22,
  },
  buzzRowMiddle: {
    flex: 1,
    minWidth: 0,
  },
  buzzRowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  buzzRowTitle: {
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  buzzRowDesc: {
    marginTop: 4,
    color: RBZ.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  notEnoughText: {
    marginTop: 4,
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "800",
  },
  pricePill: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.24)",
  },
  priceText: {
    color: "#92400e",
    fontSize: 11,
    fontWeight: "900",
  },
  limitedPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(216,52,95,0.12)",
  },
  limitedPillText: {
    color: RBZ.c2,
    fontSize: 9,
    fontWeight: "900",
  },
});