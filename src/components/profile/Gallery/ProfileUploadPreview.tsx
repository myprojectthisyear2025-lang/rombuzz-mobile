/**
 * ============================================================================
 * 📁 File: src/components/profile/Gallery/ProfileUploadPreview.tsx
 * 🎯 Purpose: Instagram-style upload preview/publish screen for profile photos + reels
 *
 * Used By:
 *   - GallerySection.tsx
 *
 * Notes:
 *   - Owns preview UI only.
 *   - Does NOT upload anything.
 *   - GallerySection keeps upload behavior:
 *      - Photos → private Cloudflare R2 + /upload-media
 *      - Reels  → Cloudflare Stream direct upload + /stream/complete
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c4: "#b5179e",

  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  bg: "#ffffff",
  soft: "#f8fafc",
  line: "rgba(17,24,39,0.10)",
  dark: "#050505",
} as const;

export type ProfileUploadKind = "photo" | "reel";
export type ProfileUploadScope = "public" | "matches" | "private";
export type ProfileUploadIntent =
  | "discover"
  | "viewprofile"
  | "letsbuzz"
  | "firstimpression";

type PickedAsset = {
  uri: string;
  isVideo: boolean;
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  visible: boolean;
  asset: PickedAsset | null;
  kind: ProfileUploadKind;
  scope: ProfileUploadScope;

  /**
   * Kept here on purpose because GallerySection already passes these props.
   * This component no longer renders the "Where should this show?" section.
   */
  intent?: ProfileUploadIntent;
  onIntentChange?: (intent: ProfileUploadIntent) => void;

  captionText: string;
  uploading: boolean;
  onClose: () => void;
  onPublish: () => void;
  onScopeChange: (scope: ProfileUploadScope) => void;
  onCaptionChange: (text: string) => void;
};

function scopeCopy(scope: ProfileUploadScope) {
  if (scope === "public") return "Anyone can see it";
  if (scope === "matches") return "Only matched users";
  return "Only you";
}

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
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const isReel = kind === "reel" || !!asset?.isVideo;
  const maxContentWidth = Math.min(width, 720);

  const previewSize = useMemo(() => {
    const horizontalPadding = width >= 768 ? 64 : 24;
    const availableWidth = Math.min(maxContentWidth - horizontalPadding, width - 24);
    const reservedVerticalSpace = 270 + insets.top + insets.bottom;
    const availableHeight = Math.max(260, height - reservedVerticalSpace);

    if (isReel) {
      const reelWidth = Math.min(availableWidth, availableHeight * 0.62);
      const reelHeight = Math.min(availableHeight, reelWidth * 1.62);

      return {
        width: reelWidth,
        height: reelHeight,
        borderRadius: 28,
      };
    }

    const photoSize = Math.min(availableWidth, availableHeight);

    return {
      width: photoSize,
      height: Math.max(280, photoSize),
      borderRadius: 28,
    };
  }, [height, insets.bottom, insets.top, isReel, maxContentWidth, width]);

  const title = isReel ? "New reel" : "New photo";
  const subtitle = isReel
    ? "Preview your reel before it goes live."
    : "Preview your photo before it goes live.";

  const publishLabel = uploading
    ? isReel
      ? "Uploading reel…"
      : "Uploading photo…"
    : isReel
    ? "Share reel"
    : "Share photo";

  return (
    <>
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.safeWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={[styles.header, { maxWidth: maxContentWidth }]}>
              <Pressable
                onPress={onClose}
                disabled={uploading}
                style={styles.headerBtn}
                hitSlop={10}
              >
                <Ionicons name="chevron-back" size={25} color={RBZ.ink} />
              </Pressable>

              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSub}>{subtitle}</Text>
              </View>

              <Pressable
                onPress={onPublish}
                disabled={uploading || !asset?.uri}
                style={[
                  styles.nextBtn,
                  (uploading || !asset?.uri) && styles.nextBtnDisabled,
                ]}
              >
                <Text style={styles.nextText}>{uploading ? "Wait" : "Next"}</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.scrollContent,
                {
                  maxWidth: maxContentWidth,
                  paddingBottom: Math.max(18, insets.bottom + 18),
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  if (asset?.uri) setFullscreenOpen(true);
                }}
                style={[
                  styles.previewFrame,
                  {
                    width: previewSize.width,
                    height: previewSize.height,
                    borderRadius: previewSize.borderRadius,
                  },
                ]}
              >
                {asset?.uri ? (
                  isReel ? (
                    <Video
                      source={{ uri: asset.uri }}
                      style={styles.previewMedia}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.previewMedia}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <View style={styles.emptyPreview}>
                    <Ionicons
                      name={isReel ? "videocam-outline" : "image-outline"}
                      size={44}
                      color={RBZ.white}
                    />
                  </View>
                )}

                <View style={styles.previewTopPill}>
                  <Ionicons
                    name={isReel ? "play" : "expand-outline"}
                    size={13}
                    color={RBZ.white}
                  />
                  <Text style={styles.previewTopText}>
                    Tap to preview full screen
                  </Text>
                </View>

                <View
                  style={[
                    styles.mediaBadge,
                    !isReel && { backgroundColor: "rgba(216,52,95,0.92)" },
                  ]}
                >
                  <Ionicons
                    name={isReel ? "videocam" : "image"}
                    size={13}
                    color={RBZ.white}
                  />
                  <Text style={styles.mediaBadgeText}>{isReel ? "Reel" : "Photo"}</Text>
                </View>
              </Pressable>

              <View style={styles.captionCard}>
                <View style={styles.captionHeader}>
                  <Ionicons name="create-outline" size={18} color={RBZ.c2} />
                  <Text style={styles.captionTitle}>Caption</Text>
                </View>

                <TextInput
                  value={captionText}
                  onChangeText={onCaptionChange}
                  placeholder={
                    isReel
                      ? "Write a short vibe for this reel…"
                      : "Write a short vibe for this photo…"
                  }
                  placeholderTextColor="rgba(17,24,39,0.35)"
                  style={styles.captionInput}
                  multiline
                  maxLength={140}
                  textAlignVertical="top"
                />

                <Text style={styles.captionCounter}>{captionText.length}/140</Text>
              </View>

              <View style={styles.settingsCard}>
                <Text style={styles.sectionTitle}>Who can see this?</Text>

                <View style={styles.scopeGrid}>
                  <BigChoice
                    icon="globe-outline"
                    label="Public"
                    sub="Everyone on Rombuzz"
                    active={scope === "public"}
                    tone="pink"
                    onPress={() => onScopeChange("public")}
                  />

                  <BigChoice
                    icon="people-outline"
                    label="Matched-only"
                    sub="Only your matches"
                    active={scope === "matches"}
                    tone="purple"
                    onPress={() => onScopeChange("matches")}
                  />

                  <BigChoice
                    icon="lock-closed-outline"
                    label="Private"
                    sub="Keep it hidden"
                    active={scope === "private"}
                    tone="dark"
                    onPress={() => onScopeChange("private")}
                  />
                </View>

                <View style={styles.selectedLine}>
                  <Ionicons name="eye-outline" size={16} color={RBZ.muted} />
                  <Text style={styles.selectedLineText}>{scopeCopy(scope)}</Text>
                </View>
              </View>

              <Pressable
                onPress={onPublish}
                disabled={uploading || !asset?.uri}
                style={[
                  styles.publishBtn,
                  (uploading || !asset?.uri) && styles.publishBtnDisabled,
                ]}
              >
                <Text style={styles.publishText}>{publishLabel}</Text>
                <Ionicons name="arrow-forward" size={18} color={RBZ.white} />
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={fullscreenOpen}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFullscreenOpen(false)}
      >
        <View style={styles.fullscreen}>
          <Pressable
            onPress={() => setFullscreenOpen(false)}
            style={[styles.fullClose, { top: insets.top + 12 }]}
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={RBZ.white} />
          </Pressable>

          {asset?.uri ? (
            isReel ? (
              <Video
                source={{ uri: asset.uri }}
                style={styles.fullMedia}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
              />
            ) : (
              <Image
                source={{ uri: asset.uri }}
                style={styles.fullMedia}
                resizeMode="contain"
              />
            )
          ) : null}

          <Text style={[styles.fullHint, { bottom: insets.bottom + 18 }]}>
            Tap X to return
          </Text>
        </View>
      </Modal>
    </>
  );
}

function BigChoice({
  icon,
  label,
  sub,
  active,
  tone,
  onPress,
}: {
  icon: IconName;
  label: string;
  sub: string;
  active: boolean;
  tone: "pink" | "purple" | "dark";
  onPress: () => void;
}) {
  const activeColor = tone === "purple" ? RBZ.c4 : tone === "dark" ? RBZ.ink : RBZ.c2;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.bigChoice,
        active && {
          borderColor: activeColor,
          backgroundColor:
            tone === "dark" ? "rgba(17,24,39,0.06)" : "rgba(216,52,95,0.07)",
        },
      ]}
    >
      <View
        style={[
          styles.bigIcon,
          { backgroundColor: active ? activeColor : "rgba(17,24,39,0.06)" },
        ]}
      >
        <Ionicons name={icon} size={18} color={active ? RBZ.white : RBZ.ink} />
      </View>

      <View style={styles.bigChoiceTextWrap}>
        <Text style={styles.bigChoiceTitle}>{label}</Text>
        <Text style={styles.bigChoiceSub}>{sub}</Text>
      </View>

      <Ionicons
        name={active ? "checkmark-circle" : "ellipse-outline"}
        size={20}
        color={active ? activeColor : "rgba(17,24,39,0.22)"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RBZ.bg,
  },
  safeWrap: {
    flex: 1,
    alignItems: "center",
    backgroundColor: RBZ.bg,
  },
  header: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: RBZ.line,
    backgroundColor: RBZ.white,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: RBZ.soft,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: RBZ.ink,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: RBZ.muted,
  },
  nextBtn: {
    minWidth: 62,
    height: 40,
    borderRadius: 999,
    backgroundColor: RBZ.c2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  nextBtnDisabled: {
    opacity: 0.55,
  },
  nextText: {
    color: RBZ.white,
    fontWeight: "900",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 14,
  },
  previewFrame: {
    backgroundColor: RBZ.dark,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  emptyPreview: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  previewTopPill: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.48)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  previewTopText: {
    color: RBZ.white,
    fontSize: 11,
    fontWeight: "800",
  },
  mediaBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(181,23,158,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  mediaBadgeText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 12,
  },
  captionCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: RBZ.line,
    borderRadius: 22,
    padding: 14,
    backgroundColor: RBZ.white,
  },
  captionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  captionTitle: {
    fontWeight: "900",
    color: RBZ.ink,
    fontSize: 15,
  },
  captionInput: {
    marginTop: 10,
    minHeight: 74,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: RBZ.soft,
    color: RBZ.ink,
    fontWeight: "700",
    lineHeight: 19,
  },
  captionCounter: {
    marginTop: 8,
    textAlign: "right",
    color: RBZ.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  settingsCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: RBZ.line,
    borderRadius: 22,
    padding: 14,
    backgroundColor: RBZ.white,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: RBZ.ink,
  },
  scopeGrid: {
    marginTop: 12,
    gap: 10,
  },
  bigChoice: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: RBZ.line,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: RBZ.white,
  },
  bigIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  bigChoiceTextWrap: {
    flex: 1,
  },
  bigChoiceTitle: {
    fontWeight: "900",
    color: RBZ.ink,
  },
  bigChoiceSub: {
    marginTop: 3,
    color: RBZ.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  selectedLine: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  selectedLineText: {
    color: RBZ.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  publishBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: RBZ.c1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: RBZ.c1,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 15,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullClose: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullMedia: {
    width: "100%",
    height: "100%",
  },
  fullHint: {
    position: "absolute",
    color: "rgba(255,255,255,0.72)",
    fontWeight: "800",
    fontSize: 12,
  },
}) as Record<string, any>;
