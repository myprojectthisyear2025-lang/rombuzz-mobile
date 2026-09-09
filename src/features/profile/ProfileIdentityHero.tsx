/**
 * Path: src/features/profile/ProfileIdentityHero.tsx
 * Purpose: Compact full-bleed, safe-area-aware owner Profile hero.
 * Used by: app/(tabs)/profile.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

type Props = {
  fullName: string;
  age: number | null;
  avatarUri: string;
  memberSince: string;
  location: string;
  safeTop: number;
  guidance?: { icon: string; text: string } | null;
  storiesEnabled: boolean;
  hasStory: boolean;
  onAvatarPress: () => void;
  onChangeAvatar: () => void;
  onAddStory: () => void;
  onWallet: () => void;
  onSettings: () => void;
};

export default function ProfileIdentityHero({
  fullName,
  age,
  avatarUri,
  memberSince,
  location,
  safeTop,
   guidance,
  storiesEnabled,
  hasStory,
  onAvatarPress,
  onChangeAvatar,
  onAddStory,
  onWallet,
  onSettings,
}: Props) {
  const { colors } = useRomBuzzTheme();
  const { width, height } = useWindowDimensions();

  const heroHeight = Math.min(
    Math.max(width * 0.88, height * 0.36),
    470
  );

  const displayName =
    age !== null ? `${fullName}, ${age}` : fullName;

  return (
    <View style={styles.root}>
      <StatusBar
        style="light"
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.hero, { height: heroHeight }]}>
        <Pressable
          onPress={onAvatarPress}
          style={StyleSheet.absoluteFill}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              resizeMode="cover"
              style={styles.photo}
            />
          ) : (
            <View style={styles.emptyPhoto}>
              <Ionicons
                name="person-outline"
                size={64}
                color="rgba(255,255,255,0.70)"
              />
            </View>
          )}

          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(4,5,7,0.48)",
              "rgba(4,5,7,0.04)",
              "transparent",
              "rgba(4,5,7,0.10)",
              "rgba(4,5,7,0.84)",
            ]}
            locations={[0, 0.2, 0.46, 0.66, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        <View
          style={[
            styles.topActions,
            { top: safeTop + 10 },
          ]}
        >
          <HeroAction
            icon="wallet-outline"
            label="Wallet"
            onPress={onWallet}
          />

          <HeroAction
            icon="settings-outline"
            label="Settings"
            onPress={onSettings}
          />
        </View>

        <View
          style={styles.identity}
          pointerEvents="box-none"
        >
          <Text
            style={styles.name}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {displayName}
          </Text>

          {!!location && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={15}
                color="rgba(255,255,255,0.88)"
              />

              <Text
                style={styles.locationText}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text
              style={styles.member}
              numberOfLines={1}
            >
              Member since {memberSince}
            </Text>

            <View style={styles.metaActions}>
              {storiesEnabled && (
                <MetaAction
                  icon="add-circle-outline"
                  label="Story"
                  onPress={onAddStory}
                />
              )}

              {!hasStory && (
                <MetaAction
                  icon="camera-outline"
                  label="Edit"
                  onPress={onChangeAvatar}
                />
              )}
            </View>
          </View>

          {!!guidance && (
            <View style={styles.guidanceInline}>
              <Text style={styles.guidanceInlineIcon}>
                {guidance.icon}
              </Text>

              <Text
                style={styles.guidanceInlineText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {guidance.text}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function HeroAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={styles.heroAction}
    >
      <Ionicons name={icon} size={20} color="#FFFFFF" />
    </Pressable>
  );
}

function MetaAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={styles.metaAction}
    >
      <Ionicons name={icon} size={15} color="#FFFFFF" />
      <Text style={styles.metaActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },

  hero: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#24252A",
  },

  photo: {
    width: "100%",
    height: "100%",
  },

  emptyPhoto: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24252A",
  },

  topActions: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 9,
  },

  heroAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,11,13,0.48)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },

  identity: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 5,
  },

  name: {
    color: "#FFFFFF",
    fontFamily: RBZFont.extraBold,
    fontSize: 29,
    lineHeight: 33,
    letterSpacing: -1.05,
  },

  locationRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  locationText: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontFamily: RBZFont.medium,
    fontSize: 13,
  },

  metaRow: {
    minHeight: 15,
    marginTop: -5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  member: {
    flex: 1,
    color: "rgba(255,255,255,0.70)",
    fontFamily: RBZFont.medium,
    fontSize: 12,
  },

  metaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  metaAction: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10,11,13,0.54)",
  },

  metaActionText: {
    color: "#FFFFFF",
    fontFamily: RBZFont.semiBold,
    fontSize: 12.5,
  },

  guidanceInline: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingRight: 4,
  },

  guidanceInlineIcon: {
    fontSize: 11.5,
  },

  guidanceInlineText: {
    flex: 1,
    color: "rgba(255,255,255,0.68)",
    fontFamily: RBZFont.medium,
    fontSize: 10.5,
    lineHeight: 14,
  },
});