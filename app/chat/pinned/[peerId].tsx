import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
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

import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";

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

function makeRoomId(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

const RBZ_TAG = "::RBZ::";

type PinnedMessage = {
  id: string;
  from: string;
  text?: string;
  type?: string;
  url?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  createdAt?: any;
  time?: any;
  deleted?: boolean;
  _temp?: boolean;
  pinned?: boolean;
  pinnedAt?: any;
};

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

  const [me, setMe] = useState<any>(null);
  const myId = useMemo(() => String(me?.id || me?._id || ""), [me]);
  const roomId = useMemo(() => makeRoomId(myId, peerId), [myId, peerId]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PinnedMessage[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync("RBZ_USER");
      setMe(raw ? JSON.parse(raw) : null);
    })();
  }, []);

  useEffect(() => {
    if (!myId || !peerId) return;

    (async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];

        const pinned = list
          .filter((m: any) => !!m?.pinned && !m?.deleted && !m?._temp)
          .sort(
            (a: any, b: any) =>
              toMs(b?.pinnedAt || b?.createdAt || b?.time) -
              toMs(a?.pinnedAt || a?.createdAt || a?.time)
          );

        setItems(pinned);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [myId, peerId, roomId]);

  useEffect(() => {
    if (!roomId) return;

    let alive = true;
    let s: any;

    const onPin = (payload: any) => {
      const nextRoomId = String(payload?.roomId || "");
      const msg = payload?.message || payload;
      if (nextRoomId && nextRoomId !== roomId) return;
      if (!msg?.id) return;

      setItems((prev) => {
        const next = prev.filter((x) => String(x.id) !== String(msg.id));

        if (msg?.pinned && !msg?.deleted && !msg?._temp) {
          next.push(msg);
        }

        return next.sort(
          (a, b) =>
            toMs(b?.pinnedAt || b?.createdAt || b?.time) -
            toMs(a?.pinnedAt || a?.createdAt || a?.time)
        );
      });
    };

    (async () => {
      s = await getSocket();
      if (!alive || !s) return;
      s.on("message:pin", onPin);
      s.on("chat:pin", onPin);
    })();

    return () => {
      alive = false;
      if (!s) return;
      s.off("message:pin", onPin);
      s.off("chat:pin", onPin);
    };
  }, [roomId]);

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
            {items.length === 1 ? "1 pinned message" : `${items.length} pinned messages`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Loading pinned messages…</Text>
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
