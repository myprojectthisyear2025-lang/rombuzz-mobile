/**
 * ============================================================================
 * 📁 File: src/components/profile/ViewProfileMediaActions.tsx
 * 🎯 Purpose: Enhanced fullscreen media actions with modern social UI
 *
 * Features:
 *  - Glassmorphic floating action bar
 *  - Micro-interactions (haptic-style press feedback)
 *  - Gradient accent backgrounds
 *  - Reordered: Gift → Comment → Share
 *  - Unique circular icon design with soft shadows
 * ============================================================================
 */

import { API_BASE } from "@/src/config/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type MediaKind = "photo" | "reel";

type ViewProfileMediaItem = {
  id?: string;
  mediaId?: string;
  ownerId?: string;
  userId?: string;
  url?: string;
  mediaUrl?: string;
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
  line: "rgba(17,24,39,0.10)",
  dark: "rgba(0,0,0,0.72)",
  glass: "rgba(20, 20, 30, 0.75)",
  glassBorder: "rgba(255,255,255,0.12)",
} as const;

const GIFT_OPTIONS = [
  { key: "rose", label: "Rose", emoji: "🌹", gradient: ["#ff758c", "#ff7eb3"] },
  { key: "heart", label: "Heart", emoji: "💖", gradient: ["#f43b47", "#ff6b6b"] },
  { key: "teddy", label: "Teddy", emoji: "🧸", gradient: ["#d4a373", "#f7d1a0"] },
  { key: "ring", label: "Ring", emoji: "💍", gradient: ["#c0c0aa", "#e0e0d0"] },
  { key: "crown", label: "Crown", emoji: "👑", gradient: ["#ffd700", "#ffed4e"] },
  { key: "sparkle", label: "Sparkle", emoji: "✨", gradient: ["#a8edea", "#fed6e3"] },
] as const;

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
      const id = parsed?.id || parsed?._id || parsed?.userId || parsed?.user?.id;
      if (id) return String(id);
    }
  } catch {}

  const h = await authHeaders();
  const res = await fetch(`${API_BASE}/users/me`, { headers: h });
  const data = await res.json().catch(() => ({}));
  const id = data?.user?.id || data?.id || data?._id || data?.userId;
  return id ? String(id) : "";
}

function getMediaId(item: ViewProfileMediaItem) {
  return String(item?.mediaId || item?.id || item?._id || "").trim();
}

function getMediaUrl(item: ViewProfileMediaItem) {
  return String(item?.mediaUrl || item?.url || item?.fileUrl || item?.videoUrl || item?.imageUrl || "").trim();
}

function commentAuthorName(comment: any) {
  const author = comment?.author || comment?.user || {};
  const first = String(author?.firstName || comment?.firstName || "").trim();
  const last = String(author?.lastName || comment?.lastName || "").trim();
  const username = String(author?.username || comment?.username || "").trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return combined || username || "RomBuzz User";
}

function commentBody(comment: any) {
  return String(comment?.text || comment?.body || comment?.comment || "").trim();
}

function findMediaFromProfile(profileUser: any, mediaId: string) {
  const sources = [
    ...(Array.isArray(profileUser?.media) ? profileUser.media : []),
    ...(Array.isArray(profileUser?.reels) ? profileUser.reels : []),
    ...(Array.isArray(profileUser?.gallery) ? profileUser.gallery : []),
    ...(Array.isArray(profileUser?.uploads) ? profileUser.uploads : []),
  ];

  return sources.find((m: any) => {
    const id = String(m?.id || m?._id || m?.mediaId || "");
    return id && id === String(mediaId);
  });
}

// Action Button Component for cleaner code
const ActionButton = ({ icon, onPress, variant = "photo", label, count }: any) => {
  const [pressed, setPressed] = useState(false);
  const isReel = variant === "reel";

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[
        isReel ? styles.reelActionItem : styles.photoActionButton,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <View style={isReel ? styles.reelIconBubble : styles.photoIconBubble}>
        <Ionicons
          name={icon}
          size={isReel ? 28 : 23}
          color={RBZ.white}
        />
      </View>

      {isReel ? (
        <Text style={styles.reelActionText}>
          {typeof count === "number" ? count : label}
        </Text>
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
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<any[]>(Array.isArray(item?.comments) ? item.comments : []);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [giftOpen, setGiftOpen] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);

  const mediaId = useMemo(() => getMediaId(item), [item]);
  const mediaUrl = useMemo(() => getMediaUrl(item), [item]);
  const commentsCount = comments.length || (Array.isArray(item?.comments) ? item.comments.length : 0);

  const loadComments = useCallback(async () => {
    if (!ownerId || !mediaId) return;

    setCommentsOpen(true);
    setCommentsLoading(true);

    try {
      const h = await authHeaders();
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(ownerId)}`, { headers: h });
      const data = await res.json().catch(() => ({}));
      const media = findMediaFromProfile(data?.user, mediaId);
      const nextComments = Array.isArray(media?.comments)
        ? media.comments
        : Array.isArray(item?.comments)
        ? item.comments
        : [];
      setComments(nextComments);
    } catch {
      setComments(Array.isArray(item?.comments) ? item.comments : []);
    } finally {
      setCommentsLoading(false);
    }
  }, [item, mediaId, ownerId]);

  const sendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !ownerId || !mediaId || sendingComment) return;

    try {
      setSendingComment(true);
      const h = await authHeaders();
      const res = await fetch(`${API_BASE}/media/${encodeURIComponent(ownerId)}/comment`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          mediaId,
          text,
          parentId: null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Could not post comment.");

      setCommentText("");
      await loadComments();
      await onRefresh?.();
    } catch (e: any) {
      Alert.alert("Comment", e?.message || "Could not post comment.");
    } finally {
      setSendingComment(false);
    }
  }, [commentText, loadComments, mediaId, onRefresh, ownerId, sendingComment]);

  const sendGift = useCallback(
    async (giftKey: string) => {
      if (!ownerId || !mediaId || sendingGift) return;

      try {
        setSendingGift(true);
        const h = await authHeaders();
        const res = await fetch(`${API_BASE}/media/${encodeURIComponent(ownerId)}/gifts`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            mediaId,
            giftKey,
            amount: 1,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Gallery media gifts are not ready on the backend yet."
          );
        }

        setGiftOpen(false);
        Alert.alert("✨ Gift sent!", `You sent ${ownerName || "this user"} a ${giftKey} gift.`);
        await onRefresh?.();
      } catch (e: any) {
        Alert.alert("Gift", e?.message || "Could not send gift.");
      } finally {
        setSendingGift(false);
      }
    },
    [mediaId, onRefresh, ownerId, ownerName, sendingGift]
  );

  const shareToOwner = useCallback(async () => {
    try {
      const meId = await getMeId();
      const targetOwnerId = String(ownerId || item?.ownerId || item?.userId || "").trim();

      if (!meId || !targetOwnerId) throw new Error("Missing user id.");
      if (meId === targetOwnerId) throw new Error("You cannot share this to yourself.");
      if (!mediaId || !mediaUrl) throw new Error("Missing media details.");

      const h = await authHeaders();
      const roomId = roomIdFor(meId, targetOwnerId);
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
        headers: h,
        body: JSON.stringify({ text, to: targetOwnerId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Could not share media.");

      router.push({
        pathname: "/chat/[peerId]" as any,
        params: {
          peerId: targetOwnerId,
          name: ownerName || "RomBuzz User",
          avatar: ownerAvatar || "",
        },
      });
    } catch (e: any) {
      Alert.alert("Share", e?.message || "Could not share media.");
    }
  }, [item, mediaId, mediaKind, mediaUrl, ownerAvatar, ownerId, ownerName, router]);

  return (
    <>
      {/* Fullscreen media actions */}
      {mediaKind === "photo" ? (
        isPhotoZoomed ? null : (
          <View style={styles.photoActionsShell} pointerEvents="box-none">
            <ActionButton icon="gift-outline" onPress={() => setGiftOpen(true)} />
            <ActionButton icon="chatbubble-outline" onPress={loadComments} />
            <ActionButton icon="paper-plane-outline" onPress={shareToOwner} />
          </View>
        )
      ) : (
        <View style={styles.reelActionsShell} pointerEvents="box-none">
          <ActionButton
            variant="reel"
            icon="gift-outline"
           // label="Gift"
            onPress={() => setGiftOpen(true)}
          />

          <ActionButton
            variant="reel"
            icon="chatbubble-outline"
           // count={commentsCount}
            onPress={loadComments}
          />

          <ActionButton
            variant="reel"
            icon="paper-plane-outline"
           // label="Share"
            onPress={shareToOwner}
          />
        </View>
      )}

      {/* Comments Modal - Enhanced */}
      <Modal
        visible={commentsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCommentsOpen(false)}>
          <Pressable style={styles.commentSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>💬 Comments</Text> 
              <Pressable onPress={() => setCommentsOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={18} color={RBZ.ink} />
              </Pressable>
            </View>

            {commentsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={RBZ.c2} size="large" />
              </View>
            ) : (
              <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <View key={String(comment?.id || comment?._id || index)} style={styles.commentItem}>
                      <View style={styles.commentAvatarPlaceholder}>
                        <Text style={styles.commentAvatarText}>
                          {commentAuthorName(comment).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentAuthor}>{commentAuthorName(comment)}</Text>
                        <Text style={styles.commentText}>{commentBody(comment)}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyComments}>
                    <LinearGradient
                      colors={[RBZ.c2, RBZ.c4]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.emptyIconCircle}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={32} color={RBZ.white} />
                    </LinearGradient>
                    <Text style={styles.emptyCommentsText}>No comments yet</Text>
                    <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.commentComposer}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={RBZ.muted}
                style={styles.commentInput}
                multiline
              />
              <Pressable
                onPress={sendComment}
                disabled={sendingComment || !commentText.trim()}
                style={[
                  styles.sendButton,
                  (!commentText.trim() || sendingComment) && styles.sendButtonDisabled,
                ]}
              >
                {sendingComment ? (
                  <ActivityIndicator size="small" color={RBZ.white} />
                ) : (
                  <Ionicons name="send" size={16} color={RBZ.white} />
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Gift Modal - Enhanced with gradients */}
      <Modal
        visible={giftOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGiftOpen(false)}
      >
        <Pressable style={styles.modalBackdropCenter} onPress={() => setGiftOpen(false)}>
          <Pressable style={styles.giftCard} onPress={() => {}}>
            <LinearGradient
              colors={["#fff", "#fef2f2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.giftCardGradient}
            >
              <Text style={styles.giftTitle}>🎁 Send a Gift</Text>
              <Text style={styles.giftSubtitle}>Show some love! 💝</Text>

              <View style={styles.giftGrid}>
                {GIFT_OPTIONS.map((gift) => (
                  <Pressable
                    key={gift.key}
                    onPress={() => sendGift(gift.key)}
                    disabled={sendingGift}
                    style={({ pressed }) => [
                      styles.giftOption,
                      pressed && styles.giftOptionPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={gift.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.giftEmojiCircle}
                    >
                      <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                    </LinearGradient>
                    <Text style={styles.giftLabel}>{gift.label}</Text>
                  </Pressable>
                ))}
              </View>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackdropCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  commentSheet: {
    maxHeight: "78%",
    minHeight: "48%",
    backgroundColor: RBZ.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.16)",
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(17,24,39,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: RBZ.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(17,24,39,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBox: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  commentsList: {
    paddingHorizontal: 16,
    flex: 1,
  },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(17,24,39,0.06)",
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    color: RBZ.white,
    fontSize: 16,
    fontWeight: "800",
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    color: RBZ.ink,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 3,
  },
  commentText: {
    color: RBZ.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyComments: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyCommentsText: {
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyCommentsSubtext: {
    color: RBZ.muted,
    fontSize: 12,
    marginTop: 4,
  },
  commentComposer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(17,24,39,0.08)",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(17,24,39,0.05)",
    color: RBZ.ink,
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  giftCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  giftCardGradient: {
    padding: 20,
  },
  giftTitle: {
    color: RBZ.ink,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  giftSubtitle: {
    color: RBZ.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 20,
    textAlign: "center",
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  giftOption: {
    width: "30%",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(216,52,95,0.06)",
  },
  giftOptionPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: "rgba(216,52,95,0.12)",
  },
  giftEmojiCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  giftEmoji: {
    fontSize: 28,
  },
  giftLabel: {
    marginTop: 4,
    color: RBZ.ink,
    fontSize: 12,
    fontWeight: "700",
  },
});