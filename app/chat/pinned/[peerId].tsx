import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePinnedMessages } from "@/src/features/chat/pinned/usePinnedMessages";

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

const RBZ_TAG = "::RBZ::";

const maybeDecode = (m: any) => {
  if (!m) return m;
  if (typeof m?.text === "string" && m.text.startsWith(RBZ_TAG)) {
    try {
      const payload = JSON.parse(m.text.slice(RBZ_TAG.length));
      return { ...m, ...payload };
    } catch {
      return m;
    }
  }
  return m;
};

const toMs = (ts: any): number => {
  if (ts == null || ts === "") return 0;
  if (typeof ts === "number") return ts < 1e12 ? ts * 1000 : ts;
  const parsed = new Date(ts).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatStamp = (ts: any) => {
  const ms = toMs(ts);
  if (!ms) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
};

const getPinnedPreview = (m: any) => {
  const msg = maybeDecode(m);

  if (msg?.deleted) return "Original message unavailable";
  if (msg?.type === "share_post") return "Shared post";
  if (msg?.type === "share_reel") return "Shared reel";
  if (msg?.mediaType === "audio") return "Voice message";
  if (msg?.mediaType === "video") return "Video";
  if (msg?.mediaType === "image") return "Photo";
  if (msg?.type === "media" && (msg?.url || msg?.mediaUrl)) {
    if (msg?.mediaType === "audio") return "Voice message";
    return msg?.mediaType === "video" ? "Video" : "Photo";
  }

  const text = String(msg?.text || "").replace(/\s+/g, " ").trim();
  if (!text) return "Message";
  return text.length > 120 ? `${text.slice(0, 117).trimEnd()}...` : text;
};

export default function PinnedMessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    peerId: string;
    name?: string;
    avatar?: string;
  }>();

  const peerId = String(params.peerId || "");
  const peerName = String(params.name || "RomBuzz User");
  const peerAvatar = String(params.avatar || "https://i.pravatar.cc/200?img=12");

  const { myId, loading, items, error, reload } = usePinnedMessages(peerId);

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={RBZ.white} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Pinned Messages
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {peerName}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.profileCard}>
        <Image source={{ uri: peerAvatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{peerName}</Text>
          <Text style={styles.sub}>
            {loading ? "Pinned messages" : items.length === 1 ? "1 pinned message" : `${items.length} pinned messages`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Loading pinned messages…</Text>
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable onPress={reload}><Text style={styles.emptyTitle}>Retry</Text></Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="bookmark-outline" size={30} color={RBZ.c4} />
          <Text style={styles.emptyTitle}>No pinned messages yet</Text>
          <Text style={styles.emptyText}>Pinned chat messages will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20, gap: 10 }}
          renderItem={({ item }) => {
            const isMine = String(item.from) === String(myId);
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/chat/[peerId]" as any,
                    params: {
                      peerId,
                      name: peerName,
                      avatar: peerAvatar,
                      focusMsgId: String(item.id),
                    },
                  })
                }
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View style={styles.pinPill}>
                    <Ionicons name="bookmark" size={12} color={RBZ.c2} />
                    <Text style={styles.pinPillText}>{isMine ? "Sent by you" : "Received"}</Text>
                  </View>
                  <Text style={styles.timeText}>{formatStamp(item?.time || item?.createdAt)}</Text>
                </View>

                <Text style={styles.previewText}>{getPinnedPreview(item)}</Text>

                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>
                    Sent • {formatStamp(item?.time || item?.createdAt)}
                  </Text>
                  <Text style={styles.metaText}>
                    Pinned • {formatStamp(item?.pinnedAt || item?.time || item?.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RBZ.soft },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  headerTitle: { color: RBZ.white, fontSize: 16, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "800", marginTop: 1 },
  profileCard: {
    margin: 12,
    marginBottom: 0,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: RBZ.soft,
  },
  name: { fontSize: 16, fontWeight: "900", color: RBZ.ink },
  sub: { marginTop: 3, fontSize: 12, color: RBZ.gray, fontWeight: "700" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "900", color: RBZ.ink },
  emptyText: { fontSize: 12, fontWeight: "700", color: RBZ.gray, textAlign: "center" },
  card: {
    backgroundColor: RBZ.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    padding: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(216,52,95,0.10)",
  },
  pinPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: RBZ.c2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "800",
    color: RBZ.gray,
  },
  previewText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: RBZ.ink,
  },
  cardMeta: {
    marginTop: 10,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "700",
    color: RBZ.gray,
  },
});
