/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/LetsBuzzPosts.tsx
 * 🎯 Purpose: LetsBuzz → Posts tab (matched users image posts)
 * 
 * 🎨 Design: Clean, modern feed with Instagram/Twitter aesthetic
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import RBZImageViewer, {
  type RBZImageViewerItem,
} from "@/src/components/media/RBZImageViewer";
import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import { useLetsBuzzActions } from "./LetsBuzzActions";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */
type BuzzUser = {
  id?: string;
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
  type?: "image" | "text" | "video";
  createdAt: any;
  user?: BuzzUser;

  // ✅ gallery-backed letsbuzz items
  mediaId?: string;
  fromGallery?: boolean;
  commentsCount?: number;
};

/* -------------------------------------------------------------------------- */
/* Theme - Clean modern palette */
/* -------------------------------------------------------------------------- */
const COLORS = {
  primary: "#FF385C",
  background: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  text: {
    primary: "#1A1A1A",
    secondary: "#666876",
    tertiary: "#8E94A7",
    light: "#FFFFFF",
  },
  border: "#E9ECEF",
  overlay: "rgba(0,0,0,0.02)",
  shadow: "#000000",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  body2: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
  button: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
};

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */
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

function formatTimestamp(timestamp: any): string {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* -------------------------------------------------------------------------- */
/* Component */
/* -------------------------------------------------------------------------- */
export default function LetsBuzzPosts({ targetPostId }: { targetPostId?: string }) {
  const router = useRouter();

  const listRef = useRef<FlatList<BuzzPost>>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<BuzzPost[]>([]);
  const [meId, setMeId] = useState("");
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerItems, setImageViewerItems] = useState<RBZImageViewerItem[]>([]);

  useEffect(() => {
    if (!targetPostId) return;
    if (!posts?.length) return;

    const idx = posts.findIndex((p) => String(p.id) === String(targetPostId));
    if (idx < 0) return;

    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.12,
        });
      } catch {}
    }, 250);

    return () => clearTimeout(t);
  }, [targetPostId, posts]);

  // Gift count cache (display-only)
  const giftTotalByPostRef = useRef<Record<string, number>>({});

  const socket = useMemo(() => {
    try {
      return getSocket();
    } catch {
      return null as any;
    }
  }, []);

  /* ----------------------------- Actions Hook ----------------------------- */
  const {
    openGiftPicker,
    openGiftInsights,
    openComments,
    shareToOwner,
    getKnownCommentCount,
    ActionsModals,
  } = useLetsBuzzActions(meId);

  /* ----------------------------- Loaders ----------------------------- */
  const fetchMeId = useCallback(async () => {
    try {
      const h = await authHeaders();
      const r = await fetch(`${API_BASE}/users/me`, { headers: h });
      const j = await r.json();
      const id = j?.user?.id || j?.id || j?.userId;
      if (id) setMeId(String(id));
      return String(id || "");
    } catch {
      return "";
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const h = await authHeaders();

      let myId = String(meId || "");
      if (!myId) {
        myId = await fetchMeId();
      }

      // ✅ same matched-gallery source family as reels
      const r = await fetch(`${API_BASE}/feed/letsbuzz`, { headers: h });
      const j = await r.json();

      const raw: any[] = Array.isArray(j?.items) ? j.items : [];

      const list: BuzzPost[] = raw
        .map((p: any): BuzzPost => {
          const mediaId = String(p?.id || p?._id || "");
          const caption = String(p?.caption || "");

          return {
            id: mediaId,
            mediaId,
            fromGallery: true,
            commentsCount: Array.isArray(p?.comments) ? p.comments.length : 0,

            userId: String(p?.userId || ""),
            mediaUrl: String(p?.mediaUrl || ""),
            type: String(p?.type || "image") as BuzzPost["type"],
            text: stripCaptionTags(caption),
            createdAt: p?.createdAt,
            user: p?.user,
          };
        })
        .filter((p) => !!p.id && !!p.userId && !!p.mediaUrl);
        
      const photosOnly = list.filter((p) => {
        const source = raw.find(
          (x: any) => String(x?.id || x?._id || "") === String(p.id)
        );
        const caption = String(source?.caption || "");
        const type = String(p?.type || "").toLowerCase();

        const notMine = !myId || String(p.userId) !== String(myId);
        const notPrivate = !hasCaptionTag(caption, "scope:private");
        const notReelTag = !hasCaptionTag(caption, "kind:reel");

        const looksLikeVideo =
          type === "video" ||
          type === "reel" ||
          /\.(mp4|mov|m4v|webm)$/i.test(String(p.mediaUrl || ""));

        return notMine && notPrivate && notReelTag && !looksLikeVideo;
      });

      const hydrated = await Promise.all(
        photosOnly.map(async (p) => {
          try {
            const ur = await fetch(`${API_BASE}/users/${p.userId}`, { headers: h });
            const uj = await ur.json();

            const mediaList = Array.isArray(uj?.user?.media) ? uj.user.media : [];
            const media = mediaList.find(
              (m: any) => String(m?.id || "") === String(p.mediaId || p.id)
            );

            const comments = Array.isArray(media?.comments) ? media.comments : [];

            return {
              ...p,
              commentsCount: comments.length,
            };
          } catch {
            return p;
          }
        })
      );

      // Sort by newest first
      hydrated.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setPosts(hydrated);
    } catch (e) {
      console.log("LetsBuzzPosts load error:", e);
      Alert.alert("LetsBuzz", "Failed to load posts.");
    }
  }, [meId, fetchMeId]);

  const boot = useCallback(async () => {
    setLoading(true);
    await fetchMeId();
    await loadPosts();
    setLoading(false);
  }, [fetchMeId, loadPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMeId();
    await loadPosts();
    setRefreshing(false);
  }, [fetchMeId, loadPosts]);

  const openImageViewer = useCallback((post: BuzzPost) => {
    const u: BuzzUser = post.user || {};
    const fullName = [u.firstName, u.lastName]
      .filter(Boolean)
      .join(" ") || u.username || "User";

    setImageViewerItems([
      {
        id: post.id,
        url: String(post.mediaUrl || ""),
        title: fullName,
      },
    ]);
    setImageViewerIndex(0);
    setImageViewerVisible(true);
  }, []);

  /* ----------------------------- Realtime ----------------------------- */
  useEffect(() => {
    boot();

    if (!socket) return;

    const onGiftNew = (evt: any) => {
      const postId = String(evt?.postId || "");
      if (!postId) return;
      giftTotalByPostRef.current[postId] = (giftTotalByPostRef.current[postId] || 0) + 1;
    };

    socket.on?.("buzz:gift:new", onGiftNew);
    return () => socket.off?.("buzz:gift:new", onGiftNew);
  }, [boot, socket]);

  /* ----------------------------- Render ----------------------------- */
  const renderPost = ({ item }: { item: BuzzPost }) => {
    const u: BuzzUser = item.user || {};
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || "User";
    const avatarUrl = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=FF385C&color=fff&size=100`;
    const timestamp = formatTimestamp(item.createdAt);
    const giftTotal = giftTotalByPostRef.current[item.id] ?? 0;
    const commentCount = getKnownCommentCount(item.id) || item.commentsCount || 0;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            onPress={() => router.push(`/view-profile?userId=${item.userId}` as any)}
            style={styles.userInfo}
            activeOpacity={0.7}
          >
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.timestamp}>{timestamp}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {!!item.text && (
          <Text style={styles.caption} numberOfLines={3}>
            {item.text}
          </Text>
        )}

        {/* Media */}
        <Pressable 
          onPress={() => openImageViewer(item)}
          style={({ pressed }) => [
            styles.mediaContainer,
            pressed && styles.mediaPressed
          ]}
        >
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        </Pressable>

        {/* Action Buttons - Keeping original functionality (gift instead of like) */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openGiftPicker(item)}
            onLongPress={() => openGiftInsights(item)}
            delayLongPress={350}
            activeOpacity={0.7}
          >
            <Ionicons name="gift-outline" size={22} color={COLORS.text.secondary} />
            <Text style={styles.actionText}>
              Gift {giftTotal > 0 ? `· ${giftTotal}` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => openComments(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={21} color={COLORS.text.secondary} />
            <Text style={styles.actionText}>
              Comment{commentCount > 0 ? ` · ${commentCount}` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => shareToOwner(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={21} color={COLORS.text.secondary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading posts…</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="images-outline" size={48} color={COLORS.text.tertiary} />
        </View>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptyText}>
          Posts from your matches will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            try {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.12,
              });
            } catch {}
          }, 350);
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <RBZImageViewer
        visible={imageViewerVisible}
        items={imageViewerItems}
        initialIndex={imageViewerIndex}
        title="Let'sBuzz"
        onClose={() => setImageViewerVisible(false)}
        onIndexChange={(index) => setImageViewerIndex(index)}
      />

      {/* ✅ Centralized modals */}
      {ActionsModals}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginTop: SPACING.lg,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.tertiary,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: SPACING.lg,
  },
  separator: {
    height: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
  },
  userName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  mediaContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
  },
  mediaPressed: {
    opacity: 0.95,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
  },
  actionText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.secondary,
  },
});