/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/LetsBuzzReels.tsx
 * 🎯 Purpose:  Reels Experience
 *
 * ✅ Fixes in this version:
 *  - ✅ Pause/Play ONLY when single-tapping the CENTER tap-zone
 *  - ✅ Name, like, comment, gift, share, mute/unmute are fully clickable (don’t pause video)
 *  - ✅ Removed the fullscreen invisible touch layer that was stealing all presses
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type BuzzUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  username?: string;
};

type BuzzPost = {
  id: string;
  userId: string;
  text?: string;
  mediaUrl?: string;
  type?: "video" | string;
  createdAt: any;
  privacy?: "public" | "matches" | "private" | string;
  user?: BuzzUser;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;

  // gallery-backed reel support
  caption?: string;
  mediaId?: string;
  fromGallery?: boolean;
  sourceType?: "gallery" | "post" | string;};

type BuzzComment = {
  id: string;
  userId: string;
  text: string;
  parentId: string | null;

  createdAt?: any;
  editedAt?: any;

  author?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    id?: string;
    username?: string;
  };

  // permissions (set client-side)
  canEdit?: boolean;
  canDelete?: boolean;
  canReply?: boolean;
};

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  text: "rgba(255,255,255,0.95)",
  sub: "rgba(255,255,255,0.70)",
  dark: "#0a0a0f",
  darker: "#050507",
  translucent: "rgba(10, 10, 15, 0.85)",
  border: "rgba(255,255,255,0.12)",
};

const GIFT_OPTIONS = [
  { key: "rose", label: "Rose", emoji: "🌹", color: "#ff6b9d" },
  { key: "heart", label: "Heart", emoji: "💖", color: "#ff4757" },
  { key: "teddy", label: "Teddy", emoji: "🧸", color: "#ff9f43" },
  { key: "ring", label: "Ring", emoji: "💍", color: "#2ed573" },
  { key: "crown", label: "Crown", emoji: "👑", color: "#ffd32a" },
  { key: "sparkle", label: "Sparkle", emoji: "✨", color: "#18dcff" },
];

function roomIdFor(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

function encodeRBZSharePost(payload: any) {
  return `::RBZ::${JSON.stringify(payload)}`;
}

async function authHeaders() {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

function hasCaptionTag(caption: any, tag: string) {
  return String(caption || "").toLowerCase().includes(String(tag || "").toLowerCase());
}

function stripCaptionTags(caption: any) {
  return String(caption || "")
    .replace(/\b(?:kind|scope|intent):[^\s]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function replySeedFor(name?: string) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");
  return clean ? `@${clean} ` : "";
}

function countHeartReactions(reactions: Record<string, any> = {}) {
  return Object.values(reactions || {}).filter((v) => v === "❤️").length;
}

const CENTER_TAP_SIZE = 190;

export default function LetsBuzzReels({ targetPostId }: { targetPostId?: string }) {
  const router = useRouter();

  const listRef = useRef<FlatList<BuzzPost>>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reels, setReels] = useState<BuzzPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meId, setMeId] = useState("");

  // Video states
  const videoRefs = useRef<Record<string, any>>({});
const [muted, setMuted] = useState(false); 
 const [paused, setPaused] = useState(false);

  // Modals
   const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeReel, setActiveReel] = useState<BuzzPost | null>(null);
  const [comments, setComments] = useState<BuzzComment[]>([]);
  const [commentText, setCommentText] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  // visible-to-me comment counts per reel (private comments)
  const commentCountByPostRef = useRef<Record<string, number>>({});
  const [, forceCommentCountsRerender] = useState(0);

  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [giftTotal, setGiftTotal] = useState<{ [key: string]: number }>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const likeAnim = useRef(new Animated.Value(0)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;

  const socket = useMemo(() => {
    try {
      return getSocket();
    } catch {
      return null as any;
    }
  }, []);

  // Gesture handler for double tap to like (CENTER ONLY)
  const lastTapRef = useRef(0);

  const currentReel = reels[currentIndex] || null;

  const fullName = useMemo(() => {
    const fn = String(currentReel?.user?.firstName || "").trim();
    const ln = String(currentReel?.user?.lastName || "").trim();
    const un = String(currentReel?.user?.username || "").trim();
    const combined = `${fn}${fn && ln ? " " : ""}${ln}`.trim();
    return combined || un || fn || "";
  }, [currentReel?.user?.firstName, currentReel?.user?.lastName, currentReel?.user?.username]);

  const fetchMeId = useCallback(async () => {
    try {
      const h = await authHeaders();
      const r = await fetch(`${API_BASE}/users/me`, { headers: h });
      const j = await r.json();
      const id = j?.user?.id || j?.id || j?.userId || "";
      if (id) setMeId(String(id));
    } catch {}
  }, []);

  const loadReels = useCallback(async () => {
    try {
      const h = await authHeaders();

      // ✅ make sure we know who "me" is before filtering my own reels out
      let myId = String(meId || "");
      if (!myId) {
        try {
          const meRes = await fetch(`${API_BASE}/users/me`, { headers: h });
          const meJson = await meRes.json();
          myId = String(meJson?.user?.id || meJson?.id || meJson?.userId || "");
          if (myId) setMeId(myId);
        } catch {}
      }

      // ✅ source of truth for gallery-backed LetsBuzz reels
      const r = await fetch(`${API_BASE}/feed/letsbuzz`, { headers: h });
      const j = await r.json();

      const raw: any[] = Array.isArray(j?.items) ? j.items : [];
      const baseList: BuzzPost[] = raw
        .map((p: any): BuzzPost => {
          const mediaId = String(p?.id || p?._id || "");
          const caption = String(p?.caption || "");

          return {
            id: mediaId,
            mediaId,
            userId: String(p?.userId || ""),
            mediaUrl: String(p?.mediaUrl || ""),
            type: (String(p?.type || "video") as BuzzPost["type"]),
            caption,
            text: stripCaptionTags(caption),
            createdAt: p?.createdAt,
            privacy: (
              hasCaptionTag(caption, "scope:private")
                ? "private"
                : hasCaptionTag(caption, "scope:matches")
                ? "matches"
                : "public"
            ) as BuzzPost["privacy"],
            user: p?.user,
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
            fromGallery: true,
            sourceType: "gallery",
          };
        })
        .filter((p) => !!p.id && !!p.userId && !!p.mediaUrl);

      // ✅ only actual LetsBuzz reels
      const onlyReels = baseList.filter((p) => {
        const type = String(p?.type || "").toLowerCase();
        const caption = String(p?.caption || "").toLowerCase();
        const hasMedia = !!String(p?.mediaUrl || "").trim();

        const isVideo = type === "video" || type === "reel";
        const isReelTag = caption.includes("kind:reel");
        const isLetsBuzz = caption.includes("intent:letsbuzz");
        const notPrivate = !caption.includes("scope:private");
        const notMine = !myId || String(p.userId) !== String(myId);

        return hasMedia && isVideo && isReelTag && isLetsBuzz && notPrivate && notMine;
      });

      // ✅ hydrate real comments + reactions from owner's public profile media array
      const hydrated = await Promise.all(
        onlyReels.map(async (p) => {
          try {
            const ur = await fetch(`${API_BASE}/users/${p.userId}`, { headers: h });
            const uj = await ur.json();
            const mediaList = Array.isArray(uj?.user?.media) ? uj.user.media : [];
            const media = mediaList.find((m: any) => String(m?.id || "") === String(p.mediaId || p.id));

            if (!media) return p;

            const reactions = media?.reactions || {};
            const comments = Array.isArray(media?.comments) ? media.comments : [];

            return {
              ...p,
              likesCount: countHeartReactions(reactions),
              commentsCount: comments.length,
              isLiked: reactions?.[myId] === "❤️",
            };
          } catch {
            return p;
          }
        })
      );

      setReels(hydrated);

      if (targetPostId) {
        const idx = hydrated.findIndex((p) => String(p?.id) === String(targetPostId));
        if (idx >= 0) {
          setCurrentIndex(idx);
          setTimeout(() => {
            try {
              listRef.current?.scrollToIndex({
                index: idx,
                animated: false,
                viewPosition: 0,
              });
            } catch {}
          }, 0);
        }
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.log("LetsBuzzReels load error:", e);
    }
  }, [fadeAnim, targetPostId, meId]);

  const loadGiftSummary = useCallback(
    async (postId: string, fromGallery?: boolean) => {
      try {
        // ✅ do not fake gallery gift endpoints that were not uploaded
        if (fromGallery) {
          setGiftTotal((prev) => ({ ...prev, [postId]: 0 }));
          return;
        }

        const h = await authHeaders();
        const r = await fetch(`${API_BASE}/buzz/posts/${postId}/gifts/summary`, { headers: h });
        const j = await r.json();

        if (r.ok) {
          setGiftTotal((prev) => ({ ...prev, [postId]: Number(j?.total || 0) }));
        }
      } catch {}
    },
    []
  );

  const handleLike = useCallback(
    async (post: BuzzPost | null, doubleTap = false) => {
      if (!post) return;

      try {
        const h = await authHeaders();

        if (post.fromGallery) {
          const r = await fetch(`${API_BASE}/media/${post.userId}/react`, {
            method: "POST",
            headers: h,
            body: JSON.stringify({
              mediaId: String(post.mediaId || post.id),
              emoji: "❤️",
            }),
          });

          const j = await r.json();

          if (r.ok) {
            const likesCount = Number(j?.counts?.["❤️"] || 0);
            const liked = j?.mine === "❤️";

            setReels((prev) =>
              prev.map((p) =>
                p.id === post.id
                  ? {
                      ...p,
                      isLiked: liked,
                      likesCount,
                    }
                  : p
              )
            );

            if (doubleTap) {
              Animated.sequence([
                Animated.timing(likeAnim, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                }),
                Animated.timing(likeAnim, {
                  toValue: 0,
                  duration: 150,
                  delay: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            }
          }

          return;
        }

        const r = await fetch(`${API_BASE}/buzz/posts/${post.id}/like`, {
          method: "POST",
          headers: h,
        });

        if (r.ok) {
          setReels((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    isLiked: !p.isLiked,
                    likesCount: (p.likesCount || 0) + (p.isLiked ? -1 : 1),
                  }
                : p
            )
          );

          if (doubleTap) {
            Animated.sequence([
              Animated.timing(likeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(likeAnim, {
                toValue: 0,
                duration: 150,
                delay: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      } catch {}
    },
    [likeAnim]
  );

  const openComments = useCallback(
    async (post: BuzzPost) => {
      try {
        setActiveReel(post);
        setCommentText("");
        setEditingCommentId(null);
        setReplyingTo(null);

        const h = await authHeaders();

        if (post.fromGallery) {
          const ownerRes = await fetch(`${API_BASE}/users/${post.userId}`, { headers: h });
          const ownerJson = await ownerRes.json();

          const mediaList = Array.isArray(ownerJson?.user?.media) ? ownerJson.user.media : [];
          const media = mediaList.find(
            (m: any) => String(m?.id || "") === String(post.mediaId || post.id)
          );

                 const rawList: BuzzComment[] = Array.isArray(media?.comments)
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

          // thread order: parent then its replies
          const topLevel = rawList
            .filter((c) => !c.parentId)
            .sort((a: any, b: any) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));
          const replies = rawList
            .filter((c) => !!c.parentId)
            .sort((a: any, b: any) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));

          const list: BuzzComment[] = [];
          for (const parent of topLevel) {
            list.push(parent);
            for (const child of replies.filter((r) => String(r.parentId) === String(parent.id))) {
              list.push(child);
            }
          }
          for (const orphan of replies.filter((r) => !topLevel.some((p) => String(p.id) === String(r.parentId)))) {
            list.push(orphan);
          }

          setComments(list);

          commentCountByPostRef.current[String(post.id)] = list.length;
          forceCommentCountsRerender((x) => x + 1);

          setReels((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    commentsCount: list.length,
                  }
                : p
            )
          );

          setCommentsOpen(true);
          return;
        }

        const postId = String(post.id || "");
        if (!postId) return;

        const r = await fetch(`${API_BASE}/buzz/posts/${postId}/comments`, { headers: h });
        const j = await r.json();
        const list = Array.isArray(j?.comments) ? j.comments : [];
        setComments(list);

        commentCountByPostRef.current[postId] = list.length;
        forceCommentCountsRerender((x) => x + 1);

        setCommentsOpen(true);
      } catch {}
    },
    [meId]
  );

  const sendComment = useCallback(async () => {
    if (!activeReel) return;
    const text = commentText.trim();
    if (!text) return;

    try {
      const h = await authHeaders();

      // ✅ Gallery-backed media comments (supports parentId/edit now)
      if (activeReel.fromGallery) {
        const mediaId = String(activeReel.mediaId || activeReel.id);
        if (!mediaId) return;

        // EDIT
        if (editingCommentId) {
          const r = await fetch(
            `${API_BASE}/media/${activeReel.userId}/comment/${editingCommentId}`,
            {
              method: "PATCH",
              headers: h,
              body: JSON.stringify({ mediaId, text }),
            }
          );
          if (!r.ok) return;

          setCommentText("");
          setEditingCommentId(null);
          setReplyingTo(null);
          await openComments(activeReel);
          return;
        }

        // CREATE / REPLY
        const r = await fetch(`${API_BASE}/media/${activeReel.userId}/comment`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            mediaId,
            text,
            parentId: replyingTo ? String(replyingTo.id) : null,
          }),
        });

        if (r.ok) {
          setCommentText("");
          setEditingCommentId(null);
          setReplyingTo(null);
          await openComments(activeReel);
        }
        return;
      }

      // ✅ Legacy buzz post comments
      const postId = String(activeReel.id || "");
      if (!postId) return;

      // EDIT
      if (editingCommentId) {
        const r = await fetch(`${API_BASE}/buzz/posts/${postId}/comments/${editingCommentId}`, {
          method: "PATCH",
          headers: h,
          body: JSON.stringify({ text }),
        });
        if (!r.ok) return;

        setCommentText("");
        setEditingCommentId(null);
        setReplyingTo(null);
        await openComments(activeReel);
        return;
      }

      // CREATE / REPLY
      const r = await fetch(`${API_BASE}/buzz/posts/${postId}/comments`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          text,
          parentId: replyingTo ? String(replyingTo.id) : null,
        }),
      });

      if (r.ok) {
        setCommentText("");
        setEditingCommentId(null);
        setReplyingTo(null);
        await openComments(activeReel);
      }
    } catch {}
  }, [activeReel, commentText, editingCommentId, replyingTo, openComments]);

  const sendGift = useCallback(
    async (giftKey: string) => {
      if (!activeReel) return;

      // ✅ gallery gift route file was not uploaded, so do not fake it here
      if (activeReel.fromGallery) {
        setGiftPickerOpen(false);
        return;
      }

      try {
        const h = await authHeaders();
        const r = await fetch(`${API_BASE}/buzz/posts/${activeReel.id}/gifts`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({ giftKey, amount: 1 }),
        });

        if (r.ok) {
          loadGiftSummary(activeReel.id);
          setGiftPickerOpen(false);
        }
      } catch {}
    },
    [activeReel, loadGiftSummary]
  );

  const shareToAuthor = useCallback(
    async (post: BuzzPost) => {
      try {
        const ownerId = String(post.userId || "");
        const my = String(meId || "");

        if (!ownerId || !my) {
          throw new Error("missing_user_id");
        }

        if (ownerId === my) {
          throw new Error("cant_share_to_self");
        }

        const h = await authHeaders();
        const roomId = roomIdFor(my, ownerId);

        const text = encodeRBZSharePost({
          type: "share_reel",
          postId: post.id,
          ownerId,
          mediaUrl: post.mediaUrl || "",
        });

        const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({ text, to: ownerId }),
        });

        if (!r.ok) {
          let msg = "Could not share reel.";
          try {
            const j = await r.json();
            msg = j?.error || j?.message || msg;
          } catch {}
          throw new Error(msg);
        }

        router.push({
          pathname: "/chat/[peerId]" as any,
          params: {
            peerId: ownerId,
            name:
              [post?.user?.firstName, post?.user?.lastName].filter(Boolean).join(" ") ||
              post?.user?.username ||
              "RomBuzz User",
            avatar:
              post?.user?.avatar ||
              "https://i.pravatar.cc/200?img=12",
          },
        });      } catch (e: any) {
        const msg = e?.message ? String(e.message) : "Could not share reel.";
        Alert.alert("Share", msg);
      }
    },
    [meId, router]
  );

  const refreshReels = useCallback(async () => {
    if (currentIndex !== 0) return;

    try {
      setRefreshing(true);
      await fetchMeId();
      await loadReels();
      setCurrentIndex(0);

      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: 0,
            animated: false,
            viewPosition: 0,
          });
        } catch {}
      }, 0);
    } finally {
      setRefreshing(false);
    }
  }, [currentIndex, fetchMeId, loadReels]);

  const animateDoubleTap = useCallback(
    (_x: number, _y: number) => {
      doubleTapAnim.setValue(0);
      Animated.sequence([
        Animated.timing(doubleTapAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(doubleTapAnim, {
          toValue: 0,
          duration: 200,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [doubleTapAnim]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        await fetchMeId();
        await loadReels();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    if (!socket) return;

    const onCommentNew = (evt: any) => {
      const postId = String(evt?.postId || "");
      if (commentsOpen && activeReel?.id && String(activeReel.id) === postId) {
        openComments(activeReel);
      }
    };

      const onGiftNew = (evt: any) => {
      const postId = String(evt?.postId || "");
      if (!postId) return;

      const matched = reels.find((p) => String(p.id) === postId);
      loadGiftSummary(postId, matched?.fromGallery);
    };

    socket.on?.("comment:new", onCommentNew);
    socket.on?.("comment:deleted", onCommentNew);
    socket.on?.("comment:updated", onCommentNew);    socket.on?.("buzz:gift:new", onGiftNew);
    return () => {
      cancelled = true;
      socket.off?.("comment:new", onCommentNew);
      socket.off?.("comment:deleted", onCommentNew);
      socket.off?.("comment:updated", onCommentNew);      socket.off?.("buzz:gift:new", onGiftNew);
    };
  }, [fetchMeId, loadReels, socket, openComments, loadGiftSummary]);  useEffect(() => {
    if (!currentReel?.id) return;
    loadGiftSummary(currentReel.id, currentReel.fromGallery);
  }, [currentReel?.id, currentReel?.fromGallery, loadGiftSummary]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RBZ.c3} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={64} color={RBZ.sub} />
        <Text style={styles.emptyTitle}>No reels yet</Text>
        <Text style={styles.emptyText}>Matched reels from your connections will appear here</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Main Reels Container */}
      <View style={styles.reelsContainer}>
               <FlatList
          ref={listRef}
          data={reels}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshReels}
              tintColor="#fff"
            />
          }
          renderItem={({ item, index }) => (
            <View style={styles.reelContainer}>
              {/* Video Background (NO FULLSCREEN PRESSABLE ANYMORE) */}
              <View style={styles.videoWrap}>
                <Video
                  ref={(ref) => {
                    if (ref) videoRefs.current[String(item.id)] = ref;
                  }}
                  source={{ uri: item.mediaUrl || "" }}
                  style={styles.video}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={index === currentIndex && !paused}
                  isLooping
                  isMuted={muted}
                  useNativeControls={false}
                  progressUpdateIntervalMillis={250}
                  onError={() => {}}
                />

                {/* CENTER TAP ZONE: single tap = pause/play, double tap = like */}
                {index === currentIndex && (
                  <Pressable
                    style={styles.centerTapZone}
                    onPress={(e: any) => {
                      const now = Date.now();
                      const isDoubleTap = now - lastTapRef.current < 280;
                      lastTapRef.current = now;

                      if (isDoubleTap) {
                        handleLike(item, true);
                        animateDoubleTap(e.nativeEvent.locationX, e.nativeEvent.locationY);
                        return;
                      }

                      setPaused((p) => !p);
                    }}
                  />
                )}

                           {/* Pause/Play icon overlay (VISUAL ONLY, DOES NOT CAPTURE TOUCHES) */}
                {index === currentIndex && paused && (
                  <View style={styles.playOverlayVisual} pointerEvents="none">
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={58} color="rgba(255,255,255,0.72)" />
                    </View>
                  </View>
                )}
              </View>

              {/* Double Tap Heart Animation */}
              {index === currentIndex && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.doubleTapHeart,
                    {
                      opacity: doubleTapAnim,
                      transform: [
                        {
                          scale: doubleTapAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.8, 1.2, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="heart" size={120} color="#ff4757" />
                </Animated.View>
              )}
            </View>
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
            if (newIndex !== currentIndex) {
              setCurrentIndex(newIndex);
              setPaused(false);
            }
          }}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0,
                });
              } catch {}
            }, 200);
          }}
        />
      </View>

      {/* Overlay UI */}
      {currentReel && (
        <View style={styles.overlayContainer} pointerEvents="box-none">
                 {/* Top Bar */}
          <View style={styles.topBar} pointerEvents="box-none">
            {/* mute moved to right action bar (below Share) */}
          </View>

          {/* Right Action Bar */}
          <View style={styles.rightActions}>
            {/* Profile */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push(`/view-profile?userId=${currentReel.userId}` as any)}
            >
              <Image
                source={{ uri: currentReel.user?.avatar || "https://via.placeholder.com/100" }}
                style={styles.profileImage}
              />
              <View style={styles.followBadge}>
                <Ionicons name="add" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

         {/* Gift (replaces heart slot) */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActiveReel(currentReel);
                setGiftPickerOpen(true);
              }}
            >
              <Ionicons name="gift-outline" size={30} color="#fff" />
              <Text style={styles.actionText}>
                {currentReel.fromGallery ? 0 : giftTotal[currentReel.id] || 0}
              </Text>
            </TouchableOpacity>

                    {/* Comment */}
            <TouchableOpacity style={styles.actionItem} onPress={() => openComments(currentReel)}>
              <Ionicons name="chatbubble-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>
                {(() => {
                  const v = commentCountByPostRef.current[String(currentReel.id || "")];
                  if (typeof v === "number") return v;
                  return Number(currentReel.commentsCount || 0);
                })()}
              </Text>
            </TouchableOpacity>

                     {/* Gift moved into the old heart slot */}

                   {/* Share */}
            <TouchableOpacity style={styles.actionItem} onPress={() => shareToAuthor(currentReel)}>
              <Ionicons name="paper-plane-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {/* Mute / Unmute */}
            <TouchableOpacity
              style={styles.muteActionButton}
              onPress={() => setMuted((prev) => !prev)}
              activeOpacity={0.8}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons
                name={muted ? "volume-mute" : "volume-high"}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

                    {/* Bottom Info */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={styles.bottomFade}
            pointerEvents="box-none"
          >
            <View style={styles.bottomInfo} pointerEvents="box-none">
              <View style={styles.userInfo} pointerEvents="box-none">
                {!!currentReel.text?.trim() && (
                  <Text style={styles.caption} numberOfLines={3}>
                    {currentReel.text}
                  </Text>
                )}

                <Pressable
                  onPress={() => router.push(`/view-profile?userId=${currentReel.userId}` as any)}
                  hitSlop={10}
                  style={[
                    styles.nameRowBottom,
                    currentReel.text?.trim()
                      ? styles.nameRowWithCaption
                      : styles.nameRowWithoutCaption,
                  ]}
                >
                  <Image
                    source={{ uri: currentReel.user?.avatar || "https://via.placeholder.com/80" }}
                    style={styles.nameAvatar}
                  />
                  <Text style={styles.username}>{fullName}</Text>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Gift Picker Modal */}
      <Modal
        visible={giftPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setGiftPickerOpen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send a Gift</Text>
              <TouchableOpacity onPress={() => setGiftPickerOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.giftGrid}>
              {GIFT_OPTIONS.map((gift) => (
                <TouchableOpacity
                  key={gift.key}
                  style={[styles.giftCard, { backgroundColor: gift.color + "20" }]}
                  onPress={() => sendGift(gift.key)}
                >
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  <Text style={styles.giftLabel}>{gift.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={commentsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsOpen(false)}
      >
        <View style={styles.commentsModal}>
          <View style={styles.commentsContainer}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
            renderItem={({ item }) => {
  const nm =
    `@${item.author?.username || item.author?.firstName || "user"}`.trim();

  const isReply = !!item.parentId;

  return (
    <View style={[styles.commentItem, isReply ? styles.replyCommentItem : null]}>
      <Image
        source={{ uri: item.author?.avatar || "https://via.placeholder.com/80" }}
        style={styles.commentAvatar}
      />

      <View style={styles.commentContent}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.commentUsername}>{nm}</Text>

          {(item.canReply || item.canEdit || item.canDelete) ? (
            <TouchableOpacity
              onPress={() => {
                const actions: any[] = [];

                if (item.canReply) {
                  actions.push({
                    text: "Reply",
                    onPress: () => {
                      setEditingCommentId(null);
                      setReplyingTo({
                        id: String(item.id),
                        name: nm.replace("@", ""),
                      });
                      setCommentText(replySeedFor(nm.replace("@", "")));
                    },
                  });
                }

                if (item.canEdit) {
                  actions.push({
                    text: "Edit",
                    onPress: () => {
                      setReplyingTo(null);
                      setEditingCommentId(String(item.id));
                      setCommentText(item.text);
                    },
                  });
                }

                if (item.canDelete) {
                  actions.push({
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        if (!activeReel) return;
                        const h = await authHeaders();

                        if (activeReel.fromGallery) {
                          const mediaId = String(activeReel.mediaId || activeReel.id);
                          const r = await fetch(
                            `${API_BASE}/media/${activeReel.userId}/comment/${item.id}`,
                            {
                              method: "DELETE",
                              headers: h,
                              body: JSON.stringify({ mediaId }),
                            }
                          );
                          if (r.ok) await openComments(activeReel);
                          return;
                        }

                        const postId = String(activeReel.id || "");
                        const r = await fetch(
                          `${API_BASE}/buzz/posts/${postId}/comments/${item.id}`,
                          { method: "DELETE", headers: h }
                        );
                        if (r.ok) await openComments(activeReel);
                      } catch {}
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

        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );
}}
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                </View>
              }
            />
{(editingCommentId || replyingTo) ? (
  <View style={styles.composeModeRow}>
    <Text style={styles.composeModeText}>
      {editingCommentId ? "Editing comment" : replyingTo ? `Replying to ${replyingTo.name}` : ""}
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
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={RBZ.sub}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={sendComment}
                disabled={!commentText.trim()}
              >
                <Ionicons name="send" size={20} color={commentText.trim() ? "#fff" : RBZ.sub} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RBZ.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: RBZ.dark,
  },
  loadingText: {
    color: RBZ.sub,
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: RBZ.dark,
    padding: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyText: {
    color: RBZ.sub,
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
  },
  reelsContainer: {
    flex: 1,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000",
    position: "relative",
  },

  videoWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },

  // ✅ ONLY CENTER area toggles pause/play (and handles double-tap like)
  centerTapZone: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: CENTER_TAP_SIZE,
    height: CENTER_TAP_SIZE,
    transform: [{ translateX: -CENTER_TAP_SIZE / 2 }, { translateY: -CENTER_TAP_SIZE / 2 }],
    borderRadius: CENTER_TAP_SIZE / 2,
    // (optional) keep invisible; if you ever want debug, uncomment:
    // backgroundColor: "rgba(255,255,255,0.06)",
  },

  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  muteButton: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
    rightActions: {
    position: "absolute",
    right: 16,
    bottom: 120,
    alignItems: "center",
    gap: 24,
    zIndex: 30,
    elevation: 30,
  },
  actionItem: {
    alignItems: "center",
    gap: 4,
  },
  muteActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
  },
  followBadge: {
    position: "absolute",
    bottom: -4,
    backgroundColor: RBZ.c3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
   bottomInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 42,
  },
  userInfo: {
    gap: 8,
  },
   nameRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },

  // ✅ New: pushes the name to the bottom of the bottomInfo area
   nameRowBottom: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
  nameRowWithCaption: {
    marginTop: 14,
  },
  nameRowWithoutCaption: {
    marginTop: 95,
  },

  nameAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  caption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },

  // ✅ Visual only (no touch)
  playOverlayVisual: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: SCREEN_HEIGHT * 0.34 - 44,
    zIndex: 20,
    elevation: 20,
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  doubleTapHeart: {
    position: "absolute",
    alignSelf: "center",
    top: "40%",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: RBZ.darker,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  giftCard: {
    width: (SCREEN_WIDTH - 64) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  giftEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  giftLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  commentsModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: RBZ.darker,
    marginTop: StatusBar.currentHeight || 44,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  commentsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  commentsList: {
    padding: 20,
  },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  commentText: {
    color: RBZ.text,
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noCommentsText: {
    color: RBZ.sub,
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: RBZ.c3,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

    replyCommentItem: {
    marginLeft: 22,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.12)",
  },

  composeModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
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
  
  sendButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});