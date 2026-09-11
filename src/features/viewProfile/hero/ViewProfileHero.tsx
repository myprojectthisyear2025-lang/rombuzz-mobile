/**
 * Path: src/features/viewProfile/hero/ViewProfileHero.tsx
 * Purpose: Compact matched-user identity and primary actions for View Profile.
 * Used by: app/(tabs)/view-profile.tsx only.
 */

import BuzzPokeCard, {
    type BuzzPokeMeta,
} from "@/src/components/profile/BuzzPokeCard";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = {
  userId: string;
  avatar?: string;
  fullName: string;
  age: number | null;
  city?: string;
  online?: boolean;
  distanceText?: string;
  matched: boolean;
  buzzMeta: BuzzPokeMeta;
  onBuzzMetaChange: (meta: BuzzPokeMeta) => void;
  onChat: () => void;
};

export default function ViewProfileHero({
  userId,
  avatar,
  fullName,
  age,
  city,
  online,
  distanceText,
  matched,
  buzzMeta,
  onBuzzMetaChange,
  onChat,
}: Props) {
  const { colors } = useRomBuzzTheme();

  const displayName =
    age === null
      ? fullName
      : `${fullName}, ${age}`;

  return (
    <View style={styles.root}>
      <View style={styles.identityRow}>
        <View style={styles.photoWrap}>
          <Image
            source={{
              uri:
                avatar ||
                "https://i.pravatar.cc/300?img=12",
            }}
            style={[
              styles.photo,
              {
                backgroundColor:
                  colors.surfaceMuted,
              },
            ]}
          />

          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: online
                  ? "#31C875"
                  : colors.iconMuted,
                borderColor:
                  colors.background,
              },
            ]}
          />
        </View>

        <View style={styles.identityCopy}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.name,
                { color: colors.text },
              ]}
            >
              {displayName}
            </Text>

            {matched ? (
              <View
                style={[
                  styles.streakBadge,
                  {
                    backgroundColor:
                      colors.brandSoft,
                  },
                ]}
              >
                <Ionicons
                  name="flame"
                  size={13}
                  color={colors.brand}
                />

                <View>
                  <Text
                    style={[
                      styles.streakCount,
                      {
                        color:
                          colors.brand,
                      },
                    ]}
                  >
                    {Number(
                      buzzMeta?.count || 0
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.streakLabel,
                      {
                        color:
                          colors.textMuted,
                      },
                    ]}
                  >
                    Buzz streak
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {!!city && (
            <View style={styles.metaLine}>
              <Ionicons
                name="location-outline"
                size={13}
                color={colors.iconMuted}
              />

              <Text
                style={[
                  styles.location,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {city}
              </Text>
            </View>
          )}

          <View style={styles.secondaryMeta}>
            {matched &&
            buzzMeta?.lastBuzzLabel ? (
              <Text
                style={[
                  styles.helper,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                Last buzz{" "}
                {buzzMeta.lastBuzzLabel}
              </Text>
            ) : null}

            {distanceText ? (
              <Text
                style={[
                  styles.helper,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                {distanceText}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <BuzzPokeCard
          userId={userId}
          matched={matched}
          onMetaChange={
            onBuzzMetaChange
          }
        />

        <Pressable
          onPress={onChat}
          style={({ pressed }) => [
            styles.chatButton,
            {
              backgroundColor:
                colors.surfaceMuted,
              borderColor:
                colors.borderStrong,
            },
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={colors.icon}
          />

          <Text
            style={[
              styles.chatText,
              { color: colors.text },
            ]}
          >
            Chat
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },

  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  photoWrap: {
    width: 88,
    height: 88,
    position: "relative",
    flexShrink: 0,
  },

  photo: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },

  statusDot: {
    position: "absolute",
    left: 7,
    bottom: 7,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },

  identityCopy: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  name: {
    flexShrink: 1,
    fontFamily: RBZFont.bold,
    fontSize: 20,
    lineHeight: 26,
  },

  streakBadge: {
    minHeight: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  streakCount: {
    fontFamily: RBZFont.bold,
    fontSize: 12,
    lineHeight: 13,
  },

  streakLabel: {
    fontFamily: RBZFont.medium,
    fontSize: 8.5,
    lineHeight: 10,
  },

  metaLine: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  location: {
    flexShrink: 1,
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
  },

  secondaryMeta: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  helper: {
    fontFamily: RBZFont.medium,
    fontSize: 12,
  },

  actions: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },

  chatButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  chatText: {
    fontFamily: RBZFont.semiBold,
    fontSize: 15,
  },

  pressed: {
    opacity: 0.72,
  },
});