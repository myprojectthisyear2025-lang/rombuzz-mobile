/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/LetsBuzzPosts.tsx
 * 🎯 Purpose: LetsBuzz → Posts tab (matched users image posts)
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
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
/* Theme */
/* -------------------------------------------------------------------------- */
const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.92)",
  sub: "rgba(255,255,255,0.70)",
  dark: "#0a0a0f",
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
  const [fullscreenPost, setFullscreenPost] = useState<BuzzPost | null>(null);

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
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User";

    const giftTotal = giftTotalByPostRef.current[item.id] ?? 0;

    return (
      <View style={styles.card}>
        {/* Header */}
        <Pressable
          onPress={() => router.push(`/view-profile?userId=${item.userId}` as any)}
          style={styles.headerRow}
        >
          <Image
            source={{ uri: u.avatar || "https://via.placeholder.com/120" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{fullName}</Text>
          <Ionicons name="chevron-forward" size={18} color={RBZ.sub} />
        </Pressable>

        {/* Media */}
        <Pressable onPress={() => setFullscreenPost(item)}>
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        </Pressable>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openGiftPicker(item)}
            onLongPress={() => openGiftInsights(item)}
            delayLongPress={350}
          >
            <Ionicons name="gift" size={18} color="#fff" />
            <Text style={styles.actionText}>
              Gift {giftTotal > 0 ? `· ${giftTotal}` : ""}
            </Text>
          </TouchableOpacity>

                   <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={styles.actionText}>
              Comment
              {(() => {
                const live = getKnownCommentCount(item.id);
                const fallback = Number(item.commentsCount || 0);
                const c = live > 0 ? live : fallback;
                return c > 0 ? ` · ${c}` : "";
              })()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => shareToOwner(item)}>
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {!!item.text && <Text style={styles.caption}>{item.text}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ color: RBZ.sub, marginTop: 10 }}>Loading posts…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: RBZ.sub }}>No matched posts yet.</Text>
          </View>
        }
      />

      {/* Fullscreen Image Viewer */}
      <Modal
        visible={!!fullscreenPost}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPost(null)}
      >
        <Pressable
          style={styles.fullscreenBackdrop}
          onPress={() => setFullscreenPost(null)}
        >
          <View style={styles.fullscreenTopBar} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.fullscreenBackBtn}
              onPress={() => setFullscreenPost(null)}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {!!fullscreenPost?.mediaUrl && (
            <Image
              source={{ uri: fullscreenPost.mediaUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* ✅ Centralized modals */}
      {ActionsModals}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: RBZ.card,
    borderWidth: 1,
    borderColor: RBZ.border,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  name: {
    flex: 1,
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  media: {
    width: "100%",
    aspectRatio: 4 / 5,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },

  actionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  actionText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  caption: {
    color: RBZ.text,
    padding: 12,
    lineHeight: 18,
  },

  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullscreenTopBar: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 16,
    zIndex: 20,
  },

  fullscreenBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
});