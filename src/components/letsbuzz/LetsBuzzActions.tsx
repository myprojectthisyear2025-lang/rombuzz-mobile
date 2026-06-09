/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/LetsBuzzActions.tsx
 * 🎯 Purpose: Centralized actions (Gift / Comment / Share) for LetsBuzz posts
 *
 * Uses:
 *  - GiftPicker for sending gifts
 *  - GiftInsightSheet for gift summary
 *  - PrivateCommentsSheet for all private comment UI
 *
 * Comment rule:
 *  - Comments are private between the post/media owner and the commenter.
 *  - Backend enforces privacy.
 *  - This file only opens the shared reusable comment sheet.
 *
 * Share rule:
 *  - Share sends viewed content directly to the content owner’s personal chat.
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import GiftPicker from "@/src/components/gifts/GiftPicker";
import GiftInsightSheet from "@/src/components/gifts/GiftInsightSheet";
import { getGiftSummary, type GiftSummaryResponse } from "@/src/api/gifts";
import PrivateCommentsSheet from "@/src/components/comments/PrivateCommentsSheet";
import RBZReportSheet from "@/src/components/reporting/RBZReportSheet";

type BuzzUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  avatarUrl?: string;
  photoUrl?: string;
  profilePic?: string;
  photos?: any[];
  username?: string;
};

type BuzzPost = {
  id?: string;
  _id?: string;
  userId: string;
  mediaUrl?: string;
  text?: string;
  caption?: string;
  type?: string;
  createdAt?: any;
  user?: BuzzUser;

  // gallery-backed LetsBuzz feed support
  mediaId?: string;
  fromGallery?: boolean;
  commentsCount?: number;
};

type CommentTargetType = "gallery_media" | "buzz_post";

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
  return String(post?.id || post?._id || "").trim();
}

function getTargetId(post: any) {
  if (!post) return "";

  if (post.fromGallery) {
    return String(post.mediaId || post.id || post._id || "").trim();
  }

  return getPostId(post);
}

function getTargetType(post: any): CommentTargetType {
  return post?.fromGallery ? "gallery_media" : "buzz_post";
}

function getOwnerName(user?: BuzzUser | null) {
  const first = String(user?.firstName || "").trim();
  const last = String(user?.lastName || "").trim();
  const username = String(user?.username || "").trim();
  return [first, last].filter(Boolean).join(" ").trim() || username || "RomBuzz User";
}

function getOwnerAvatar(user?: BuzzUser | null) {
  return (
    user?.avatar ||
    user?.avatarUrl ||
    user?.photoUrl ||
    user?.profilePic ||
    user?.photos?.[0] ||
    "https://i.pravatar.cc/200?img=12"
  );
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
  const [giftSummary, setGiftSummary] = useState<GiftSummaryResponse | null>(null);

    // 💬 Shared private comments sheet
  const [commentsOpen, setCommentsOpen] = useState(false);

  // 🚩 Shared report sheet
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportPost, setReportPost] = useState<BuzzPost | null>(null);

  // Comment counts per target. This keeps Posts/Reels badges working.
  const commentCountByPostRef = useRef<Record<string, number>>({});
  const [, forceCountsRerender] = useState(0);

  const getKnownCommentCount = useCallback((postId?: string) => {
    if (!postId) return 0;
    return commentCountByPostRef.current[String(postId)] || 0;
  }, []);

  const parseError = useCallback(async (res: Response) => {
    try {
      const json = await res.json();
      return json?.error || json?.message || "request_failed";
    } catch {
      return "request_failed";
    }
  }, []);

  const activeGiftTargetId = useMemo(() => {
    return getTargetId(activePost);
  }, [activePost]);

  const activeGiftTargetType = useMemo(() => {
    return getTargetType(activePost);
  }, [activePost]);

  const rememberCommentCount = useCallback((post: BuzzPost | null, count: number) => {
    if (!post) return;

    const safeCount = Math.max(0, Number(count || 0));
    const targetId = getTargetId(post);
    const postId = getPostId(post);

    if (targetId) {
      commentCountByPostRef.current[targetId] = safeCount;
    }

    if (postId) {
      commentCountByPostRef.current[postId] = safeCount;
    }

    forceCountsRerender((x) => x + 1);
  }, []);

  /* ------------------------------------------------------------------ */
  /* 📡 Realtime: comment socket badge sync                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let alive = true;
    let socket: any = null;

    let onNew: any = null;
    let onDeleted: any = null;

    (async () => {
      socket = await getSocket();
      if (!alive || !socket?.on || !socket?.off) return;

      onNew = (payload: any) => {
        const postId = String(payload?.postId || payload?.mediaId || payload?.targetId || "");
        if (!postId) return;

        commentCountByPostRef.current[postId] =
          Number(commentCountByPostRef.current[postId] || 0) + 1;

        forceCountsRerender((x) => x + 1);
      };

      onDeleted = (payload: any) => {
        const postId = String(payload?.postId || payload?.mediaId || payload?.targetId || "");
        if (!postId) return;

        commentCountByPostRef.current[postId] = Math.max(
          0,
          Number(commentCountByPostRef.current[postId] || 0) - 1
        );

        forceCountsRerender((x) => x + 1);
      };

      socket.on("comment:new", onNew);
      socket.on("comment:deleted", onDeleted);
    })();

    return () => {
      alive = false;

      if (socket?.off) {
        if (onNew) socket.off("comment:new", onNew);
        if (onDeleted) socket.off("comment:deleted", onDeleted);
      }
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* 🎁 Gift: picker                                                     */
  /* ------------------------------------------------------------------ */
  const openGiftPicker = useCallback((post: BuzzPost) => {
    setActivePost(post);
    setGiftPickerOpen(true);
  }, []);

  /* ------------------------------------------------------------------ */
  /* 🎁 Gift: insights                                                   */
  /* ------------------------------------------------------------------ */
  const openGiftInsights = useCallback(async (post: BuzzPost) => {
    try {
      const targetId = getTargetId(post);
      const targetType = getTargetType(post);

      if (!targetId) return;

      const res = await getGiftSummary({
        receiverId: String(post.userId || ""),
        targetType,
        targetId,
        includeTransactions: true,
      });

      if (!res?.rows?.length && Number(res?.totalCount || 0) <= 0) {
        return;
      }

      setActivePost(post);
      setGiftSummary(res);
      setGiftInsightsOpen(true);
    } catch {
      // Silent by design.
      // Gift privacy is controlled by backend.
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* 💬 Comments                                                         */
  /* ------------------------------------------------------------------ */
   const openComments = useCallback((post: BuzzPost) => {
    const targetId = getTargetId(post);

    if (!targetId) {
      Alert.alert("Comments", "Missing post/media id.");
      return;
    }

    if (!post?.userId) {
      Alert.alert("Comments", "Missing owner id.");
      return;
    }

    setActivePost(post);
    setCommentsOpen(true);
  }, []);

  /* ------------------------------------------------------------------ */
  /* 🚩 Report                                                           */
  /* ------------------------------------------------------------------ */
  const openReport = useCallback((post: BuzzPost) => {
    const targetId = getTargetId(post);

    if (!targetId) {
      Alert.alert("Report", "Missing post/media id.");
      return;
    }

    if (!post?.userId) {
      Alert.alert("Report", "Missing post owner id.");
      return;
    }

    setReportPost(post);
    setReportSheetOpen(true);
  }, []);

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

        const postId = getTargetId(post);
        if (!postId) throw new Error("missing_post_id");

        const roomId = roomIdFor(my, ownerId);
        const headers = await authHeaders();

        const text = encodeRBZSharePost({
          type: "share_post",
          postId,
          ownerId,
          mediaUrl: post.mediaUrl || "",
          targetType: getTargetType(post),
        });

        const res = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ text, to: ownerId }),
        });

        if (!res.ok) throw new Error(await parseError(res));

        router.push({
          pathname: "/chat/[peerId]" as any,
          params: {
            peerId: ownerId,
            name: getOwnerName(post.user),
            avatar: getOwnerAvatar(post.user),
          },
        });
      } catch (error: any) {
        const message = error?.message ? String(error.message) : "Could not share post.";
        Alert.alert("Share", message);
      }
    },
    [meId, parseError, router]
  );

  /* ------------------------------------------------------------------ */
  /* ✅ Modals                                                           */
  /* ------------------------------------------------------------------ */
  const ActionsModals = useMemo(() => {
    const commentTargetId = getTargetId(activePost);
    const commentTargetType = getTargetType(activePost);

    return (
      <>
        {activePost && activeGiftTargetId ? (
          <GiftPicker
            visible={giftPickerOpen}
            onClose={() => setGiftPickerOpen(false)}
            receiverId={String(activePost.userId || "")}
            placement="posts"
            targetType={activeGiftTargetType}
            targetId={activeGiftTargetId}
            title="Send a Gift"
            subtitle="Pick a gift for this post."
            onSent={() => {
              setGiftPickerOpen(false);
            }}
          />
        ) : null}

         <GiftInsightSheet
          visible={giftInsightsOpen}
          summary={giftSummary}
          currentUserId={String(meId || "")}
          onClose={() => {
            setGiftInsightsOpen(false);
            setGiftSummary(null);
          }}
        />

          {activePost && commentTargetId ? (
          <PrivateCommentsSheet
            visible={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            targetType={commentTargetType}
            targetId={commentTargetId}
            ownerId={String(activePost.userId || "")}
            currentUserId={String(meId || "")}
            ownerUser={activePost.user || null}
            title="Private Comments"
            subtitle="Visible only to you and the post owner."
            onChanged={(comments) => {
              rememberCommentCount(activePost, comments.length);
            }}
          />
        ) : null}

        {reportPost && getTargetId(reportPost) ? (
          <RBZReportSheet
            visible={reportSheetOpen}
            onClose={() => {
              setReportSheetOpen(false);
              setReportPost(null);
            }}
            onSubmitted={() => {
              setReportSheetOpen(false);
              setReportPost(null);
            }}
            target={{
              targetType: "post",
              targetId: getTargetId(reportPost),
              reportedUserId: String(reportPost.userId || ""),
              targetOwnerId: String(reportPost.userId || ""),
              source: "mobile_letsbuzz_post",
              title: getOwnerName(reportPost.user),
              subtitle: "LetsBuzz post",
              avatar: getOwnerAvatar(reportPost.user),
              evidenceSnapshot: {
                screen: "letsbuzz_posts",
                contentType: "post",
                letsBuzzTargetType: getTargetType(reportPost),
                postId: getPostId(reportPost),
                mediaId: String(reportPost.mediaId || ""),
                ownerId: String(reportPost.userId || ""),
                authorName: getOwnerName(reportPost.user),
                authorAvatar: getOwnerAvatar(reportPost.user),
                caption: String(reportPost.text || reportPost.caption || ""),
                mediaUrl: String(reportPost.mediaUrl || ""),
                createdAt: reportPost.createdAt || null,
              },
            }}
          />
        ) : null}
      </>
    );
  }, [
    activeGiftTargetId,
    activeGiftTargetType,
    activePost,
    commentsOpen,
    giftInsightsOpen,
    giftPickerOpen,
    giftSummary,
    meId,
    rememberCommentCount,
    reportPost,
    reportSheetOpen,
  ]);

  return {
    openGiftPicker,
    openGiftInsights,
    openComments,
    openReport,
    shareToOwner,
    getKnownCommentCount,
    ActionsModals,
  };
}