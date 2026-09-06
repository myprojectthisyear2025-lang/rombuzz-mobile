/**
 * Path: src/features/profile/gallery/viewer/GalleryViewerChrome.tsx
 * Purpose: Modern immersive chrome for Profile Gallery photo/reel viewing.
 * Used by: src/components/profile/Gallery/FullscreenViewer.tsx.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Scope =
  | "public"
  | "matches"
  | "private";

type Props = {
  caption: string;
  scope: Scope;
  createdAt?: any;

  isReel: boolean;

  topInset: number;
  bottomInset: number;

  onClose: () => void;
  onOptions: () => void;
};
function formatUploadDate(value: any) {
  if (!value) return "";

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${
    months[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;
}
function getScopeMeta(scope: Scope) {
  if (scope === "matches") {
    return {
      label: "Matches",
      icon: "people-outline" as const,
    };
  }

  if (scope === "private") {
    return {
      label: "Only me",
      icon: "lock-closed-outline" as const,
    };
  }

  return {
    label: "Public",
    icon: "globe-outline" as const,
  };
}

export default function GalleryViewerChrome({
  caption,
  scope,
  createdAt,
  isReel,
  topInset,
  bottomInset,
  onClose,
  onOptions,
}: Props) {
  const privacy = getScopeMeta(scope);
  const uploadDate =
  formatUploadDate(createdAt);

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(0,0,0,0.42)",
          "rgba(0,0,0,0)",
        ]}
        style={styles.topFade}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(0,0,0,0)",
          "rgba(0,0,0,0.72)",
        ]}
        style={styles.bottomFade}
      />

            <View
              style={[
                styles.topBar,
                {
                  top: topInset + 8,
                },
              ]}
            >      
              <GlassButton
          icon="close"
          onPress={onClose}
          accessibilityLabel="Close media"
        />

        <GlassButton
          icon="ellipsis-horizontal"
          onPress={onOptions}
          accessibilityLabel="Media options"
        />
      </View>

          <View
        style={[
          styles.captionArea,
          {
            bottom: isReel
              ? bottomInset + 82
              : bottomInset + 22,

            right: isReel
              ? 76
              : 154,
          },
        ]}
      >
        {!!caption && (
          <Text
            style={styles.caption}
            numberOfLines={3}
          >
            {caption}
          </Text>
        )}

        <View style={styles.privacyRow}>
          <Ionicons
            name={privacy.icon}
            size={13}
            color="rgba(255,255,255,0.84)"
          />

          <Text style={styles.privacyText}>
            {privacy.label}
          </Text>
        </View>
        {!!uploadDate && (
          <Text style={styles.uploadDate}>
            {uploadDate}
          </Text>
        )}
      </View>
    </View>
  );
}

function GlassButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.glassButton,
        pressed && { opacity: 0.62 },
      ]}
    >
      <Ionicons
        name={icon}
        size={21}
        color="#FFFFFF"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },

  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 210,
  },

  topBar: {
    position: "absolute",
    left: 14,
    right: 14,

    flexDirection: "row",
    justifyContent: "space-between",

    zIndex: 30,
  },
  uploadDate: {
  marginTop: 3,

  color:
    "rgba(255,255,255,0.60)",

  fontFamily: RBZFont.medium,
  fontSize: 9.5,
  lineHeight: 12,
},

  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor:
      "rgba(10,10,12,0.48)",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderColor:
      "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",
  },

  captionArea: {
    position: "absolute",
    left: 16,
    zIndex: 24,
  },

  caption: {
    color: "#FFFFFF",
    fontFamily: RBZFont.semiBold,
    fontSize: 13.5,
    lineHeight: 18,
    textShadowColor:
      "rgba(0,0,0,0.35)",
    textShadowRadius: 4,
  },

  privacyRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  privacyText: {
    color:
      "rgba(255,255,255,0.82)",
    fontFamily: RBZFont.medium,
    fontSize: 10.5,
  },
});