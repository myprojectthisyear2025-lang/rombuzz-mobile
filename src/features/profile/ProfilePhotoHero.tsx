/**
 * Path: src/features/profile/ProfilePhotoHero.tsx
 * Purpose: Full-bleed, safe-area-aware Profile photo hero.
 * Used by: app/(tabs)/profile.tsx.
 */

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

  safeTop: number;

  guidance?: {
    icon: string;
    text: string;
  } | null;

  storiesEnabled: boolean;
  hasStory: boolean;

  onAvatarPress: () => void;
  onChangeAvatar: () => void;
  onAddStory: () => void;
  onWallet: () => void;
  onSettings: () => void;
};

export default function ProfilePhotoHero({
  fullName,
  age,
  avatarUri,
  memberSince,
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
  const { width, height } =
    useWindowDimensions();

  const heroHeight = Math.min(
    Math.max(
      width * 1.02,
      height * 0.42
    ),
    540
  );

  const displayName =
    age !== null
      ? `${fullName}, ${age}`
      : fullName;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.photoWrap,
          { height: heroHeight },
        ]}
      >
        <Pressable
          onPress={onAvatarPress}
          style={StyleSheet.absoluteFill}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.emptyPhoto,
                {
                  backgroundColor:
                    colors.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={64}
                color={colors.iconMuted}
              />
            </View>
          )}

          <LinearGradient
            colors={[
              "rgba(0,0,0,0.20)",
              "transparent",
              "transparent",
              "rgba(0,0,0,0.72)",
            ]}
            locations={[
              0,
              0.22,
              0.55,
              1,
            ]}
            style={
              StyleSheet.absoluteFill
            }
            pointerEvents="none"
          />
        </Pressable>

        <View
          style={[
            styles.safeActions,
            {
              top: safeTop + 10,
            },
          ]}
        >
          <View style={styles.actionSpacer} />

          <View style={styles.actionRow}>
            <CircleAction
              icon="wallet-outline"
              onPress={onWallet}
            />

            <CircleAction
              icon="settings-outline"
              onPress={onSettings}
            />
          </View>
        </View>

        <View style={styles.editArea}>
          {storiesEnabled && (
            <Pressable
              onPress={onAddStory}
              style={styles.photoButton}
            >
              <Ionicons
                name="add-circle-outline"
                size={17}
                color="#fff"
              />

              <Text style={styles.photoButtonText}>
                Story
              </Text>
            </Pressable>
          )}

          {!hasStory && (
            <Pressable
              onPress={onChangeAvatar}
              style={styles.photoButton}
            >
              <Ionicons
                name="camera-outline"
                size={17}
                color="#fff"
              />

              <Text style={styles.photoButtonText}>
                Edit
              </Text>
            </Pressable>
          )}
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
        </View>
      </View>

      {!!guidance && (
        <View
          style={[
            styles.guidance,
            {
              backgroundColor:
                colors.background,
              borderBottomColor:
                colors.border,
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

function CircleAction({
  icon,
  onPress,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.circleAction,
        pressed && {
          opacity: 0.65,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#fff"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },

  photoWrap: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },

  photo: {
    width: "100%",
    height: "100%",
  },

  emptyPhoto: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  safeActions: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  actionSpacer: {
    width: 42,
  },

  actionRow: {
    flexDirection: "row",
    gap: 8,
  },

  circleAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      "rgba(15,16,18,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },

  editArea: {
    position: "absolute",
    right: 16,
    bottom: 78,
    flexDirection: "row",
    gap: 8,
  },

  photoButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor:
      "rgba(15,16,18,0.58)",
  },

  photoButtonText: {
    color: "#fff",
    fontFamily: RBZFont.semiBold,
    fontSize: 13,
  },

  identity: {
    position: "absolute",
    left: 18,
    right: 96,
    bottom: 18,
  },

  name: {
    color: "#fff",
    fontFamily: RBZFont.extraBold,
    fontSize: 29,
    letterSpacing: -1,
  },

  member: {
    marginTop: 3,
    color:
      "rgba(255,255,255,0.82)",
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
  },

  guidance: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
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