/**
 * Path: src/components/buzz/BuzzTypePicker.tsx
 * Purpose: Modern theme-aware premium Buzz picker opened by long-press.
 * Used by: src/components/profile/BuzzPokeCard.tsx
 */

import {
  formatBuzzPrice,
  getAvailableBuzzTypes,
  type BuzzType,
  type BuzzTypeId,
} from "@/src/config/buzzTypes";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
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
  const { colors } = useRomBuzzTheme();

  const available = useMemo(() => getAvailableBuzzTypes(), []);
  const always = useMemo(
    () => available.filter((item) => item.category !== "seasonal"),
    [available]
  );
  const seasonal = useMemo(
    () => available.filter((item) => item.category === "seasonal"),
    [available]
  );

  const renderRow = (type: BuzzType, limited = false) => {
    const selected = selectedBuzzTypeId === type.id;
    const notEnough =
      type.isPaid &&
      spendableBalance !== null &&
      spendableBalance < type.price;

    return (
      <Pressable
        key={type.id}
        onPress={() => onSelect(type)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: selected
              ? colors.surfaceMuted
              : colors.surfaceRaised,
            borderColor: selected ? colors.brand : colors.border,
          },
          notEnough && styles.lowBalance,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.emojiBox,
            { backgroundColor: colors.surfaceMuted },
          ]}
        >
          <Text style={styles.emoji}>{type.emoji}</Text>
        </View>

        <View style={styles.middle}>
          <View style={styles.titleLine}>
            <Text style={[styles.title, { color: colors.text }]}>
              {type.label}
            </Text>

            {limited ? (
              <Text style={[styles.limited, { color: colors.brand }]}>
                LIMITED
              </Text>
            ) : null}

            {selected ? (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.brand}
              />
            ) : null}
          </View>

          <Text
            numberOfLines={2}
            style={[styles.description, { color: colors.textMuted }]}
          >
            {type.description}
          </Text>

          {notEnough ? (
            <Text style={[styles.notEnough, { color: colors.textMuted }]}>
              Not enough BC
            </Text>
          ) : null}
        </View>

        <Text
          style={[
            styles.price,
            {
              color: type.isPaid
                ? colors.textSecondary
                : colors.brand,
            },
          ]}
        >
          {type.isPaid ? formatBuzzPrice(type) : "Free"}
        </Text>
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(18, insets.bottom + 12),
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.borderStrong },
            ]}
          />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Choose a Buzz
              </Text>

              <Text
                style={[
                  styles.sheetSubtitle,
                  { color: colors.textMuted },
                ]}
              >
                Pick how you want to get their attention.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.close,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons name="close" size={19} color={colors.icon} />
            </Pressable>
          </View>

          <View
            style={[
              styles.balanceRow,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.balanceLeft}>
              <Ionicons
                name="wallet-outline"
                size={17}
                color={colors.iconMuted}
              />

              <Text
                style={[
                  styles.balanceLabel,
                  { color: colors.textSecondary },
                ]}
              >
                BuzzCoin balance
              </Text>
            </View>

            <Text style={[styles.balanceValue, { color: colors.text }]}>
              {balanceLoading
                ? "Loading..."
                : spendableBalance === null
                  ? "Unavailable"
                  : `${spendableBalance} BC`}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            <Text style={[styles.section, { color: colors.textMuted }]}>
              ALWAYS AVAILABLE
            </Text>

            {always.map((type) => renderRow(type))}

            {seasonal.length > 0 ? (
              <>
                <Text
                  style={[
                    styles.section,
                    styles.sectionSpacing,
                    { color: colors.textMuted },
                  ]}
                >
                  LIMITED
                </Text>

                {seasonal.map((type) => renderRow(type, true))}
              </>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "84%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 9,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: { flex: 1 },
  sheetTitle: {
    fontFamily: RBZFont.bold,
    fontSize: 20,
  },
  sheetSubtitle: {
    marginTop: 3,
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
    lineHeight: 18,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceRow: {
    marginTop: 15,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  balanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  balanceLabel: {
    fontFamily: RBZFont.medium,
    fontSize: 13,
  },
  balanceValue: {
    fontFamily: RBZFont.semiBold,
    fontSize: 14,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 8,
    fontFamily: RBZFont.bold,
    fontSize: 10.5,
    letterSpacing: 0.7,
  },
  sectionSpacing: { marginTop: 13 },
  row: {
    minHeight: 70,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 15,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 21 },
  middle: { flex: 1, minWidth: 0 },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  title: {
    fontFamily: RBZFont.semiBold,
    fontSize: 14.5,
  },
  limited: {
    fontFamily: RBZFont.bold,
    fontSize: 8.5,
    letterSpacing: 0.4,
  },
  description: {
    marginTop: 2,
    fontFamily: RBZFont.medium,
    fontSize: 11.5,
    lineHeight: 16,
  },
  notEnough: {
    marginTop: 3,
    fontFamily: RBZFont.semiBold,
    fontSize: 10.5,
  },
  price: {
    flexShrink: 0,
    fontFamily: RBZFont.semiBold,
    fontSize: 12,
  },
  lowBalance: { opacity: 0.62 },
  pressed: { opacity: 0.72 },
});