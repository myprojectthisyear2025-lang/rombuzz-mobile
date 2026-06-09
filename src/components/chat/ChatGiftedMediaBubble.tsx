/**
 * ============================================================
 * 📁 Location: src/components/chat/ChatGiftedMediaBubble.tsx
 * 🎁 Purpose: Gifted paid photo/video bubble for RomBuzz chat.
 *
 * Used by:
 *  - app/chat/[peerId].tsx
 *
 * What this file does:
 *  - Renders paid/gift-locked chat photos and videos.
 *  - Sender sees a protected blurred gift-media card.
 *  - Receiver sees locked media with unlock price.
 *  - Receiver unlocks through backend:
 *      POST /api/chat/rooms/:roomId/:msgId/unlock
 *  - Backend is the source of truth for BuzzCoin debit.
 *  - After successful unlock, parent chat updates the message.
 *
 * Important:
 *  - This file does NOT create the gift media.
 *  - ChatPlusModal creates/sends gift-locked media.
 *  - This file only renders and unlocks it.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { API_BASE } from "@/src/config/api";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#f5f6fa",
  line: "rgba(0,0,0,0.08)",
};

type Props = {
  message: any;
  isMine: boolean;
  myId: string;
  roomId: string;
  maxWidth: number;
  isExpired?: boolean;
  isViewOnceOrTwice?: boolean;
  onUnlocked: (updatedMessage: any) => void;
  onOpenImage: () => void;
  onOpenVideo: () => void;
  onLongPress?: () => void;
};

function getPriceBC(message: any) {
  const n = Math.floor(Number(message?.gift?.priceBC ?? message?.gift?.amount ?? 0) || 0);
  return n > 0 ? n : 0;
}

function getUnlockedBy(message: any) {
  return Array.isArray(message?.gift?.unlockedBy)
    ? message.gift.unlockedBy.map((x: any) => String(x))
    : [];
}

function getGiftMediaUri(message: any) {
  return String(
    message?.playback?.hls ||
      message?.signedUrl ||
      message?.previewUrl ||
      message?.url ||
      message?.mediaUrl ||
      ""
  ).trim();
}

function getGiftImageUri(message: any) {
  return String(
    message?.signedUrl ||
      message?.previewUrl ||
      message?.url ||
      message?.mediaUrl ||
      ""
  ).trim();
}

function getGiftPosterUri(message: any) {
  return String(
    message?.thumbnailUrl ||
      message?.cloudflareStream?.thumbnailUrl ||
      message?.previewUrl ||
      message?.signedUrl ||
      message?.url ||
      message?.mediaUrl ||
      ""
  ).trim();
}

export default function ChatGiftedMediaBubble({
  message,
  isMine,
  myId,
  roomId,
  maxWidth,
  isExpired = false,
  isViewOnceOrTwice = false,
  onUnlocked,
  onOpenImage,
  onOpenVideo,
  onLongPress,
}: Props) {
  const [unlocking, setUnlocking] = useState(false);
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  const priceBC = useMemo(() => getPriceBC(message), [message]);
  const mediaType = String(message?.mediaType || "").toLowerCase();
  const isVideo = mediaType === "video";

  const mediaUri = useMemo(() => getGiftMediaUri(message), [message]);
  const imageUri = useMemo(() => getGiftImageUri(message), [message]);
  const posterUri = useMemo(() => getGiftPosterUri(message), [message]);

const PROTECTED_STARS = [
  { id: "s1", left: "12%", top: "10%", size: 7, delay: 0 },
  { id: "s2", left: "35%", top: "16%", size: 4, delay: 140 },
  { id: "s3", left: "72%", top: "9%", size: 6, delay: 280 },
  { id: "s4", left: "88%", top: "24%", size: 4, delay: 420 },
  { id: "s5", left: "18%", top: "34%", size: 5, delay: 560 },
  { id: "s6", left: "51%", top: "31%", size: 8, delay: 700 },
  { id: "s7", left: "78%", top: "42%", size: 5, delay: 840 },
  { id: "s8", left: "28%", top: "55%", size: 6, delay: 980 },
  { id: "s9", left: "62%", top: "61%", size: 4, delay: 1120 },
  { id: "s10", left: "91%", top: "70%", size: 7, delay: 1260 },
  { id: "s11", left: "14%", top: "79%", size: 4, delay: 1400 },
  { id: "s12", left: "47%", top: "84%", size: 6, delay: 1540 },
  { id: "s13", left: "73%", top: "88%", size: 5, delay: 1680 },
];
  const unlockedByMe = useMemo(() => {
    return getUnlockedBy(message).includes(String(myId));
  }, [message, myId]);

  // Receiver must pay first.
  const lockedForReceiver = !!message?.gift?.locked && !isMine && !unlockedByMe;

  // Sender should not expose the full paid media in the bubble.
  // They get a protected blurred card instead of a dark/black screen.
  const protectedForSender = !!message?.gift?.locked && isMine;

  // View-once/twice gifted media should also stay visually protected in the bubble.
  const shouldProtectVisual =
    lockedForReceiver || protectedForSender || !!isViewOnceOrTwice;

  useEffect(() => {
    if (!shouldProtectVisual) {
      sparkleAnim.stopAnimation();
      sparkleAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [shouldProtectVisual, sparkleAnim]);

  const canOpen = !isExpired && !lockedForReceiver && !protectedForSender;

  async function unlockGiftedMedia() {
    const msgId = String(message?.id || "");
    if (!msgId || !roomId) return;

    if (priceBC <= 0) {
      Alert.alert("Unlock unavailable", "This media does not have a valid BuzzCoin unlock price.");
      return;
    }

    if (unlocking) return;

    try {
      setUnlocking(true);

      const token = await SecureStore.getItemAsync("RBZ_TOKEN");

      const res = await fetch(`${API_BASE}/chat/rooms/${roomId}/${msgId}/unlock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          "Could not unlock this gifted media.";

        Alert.alert("Unlock failed", errorMessage);
        return;
      }

      const unlockedGift = {
        ...(message?.gift || {}),
        ...(data?.message?.gift || {}),
        locked: false,
        unlockedBy: [
          ...new Set([
            ...getUnlockedBy(message),
            ...(Array.isArray(data?.message?.gift?.unlockedBy)
              ? data.message.gift.unlockedBy.map((v: any) => String(v))
              : []),
            String(myId),
          ]),
        ],
        priceBC,
        amount: priceBC,
        currency: "BC",
      };

      const updated = {
        ...message,
        ...(data?.message || {}),
        gift: unlockedGift,
      };

      onUnlocked(updated);

      Alert.alert(
        "Unlocked",
        `You unlocked this media for ${Number(data?.priceBC || priceBC)} BC.`
      );
    } catch (err: any) {
      Alert.alert("Unlock failed", err?.message || "Try again.");
    } finally {
      setUnlocking(false);
    }
  }

  function openMedia() {
    if (!canOpen) return;

    if (isVideo) {
      onOpenVideo();
      return;
    }

    onOpenImage();
  }

  if (isExpired) return null;

  const bubbleStyle: StyleProp<ViewStyle> = [
    styles.wrap,
    { maxWidth },
    isMine ? styles.mine : styles.peer,
    shouldProtectVisual ? styles.protectedWrap : undefined,
  ];

  const mediaStyle: StyleProp<ViewStyle> = [
    styles.media,
    shouldProtectVisual ? styles.mediaProtected : undefined,
  ];

  const imageStyle: StyleProp<ImageStyle> = [
    styles.media,
    shouldProtectVisual ? styles.mediaProtected : undefined,
  ];

  const unlockButtonStyle: StyleProp<ViewStyle> = [
    styles.unlockBtn,
    unlocking ? styles.unlockBtnDisabled : undefined,
  ];

  return (
    <Pressable
      onPress={openMedia}
      onLongPress={onLongPress}
      delayLongPress={260}
      style={bubbleStyle}
    >
      {isVideo ? (
        posterUri ? (
                <Image
            source={{ uri: posterUri }}
            style={imageStyle}
            resizeMode="cover"
            blurRadius={shouldProtectVisual ? 48 : 0}
          />
        ) : (
          <Video
            source={{ uri: mediaUri }}
            style={mediaStyle}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
          />
        )
      ) : (
           <Image
          source={{ uri: imageUri }}
          style={imageStyle}
          resizeMode="cover"
          blurRadius={shouldProtectVisual ? 48 : 0}
        />
      )}

          {shouldProtectVisual ? (
        <View style={styles.protectOverlay}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sparkleLayer,
              {
                opacity: sparkleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.45, 1, 0.55],
                }),
                transform: [
                  {
                    translateY: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [6, -8],
                    }),
                  },
                ],
              },
            ]}
          >
            {PROTECTED_STARS.map((star) => {
              const scale = sparkleAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.75, 1.35, 0.85],
              });

              return (
                <Animated.View
                  key={star.id}
                  style={[
                    styles.sparkleStar,
                    {
                      left: star.left as any,
                      top: star.top as any,
                      width: star.size,
                      height: star.size,
                      borderRadius: star.size / 2,
                      transform: [{ scale }],
                    },
                  ]}
                />
              );
            })}
          </Animated.View>

          <View style={styles.privacyVeil} pointerEvents="none" />

          <View style={styles.lockIcon}>
            <Ionicons
              name={lockedForReceiver ? "gift" : "lock-closed"}
              size={27}
              color={RBZ.white}
            />
          </View>

          <Text style={styles.lockTitle}>
            {lockedForReceiver
              ? `Gifted ${isVideo ? "video" : "photo"}`
              : `Protected ${isVideo ? "video" : "photo"}`}
          </Text>

          <Text style={styles.lockSub}>
            {lockedForReceiver
              ? "Unlock once. Keep it forever."
              : isMine
                ? `Sent as ${priceBC} BC gift media`
                : "Tap to view after opening"}
          </Text>

          {lockedForReceiver ? (
            <Pressable
              onPress={unlockGiftedMedia}
              disabled={unlocking}
              style={unlockButtonStyle}
            >
              {unlocking ? (
                <ActivityIndicator size="small" color={RBZ.white} />
              ) : (
                <Ionicons name="diamond" size={15} color={RBZ.white} />
              )}

              <Text style={styles.unlockText}>
                {unlocking ? "Unlocking..." : `Unlock for ${priceBC} BC`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!shouldProtectVisual ? (
        <>
          {isVideo ? (
            <View style={styles.videoPlayOverlay} pointerEvents="none">
              <View style={styles.videoPlayBadge}>
                <Ionicons name="play" size={22} color={RBZ.white} />
              </View>
            </View>
          ) : null}

          <View style={styles.priceBadge}>
            <Ionicons name="gift" size={13} color={RBZ.white} />
            <Text style={styles.priceBadgeText}>Unlocked</Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 6,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#151018",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  mine: {
    alignSelf: "flex-end",
  },
  peer: {
    alignSelf: "flex-start",
  },
  protectedWrap: {
    borderColor: "rgba(216,52,95,0.34)",
    backgroundColor: "#171018",
  },
  media: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#20131b",
  },
  mediaProtected: {
    opacity: 0.24,
    transform: [{ scale: 1.12 }],
  },
  protectOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,6,14,0.84)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  privacyVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(177,18,60,0.20)",
  },
  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  sparkleStar: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#fff",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
   lockIcon: {
    zIndex: 3,
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,52,95,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    marginBottom: 10,
  },
  lockTitle: {
    zIndex: 3,
    color: RBZ.white,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
   lockSub: {
    zIndex: 3,
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 14,
  },
    unlockBtn: {
    zIndex: 3,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  unlockBtnDisabled: {
    opacity: 0.68,
  },
  unlockText: {
    color: RBZ.white,
    fontSize: 13,
    fontWeight: "900",
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayBadge: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  priceBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(216,52,95,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  priceBadgeText: {
    color: RBZ.white,
    fontSize: 11,
    fontWeight: "900",
  },
});