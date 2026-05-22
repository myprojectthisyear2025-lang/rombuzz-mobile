/**
 * ============================================================
 * 📁 Location: src/components/gifts/GiftSummaryBar.tsx
 * 📊 Purpose: Compact gift summary row for a target.
 *
 * Used by:
 *  - Future LetsBuzz post/reel UI
 *  - Future View Profile media insights
 *  - Future owner summary screens
 *
 * What this file does:
 *  - Loads summary rows for targetType + targetId.
 *  - Looks up gift display metadata from src/config/rombuzzGifts.ts.
 *  - Shows top gifts, total count, and totalBC.
 * ============================================================
 */

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getGiftById } from "../../config/rombuzzGifts";
import { useGiftSummary } from "../../hooks/gifts/useGiftSummary";

type Props = {
  receiverId?: string;
  targetType: string;
  targetId: string;
  maxItems?: number;
  onPress?: () => void;
};

export default function GiftSummaryBar({
  receiverId,
  targetType,
  targetId,
  maxItems = 3,
  onPress,
}: Props) {
  const {
    summary,
    loading,
    error,
    totalCount,
    totalBC,
  } = useGiftSummary({
    receiverId,
    targetType,
    targetId,
    autoLoad: Boolean(targetType && targetId),
  });

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading gifts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!summary.length) {
    return null;
  }

  const top = summary.slice(0, maxItems);

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={styles.icons}>
        {top.map((row) => {
          const gift = getGiftById(row.giftId);
          return (
            <View key={row.giftId} style={styles.iconBubble}>
              <Text style={styles.icon}>{gift?.category === "romantic" ? "🌹" : "🎁"}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.textBlock}>
        <Text numberOfLines={1} style={styles.title}>
          {totalCount} gift{totalCount === 1 ? "" : "s"} received
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {totalBC} BC total
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderWidth: 1,
    borderColor: "rgba(255,105,180,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBubble: {
    width: 28,
    height: 28,
    marginRight: -7,
    borderRadius: 14,
    backgroundColor: "#FFF0F8",
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 15,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    color: "#3B102A",
  },
  subtitle: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#8B5B73",
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B3358",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D12B5C",
  },
});
