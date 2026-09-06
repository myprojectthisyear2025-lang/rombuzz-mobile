/**
 * Path: src/components/profile/Gallery/ProfileUploadPreview.tsx
 * Purpose: Lightweight controller/shell for Profile media upload preview.
 * Used by: GallerySection.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import ProfileUploadEditor from "@/src/features/profile/gallery/upload/ProfileUploadEditor";
import ProfileUploadMediaPreview from "@/src/features/profile/gallery/upload/ProfileUploadMediaPreview";
import { styles } from "@/src/features/profile/gallery/upload/profileUploadPreview.styles";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ProfileUploadKind =
  | "photo"
  | "reel";

export type ProfileUploadScope =
  | "public"
  | "matches"
  | "private";

export type ProfileUploadIntent =
  | "discover"
  | "viewprofile"
  | "letsbuzz"
  | "firstimpression";

type Props = {
  visible: boolean;
  asset: {
    uri: string;
    isVideo: boolean;
  } | null;

  kind: ProfileUploadKind;
  scope: ProfileUploadScope;

  // Preserved for existing GallerySection behavior.
  intent?: ProfileUploadIntent;
  onIntentChange?: (
    intent: ProfileUploadIntent
  ) => void;

  captionText: string;
  uploading: boolean;

  onClose: () => void;
  onPublish: () => void;

  onScopeChange: (
    scope: ProfileUploadScope
  ) => void;

  onCaptionChange: (
    text: string
  ) => void;
};

export default function ProfileUploadPreview({
  visible,
  asset,
  kind,
  scope,
  captionText,
  uploading,
  onClose,
  onPublish,
  onScopeChange,
  onCaptionChange,
}: Props) {
  const insets =
    useSafeAreaInsets();

  const { colors } =
    useRomBuzzTheme();

  const isReel =
    kind === "reel" ||
    !!asset?.isVideo;

  const canShare =
    !!asset?.uri &&
    !uploading;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar style="auto" />

      <KeyboardAvoidingView
        style={[
          styles.screen,
          {
            backgroundColor:
              colors.background,
          },
        ]}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={[
            styles.safe,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              {
                borderBottomColor:
                  colors.border,

                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <View style={styles.headerSide}>
              <Pressable
                onPress={onClose}
                disabled={uploading}
                hitSlop={8}
                style={[
                  styles.backButton,
                  {
                    backgroundColor:
                      colors.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={21}
                  color={colors.icon}
                />
              </Pressable>
            </View>

            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {isReel
                ? "New reel"
                : "New photo"}
            </Text>

            <View
              style={[
                styles.headerSide,
                styles.headerRight,
              ]}
            >
              <Pressable
                onPress={onPublish}
                disabled={!canShare}
                style={[
                  styles.shareButton,
                  {
                    backgroundColor:
                      colors.brand,
                  },
                  !canShare &&
                    styles.disabled,
                ]}
              >
                {uploading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.shareText
                    }
                  >
                    Share
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  insets.bottom + 28,
              },
            ]}
          >
          <ProfileUploadEditor
              isReel={isReel}
              scope={scope}
              captionText={captionText}
              onScopeChange={onScopeChange}
              onCaptionChange={onCaptionChange}
            />

            <ProfileUploadMediaPreview
              asset={asset}
              isReel={isReel}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}