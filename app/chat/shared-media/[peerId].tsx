import { diagnosticImage } from "@/src/performance/diagnostics/media";
import { withPerfScreen, usePerfContent } from "@/src/performance/diagnostics/screens";
/**
 * ============================================================
 * 📁 File: app/chat/shared-media/[peerId].tsx
 * 🎯 Screen: RomBuzz — Shared Media Hub
 *
 * Shows 2 tabs under Shared media:
 *  1) Photos → all NON-EPHEMERAL shared images
 *  2) Videos → all NON-EPHEMERAL shared videos
 *
 * Rules:
 *  - NEVER show/store view-once/view-twice (ephemeral) media
 *  - Grid: 3 per row
 *  - Each tile has ⋮ menu:
 *      - Delete for me
 *      - Delete for all
 *      - Show in chat
 *
 * Backend (already exists):
 *  - GET    /api/chat/rooms/:roomId
 *  - DELETE /api/chat/rooms/:roomId/:msgId?scope=me
 *  - DELETE /api/chat/rooms/:roomId/:msgId?scope=all
 * ============================================================
 */

import MediaViewer from "@/src/components/chat/MediaViewer";
import RBZImageViewer from "@/src/components/media/RBZImageViewer";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config/api";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useRomBuzzTypography } from "@/src/design/rombuzzTypography";
import { useSharedMediaStyles } from "@/src/features/chat/sharedMedia/useSharedMediaStyles";
import ChatVideoPreview from "@/src/features/chat/sharedMedia/ChatVideoPreview";
import { useChatMedia } from "@/src/features/chat/mediaHub/useChatMedia";
import { ChatMediaRow as MediaRow } from "@/src/features/chat/mediaHub/chatMediaRows";

const PerfImage = diagnosticImage("shared-media");


const SCREEN_W = Dimensions.get("window").width;

function guessExt(url: string, mediaType: "image" | "video") {
  const lower = String(url || "").toLowerCase();
  if (mediaType === "video") return "mp4";
  if (lower.includes(".png")) return "png";
  if (lower.includes(".webp")) return "webp";
  if (lower.includes(".jpeg")) return "jpeg";
  if (lower.includes(".jpg")) return "jpg";
  return "jpg";
}

function SharedMediaHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRomBuzzTypography();
  const { colors } = useRomBuzzTheme();
  const styles = useSharedMediaStyles();

  const params = useLocalSearchParams<{
    peerId: string;
    name?: string;
    avatar?: string;
  }>();

  const peerId = String(params.peerId || "");
  const peerName = String(params.name || "RomBuzz User");
  const peerAvatar = String(params.avatar || "https://i.pravatar.cc/200?img=12");

  const [mediaTab, setMediaTab] = useState<"photos" | "videos">("photos");
  const { rows: shared, setRows: setShared, roomId, loading, busy, error, counts, hasMore, load, loadMore, active } = useChatMedia(peerId, "shared", mediaTab === "photos" ? "image" : "video");
  usePerfContent("shared-media", !loading, shared.length);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItem, setMenuItem] = useState<MediaRow | null>(null);

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [videoViewerItem, setVideoViewerItem] = useState<MediaRow | null>(null);

  const col = 3;
  const gap = 10;
  const pad = 12;
  const tileW = useMemo(() => {
    const totalGap = gap * (col - 1);
    return Math.floor((SCREEN_W - pad * 2 - totalGap) / col);
  }, []);

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

      setShared((p) => p.filter((x) => x.id !== id));
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

      setShared((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message || "Try again");
    }
  };

  const showInChat = (id: string) => {
    router.push({
      pathname: "/chat/[peerId]" as any,
      params: {
        peerId,
        name: peerName,
        avatar: peerAvatar,
        focusMsgId: id,
      },
    });
  };

  const saveToPhone = async (item: MediaRow) => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Allow Photos permission to save media.");
        return;
      }

      const ext = guessExt(item.url, item.mediaType);
      const FS: any = FileSystem;
      const baseDir = String(FS.cacheDirectory || FS.documentDirectory || "");
      const localPath = `${baseDir}rbz_${item.id}_${Date.now()}.${ext}`;

      const dl = await FileSystem.downloadAsync(item.url, localPath);
      const asset = await MediaLibrary.createAssetAsync(dl.uri);

      try {
        const albumName = "RomBuzz";
        const album = await MediaLibrary.getAlbumAsync(albumName);
        if (!album) {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch {}

      Alert.alert("Saved", "Saved to your phone.");
    } catch (e: any) {
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

  const photos = useMemo(
    () => shared.filter((item) => item.mediaType === "image"),
    [shared]
  );

  const videos = useMemo(
    () => shared.filter((item) => item.mediaType === "video"),
    [shared]
  );

  const data = mediaTab === "photos" ? photos : videos;

  const imageViewerItems = useMemo(
    () =>
      photos
        .filter((item) => !!String(item.url || "").trim())
        .map((item) => ({
          id: item.id,
          url: item.url,
          title: "Photo",
        })),
    [photos]
  );

  const openImageViewer = (item: MediaRow) => {
    const foundIndex = imageViewerItems.findIndex((x) => String(x.id) === String(item.id));
    setImageViewerIndex(foundIndex >= 0 ? foundIndex : 0);
    setImageViewerOpen(true);
  };

  const openVideoViewer = (item: MediaRow) => {
    setVideoViewerItem(item);
    setVideoViewerOpen(true);
  };

  const MediaTabBtn = ({
    id,
    label,
    count,
  }: {
    id: "photos" | "videos";
    label: string;
    count: number;
  }) => {
    const active = mediaTab === id;
    return (
      <Pressable
        onPress={() => setMediaTab(id)}
        style={[styles.tabBtn, active ? styles.tabBtnActive : null]}
      >
        <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
          {label}{" "}
          <Text style={[styles.tabCount, active ? styles.tabCountActive : null]}>
            {count}
          </Text>
        </Text>
      </Pressable>
    );
  };

  const renderMediaTile = (item: MediaRow) => {
    return (
      <Pressable
        onPress={() => {
          if (item.mediaType === "video") {
            openVideoViewer(item);
          } else {
            openImageViewer(item);
          }
        }}
        onLongPress={() => openMenu(item)}
        style={[styles.tile, { width: tileW, height: tileW }]}
      >
        {item.mediaType === "video" ? (
          <ChatVideoPreview item={item} />
        ) : (
          <PerfImage resizeMethod="resize" source={{ uri: item.url }} style={styles.thumb} />
        )}

        {item.mediaType === "video" ? (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={14} color={colors.white} />
          </View>
        ) : null}

        {item.giftLocked ? (
          <View style={styles.giftBadge}>
            <Ionicons name="gift" size={14} color={colors.white} />
          </View>
        ) : null}

        <Pressable onPress={() => openMenu(item)} style={styles.dotsBtn} hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={14} color={colors.white} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.icon} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Shared Media
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {peerName}
          </Text>
        </View>

        <Pressable onPress={load} style={styles.headerBtn}>
          <Ionicons name="refresh" size={18} color={colors.icon} />
        </Pressable>
      </View>

      <View style={styles.tabsWrap}>
        <MediaTabBtn id="photos" label="Photos" count={counts.image} />
        <MediaTabBtn id="videos" label="Videos" count={counts.video} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name={mediaTab === "photos" ? "images-outline" : "videocam-outline"}
            size={34}
            color={colors.brand}
          />
          <Text style={styles.emptyTitle}>
            {mediaTab === "photos" ? "No shared photos yet." : "No shared videos yet."}
          </Text>
          {hasMore || error ? <Pressable onPress={error ? load : loadMore}><Text>{error ? "Retry loading media" : "Load older media"}</Text></Pressable> : null}
          <Text style={styles.emptySub}>View once/twice media never appears here.</Text>
        </View>
      ) : (
         <FlatList
          data={data}
          key={mediaTab}
          keyExtractor={(x) => x.id}
          numColumns={3}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{
            paddingHorizontal: pad,
            paddingTop: 12,
            gap,
            paddingBottom: insets.bottom + 18,
          }}
          renderItem={({ item }) => renderMediaTile(item)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={busy ? <ActivityIndicator color={colors.brand} /> : error || hasMore ? <Pressable onPress={error ? load : loadMore}><Text>{error ? "Retry loading media" : "Load older media"}</Text></Pressable> : null}
        />
      )}

      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <Text style={styles.menuTitle}>Shared media</Text>

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
              <View style={styles.menuIconBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.brand} />
              </View>

              <View style={styles.menuTextWrap}>
                <Text style={styles.menuText}>Show in chat</Text>
                <Text style={styles.menuHint}>Jump back to this message</Text>
              </View>

              <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
            </Pressable>

            <View style={styles.menuSectionGap} />

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
              <View style={styles.menuIconBox}>
                <Ionicons name="eye-off-outline" size={19} color={colors.icon} />
              </View>

              <View style={styles.menuTextWrap}>
                <Text style={styles.menuText}>Delete for me</Text>
                <Text style={styles.menuHint}>Only remove it from your view</Text>
              </View>

              <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={[styles.menuRow, styles.menuDangerRow]}
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
              <View style={[styles.menuIconBox, styles.menuDangerIconBox]}>
                <Ionicons name="trash-outline" size={19} color={colors.danger} />
              </View>

              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuText, styles.menuDangerText]}>
                  Delete for all
                </Text>
                <Text style={[styles.menuHint, styles.menuDangerHint]}>
                  Permanently remove for both users
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={17} color={colors.danger} />
            </Pressable>

            <Pressable style={styles.menuCloseBtn} onPress={closeMenu}>
              <Text style={styles.menuCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <RBZImageViewer
        visible={imageViewerOpen && active}
        items={imageViewerItems}
        initialIndex={imageViewerIndex}
        title="Photo"
        onIndexChange={setImageViewerIndex}
        onClose={() => {
          setImageViewerOpen(false);
        }}
      />

      {videoViewerItem && active ? (
        <MediaViewer
          visible={videoViewerOpen && active}
          onClose={() => {
            setVideoViewerOpen(false);
            setVideoViewerItem(null);
          }}
          uri={videoViewerItem.url}
          mediaType="video"
          allowDownload={false}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default withPerfScreen(SharedMediaHub, "shared-media");
