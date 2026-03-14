/**
 * ============================================================
 * 📁 File: app/chat/shared-media/[peerId].tsx
 * 🎯 Screen: RomBuzz — Thread Media Hub
 *
 * Shows 2 tabs:
 *  1) Shared Media     → all NON-EPHEMERAL media (images/videos) in time order
 *  2) Purchased Media  → gifted/locked media only (gift.locked===true)
 *
 * Rules:
 *  - NEVER show/store view-once/view-twice (ephemeral) media
 *  - Grid: 3 per row
 *  - Each tile has ⋮ menu:
 *      Shared Media:
 *        - Delete for me
 *        - Delete for all
 *        - Show in chat
 *        - Save
 *      Purchased Media:
 *        - Delete for me
 *        - Show in chat
 *        - Save
 *
 * Backend (already exists):
 *  - GET    /api/chat/rooms/:roomId
 *  - DELETE /api/chat/rooms/:roomId/:msgId?scope=me
 *  - DELETE /api/chat/rooms/:roomId/:msgId?scope=all
 *
 * ============================================================
 */

import MediaViewer from "@/src/components/chat/MediaViewer";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config/api";

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

type AnyMsg = any;

type MediaRow = {
  id: string;
  url: string;
  mediaType: "image" | "video";
  createdAtMs: number;
  giftLocked: boolean;
};

const SCREEN_W = Dimensions.get("window").width;

function isEphemeral(m: AnyMsg) {
  const mv = m?.ephemeral?.maxViews;
  const mode = String(m?.ephemeral?.mode || "");
  const viewsLeft = Number(m?.ephemeral?.viewsLeft || 0);

  // ✅ ONLY treat as ephemeral when it is actually view-once/view-twice
  // Your backend always includes viewsLeft (often 0), so DO NOT block on "number exists".
  if (mv === 1 || mv === 2) return true;
  if (mode === "once" || mode === "twice") return true;
  if (Number.isFinite(viewsLeft) && viewsLeft > 0) return true;

  return false;
}


function toMs(ts: any) {
  const d = ts || ts === 0 ? new Date(ts) : null;
  const n = d ? d.getTime() : 0;
  return Number.isFinite(n) ? n : 0;
}

function safeMediaType(m: AnyMsg): "image" | "video" {
  const t = String(m?.mediaType || "").toLowerCase();
  if (t === "video") return "video";
  return "image";
}

function guessExt(url: string, mediaType: "image" | "video") {
  const lower = String(url || "").toLowerCase();
  if (mediaType === "video") return "mp4";
  if (lower.includes(".png")) return "png";
  if (lower.includes(".webp")) return "webp";
  if (lower.includes(".jpeg")) return "jpeg";
  if (lower.includes(".jpg")) return "jpg";
  return "jpg";
}

// ✅ backend stores media as ::RBZ::<json> inside msg.text
function parseRBZ(text: any): any | null {
  const s = String(text || "");
  if (!s.startsWith("::RBZ::")) return null;
  try {
    return JSON.parse(s.replace(/^::RBZ::/, ""));
  } catch {
    return null;
  }
}

function pickMediaUrl(m: AnyMsg): string {
  // direct fields (if you ever add them later)
  const direct = String(m?.url || m?.mediaUrl || "");
  if (direct) return direct;

  // RBZ payload in text
  const p = parseRBZ(m?.text);
  const u =
    String(
      p?.url ||
        p?.mediaUrl ||
        p?.media?.url ||
        p?.media?.secure_url ||
        p?.secure_url ||
        ""
    ) || "";

  return u;
}

function pickMediaType(m: AnyMsg): "image" | "video" {
  const direct = String(m?.mediaType || "").toLowerCase();
  if (direct === "video") return "video";

  const p = parseRBZ(m?.text);
  const t = String(p?.mediaType || p?.type || p?.kind || "").toLowerCase();
  if (t === "video") return "video";

  return "image";
}

function pickGiftLocked(m: AnyMsg): boolean {
  if (!!m?.gift?.locked) return true;
  const p = parseRBZ(m?.text);
  return !!(p?.gift?.locked || p?.locked);
}


export default function ThreadMediaHub() {
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
  const [tab, setTab] = useState<"shared" | "purchased">("shared");

  const [shared, setShared] = useState<MediaRow[]>([]);
  const [purchased, setPurchased] = useState<MediaRow[]>([]);

  // action sheet
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItem, setMenuItem] = useState<MediaRow | null>(null);
const [viewerOpen, setViewerOpen] = useState(false);
const [viewerItem, setViewerItem] = useState<MediaRow | null>(null);

  const col = 3;
  const gap = 10;
  const pad = 12;
  const tileW = useMemo(() => {
    const totalGap = gap * (col - 1);
    return Math.floor((SCREEN_W - pad * 2 - totalGap) / col);
  }, []);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync("RBZ_USER");
      setMe(raw ? JSON.parse(raw) : null);
    })();
  }, []);

  const load = async () => {
    if (!myId || !peerId) return;

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = (await r.json()) as AnyMsg[];
      const arr = Array.isArray(list) ? list : [];

    const media = arr
  .filter((m) => {
    if (!m) return false;
    if (m?.deleted) return false; // delete-for-all marks deleted=true
    if (isEphemeral(m)) return false; // ✅ never show ephemeral

    const type = String(m?.type || "");
    const url = pickMediaUrl(m);

    // backend marks media as type="media", but url lives in ::RBZ:: payload
    const isMedia = type === "media" || !!url;
    if (!isMedia) return false;
    if (!url) return false;

    return true;
  })
  .map((m) => {
    const id = String(m?.id || m?._id || "");
    const url = pickMediaUrl(m);
    const createdAtMs = toMs(m?.createdAt || m?.time);
    const mediaType = pickMediaType(m);
    const giftLocked = pickGiftLocked(m);

    return {
      id,
      url,
      mediaType,
      createdAtMs,
      giftLocked,
    } as MediaRow;
  })
  .filter((x) => !!x.id && !!x.url)
.sort((a, b) => b.createdAtMs - a.createdAtMs); // ✅ newest first

      setShared(media);

      setPurchased(media.filter((x) => x.giftLocked));
    } catch {
      setShared([]);
      setPurchased([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!myId || !peerId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, peerId]);

  const openMenu = (item: MediaRow) => {
    setMenuItem(item);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuItem(null);
  };

  const deleteForMe = async (id: string) => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${id}?scope=me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!j?.ok) throw new Error(j?.error || "Delete failed");

      // ✅ remove from grids instantly
      setShared((p) => p.filter((x) => x.id !== id));
      setPurchased((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message || "Try again");
    }
  };

  const deleteForAll = async (id: string) => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${id}?scope=all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!j?.ok) throw new Error(j?.error || "Delete failed");

      // backend marks deleted=true, but we remove from the grid too
      setShared((p) => p.filter((x) => x.id !== id));
      setPurchased((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message || "Try again");
    }
  };

  const showInChat = (id: string) => {
    // Navigate back into chat and focus scroll on this message
    router.push({
      pathname: "/chat/[peerId]" as any,
      params: {
        peerId,
        name: peerName,
        avatar: peerAvatar,
        focusMsgId: id, // 🔥 we add support in chat/[peerId].tsx patch below
      },
    });
  };

  const saveToPhone = async (item: MediaRow) => {
    try {
      // Permission
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Allow Photos permission to save media.");
        return;
      }
const ext = guessExt(item.url, item.mediaType);

// ✅ avoid TS type mismatch across expo-file-system versions
const FS: any = FileSystem;
const baseDir = String(FS.cacheDirectory || FS.documentDirectory || "");
const localPath = `${baseDir}rbz_${item.id}_${Date.now()}.${ext}`;

      const dl = await FileSystem.downloadAsync(item.url, localPath);

      // Create asset in gallery
      const asset = await MediaLibrary.createAssetAsync(dl.uri);

      // Optional: put in album
      try {
        const albumName = "RomBuzz";
        const album = await MediaLibrary.getAlbumAsync(albumName);
        if (!album) {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch {
        // album step is optional
      }

      Alert.alert("Saved", "Saved to your phone.");
    } catch (e: any) {
      // fallback to share if gallery save fails
      try {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          Alert.alert("Save", "Saving failed. Opening share sheet instead.");
          await Sharing.shareAsync(item.url);
          return;
        }
      } catch {}
      Alert.alert("Save failed", e?.message || "Try again");
    }
  };

  const data = tab === "shared" ? shared : purchased;

  const TabBtn = ({
    id,
    label,
    count,
  }: {
    id: "shared" | "purchased";
    label: string;
    count: number;
  }) => {
    const active = tab === id;
    return (
      <Pressable
        onPress={() => setTab(id)}
        style={[
          styles.tabBtn,
          active ? { backgroundColor: RBZ.c4, borderColor: "transparent" } : null,
        ]}
      >
        <Text style={[styles.tabText, active ? { color: RBZ.white } : null]}>
          {label}{" "}
          <Text style={[styles.tabCount, active ? { color: RBZ.white } : null]}>
            {count}
          </Text>
        </Text>
      </Pressable>
    );
  };

  const MediaTile = ({ item }: { item: MediaRow }) => {
    return (
      <Pressable
        onPress={() => {
            setViewerItem(item);
            setViewerOpen(true);
          }}
        onLongPress={() => openMenu(item)}
        style={[styles.tile, { width: tileW, height: tileW }]}
      >
        {item.mediaType === "video" ? (
          <Video
            source={{ uri: item.url }}
            style={styles.thumb}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
            useNativeControls={false}
          />
        ) : (
          <Image source={{ uri: item.url }} style={styles.thumb} />
        )}

        {/* video badge */}
        {item.mediaType === "video" ? (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={14} color={RBZ.white} />
          </View>
        ) : null}

        {/* gift badge (only show in shared tab if it is gifted too) */}
        {item.giftLocked ? (
          <View style={styles.giftBadge}>
            <Ionicons name="gift" size={14} color={RBZ.white} />
          </View>
        ) : null}

        {/* 3 dots */}
        <Pressable
          onPress={() => openMenu(item)}
          style={styles.dotsBtn}
          hitSlop={10}
        >
          <Ionicons name="ellipsis-vertical" size={14} color={RBZ.white} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={RBZ.white} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Shared Content
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {peerName}
          </Text>
        </View>

        <Pressable onPress={load} style={styles.headerBtn}>
          <Ionicons name="refresh" size={18} color={RBZ.white} />
        </Pressable>
      </LinearGradient>

      {/* tabs */}
      <View style={styles.tabsWrap}>
        <TabBtn id="shared" label="Shared media" count={shared.length} />
        <TabBtn id="purchased" label="Purchased" count={purchased.length} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={34} color={RBZ.c4} />
          <Text style={styles.emptyTitle}>
            {tab === "shared" ? "No shared media yet." : "No purchased media yet."}
          </Text>
          <Text style={styles.emptySub}>
            View once/twice media never appears here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          numColumns={3}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{ paddingHorizontal: pad, paddingTop: 12, gap, paddingBottom: insets.bottom + 18 }}
          renderItem={({ item }) => <MediaTile item={item} />}
        />
      )}

      {/* 3-dot menu */}
      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <Text style={styles.menuTitle}>
              {tab === "shared" ? "Shared media" : "Purchased media"}
            </Text>

            <View style={styles.menuHr} />

            <Pressable
              style={styles.menuRow}
              onPress={() => {
                const it = menuItem;
                closeMenu();
                if (!it) return;
                showInChat(it.id);
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={RBZ.ink} />
              <Text style={styles.menuText}>Show in chat</Text>
            </Pressable>

            <Pressable
              style={styles.menuRow}
              onPress={() => {
                const it = menuItem;
                closeMenu();
                if (!it) return;
                saveToPhone(it);
              }}
            >
              <Ionicons name="download-outline" size={18} color={RBZ.ink} />
              <Text style={styles.menuText}>Save</Text>
            </Pressable>

            <View style={styles.menuHr} />

            {/* Delete for me */}
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                const it = menuItem;
                closeMenu();
                if (!it) return;
                Alert.alert("Delete for me", "Remove this permanently for you?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteForMe(it.id),
                  },
                ]);
              }}
            >
              <Ionicons name="eye-off-outline" size={18} color={RBZ.ink} />
              <Text style={styles.menuText}>Delete for me</Text>
            </Pressable>

            {/* Delete for all (NOT in Purchased) */}
            {tab === "shared" ? (
              <Pressable
                style={styles.menuRow}
                onPress={() => {
                  const it = menuItem;
                  closeMenu();
                  if (!it) return;
                  Alert.alert("Delete for all", "Remove for both users forever?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete for all",
                      style: "destructive",
                      onPress: () => deleteForAll(it.id),
                    },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={RBZ.c1} />
                <Text style={[styles.menuText, { color: RBZ.c1 }]}>Delete for all</Text>
              </Pressable>
            ) : null}

            <View style={styles.menuHr} />

            <Pressable style={[styles.menuRow, { justifyContent: "center" }]} onPress={closeMenu}>
              <Text style={[styles.menuText, { color: RBZ.c2, fontWeight: "900" }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      {viewerItem ? (
  <MediaViewer
    visible={viewerOpen}
    onClose={() => {
      setViewerOpen(false);
      setViewerItem(null);
    }}
    uri={viewerItem.url}
    mediaType={viewerItem.mediaType}
    allowDownload={!viewerItem.giftLocked}
  />
) : null}
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

  tabsWrap: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.white,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: { color: RBZ.ink, fontWeight: "900" },
  tabCount: { color: RBZ.gray, fontWeight: "900" },

  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, color: RBZ.gray, fontWeight: "800" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyTitle: { marginTop: 10, fontSize: 14, fontWeight: "900", color: RBZ.ink },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: "800", color: RBZ.gray, textAlign: "center" },

  tile: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(181,23,158,0.16)",
  },
  thumb: { width: "100%", height: "100%" },

  dotsBtn: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  videoBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  giftBadge: {
    position: "absolute",
    left: 6,
    top: 6,
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: RBZ.c4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 12,
  },
  menuCard: {
    backgroundColor: RBZ.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  menuTitle: { fontSize: 14, fontWeight: "900", color: RBZ.ink },
  menuHr: { height: 1, backgroundColor: RBZ.line, marginVertical: 10 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  menuText: { fontSize: 14, fontWeight: "800", color: RBZ.ink },
});
