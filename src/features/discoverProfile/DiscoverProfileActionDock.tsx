/**
 * Path: src/features/discoverProfile/DiscoverProfileActionDock.tsx
 * Purpose: Compact relationship-aware action dock for unmatched Discover Profile users.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { RelationshipMode } from "./discoverProfileApi";

export default function DiscoverProfileActionDock({
  mode,
  firstName,
  loading,
  onSkip,
  onSend,
  onDecline,
  onAccept,
  onBack,
  onOpenMatched,
}: {
  mode: RelationshipMode;
  firstName?: string;
  loading: boolean;
  onSkip: () => void;
  onSend: () => void;
  onDecline: () => void;
  onAccept: () => void;
  onBack: () => void;
  onOpenMatched: () => void;
}) {
  const { colors } = useRomBuzzTheme();
  const name = firstName || "this person";

  if (mode === "loading") {
    return (
      <View style={[styles.dock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  const title =
    mode === "discover" ? `Interested in ${name}?` :
    mode === "incoming" ? `${name} sent you a request` :
    mode === "requested" ? `Request sent to ${name}` :
    `You matched with ${name}`;

  return (
    <View style={[styles.dock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {mode === "matched" ? (
        <Pressable
          onPress={onOpenMatched}
          style={[styles.primaryWide, { backgroundColor: colors.brand }]}
        >
          <Ionicons name="person-outline" size={18} color={colors.white} />
          <Text style={styles.primaryText}>Open profile</Text>
        </Pressable>
      ) : (
        <View style={styles.row}>
          <Pressable
            disabled={loading}
            onPress={mode === "incoming" ? onDecline : mode === "requested" ? onBack : onSkip}
            style={({ pressed }) => [
              styles.secondary,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.borderStrong },
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Ionicons
              name={mode === "requested" ? "arrow-back" : "close"}
              size={18}
              color={colors.icon}
            />

            <Text style={[styles.secondaryText, { color: colors.text }]}>
              {mode === "incoming" ? "Decline" : mode === "requested" ? "Back" : "Skip"}
            </Text>
          </Pressable>

          <Pressable
            disabled={loading || mode === "requested"}
            onPress={mode === "incoming" ? onAccept : mode === "requested" ? undefined : onSend}
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: mode === "requested" ? colors.brandSoft : colors.brand },
              pressed && styles.pressed,
              (loading || mode === "requested") && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons
                name={mode === "requested" ? "checkmark-circle" : "heart"}
                size={18}
                color={mode === "requested" ? colors.brand : colors.white}
              />
            )}

            <Text style={[styles.primaryText, mode === "requested" && { color: colors.brand }]}>
              {mode === "incoming" ? "Accept" : mode === "requested" ? "Pending" : "Send request"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },

  title: {
    textAlign: "center",
    fontFamily: RBZFont.bold,
    fontSize: 13.5,
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    gap: 8,
  },

  secondary: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  primary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  primaryWide: {
    minHeight: 46,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  secondaryText: {
    fontFamily: RBZFont.semiBold,
    fontSize: 13.5,
  },

  primaryText: {
    color: "#fff",
    fontFamily: RBZFont.bold,
    fontSize: 13.5,
  },

  disabled: { opacity: 0.64 },
  pressed: { opacity: 0.82 },
});