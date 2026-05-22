/**
 * ============================================================
 * 📁 Location: src/components/gifts/GiftBalancePill.tsx
 * 🪙 Purpose: Small reusable BuzzCoin balance UI pill.
 *
 * Used by:
 *  - GiftPicker header
 *  - Future wallet/purchase screens
 *
 * What this file does:
 *  - Displays current BuzzCoin balance.
 *  - Shows loading, locked, and error states.
 *  - Does not perform purchases.
 * ============================================================
 */

import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  balanceBC?: number;
  loading?: boolean;
  locked?: boolean;
  error?: string;
};

export default function GiftBalancePill({
  balanceBC = 0,
  loading = false,
  locked = false,
  error = "",
}: Props) {
  return (
    <View style={[styles.pill, locked && styles.lockedPill]}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <>
          <Text style={styles.coin}>🪙</Text>
          <Text style={styles.text}>
            {locked ? "Wallet locked" : `${balanceBC} BC`}
          </Text>
        </>
      )}

      {!!error && !loading && (
        <Text numberOfLines={1} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,105,180,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockedPill: {
    backgroundColor: "rgba(255,240,240,0.95)",
  },
  coin: {
    fontSize: 15,
  },
  text: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5A1238",
  },
  error: {
    maxWidth: 110,
    fontSize: 11,
    color: "#D12B5C",
    marginLeft: 6,
  },
});
