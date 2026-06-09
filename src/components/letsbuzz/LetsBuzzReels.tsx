/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/LetsBuzzReels.tsx
 * 🎯 Purpose: Reels Experience for LetsBuzz
 *
 * What it does:
 *  - Loads matched users' LetsBuzz reels from /feed/letsbuzz
 *  - Supports gallery-backed reel likes, gifts, comments, and sharing
 *  - Uses PrivateCommentsSheet for all private comments
 *  - Keeps fullscreen support through LetsBuzzReelsFullscreen
 *
 * Comment rule:
 *  - Comments are private between the reel/media owner and the commenter.
 *  - Backend enforces privacy.
 *  - This file only opens the reusable PrivateCommentsSheet.
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
  TouchableOpacity,
  View,
} from "react-native";

import { getGiftSummary, type GiftSummaryResponse } from "@/src/api/gifts";
import { API_BASE } from "@/src/config/api";
import PrivateCommentsSheet from "@/src/components/comments/PrivateCommentsSheet";
import GiftInsightSheet from "@/src/components/gifts/GiftInsightSheet";
import GiftPicker from "@/src/components/gifts/GiftPicker";
import RBZReportSheet from "@/src/components/reporting/RBZReportSheet";
import { getSocket } from "@/src/lib/socket";
import {
  getReelPlayableUrl,
  getStreamUid,
  normalizeLetsBuzzReel,
  shouldShowInLetsBuzzReels,
  type LetsBuzzNormalizedReel,
} from "./letsBuzzReelMedia";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type BuzzUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  avatarUrl?: string;
  photoUrl?: string;
  profilePic?: string;
  username?: string;
  photos?: any[];
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
  sourceType?: "gallery" | "post" | string;

  // Cloudflare Stream profile_reel support
  provider?: string;
  storage?: string;
  streamUid?: string;
  playback?: any;
  thumbnailUrl?: string;
  cloudflareStream?: any;
  status?: string;
  duration?: number;
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
  border: "rgba(255,255,255,0.12)",
};

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

function encodeRBZSharePost(payload: any) {
  return `::RBZ::${JSON.stringify(payload)}`;
}

function hasCaptionTag(caption: any, tag: string) {
  return String(caption || "")
    .toLowerCase()
    .includes(String(tag || "").toLowerCase());
}

function stripCaptionTags(caption: any) {
  return String(caption || "")
    .replace(/\b(?:kind|scope|intent):[^\s]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function countHeartReactions(reactions: Record<string, any> = {}) {
  return Object.values(reactions || {}).filter((value) => value === "❤️").length;
}

function getGiftTargetId(post: BuzzPost | null) {
  if (!post) return "";

  return String(post.fromGallery ? post.mediaId || post.id || "" : post.id || "");
}

function getGiftDisplayKey(post: BuzzPost | null) {
  return String(post?.id || "");
}

function getGiftTargetType(post: BuzzPost | null) {
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

type LetsBuzzReelsProps = {
  targetPostId?: string;
  targetType?: string;
  ownerId?: string;
  openComments?: boolean;
  commentId?: string;
  parentId?: string;
  replyId?: string;
};

export default function LetsBuzzReels({
  targetPostId,
  targetType,
  ownerId,
  openComments: deepLinkOpenComments,
  commentId,
  parentId,
  replyId,
}: LetsBuzzReelsProps) {
  const router = useRouter();
  const listRef = useRef<FlatList<BuzzPost>>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reels, setReels] = useState<BuzzPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meId, setMeId] = useState("");

  const videoRefs = useRef<Record<string, any>>({});
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resolvedStreamUrls, setResolvedStreamUrls] = useState<Record<string, string>>({});

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeReel, setActiveReel] = useState<BuzzPost | null>(null);

  const commentCountByPostRef = useRef<Record<string, number>>({});
  const [, forceCommentCountsRerender] = useState(0);

    const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [giftTotal, setGiftTotal] = useState<Record<string, number>>({});
  const [giftInsightsOpen, setGiftInsightsOpen] = useState(false);
  const [giftSummary, setGiftSummary] = useState<GiftSummaryResponse | null>(null);

  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportReel, setReportReel] = useState<BuzzPost | null>(null);
  const [reelMenuOpen, setReelMenuOpen] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const likeAnim = useRef(new Animated.Value(0)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);

  const socket = useMemo(() => {
    try {
      return getSocket();
    } catch {
      return null as any;
    }
  }, []);

  const currentReel = reels[currentIndex] || null;

  const fullName = useMemo(() => {
    return getOwnerName(currentReel?.user);
  }, [currentReel?.user]);

  const resolveReelPlaybackUrl = useCallback(
    async (post: BuzzPost | null) => {
      if (!post) return "";

      const directUrl = getReelPlayableUrl(post);
      if (directUrl) return directUrl;

      const uid = getStreamUid(post);
      if (!uid) return "";

      if (resolvedStreamUrls[uid]) return resolvedStreamUrls[uid];

      try {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE}/stream/${uid}/playback`, { headers });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) return "";

        const nextUrl = String(json?.playback?.hls || json?.playback?.dash || "").trim();

        if (nextUrl) {
          setResolvedStreamUrls((prev) => ({
            ...prev,
            [uid]: nextUrl,
          }));
        }

        return nextUrl;
      } catch {
        return "";
      }
    },
    [resolvedStreamUrls]
  );

   const fetchMeId = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/users/me`, { headers });
      const json = await res.json();

      const id = json?.user?.id || json?.id || json?.userId || "";
      if (id) setMeId(String(id));
    } catch {}
  }, []);

  const openComments = useCallback((post: BuzzPost) => {
    const targetId = getGiftTargetId(post);

    if (!targetId) {
      Alert.alert("Comments", "Missing reel/media id.");
      return;
    }

    if (!post?.userId) {
      Alert.alert("Comments", "Missing reel owner id.");
      return;
    }

    setActiveReel(post);
    setCommentsOpen(true);
  }, []);

  const loadReels = useCallback(async () => {
    try {
      const headers = await authHeaders();

      let myId = String(meId || "");
      if (!myId) {
        try {
          const meRes = await fetch(`${API_BASE}/users/me`, { headers });
          const meJson = await meRes.json();

          myId = String(meJson?.user?.id || meJson?.id || meJson?.userId || "");
          if (myId) setMeId(myId);
        } catch {}
      }

      const res = await fetch(`${API_BASE}/feed/letsbuzz`, { headers });
      const json = await res.json();

       const raw: any[] = Array.isArray(json?.items) ? json.items : [];

      const baseList: LetsBuzzNormalizedReel[] = raw
        .map((item: any) => normalizeLetsBuzzReel(item))
        .filter(
          (item: LetsBuzzNormalizedReel | null): item is LetsBuzzNormalizedReel =>
            item !== null
        );

      const onlyReels = baseList.filter((item) =>
        shouldShowInLetsBuzzReels(item, myId)
      );

      const hydrated = await Promise.all(
        onlyReels.map(async (item) => {
          try {
            const userRes = await fetch(`${API_BASE}/users/${item.userId}`, { headers });
            const userJson = await userRes.json();

            const mediaList = Array.isArray(userJson?.user?.media)
              ? userJson.user.media
              : [];

                  const targetKeys = [
              item.mediaId,
              item.id,
              item.streamUid,
              getStreamUid(item),
            ]
              .map((value) => String(value || "").trim())
              .filter(Boolean);

            const media = mediaList.find((mediaItem: any) => {
              const mediaKeys = [
                mediaItem?.id,
                mediaItem?._id,
                mediaItem?.mediaId,
                mediaItem?.postId,
                mediaItem?.streamUid,
                mediaItem?.uid,
                mediaItem?.cloudflareStream?.uid,
              ]
                .map((value) => String(value || "").trim())
                .filter(Boolean);

              return mediaKeys.some((key) => targetKeys.includes(key));
            });

            if (!media) return item;

            const reactions = media?.reactions || {};
            const comments = Array.isArray(media?.comments) ? media.comments : [];

            const visibleCommentCount = comments.length;
            commentCountByPostRef.current[String(item.id)] = visibleCommentCount;
            commentCountByPostRef.current[String(item.mediaId || item.id)] = visibleCommentCount;

             return {
              ...item,
              mediaUrl: item.mediaUrl || getReelPlayableUrl(media),
              provider: item.provider || media?.provider,
              storage: item.storage || media?.storage,
              streamUid: item.streamUid || getStreamUid(media),
              playback: item.playback || media?.playback,
              thumbnailUrl: item.thumbnailUrl || media?.thumbnailUrl,
              cloudflareStream: item.cloudflareStream || media?.cloudflareStream,
              status: item.status || media?.status || media?.cloudflareStream?.status,
              duration: Number(item.duration || media?.duration || media?.cloudflareStream?.duration || 0),
              likesCount: countHeartReactions(reactions),
              commentsCount: visibleCommentCount,
              isLiked: reactions?.[myId] === "❤️",
            };
          } catch {
            return item;
          }
        })
      );

         setReels(hydrated);

      if (targetPostId) {
        const idx = hydrated.findIndex((item) => String(item?.id) === String(targetPostId));

        if (idx >= 0) {
          const targetReel = hydrated[idx];

          setCurrentIndex(idx);

          setTimeout(() => {
            try {
              listRef.current?.scrollToIndex({
                index: idx,
                animated: false,
                viewPosition: 0,
              });
            } catch {}

            if (deepLinkOpenComments && targetReel) {
              openComments(targetReel);
            }
          }, 150);
        }
      }

       Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.log("LetsBuzzReels load error:", error);
    }
  }, [deepLinkOpenComments, fadeAnim, meId, openComments, targetPostId]);
  const loadGiftSummary = useCallback(async (post: BuzzPost | null) => {
    try {
      const displayKey = getGiftDisplayKey(post);
      const targetId = getGiftTargetId(post);

      if (!displayKey || !targetId || !post) return;

      const summary = await getGiftSummary({
        receiverId: String(post.userId || ""),
        targetType: getGiftTargetType(post),
        targetId,
        includeTransactions: false,
      });

      setGiftTotal((prev) => ({
        ...prev,
        [displayKey]: Number(summary?.totalCount || 0),
      }));
    } catch {
      const displayKey = getGiftDisplayKey(post);

      if (displayKey) {
        setGiftTotal((prev) => ({
          ...prev,
          [displayKey]: 0,
        }));
      }
    }
  }, []);

   const handleLike = useCallback(
    async (post: BuzzPost | null, doubleTap = false) => {
      if (!post) return;

      try {
        const headers = await authHeaders();

        if (post.fromGallery) {
          const res = await fetch(`${API_BASE}/media/${post.userId}/react`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              mediaId: String(post.mediaId || post.id),
              emoji: "❤️",
            }),
          });

          const json = await res.json();

          if (res.ok) {
            const likesCount = Number(json?.counts?.["❤️"] || 0);
            const liked = json?.mine === "❤️";

            setReels((prev) =>
              prev.map((item) =>
                item.id === post.id
                  ? {
                      ...item,
                      isLiked: liked,
                      likesCount,
                    }
                  : item
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

        const res = await fetch(`${API_BASE}/buzz/posts/${post.id}/like`, {
          method: "POST",
          headers,
        });

        if (res.ok) {
          setReels((prev) =>
            prev.map((item) =>
              item.id === post.id
                ? {
                    ...item,
                    isLiked: !item.isLiked,
                    likesCount: (item.likesCount || 0) + (item.isLiked ? -1 : 1),
                  }
                : item
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

  const openGiftInsights = useCallback(async (post: BuzzPost | null) => {
    try {
      if (!post) return;

      const targetId = getGiftTargetId(post);
      if (!targetId) return;

      const summary = await getGiftSummary({
        receiverId: String(post.userId || ""),
        targetType: getGiftTargetType(post),
        targetId,
        includeTransactions: true,
      });

      if (!summary?.rows?.length && Number(summary?.totalCount || 0) <= 0) {
        return;
      }

      setActiveReel(post);
      setGiftSummary(summary);
      setGiftInsightsOpen(true);
    } catch {
      // Backend controls privacy. If viewer is not owner/gifter, nothing opens.
    }
  }, []);

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

        const headers = await authHeaders();
        const roomId = roomIdFor(my, ownerId);

        const text = encodeRBZSharePost({
          type: "share_reel",
          postId: post.id,
          ownerId,
          mediaUrl: post.mediaUrl || "",
        });

        const res = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ text, to: ownerId }),
        });

        if (!res.ok) {
          let message = "Could not share reel.";

          try {
            const json = await res.json();
            message = json?.error || json?.message || message;
          } catch {}

          throw new Error(message);
        }

        router.push({
          pathname: "/chat/[peerId]" as any,
          params: {
            peerId: ownerId,
            name: getOwnerName(post.user),
            avatar: getOwnerAvatar(post.user),
          },
        });
      } catch (error: any) {
        const message = error?.message ? String(error.message) : "Could not share reel.";
        Alert.alert("Share", message);
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

  const handleCommentsChanged = useCallback(
    (nextComments: any[]) => {
      if (!activeReel) return;

      const count = Array.isArray(nextComments) ? nextComments.length : 0;
      const displayKey = String(activeReel.id || "");
      const targetKey = getGiftTargetId(activeReel);

      if (displayKey) commentCountByPostRef.current[displayKey] = count;
      if (targetKey) commentCountByPostRef.current[targetKey] = count;

      forceCommentCountsRerender((value) => value + 1);

      setReels((prev) =>
        prev.map((item) =>
          String(item.id) === String(activeReel.id)
            ? {
                ...item,
                commentsCount: count,
              }
            : item
        )
      );
    },
    [activeReel]
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

    const onCommentNew = (event: any) => {
      const postId = String(event?.postId || event?.mediaId || event?.targetId || "");
      if (!postId) return;

      commentCountByPostRef.current[postId] =
        Number(commentCountByPostRef.current[postId] || 0) + 1;

      forceCommentCountsRerender((value) => value + 1);
    };

    const onCommentDeleted = (event: any) => {
      const postId = String(event?.postId || event?.mediaId || event?.targetId || "");
      if (!postId) return;

      commentCountByPostRef.current[postId] = Math.max(
        0,
        Number(commentCountByPostRef.current[postId] || 0) - 1
      );

      forceCommentCountsRerender((value) => value + 1);
    };

    const onGiftNew = (event: any) => {
      const postId = String(event?.postId || event?.targetId || "");
      if (!postId) return;

      const matched = reels.find(
        (item) =>
          String(item.id) === postId ||
          String(item.mediaId || "") === postId ||
          getGiftTargetId(item) === postId
      );

      if (matched) {
        loadGiftSummary(matched);
      }
    };

      socket.on?.("comment:new", onCommentNew);
    socket.on?.("comment:deleted", onCommentDeleted);
    socket.on?.("buzz:gift:new", onGiftNew);

    return () => {
      cancelled = true;

      socket.off?.("comment:new", onCommentNew);
      socket.off?.("comment:deleted", onCommentDeleted);
      socket.off?.("buzz:gift:new", onGiftNew);
    };
  }, [fetchMeId, loadGiftSummary, loadReels, socket]);

  useEffect(() => {
    if (!currentReel?.id) return;
    loadGiftSummary(currentReel);
  }, [currentReel?.id, currentReel?.mediaId, currentReel?.fromGallery, loadGiftSummary]);

  useEffect(() => {
    if (!currentReel) return;
    resolveReelPlaybackUrl(currentReel).catch(() => {});
  }, [currentReel?.id, currentReel?.streamUid, resolveReelPlaybackUrl]);

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
        <Text style={styles.emptyText}>
          Matched reels from your connections will appear here
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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
              <View style={styles.videoWrap}>
                            {(() => {
                  const streamUid = getStreamUid(item);
                  const playableUrl =
                    getReelPlayableUrl(item) ||
                    (streamUid ? resolvedStreamUrls[streamUid] || "" : "");

                  if (!playableUrl) {
                    return (
                      <View style={[styles.video, styles.streamProcessing]}>
                        <Ionicons name="videocam" size={42} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.streamProcessingText}>Preparing reel…</Text>
                      </View>
                    );
                  }

                  return (
                    <Video
                      ref={(ref) => {
                        if (ref) videoRefs.current[String(item.id)] = ref;
                      }}
                      source={{ uri: playableUrl }}
                      style={styles.video}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={index === currentIndex && !paused}
                      isLooping
                      isMuted={muted}
                      useNativeControls={false}
                      progressUpdateIntervalMillis={250}
                      onError={() => {}}
                    />
                  );
                })()}

                {index === currentIndex ? (
                  <Pressable
                    style={styles.videoTapLayer}
                    onPress={(event: any) => {
                      const now = Date.now();
                      const isDoubleTap = now - lastTapRef.current < 280;
                      lastTapRef.current = now;

                      if (isDoubleTap) {
                        handleLike(item, true);
                        animateDoubleTap(
                          event.nativeEvent.locationX,
                          event.nativeEvent.locationY
                        );
                        return;
                      }

                      setPaused((value) => !value);
                    }}
                  />
                ) : null}

                {index === currentIndex && paused ? (
                  <View style={styles.playOverlayVisual} pointerEvents="none">
                    <View style={styles.playButton}>
                      <Ionicons
                        name="play"
                        size={58}
                        color="rgba(255,255,255,0.72)"
                      />
                    </View>
                  </View>
                ) : null}
              </View>

              {index === currentIndex ? (
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
              ) : null}
            </View>
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.y / SCREEN_HEIGHT
            );

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

      {currentReel ? (
        <View style={styles.overlayContainer} pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none" />

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() =>
                router.push(`/view-profile?userId=${currentReel.userId}` as any)
              }
            >
              <Image
                source={{ uri: getOwnerAvatar(currentReel.user) }}
                style={styles.profileImage}
              />
              <View style={styles.followBadge}>
                <Ionicons name="add" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActiveReel(currentReel);
                setGiftPickerOpen(true);
              }}
              onLongPress={() => openGiftInsights(currentReel)}
              delayLongPress={350}
              activeOpacity={0.8}
            >
              <Ionicons name="gift-outline" size={30} color="#fff" />
              <Text style={styles.actionText}>
                {giftTotal[getGiftDisplayKey(currentReel)] || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => openComments(currentReel)}
            >
              <Ionicons name="chatbubble-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>
                {(() => {
                  const displayKey = String(currentReel.id || "");
                  const targetKey = getGiftTargetId(currentReel);
                  const displayCount = commentCountByPostRef.current[displayKey];
                  const targetCount = commentCountByPostRef.current[targetKey];

                  if (typeof displayCount === "number") return displayCount;
                  if (typeof targetCount === "number") return targetCount;

                  return Number(currentReel.commentsCount || 0);
                })()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => shareToAuthor(currentReel)}
            >
              <Ionicons name="paper-plane-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

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

                   <TouchableOpacity
              style={styles.reportActionButton}
              onPress={() => {
                setReportReel(currentReel);
                setReelMenuOpen(true);
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={styles.bottomFade}
            pointerEvents="box-none"
          >
            <View style={styles.bottomInfo} pointerEvents="box-none">
              <View style={styles.userInfo} pointerEvents="box-none">
                {!!currentReel.text?.trim() ? (
                  <Text style={styles.caption} numberOfLines={3}>
                    {currentReel.text}
                  </Text>
                ) : null}

                <Pressable
                  onPress={() =>
                    router.push(`/view-profile?userId=${currentReel.userId}` as any)
                  }
                  hitSlop={10}
                  style={[
                    styles.nameRowBottom,
                    currentReel.text?.trim()
                      ? styles.nameRowWithCaption
                      : styles.nameRowWithoutCaption,
                  ]}
                >
                  <Image
                    source={{ uri: getOwnerAvatar(currentReel.user) }}
                    style={styles.nameAvatar}
                  />
                  <Text style={styles.username}>{fullName}</Text>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </View>
      ) : null}

      {activeReel && getGiftTargetId(activeReel) ? (
        <GiftPicker
          visible={giftPickerOpen}
          onClose={() => setGiftPickerOpen(false)}
          receiverId={String(activeReel.userId || "")}
          placement="reels"
          targetType={getGiftTargetType(activeReel)}
          targetId={getGiftTargetId(activeReel)}
          title="Send a Gift"
          subtitle="Pick a gift for this reel."
          onSent={() => {
            setGiftPickerOpen(false);
            loadGiftSummary(activeReel);
          }}
        />
      ) : null}

      <GiftInsightSheet
        visible={giftInsightsOpen}
        summary={giftSummary}
        currentUserId={meId}
        onClose={() => {
          setGiftInsightsOpen(false);
          setGiftSummary(null);
        }}
      />

               {activeReel && getGiftTargetId(activeReel) ? (
        <PrivateCommentsSheet
          visible={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          targetType={getGiftTargetType(activeReel) as any}
          targetId={getGiftTargetId(activeReel)}
          ownerId={String(activeReel.userId || "")}
          currentUserId={String(meId || "")}
          ownerUser={activeReel.user || null}
          title="Private Comments"
          subtitle="Visible only to you and the reel owner."
          onChanged={handleCommentsChanged}
        />
      ) : null}

      <Modal
        visible={reelMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setReelMenuOpen(false);
          setReportReel(null);
        }}
      >
        <Pressable
          style={styles.reelMenuBackdrop}
          onPress={() => {
            setReelMenuOpen(false);
            setReportReel(null);
          }}
        >
          <Pressable style={styles.reelMenuCard} onPress={() => {}}>
            <Pressable
              style={styles.reelMenuItem}
              onPress={() => {
                if (!reportReel) return;

                setReelMenuOpen(false);
                setReportSheetOpen(true);
              }}
            >
              <View style={styles.reelMenuIconBubble}>
                <Ionicons name="flag-outline" size={18} color={RBZ.c3} />
              </View>

              <View style={styles.reelMenuTextWrap}>
                <Text style={styles.reelMenuTitle}>Report</Text>
                <Text style={styles.reelMenuSubtitle}>
                  Report this reel to RomBuzz safety
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.reelMenuCancelButton}
              onPress={() => {
                setReelMenuOpen(false);
                setReportReel(null);
              }}
            >
              <Text style={styles.reelMenuCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

         {reportReel && getGiftTargetId(reportReel) ? (
        <RBZReportSheet
          visible={reportSheetOpen}
          onClose={() => {
            setReportSheetOpen(false);
            setReelMenuOpen(false);
            setReportReel(null);
          }}
          onSubmitted={() => {
            setReportSheetOpen(false);
            setReelMenuOpen(false);
            setReportReel(null);
          }}
          target={{
            targetType: "reel",
            targetId: getGiftTargetId(reportReel),
            reportedUserId: String(reportReel.userId || ""),
            targetOwnerId: String(reportReel.userId || ""),
            source: "mobile_letsbuzz_reel",
            title: getOwnerName(reportReel.user),
            subtitle: "LetsBuzz reel",
            avatar: getOwnerAvatar(reportReel.user),
            evidenceSnapshot: {
              screen: "letsbuzz_reels",
              contentType: "reel",
              letsBuzzTargetType: getGiftTargetType(reportReel),
              reelId: String(reportReel.id || ""),
              mediaId: String(reportReel.mediaId || ""),
              ownerId: String(reportReel.userId || ""),
              authorName: getOwnerName(reportReel.user),
              authorAvatar: getOwnerAvatar(reportReel.user),
              caption: String(reportReel.text || reportReel.caption || ""),
              mediaUrl: String(reportReel.mediaUrl || ""),
              createdAt: reportReel.createdAt || null,
            },
          }}
        />
      ) : null}
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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  streamProcessing: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.darker,
  },

  streamProcessingText: {
    color: RBZ.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
  },

  videoTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
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
    backgroundColor: "transparent",
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

   reportActionButton: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  reelMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 74,
  },
  reelMenuCard: {
    width: 230,
    borderRadius: 20,
    padding: 12,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 20,
  },
  reelMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  reelMenuIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233,72,106,0.16)",
  },
  reelMenuTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  reelMenuTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  reelMenuSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 2,
  },
  reelMenuCancelButton: {
    minHeight: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  reelMenuCancelText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "800",
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
});