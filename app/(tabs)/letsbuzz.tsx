/**
 * ============================================================================
 * 📁 File: app/letsbuzz.tsx
 * 🎯 RomBuzz Mobile — LetsBuzz (Posts & Reels)
 * ============================================================================
 */

import { Feather, Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";

import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

/* 🎨 RomBuzz Palette */
const COLORS = {
  primary: "#b1123c",
  secondary: "#d8345f",
  accent: "#e9486a",
  highlight: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
};

const API = "https://YOUR_BACKEND_URL/api"; // already matches your backend routes

export default function LetsBuzzScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"posts" | "reels">("posts");
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [tab]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const endpoint =
        tab === "posts" ? "/buzz/feed" : "/buzz/reels";
      const res = await fetch(API + endpoint, {
        headers: { Authorization: "Bearer TOKEN" },
      });
      const data = await res.json();
      setFeed(data.posts || []);
    } catch (e) {
      console.error("LetsBuzz feed error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔝 Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Let’sBuzz</Text>
        <View style={styles.tabs}>
          <Tab label="Posts" active={tab === "posts"} onPress={() => setTab("posts")} />
          <Tab label="Reels" active={tab === "reels"} onPress={() => setTab("reels")} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            tab === "posts" ? (
              <PostCard post={item} />
            ) : (
              <ReelCard post={item} />
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* ===================== COMPONENTS ===================== */

function Tab({ label, active, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tab,
        active && { borderBottomColor: COLORS.primary },
      ]}
    >
      <Text
        style={[
          styles.tabText,
          active && { color: COLORS.primary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PostCard({ post }: any) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.row}>
        <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{post.user.firstName}</Text>
      </View>

      {/* Media */}
      {post.mediaUrl ? (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
        <Ionicons name="chatbubble-outline" size={22} color={COLORS.primary} />
        <Feather name="send" size={22} color={COLORS.primary} />
      </View>

      {/* Counts */}
      <Text style={styles.count}>
        {post.likes?.length || 0} likes · {post.comments?.length || 0} comments
      </Text>

      {/* Text */}
      {post.text ? <Text style={styles.caption}>{post.text}</Text> : null}
    </View>
  );
}

function ReelCard({ post }: any) {
  return (
    <View style={styles.reel}>
      <Video
        source={{ uri: post.mediaUrl }}
        style={styles.reelVideo}
  resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
      />

      <View style={styles.reelActions}>
        <Ionicons name="heart" size={28} color={COLORS.white} />
        <Ionicons name="chatbubble" size={26} color={COLORS.white} />
        <Feather name="send" size={26} color={COLORS.white} />
      </View>
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  header: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 12,
  },
  tabs: { flexDirection: "row", gap: 20 },
  tab: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 16, fontWeight: "700", color: COLORS.gray },

  card: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    padding: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  name: { fontWeight: "700", color: COLORS.primary },
  media: { width: "100%", height: 280, borderRadius: 12, marginVertical: 10 },
  actions: { flexDirection: "row", gap: 16, marginVertical: 6 },
  count: { color: COLORS.gray, fontSize: 13 },
  caption: { marginTop: 4, fontSize: 14 },

  reel: { height: 520, backgroundColor: "#000" },
  reelVideo: { width: "100%", height: "100%" },
  reelActions: {
    position: "absolute",
    right: 12,
    bottom: 80,
    gap: 18,
  },
});
