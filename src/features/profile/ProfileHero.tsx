/**
 * Path: src/features/profile/ProfileHero.tsx
 * Purpose: Theme-aware visual hero for the owner's Profile screen.
 * Used by: app/(tabs)/profile.tsx.
 */

import StoryAvatar from "@/src/components/story/StoryAvatar";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  guidance?: { icon: string; text: string } | null;
  completion: number;
  showCompletion: boolean;
  showEditProfileAction: boolean;
  storiesEnabled: boolean;
  hasStory: boolean;
  storySeen: boolean;
  onAvatarPress: () => void;
  onChangeAvatar: () => void;
  onAddStory: () => void;
  onEditProfile: () => void;
  onWallet: () => void;
  onSettings: () => void;
};

export default function ProfileHero({
  fullName,
  age,
  avatarUri,
  memberSince,
  guidance,
  completion,
  showCompletion,
  showEditProfileAction,
  storiesEnabled,
  hasStory,
  storySeen,
  onAvatarPress,
  onChangeAvatar,
  onAddStory,
  onEditProfile,
  onWallet,
  onSettings,
}: Props) {
  const { colors } = useRomBuzzTheme();
  const { width } = useWindowDimensions();

  const heroWidth = Math.min(
    Math.max(width - 32, 288),
    680
  );

  const heroHeight = Math.min(
    Math.max(heroWidth * 0.94, 320),
    520
  );

  const displayName =
    age !== null
      ? `${fullName}, ${age}`
      : fullName;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.topBar,
          { width: heroWidth },
        ]}
      >
        <Text
          style={[
            styles.brand,
            { color: colors.text },
          ]}
        >
          Rom
          <Text style={{ color: colors.brand }}>
            Buzz
          </Text>
        </Text>

        <View style={styles.topActions}>
          <TopAction
            icon="wallet-outline"
            label="Wallet"
            onPress={onWallet}
          />

          <TopAction
            icon="settings-outline"
            label="Settings"
            onPress={onSettings}
          />
        </View>
      </View>

      <View
        style={[
          styles.hero,
          {
            width: heroWidth,
            height: heroHeight,
            backgroundColor:
              colors.surfaceMuted,
          },
        ]}
      >
        <Pressable
          onPress={onAvatarPress}
          style={StyleSheet.absoluteFill}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.emptyPhoto}>
              <Ionicons
                name="person-outline"
                size={58}
                color={colors.iconMuted}
              />
            </View>
          )}

          <LinearGradient
            colors={[
              "transparent",
              "rgba(8,8,11,0.72)",
            ]}
            locations={[0.48, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Pressable>

        <View style={styles.photoTopRow}>
          {storiesEnabled && (
            <View style={styles.storySlot}>
              <StoryAvatar
                uri={avatarUri}
                hasStory={hasStory}
                seen={storySeen}
                size={44}
                onPress={onAvatarPress}
              />

              <Pressable
                onPress={onAddStory}
                style={styles.storyAdd}
                hitSlop={8}
              >
                <Ionicons
                  name="add"
                  size={13}
                  color="#fff"
                />
              </Pressable>
            </View>
          )}

          <View style={styles.photoActions}>
            {showEditProfileAction && (
              <Pressable
                onPress={onEditProfile}
                style={styles.cameraButton}
                hitSlop={10}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color="#fff"
                />
              </Pressable>
            )}

            {!hasStory && (
              <Pressable
                onPress={onChangeAvatar}
                style={styles.cameraButton}
                hitSlop={10}
              >
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color="#fff"
                />
              </Pressable>
            )}
          </View>
        </View>

        <View
          style={styles.identity}
          pointerEvents="none"
        >
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          <Text style={styles.member}>
            Member since {memberSince}
          </Text>

          {showCompletion && (
            <Text style={styles.member}>
              Profile{" "}
              {Math.round(completion * 100)}%
              complete
            </Text>
          )}
        </View>
      </View>

      {!!guidance && (
        <View
          style={[
            styles.guidance,
            {
              width: heroWidth,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={styles.guidanceIcon}>
            {guidance.icon}
          </Text>

          <Text
            style={[
              styles.guidanceText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
            numberOfLines={2}
          >
            {guidance.text}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.iconMuted}
          />
        </View>
      )}
    </View>
  );
}

function TopAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useRomBuzzTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.topAction,
        pressed && { opacity: 0.55 },
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={colors.icon}
      />

      <Text
        style={[
          styles.topActionText,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },

  topBar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    fontFamily: RBZFont.extraBold,
    fontSize: 24,
    letterSpacing: -0.9,
  },

  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  topAction: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 42,
    minHeight: 44,
    gap: 1,
  },

  topActionText: {
    fontFamily: RBZFont.semiBold,
    fontSize: 9.5,
  },

  hero: {
    overflow: "hidden",
    borderRadius: 24,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  emptyPhoto: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  photoTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  storySlot: {
    position: "relative",
  },

  photoActions: {
    marginLeft: "auto",
    flexDirection: "row",
    gap: 8,
  },

  storyAdd: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F52E64",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  cameraButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor:
      "rgba(15,16,18,0.58)",
    alignItems: "center",
    justifyContent: "center",
  },

  identity: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },

  name: {
    color: "#fff",
    fontFamily: RBZFont.extraBold,
    fontSize: 29,
    letterSpacing: -1.05,
  },

  member: {
    color:
      "rgba(255,255,255,0.82)",
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
    marginTop: 3,
  },

  guidance: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  guidanceIcon: {
    fontSize: 16,
  },

  guidanceText: {
    flex: 1,
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
    lineHeight: 17,
  },
});