import { diagnosticImage } from "@/src/performance/diagnostics/media";
import { withPerfScreen, usePerfContent } from "@/src/performance/diagnostics/screens";
/**
 * ============================================================
 * 📁 File: app/chat/purchased-media/[peerId].tsx
 * 🎯 Screen: RomBuzz — Purchased Media Hub
 *
 * Shows 2 tabs under Purchased media:
 *  1) Photos → purchased / locked images only
 *  2) Videos → purchased / locked videos only
 *
 * Rules:
 *  - NEVER show/store view-once/view-twice (ephemeral) media
 *  - ONLY gift.locked / locked media appears here
 *  - Grid: 3 per row
 *  - Each tile has ⋮ menu:
 *      - Delete for me
 *      - Show in chat
 *
 * Backend (already exists):
 *  - GET    /api/chat/rooms/:roomId
 *  - DELETE /api/chat/rooms/:roomId/:msgId?scope=me
 * ============================================================
 */

import MediaViewer from "@/src/components/chat/MediaViewer";
import RBZImageViewer from "@/src/components/media/RBZImageViewer";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
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
import { usePurchasedMediaStyles } from "@/src/features/chat/purchasedMedia/usePurchasedMediaStyles";
import { useChatMedia } from "@/src/features/chat/mediaHub/useChatMedia";
import { ChatMediaRow as MediaRow, chatMediaRow } from "@/src/features/chat/mediaHub/chatMediaRows";

const PerfImage = diagnosticImage("purchased-media");


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

function PurchasedMediaHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRomBuzzTypography();
  const { colors } = useRomBuzzTheme();
  const styles = usePurchasedMediaStyles();

  const params = useLocalSearchParams<{
    peerId: string;
    name?: string;
    avatar?: string;
  }>();

  const peerId = String(params.peerId || "");
  const peerName = String(params.name || "RomBuzz User");
  const peerAvatar = String(params.avatar || "https://i.pravatar.cc/200?img=12");

  const [mediaTab, setMediaTab] = useState<"photos" | "videos">("photos");
  const { rows: purchased, setRows: setPurchased, myId, roomId, loading, busy, error, counts, hasMore, load, loadMore, active } = useChatMedia(peerId, "purchased", mediaTab === "photos" ? "image" : "video");
  usePerfContent("purchased-media", !loading, purchased.length);

  const [menuOpen, setMenuOpen] = useState(false);
  const [unlockingId, setUnlockingId] = useState("");
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

      setPurchased((p) => p.filter((x) => x.id !== id));
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

  const isLockedForMe = (item: MediaRow) => {
    if (!item.giftLocked) return false;
    if (String(item.fromId) === String(myId)) return false;
    return !item.unlockedBy.map(String).includes(String(myId));
  };

  const unlockPurchasedMedia = async (item: MediaRow) => {
    if (!item?.id || !roomId) return;

    if (item.giftPriceBC <= 0) {
      Alert.alert("Unlock unavailable", "This media does not have a valid BuzzCoin unlock price.");
      return;
    }

    if (unlockingId === item.id) return;

    try {
      setUnlockingId(item.id);

      const token = await SecureStore.getItemAsync("RBZ_TOKEN");

      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${item.id}/unlock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        throw new Error(j?.message || j?.error || "Could not unlock this media.");
      }

      setPurchased((prev) =>
        prev.map((x) =>
          String(x.id) === String(item.id)
            ? {
                ...x,
                ...(chatMediaRow(j?.message) || {}),
                giftLocked: false,
                unlockedBy: Array.from(
                  new Set([...x.unlockedBy.map(String), String(myId)])
                ),
              }
            : x
        )
      );

      Alert.alert("Unlocked", `You unlocked this media for ${Number(j?.priceBC || item.giftPriceBC)} BC.`);
    } catch (e: any) {
      Alert.alert("Unlock failed", e?.message || "Try again.");
    } finally {
      setUnlockingId("");
    }
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
    () => purchased.filter((item) => item.mediaType === "image"),
    [purchased]
  );

  const videos = useMemo(
    () => purchased.filter((item) => item.mediaType === "video"),
    [purchased]
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
    const lockedForMe = isLockedForMe(item);
    const unlockingThis = unlockingId === item.id;

    return (
      <Pressable
        onPress={() => {
          if (lockedForMe) {
            unlockPurchasedMedia(item);
            return;
          }

          if (item.mediaType === "video") {
            openVideoViewer(item);
          } else {
            openImageViewer(item);
          }
        }}
        onLongPress={() => openMenu(item)}
        style={[styles.tile, { width: tileW, height: tileW }]}
      >
                {item.mediaType === "video" && !item.thumbnailUrl ? (
          active ? <Video
            source={{ uri: item.url }}
            style={[styles.thumb, lockedForMe ? styles.lockedThumb : null]}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
            useNativeControls={false}
          /> : <View style={styles.thumb} />
        ) : (
          <PerfImage
            resizeMethod="resize" source={{ uri: item.mediaType === "video" ? item.thumbnailUrl : item.url }}
            style={[styles.thumb, lockedForMe ? styles.lockedThumb : null]}
          />
        )}

        {item.mediaType === "video" && !lockedForMe ? (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={14} color={colors.white} />
          </View>
        ) : null}

        <View style={styles.giftBadge}>
          <Ionicons name={lockedForMe ? "lock-closed" : "gift"} size={14} color={colors.white} />
        </View>

        {lockedForMe ? (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={20} color={colors.white} />
            <Text style={styles.lockPriceText}>{item.giftPriceBC} BC</Text>
            <View style={styles.unlockMiniBtn}>
              {unlockingThis ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.unlockMiniText}>Unlock</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.white} />
            <Text style={styles.unlockedText}>Unlocked</Text>
          </View>
        )}

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
            Purchased Media
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
            {mediaTab === "photos" ? "No purchased photos yet." : "No purchased videos yet."}
          </Text>
          {hasMore || error ? <Pressable onPress={error ? load : loadMore}><Text>{error ? "Retry loading media" : "Load older media"}</Text></Pressable> : null}
          <Text style={styles.emptySub}>Only locked / purchased media appears here.</Text>
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
            <Text style={styles.menuTitle}>Purchased media</Text>

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
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={19}
                  color={colors.brand}
                />
              </View>

              <View style={styles.menuTextWrap}>
                <Text style={styles.menuText}>Show in chat</Text>
                <Text style={styles.menuHint}>Jump back to this message</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textMuted}
              />
            </Pressable>

            <View style={styles.menuSectionGap} />

            <Pressable
              style={[styles.menuRow, styles.menuDangerRow]}
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
              <View style={[styles.menuIconBox, styles.menuDangerIconBox]}>
                <Ionicons
                  name="eye-off-outline"
                  size={19}
                  color={colors.danger}
                />
              </View>

              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuText, styles.menuDangerText]}>
                  Delete for me
                </Text>
                <Text style={[styles.menuHint, styles.menuDangerHint]}>
                  Remove it only from your media
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.danger}
              />
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

export default withPerfScreen(PurchasedMediaHub, "purchased-media");
