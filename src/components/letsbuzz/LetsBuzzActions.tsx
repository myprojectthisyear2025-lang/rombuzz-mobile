/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/LetsBuzzActions.tsx
 * 🎯 Purpose: Centralized actions (Gift / Comment / Share) for LetsBuzz posts
 *
 * Guarantees:
 *  - Gift picker UI unchanged (emoji + label)
 *  - Gift insights:
 *      • Owner → all gifters + gifts
 *      • Gifter → ONLY what they sent
 *      • Others → nothing
 *  - Comments are private (owner + commenter)
 *  - Share → sends to owner chat + opens chat
 * ============================================================================
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";

type BuzzUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
};

type GiftSummaryRow = {
  userId: string;
  user?: BuzzUser;
  gifts?: Record<string, number>;
  total?: number;
};

type GiftSummary = {
  postId: string;
  ownerId: string;
  total: number;
  byGift?: Record<string, number>;
  byUser?: GiftSummaryRow[] | null;

  // (we add this on the client, even if backend doesn't send it)
  viewerRole?: "owner" | "gifter" | "viewer";
};

type BuzzComment = {
  id: string;
  userId: string;
  text: string;
  parentId: string | null;
  createdAt: any;
  updatedAt: any;
  author?: BuzzUser;
};
type BuzzPost = {
  id?: string;      // legacy
  _id?: string;     // mongo
  userId: string;
  mediaUrl?: string;
  user?: BuzzUser;

  // ✅ gallery-backed letsbuzz feed support
  mediaId?: string;
  fromGallery?: boolean;
  commentsCount?: number;
};

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  sub: "rgba(255,255,255,0.70)",
  text: "rgba(255,255,255,0.92)",
};

const GIFT_OPTIONS = [
  { key: "rose", label: "Rose", emoji: "🌹" },
  { key: "heart", label: "Heart", emoji: "💖" },
  { key: "teddy", label: "Teddy", emoji: "🧸" },
  { key: "ring", label: "Ring", emoji: "💍" },
  { key: "crown", label: "Crown", emoji: "👑" },
  { key: "sparkle", label: "Sparkle", emoji: "✨" },
] as const;

async function authHeaders() {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

function roomIdFor(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}
function getPostId(post: any) {
  return post?.id || post?._id;
}

function encodeRBZSharePost(payload: any) {
  return `::RBZ::${JSON.stringify(payload)}`;
}

export function useLetsBuzzActions(meId: string) {
  const router = useRouter();

  const [activePost, setActivePost] = useState<BuzzPost | null>(null);

  // 🎁 Gifts
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [giftInsightsOpen, setGiftInsightsOpen] = useState(false);
  const [giftSummary, setGiftSummary] = useState<GiftSummary | null>(null);

  // 💬 Comments
   // 💬 Comments
   const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<BuzzComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  // comment counts per post (so Posts/Reels can show “· N”)
  const commentCountByPostRef = useRef<Record<string, number>>({});
  const getKnownCommentCount = useCallback((postId?: string) => {
    if (!postId) return 0;
    return commentCountByPostRef.current[postId] || 0;
  }, []);

  const [, forceCountsRerender] = useState(0);

  const parseError = async (r: Response) => {

    try {
      const j = await r.json();
      return j?.error || j?.message || "request_failed";
    } catch {
      return "request_failed";
    }
  };

    const loadGalleryComments = useCallback(
    async (post: BuzzPost) => {
      const h = await authHeaders();

      const ownerRes = await fetch(`${API_BASE}/users/${post.userId}`, { headers: h });
      if (!ownerRes.ok) throw new Error(await parseError(ownerRes));

      const ownerJson = await ownerRes.json();
      const mediaList = Array.isArray(ownerJson?.user?.media) ? ownerJson.user.media : [];

      const media = mediaList.find(
        (m: any) => String(m?.id || "") === String(post.mediaId || post.id)
      );

       const rawList = Array.isArray(media?.comments)
        ? media.comments.map((c: any) => ({
            ...c,
            author:
              c?.userId === post.userId
                ? post.user
                : c?.userId === meId
                ? { id: meId, firstName: "You" }
                : { id: c?.userId, firstName: "User" },
            canEdit: String(c?.userId || "") === String(meId),
            canDelete:
              String(c?.userId || "") === String(meId) ||
              String(post.userId || "") === String(meId),
            canReply:
              String(c?.userId || "") === String(meId) ||
              String(post.userId || "") === String(meId),
          }))
        : [];

      const topLevel = rawList
        .filter((c: any) => !c?.parentId)
        .sort((a: any, b: any) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));

      const replies = rawList
        .filter((c: any) => !!c?.parentId)
        .sort((a: any, b: any) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));

      const list: any[] = [];
      for (const parent of topLevel) {
        list.push(parent);

        const childReplies = replies.filter(
          (r: any) => String(r?.parentId || "") === String(parent.id)
        );

        for (const child of childReplies) {
          list.push(child);
        }
      }

      const orphanReplies = replies.filter(
        (r: any) => !topLevel.some((p: any) => String(p.id) === String(r.parentId))
      );

      for (const orphan of orphanReplies) {
        list.push(orphan);
      }

      setComments(list);

      const postKey = String(post.id || post._id || "");
      commentCountByPostRef.current[postKey] = list.length;
      forceCountsRerender((x) => x + 1);

      return list;
    },
    [meId, parseError]
  );

  const replySeedFor = useCallback((name?: string) => {
    const clean = String(name || "").trim().replace(/\s+/g, " ");
    return clean ? `@${clean} ` : "";
  }, []);

  const reloadCommentsForPost = useCallback(
    async (post?: BuzzPost | null) => {
      const target = post || activePost;
      if (!target) return;

      if (target.fromGallery) {
        await loadGalleryComments(target);
        return;
      }

      const h = await authHeaders();
      const postId = getPostId(target);
      if (!postId) throw new Error("missing_post_id");

      const r = await fetch(`${API_BASE}/buzz/posts/${postId}/comments`, { headers: h });
      if (!r.ok) throw new Error(await parseError(r));

      const j = await r.json();
      const list = Array.isArray(j?.comments) ? j.comments : [];
      setComments(list);

      commentCountByPostRef.current[String(postId)] = list.length;
      forceCountsRerender((x) => x + 1);
    },
    [activePost, loadGalleryComments, parseError]
  );

  /* ------------------------------------------------------------------ */
  /* 📡 Realtime: comment socket sync                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
  let alive = true;
  let socket: any = null;

  let onNew: any = null;
  let onDeleted: any = null;
  let onReact: any = null;
  let onUpdated: any = null;

  (async () => {
    socket = await getSocket();
    if (!alive || !socket?.on || !socket?.off) return;

    const refreshIfActive = async (postId: string) => {
      try {
        if (!alive) return;
        if (!activePost || !commentsOpen) return;

        const activeId = String(activePost.id || activePost._id || "");
        if (activeId !== String(postId)) return;

        await reloadCommentsForPost(activePost);
      } catch {}
    };

    onNew = async (p: any) => {
      const postId = String(p?.postId || "");
      if (!postId) return;

      commentCountByPostRef.current[postId] =
        (commentCountByPostRef.current[postId] || 0) + 1;

      forceCountsRerender((x) => x + 1);
      await refreshIfActive(postId);
    };

    onDeleted = async (p: any) => {
      const postId = String(p?.postId || "");
      if (!postId) return;

      commentCountByPostRef.current[postId] = Math.max(
        0,
        (commentCountByPostRef.current[postId] || 0) - 1
      );

      forceCountsRerender((x) => x + 1);
      await refreshIfActive(postId);
    };

    onReact = async (p: any) => {
      const postId = String(p?.postId || "");
      if (!postId) return;
      await refreshIfActive(postId);
    };

    onUpdated = async (p: any) => {
      const postId = String(p?.postId || "");
      if (!postId) return;
      await refreshIfActive(postId);
    };

    socket.on("comment:new", onNew);
    socket.on("comment:deleted", onDeleted);
    socket.on("comment:react", onReact);
    socket.on("comment:reactRemoved", onReact);
    socket.on("comment:updated", onUpdated);
  })();

  return () => {
    alive = false;

    if (socket?.off) {
      if (onNew) socket.off("comment:new", onNew);
      if (onDeleted) socket.off("comment:deleted", onDeleted);
      if (onReact) socket.off("comment:react", onReact);
      if (onReact) socket.off("comment:reactRemoved", onReact);
      if (onUpdated) socket.off("comment:updated", onUpdated);
    }
  };
}, [activePost, commentsOpen, reloadCommentsForPost]);

  /* ------------------------------------------------------------------ */
  /* 🎁 Gift: picker                                                     */
  /* ------------------------------------------------------------------ */
  const openGiftPicker = useCallback((post: BuzzPost) => {
    setActivePost(post);
    setGiftPickerOpen(true);
  }, []);

 const sendGift = useCallback(
  async (giftKey: string) => {
    if (!activePost) return;

    const postId = getPostId(activePost);
    if (!postId) return;

    try {
      const h = await authHeaders();
      const r = await fetch(`${API_BASE}/buzz/posts/${postId}/gifts`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ giftKey, amount: 1 }),
      });
        if (!r.ok) throw new Error(await parseError(r));

        setGiftPickerOpen(false);
      } catch (e: any) {
        Alert.alert("Gift", e?.message ? String(e.message) : "Failed to send gift.");
      }
    },
    [activePost]
  );

  /* ------------------------------------------------------------------ */
  /* 🎁 Gift: insights (long press)                                      */
  /* ------------------------------------------------------------------ */
  const openGiftInsights = useCallback(
    async (post: BuzzPost) => {
      try {
        const h = await authHeaders();
        const r = await fetch(`${API_BASE}/buzz/posts/${getPostId(post)}/gifts/summary`, {
          headers: h,
        });

        if (!r.ok) throw new Error(await parseError(r));

        const j = (await r.json()) as GiftSummary;
        const isOwner = String(post.userId) === String(meId);

        // Owner: show all gifters (backend already returns byUser)
        if (isOwner) {
          j.viewerRole = "owner";
          setActivePost(post);
          setGiftSummary(j);
          setGiftInsightsOpen(true);
          return;
        }

        // Gifter: only show what they sent.
        // NOTE: This REQUIRES backend patch (below) to return byUser=[{userId:me,...}] for gifters.
        const mine = Array.isArray(j.byUser)
          ? j.byUser.filter((u) => String(u.userId) === String(meId))
          : [];

        if (!mine.length) {
          // Everyone else sees nothing (silent)
          return;
        }

        j.byUser = mine;
        j.viewerRole = "gifter";
        setActivePost(post);
        setGiftSummary(j);
        setGiftInsightsOpen(true);
      } catch {
        // Silent by design
      }
    },
    [meId]
  );

  /* ------------------------------------------------------------------ */
  /* 💬 Comments                                                         */
  /* ------------------------------------------------------------------ */
const openComments = useCallback(async (post: BuzzPost) => {
  try {
    setActivePost(post);
    setCommentText("");
    setEditingCommentId(null);
    setReplyingTo(null);

    if (post.fromGallery) {
      await loadGalleryComments(post);
      setCommentsOpen(true);
      return;
    }

    const h = await authHeaders();
    const postId = getPostId(post);
    if (!postId) throw new Error("missing_post_id");

    const r = await fetch(`${API_BASE}/buzz/posts/${postId}/comments`, { headers: h });
    if (!r.ok) throw new Error(await parseError(r));

    const j = await r.json();
    const list = Array.isArray(j?.comments) ? j.comments : [];
    setComments(list);

    commentCountByPostRef.current[postId] = list.length;
    forceCountsRerender((x) => x + 1);

    setCommentsOpen(true);
  } catch (e: any) {
    setCommentsOpen(false);
    Alert.alert("Comments", e?.message ? String(e.message) : "Failed to load comments.");
  }
}, [loadGalleryComments, parseError]);
   const sendComment = useCallback(async () => {
    if (!activePost) return;
    const rawText = commentText.trim();
    if (!rawText) return;

    try {
      const h = await authHeaders();

      // ✅ gallery-backed letsbuzz media comment flow
      if (activePost.fromGallery) {
        const mediaId = String(activePost.mediaId || activePost.id);
        if (!mediaId) throw new Error("missing_media_id");

        if (editingCommentId) {
          const r = await fetch(
            `${API_BASE}/media/${activePost.userId}/comment/${editingCommentId}`,
            {
              method: "PATCH",
              headers: h,
              body: JSON.stringify({
                mediaId,
                text: rawText,
              }),
            }
          );

          if (!r.ok) throw new Error(await parseError(r));

          setCommentText("");
          setEditingCommentId(null);
          setReplyingTo(null);
          await reloadCommentsForPost(activePost);
          return;
        }

           const textToSend =
          replyingTo && !rawText.startsWith("@")
            ? `${replySeedFor(replyingTo.name)}${rawText}`
            : rawText;

        const r = await fetch(`${API_BASE}/media/${activePost.userId}/comment`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            mediaId,
            text: textToSend,
            parentId: replyingTo ? String(replyingTo.id) : null,
          }),
        });

        if (!r.ok) throw new Error(await parseError(r));

        setCommentText("");
        setEditingCommentId(null);
        setReplyingTo(null);
        await reloadCommentsForPost(activePost);
        return;
      }

      const postId = getPostId(activePost);
      if (!postId) throw new Error("missing_post_id");

      if (editingCommentId) {
        const r = await fetch(
          `${API_BASE}/buzz/posts/${postId}/comments/${editingCommentId}`,
          {
            method: "PATCH",
            headers: h,
            body: JSON.stringify({ text: rawText }),
          }
        );
        if (!r.ok) throw new Error(await parseError(r));

        setCommentText("");
        setEditingCommentId(null);
        setReplyingTo(null);
      } else {
        const r = await fetch(`${API_BASE}/buzz/posts/${postId}/comments`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            text: rawText,
            parentId: replyingTo ? String(replyingTo.id) : null,
          }),
        });
        if (!r.ok) throw new Error(await parseError(r));

        setCommentText("");
        setEditingCommentId(null);
        setReplyingTo(null);
      }

      await reloadCommentsForPost(activePost);
    } catch (e: any) {
      Alert.alert("Comments", e?.message ? String(e.message) : "Failed to send comment.");
    }
  }, [
    activePost,
    commentText,
    editingCommentId,
    replyingTo,
    parseError,
    reloadCommentsForPost,
    replySeedFor,
  ]);
   /* ------------------------------------------------------------------ */
  /* ✈️ Share                                                            */
  /* ------------------------------------------------------------------ */
  const shareToOwner = useCallback(
    async (post: BuzzPost) => {
      try {
        const ownerId = String(post.userId || "");
        const my = String(meId || "");
        if (!ownerId || !my) throw new Error("missing_user_id");
        if (ownerId === my) throw new Error("cant_share_to_self");

        const roomId = roomIdFor(my, ownerId);
        const h = await authHeaders();

        const postId = getPostId(post);
        if (!postId) throw new Error("missing_post_id");

        const text = encodeRBZSharePost({
          type: "share_post",
          postId,
          ownerId,
          mediaUrl: post.mediaUrl || "",
        });

        const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({ text, to: ownerId }),
        });

             if (!r.ok) throw new Error(await parseError(r));

        router.push({
          pathname: "/chat/[peerId]" as any,
          params: {
            peerId: ownerId,
            name:
              [post?.user?.firstName, post?.user?.lastName].filter(Boolean).join(" ") ||
              "RomBuzz User",
            avatar:
              post?.user?.avatar ||
              "https://i.pravatar.cc/200?img=12",
          },
        });
      } catch (e: any) {
        const msg = e?.message ? String(e.message) : "Could not share post.";
        Alert.alert("Share", msg);
      }
    },
    [meId, router]
  );

  /* ------------------------------------------------------------------ */
  /* ✅ Modals (render once)                                              */
  /* ------------------------------------------------------------------ */
  const ActionsModals = useMemo(() => {
    const role = giftSummary?.viewerRole || "viewer";
    const isOwnerView = role === "owner";
    const isGifterView = role === "gifter";

    return (
      <>
        {/* 🎁 Gift Picker */}
        <Modal visible={giftPickerOpen} transparent animationType="fade" onRequestClose={() => setGiftPickerOpen(false)}>
          <Pressable style={styles.backdropCenter} onPress={() => setGiftPickerOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Send a gift</Text>

              <View style={styles.giftGrid}>
                {GIFT_OPTIONS.map((g) => (
                  <TouchableOpacity key={g.key} style={styles.giftItem} onPress={() => sendGift(g.key)}>
                    <Text style={styles.giftEmoji}>{g.emoji}</Text>
                    <Text style={styles.giftLabel}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* 🎁 Gift Insights (Bottom Sheet) */}
        <Modal visible={giftInsightsOpen} transparent animationType="slide" onRequestClose={() => setGiftInsightsOpen(false)}>
          <Pressable style={styles.backdropBottom} onPress={() => setGiftInsightsOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{isOwnerView ? "Gifts Received" : "Gifts You Sent"}</Text>
                <TouchableOpacity onPress={() => setGiftInsightsOpen(false)}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.privateHint}>
                {isOwnerView ? "Visible only to you." : "Visible only to you (what you sent)."}
              </Text>

              {isOwnerView && (
                <FlatList
                  data={giftSummary?.byUser || []}
                  keyExtractor={(u) => String(u.userId)}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  renderItem={({ item }) => {
                    const usr = item.user || {};
                    const name = `${usr.firstName || ""} ${usr.lastName || ""}`.trim() || "User";

                    return (
                      <View style={styles.giftUserRow}>
                        <TouchableOpacity
                          style={styles.giftUserLeft}
                          onPress={() => router.push(`/view-profile?id=${item.userId}` as any)}
                        >
                          <Image source={{ uri: usr.avatar || "https://via.placeholder.com/80" }} style={styles.giftUserAvatar} />
                          <Text style={styles.giftUserName}>{name}</Text>
                        </TouchableOpacity>

                        <View style={styles.giftList}>
                          {Object.entries(item.gifts || {}).map(([k, v]) => {
                            const opt = GIFT_OPTIONS.find((x) => x.key === k);
                            const label = opt ? `${opt.emoji} ×${v}` : `${k} ×${v}`;
                            return (
                              <View key={k} style={styles.giftBadge}>
                                <Text style={styles.giftBadgeText}>{label}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.center}>
                      <Text style={{ color: RBZ.sub }}>No gifts yet.</Text>
                    </View>
                  }
                />
              )}

              {isGifterView && (
                <View style={{ paddingTop: 8 }}>
                  {giftSummary?.byUser?.[0]?.gifts && Object.keys(giftSummary.byUser[0].gifts).length > 0 ? (
                    <View style={styles.giftListGifter}>
                      {Object.entries(giftSummary.byUser[0].gifts || {}).map(([k, v]) => {
                        const opt = GIFT_OPTIONS.find((x) => x.key === k);
                        const label = opt ? `${opt.emoji} ${opt.label} ×${v}` : `${k} ×${v}`;
                        return (
                          <View key={k} style={styles.giftBadgeBig}>
                            <Text style={styles.giftBadgeText}>{label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.center}>
                      <Text style={{ color: RBZ.sub }}>No gifts sent yet.</Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* 💬 Comments (Bottom Sheet) */}
        <Modal visible={commentsOpen} transparent animationType="slide" onRequestClose={() => setCommentsOpen(false)}>
          <Pressable style={styles.backdropBottom} onPress={() => setCommentsOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Private Comments</Text>
                <TouchableOpacity onPress={() => setCommentsOpen(false)}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.privateHint}>Visible only to you and the post owner.</Text>

              <FlatList
                data={comments}
                keyExtractor={(c) => String(c.id)}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 12 }}
                            renderItem={({ item }) => {
                  const a = item.author || {};
                  const nm = `${a.firstName || ""} ${a.lastName || ""}`.trim() || "User";
                  const isReply = !!item.parentId;

                  const parentComment = isReply
                    ? comments.find((c) => String(c.id) === String(item.parentId))
                    : null;

                  const parentAuthor = parentComment?.author || {};
                  const parentName =
                    `${parentAuthor.firstName || ""} ${parentAuthor.lastName || ""}`.trim() ||
                    (parentComment?.userId === meId ? "You" : "User");

                  return (
               <View
                 style={[
                   styles.commentRow,
                   isReply ? styles.replyCommentRow : null,
                 ]}
               >
  <Image source={{ uri: a.avatar || "https://via.placeholder.com/80" }} style={styles.commentAvatar} />

  <View style={{ flex: 1 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={styles.commentName}>{nm}</Text>

       {(item as any).canEdit || (item as any).canDelete || (item as any).canReply ? (
        <TouchableOpacity
          onPress={() => {
            const actions: any[] = [];

            if ((item as any).canReply) {
              actions.push({
                text: "Reply",
                onPress: () => {
                  setEditingCommentId(null);
                  setReplyingTo({
                    id: String(item.id),
                    name: nm,
                  });
                  setCommentText(replySeedFor(nm));
                },
              });
            }

            if ((item as any).canEdit) {
              actions.push({
                text: "Edit",
                onPress: () => {
                  setReplyingTo(null);
                  setEditingCommentId(String(item.id));
                  setCommentText(item.text);
                },
              });
            }

            if ((item as any).canDelete) {
              actions.push({
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    if (!activePost) return;
                    const h = await authHeaders();

                    if (activePost.fromGallery) {
                      const mediaId = String(activePost.mediaId || activePost.id);
                      if (!mediaId) throw new Error("missing_media_id");

                      const r = await fetch(
                        `${API_BASE}/media/${activePost.userId}/comment/${item.id}`,
                        {
                          method: "DELETE",
                          headers: h,
                          body: JSON.stringify({ mediaId }),
                        }
                      );

                      if (!r.ok) throw new Error(await parseError(r));

                      if (editingCommentId === String(item.id)) {
                        setEditingCommentId(null);
                        setCommentText("");
                      }

                      if (replyingTo?.id === String(item.id)) {
                        setReplyingTo(null);
                        setCommentText("");
                      }

                      await reloadCommentsForPost(activePost);
                      return;
                    }

                    const postId = getPostId(activePost);
                    if (!postId) return;

                    const r = await fetch(
                      `${API_BASE}/buzz/posts/${postId}/comments/${item.id}`,
                      { method: "DELETE", headers: h }
                    );

                    if (!r.ok) throw new Error(await parseError(r));

                    if (editingCommentId === String(item.id)) {
                      setEditingCommentId(null);
                      setCommentText("");
                    }

                    if (replyingTo?.id === String(item.id)) {
                      setReplyingTo(null);
                      setCommentText("");
                    }

                    await reloadCommentsForPost(activePost);
                  } catch (e: any) {
                    Alert.alert("Comments", e?.message || "Delete failed");
                  }
                },
              });
            }

            actions.push({ text: "Cancel", style: "cancel" });
            Alert.alert("Comment", "Choose action", actions);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={RBZ.sub} />
        </TouchableOpacity>
      ) : null}
    </View>

     {isReply ? (
      <Text style={styles.replyMetaText}>Replying to {parentName}</Text>
    ) : null}

    <Text style={styles.commentText}>{item.text}</Text>
  </View>
</View>

                  );
                }}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={{ color: RBZ.sub }}>No comments yet.</Text>
                  </View>
                }
              />

                    {(editingCommentId || replyingTo) ? (
                <View style={styles.composeModeRow}>
                  <Text style={styles.composeModeText}>
                    {editingCommentId
                      ? "Editing comment"
                      : replyingTo
                      ? `Replying to ${replyingTo.name}`
                      : ""}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setEditingCommentId(null);
                      setReplyingTo(null);
                      setCommentText("");
                    }}
                  >
                    <Text style={styles.composeModeCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.inputRow}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={
                    editingCommentId
                      ? "Edit your private comment…"
                      : replyingTo
                      ? "Write your reply…"
                      : "Write a private comment…"
                  }
                  placeholderTextColor={RBZ.sub}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendComment}>
                  <LinearGradient
                    colors={[RBZ.c1, RBZ.c2, RBZ.c3, RBZ.c4]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendBtnInner}
                  >
                    <Ionicons name="send" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }, [
    giftPickerOpen,
    giftInsightsOpen,
    commentsOpen,
    giftSummary,
    comments,
    commentText,
    editingCommentId,
    replyingTo,
    activePost,
    sendGift,
    sendComment,
    router,
  ]);
   return {
    openGiftPicker,
    openGiftInsights,
    openComments,
    shareToOwner,
    getKnownCommentCount,
    ActionsModals,
  };

}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 18 },

  backdropCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 16,
  },
  backdropBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#12121a",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "900", marginBottom: 10 },

  giftGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  giftItem: {
    width: "31%",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  giftEmoji: { fontSize: 26 },
  giftLabel: { color: "#fff", marginTop: 6, fontWeight: "800", fontSize: 12 },

  sheet: {
    backgroundColor: "#12121a",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
    height: "78%",
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { color: "#fff", fontSize: 16, fontWeight: "900" },

  privateHint: { color: RBZ.sub, marginTop: 6, marginBottom: 10, fontSize: 12 },

  giftUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  giftUserLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  giftUserAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)" },
  giftUserName: { color: "#fff", fontWeight: "900", fontSize: 14 },

  giftList: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "55%" },
  giftBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  giftBadgeBig: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  giftBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  giftListGifter: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  commentRow: { flexDirection: "row", gap: 10, paddingVertical: 10 },
  replyCommentRow: {
    marginLeft: 22,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.10)",
  },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.10)" },
  commentName: { color: "#fff", fontWeight: "900", fontSize: 13 },
  replyMetaText: {
    color: RBZ.sub,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 2,
  },
  commentText: { color: RBZ.text, marginTop: 3, lineHeight: 18 },
  composeModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  composeModeText: {
    color: RBZ.sub,
    fontSize: 12,
    fontWeight: "700",
  },
  composeModeCancel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  sendBtn: { width: 44, height: 44, borderRadius: 14, overflow: "hidden" },
  sendBtnInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
