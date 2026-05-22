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
 *  - Sender sees the media with a price badge.
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
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const priceBC = useMemo(() => getPriceBC(message), [message]);
  const mediaType = String(message?.mediaType || "").toLowerCase();
  const isVideo = mediaType === "video";
  const url = String(message?.url || "").trim();

  const unlockedByMe = useMemo(() => {
    return getUnlockedBy(message).includes(String(myId));
  }, [message, myId]);

  const lockedForMe = !!message?.gift?.locked && !isMine && !unlockedByMe;
  const canOpen = !isExpired && !lockedForMe;

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

      const updated = data?.message || {
        ...message,
        gift: {
          ...(message?.gift || {}),
          locked: false,
          unlockedBy: [
            ...new Set([
              ...getUnlockedBy(message),
              String(myId),
            ]),
          ],
          priceBC,
          amount: priceBC,
        },
      };

      onUnlocked(updated);
      Alert.alert("Unlocked", `You unlocked this media for ${Number(data?.priceBC || priceBC)} BC.`);
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
    lockedForMe ? styles.lockedWrap : undefined,
  ];

  const videoStyle: StyleProp<ViewStyle> = [
    styles.media,
    lockedForMe || isViewOnceOrTwice ? styles.mediaHidden : undefined,
  ];

  const imageStyle: StyleProp<ImageStyle> = [
    styles.media,
    lockedForMe || isViewOnceOrTwice ? styles.mediaHidden : undefined,
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
        <Video
          source={{ uri: url }}
          style={videoStyle}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted={!!message?.muted}
        />
      ) : (
        <Image
          source={{ uri: url }}
          style={imageStyle}
          resizeMode="cover"
        />
      )}

      {lockedForMe ? (
        <View style={styles.lockOverlay}>
          <View style={styles.lockIcon}>
            <Ionicons name="gift" size={28} color={RBZ.white} />
          </View>

          <Text style={styles.lockTitle}>
            Gifted {isVideo ? "video" : "photo"}
          </Text>

          <Text style={styles.lockSub}>
            Unlock once. Keep it forever.
          </Text>

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
        </View>
      ) : null}

      {!lockedForMe ? (
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
            <Text style={styles.priceBadgeText}>
              {isMine ? `${priceBC} BC gift media` : "Unlocked"}
            </Text>
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
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  mine: {
    alignSelf: "flex-end",
  },
  peer: {
    alignSelf: "flex-start",
  },
  lockedWrap: {
    borderColor: "rgba(216,52,95,0.62)",
  },
  media: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  mediaHidden: {
    opacity: 0.14,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,8,12,0.82)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    marginBottom: 10,
  },
  lockTitle: {
    color: RBZ.white,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  lockSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 14,
  },
  unlockBtn: {
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