/**
 * ============================================================================
 * 📁 File: src/components/profile/ViewProfileMediaActions.tsx
 * 🎯 Purpose: Fullscreen media actions for ViewProfile photos/reels.
 *
 * Used by:
 *  - app/(tabs)/view-profile.tsx
 *  - RBZImageViewer footer
 *  - RBZVideoViewer footer
 *
 * What it does:
 *  - Shows Gift / Comment / Share actions on matched user's fullscreen media
 *  - Uses PrivateCommentsSheet for private comments
 *  - Keeps media gifts + gift insights working
 *  - Shares the viewed media directly to the media owner’s chat
 *
 * Comment rule:
 *  - Comments are private between media owner and commenter.
 *  - Backend enforces privacy.
 *  - This component only opens the shared reusable comments sheet.
 * ============================================================================
 */

import { getGiftSummary, type GiftSummaryResponse } from "@/src/api/gifts";
import { API_BASE } from "@/src/config/api";
import PrivateCommentsSheet from "@/src/components/comments/PrivateCommentsSheet";
import GiftInsightSheet from "@/src/components/gifts/GiftInsightSheet";
import GiftPicker from "@/src/components/gifts/GiftPicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

type MediaKind = "photo" | "reel";

type ViewProfileMediaItem = {
  id?: string;
  _id?: string;
  mediaId?: string;
  ownerId?: string;
  userId?: string;
  url?: string;
  mediaUrl?: string;
  fileUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  type?: string;
  caption?: string;
  comments?: any[];
  [key: string]: any;
};

type Props = {
  item: ViewProfileMediaItem;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  mediaKind: MediaKind;

  /**
   * Pass true from the photo viewer while the image is zoomed.
   * Photos hide the action icons while zoomed so the user can pan freely.
   * Reels ignore this prop.
   */
  isPhotoZoomed?: boolean;

  onRefresh?: () => Promise<void> | void;
};

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
} as const;

function roomIdFor(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

function encodeRBZShare(payload: any) {
  return `::RBZ::${JSON.stringify(payload)}`;
}

async function authHeaders() {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

async function getMeId() {
  try {
    const cached = await SecureStore.getItemAsync("RBZ_USER");

    if (cached) {
      const parsed = JSON.parse(cached);
      const id =
        parsed?.id ||
        parsed?._id ||
        parsed?.userId ||
        parsed?.user?.id ||
        parsed?.user?._id ||
        parsed?.user?.userId;

      if (id) return String(id);
    }
  } catch {}

  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/users/me`, { headers });
  const data = await res.json().catch(() => ({}));
  const id = data?.user?.id || data?.id || data?._id || data?.userId;

  return id ? String(id) : "";
}

function getMediaId(item: ViewProfileMediaItem) {
  return String(item?.mediaId || item?.id || item?._id || "").trim();
}

function getMediaUrl(item: ViewProfileMediaItem) {
  return String(
    item?.mediaUrl ||
      item?.url ||
      item?.fileUrl ||
      item?.videoUrl ||
      item?.imageUrl ||
      ""
  ).trim();
}

function getInitialCommentCount(item: ViewProfileMediaItem) {
  return Array.isArray(item?.comments) ? item.comments.length : 0;
}

const ActionButton = ({
  icon,
  onPress,
  onLongPress,
  variant = "photo",
  label,
  count,
}: {
  icon: any;
  onPress: () => void;
  onLongPress?: () => void;
  variant?: "photo" | "reel";
  label?: string;
  count?: number;
}) => {
  const [pressed, setPressed] = useState(false);
  const isReel = variant === "reel";
  const hasCount = typeof count === "number" && count > 0;

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={260}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[
        isReel ? styles.reelActionItem : styles.photoActionButton,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <View style={isReel ? styles.reelIconBubble : styles.photoIconBubble}>
        <Ionicons name={icon} size={isReel ? 28 : 23} color={RBZ.white} />

        {!isReel && hasCount ? (
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>{count}</Text>
          </View>
        ) : null}
      </View>

      {isReel ? (
        <Text style={styles.reelActionText}>{hasCount ? count : label}</Text>
      ) : null}
    </Pressable>
  );
};

export default function ViewProfileMediaActions({
  item,
  ownerId,
  ownerName,
  ownerAvatar,
  mediaKind,
  isPhotoZoomed = false,
  onRefresh,
}: Props) {
  const router = useRouter();

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(getInitialCommentCount(item));

  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [giftInsightOpen, setGiftInsightOpen] = useState(false);
  const [giftSummary, setGiftSummary] = useState<GiftSummaryResponse | null>(null);
  const [giftSummaryLoading, setGiftSummaryLoading] = useState(false);

  const [meId, setMeId] = useState("");

  const mediaId = useMemo(() => getMediaId(item), [item]);
  const mediaUrl = useMemo(() => getMediaUrl(item), [item]);
  const giftCount = Number(giftSummary?.totalCount || 0);

  const ownerUser = useMemo(
    () => ({
      id: String(ownerId || item?.ownerId || item?.userId || ""),
      firstName: String(ownerName || "").split(" ")[0] || "",
      lastName: String(ownerName || "").split(" ").slice(1).join(" ") || "",
      avatar: ownerAvatar || "",
    }),
    [item?.ownerId, item?.userId, ownerAvatar, ownerId, ownerName]
  );

  useEffect(() => {
    setCommentsCount(getInitialCommentCount(item));
  }, [item]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const id = await getMeId();
        if (alive) setMeId(id);
      } catch {
        if (alive) setMeId("");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const reloadGiftSummary = useCallback(async () => {
    if (!ownerId || !mediaId) {
      setGiftSummary(null);
      return;
    }

    try {
      setGiftSummaryLoading(true);

      const summary = await getGiftSummary({
        receiverId: String(ownerId),
        targetType: "gallery_media",
        targetId: String(mediaId),
        includeTransactions: true,
      });

      setGiftSummary(summary);
    } catch {
      setGiftSummary(null);
    } finally {
      setGiftSummaryLoading(false);
    }
  }, [mediaId, ownerId]);

  useEffect(() => {
    reloadGiftSummary();
  }, [reloadGiftSummary]);

  const openGiftInsight = useCallback(async () => {
    if (!ownerId || !mediaId || giftSummaryLoading) return;

    if (!giftSummary) {
      await reloadGiftSummary();
    }

    const currentCount = Number(giftSummary?.totalCount || 0);
    if (currentCount <= 0) return;

    setGiftInsightOpen(true);
  }, [giftSummary, giftSummaryLoading, mediaId, ownerId, reloadGiftSummary]);

  const openComments = useCallback(() => {
    if (!ownerId || !mediaId) {
      Alert.alert("Comments", "Missing media details.");
      return;
    }

    setCommentsOpen(true);
  }, [mediaId, ownerId]);

  const handleCommentsChanged = useCallback((nextComments: any[]) => {
    setCommentsCount(Array.isArray(nextComments) ? nextComments.length : 0);
  }, []);

  const handleGiftSent = useCallback(async () => {
    await reloadGiftSummary();
    await onRefresh?.();
  }, [onRefresh, reloadGiftSummary]);

  const shareToOwner = useCallback(async () => {
    try {
      const myId = meId || (await getMeId());
      const targetOwnerId = String(ownerId || item?.ownerId || item?.userId || "").trim();

      if (!myId || !targetOwnerId) throw new Error("Missing user id.");
      if (myId === targetOwnerId) throw new Error("You cannot share this to yourself.");
      if (!mediaId || !mediaUrl) throw new Error("Missing media details.");

      const headers = await authHeaders();
      const roomId = roomIdFor(myId, targetOwnerId);

      const text = encodeRBZShare({
        type: "share_profile_media",
        mediaType: mediaKind,
        mediaId,
        ownerId: targetOwnerId,
        ownerName,
        mediaUrl,
        caption: item?.caption || "",
      });

      const res = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, to: targetOwnerId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Could not share media.");
      }

      router.push({
        pathname: "/chat/[peerId]" as any,
        params: {
          peerId: targetOwnerId,
          name: ownerName || "RomBuzz User",
          avatar: ownerAvatar || "",
        },
      });
    } catch (error: any) {
      Alert.alert("Share", error?.message || "Could not share media.");
    }
  }, [item, meId, mediaId, mediaKind, mediaUrl, ownerAvatar, ownerId, ownerName, router]);

  return (
    <>
      {mediaKind === "photo" ? (
        isPhotoZoomed ? null : (
          <View style={styles.photoActionsShell} pointerEvents="box-none">
            <ActionButton
              icon="gift-outline"
              count={giftCount}
              onPress={() => setGiftPickerOpen(true)}
              onLongPress={openGiftInsight}
            />

            <ActionButton
              icon="chatbubble-outline"
              count={commentsCount}
              onPress={openComments}
            />

            <ActionButton icon="paper-plane-outline" onPress={shareToOwner} />
          </View>
        )
      ) : (
        <View style={styles.reelActionsShell} pointerEvents="box-none">
          <ActionButton
            variant="reel"
            icon="gift-outline"
            count={giftCount}
            onPress={() => setGiftPickerOpen(true)}
            onLongPress={openGiftInsight}
          />

          <ActionButton
            variant="reel"
            icon="chatbubble-outline"
            label="Comments"
            count={commentsCount}
            onPress={openComments}
          />

          <ActionButton
            variant="reel"
            icon="paper-plane-outline"
            label="Share"
            onPress={shareToOwner}
          />
        </View>
      )}

      {ownerId && mediaId ? (
        <PrivateCommentsSheet
          visible={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          targetType="gallery_media"
          targetId={String(mediaId)}
          ownerId={String(ownerId)}
          currentUserId={String(meId || "")}
          ownerUser={ownerUser}
          title="Private Comments"
          subtitle="Visible only to you and the media owner."
          onChanged={handleCommentsChanged}
        />
      ) : null}

      <GiftPicker
        visible={giftPickerOpen}
        onClose={() => setGiftPickerOpen(false)}
        receiverId={String(ownerId || "")}
        placement="profile_media"
        targetType="gallery_media"
        targetId={String(mediaId || "")}
        title="Send a Gift"
        subtitle={`Send a gift to ${ownerName || "this user"}.`}
        onSent={handleGiftSent}
      />

      <GiftInsightSheet
        visible={giftInsightOpen}
        onClose={() => setGiftInsightOpen(false)}
        summary={giftSummary}
        currentUserId={meId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  photoActionsShell: {
    position: "absolute",
    right: 16,
    bottom: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    zIndex: 40,
    elevation: 40,
  },

  reelActionsShell: {
    position: "absolute",
    right: 16,
    bottom: 135,
    alignItems: "center",
    gap: 1,
    zIndex: 40,
    elevation: 40,
  },

  photoActionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  reelActionItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  actionButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.82,
  },

  photoIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },

  photoCountBadge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: RBZ.white,
  },

  photoCountText: {
    color: RBZ.white,
    fontSize: 10,
    fontWeight: "900",
  },

  reelIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  reelActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});