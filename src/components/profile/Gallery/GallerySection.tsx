/**
 * ============================================================================
 * 📁 File: src/components/profile/Gallery/GallerySection.tsx
 * 🎯 Purpose: Profile → Gallery tab (Photos + Reels, upload, publish scope, fullscreen)
 *
 * Backend:
 *  - POST  /upload-r2-file       → upload file to Cloudflare R2
 *  - POST  /upload-media         → save media item into user.media[]
 *  - PATCH /media/:id/privacy    → set public/matches/private
 *
 * Caption Tags:
 *  - kind:photo | kind:reel
 *  - scope:public | scope:matches | scope:private
 *  - intent:discover | intent:viewprofile | intent:letsbuzz | intent:firstimpression
 *
 * Example caption:
 *  "kind:photo scope:matches intent:letsbuzz"
 * ============================================================================
 */

import { uploadRomBuzzMedia } from "@/src/config/uploadMedia";
import { Ionicons } from "@expo/vector-icons";
import GalleryTabs from "./GalleryTabs";

import React, { useEffect, useMemo, useRef, useState } from "react";
import FullscreenViewer from "./FullscreenViewer";
import { pickMedia } from "./MediaUploader";
import PhotoGrid from "./PhotoGrid";
import ProfileUploadPreview from "./ProfileUploadPreview";
import ReelGrid from "./ReelGrid";

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  bg: "#ffffff",
  card: "#ffffff",
  soft: "#f8fafc",
  line: "rgba(17,24,39,0.08)",
} as const;

type MediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  privacy?: "public" | "matches" | "private";
  createdAt?: any;
};

type PublishScope = "public" | "matches" | "private";
type PublishIntent = "discover" | "viewprofile" | "letsbuzz" | "firstimpression";
type MediaKind = "photo" | "reel";

function hasTag(caption: string | undefined, tag: string) {
  if (!caption) return false;
  return caption.split(/\s+/).includes(tag);
}

function buildCaption(kind: MediaKind, scope: PublishScope, intent: PublishIntent, extraCaption?: string) {
  const tags = [`kind:${kind}`, `scope:${scope}`, `intent:${intent}`];
  const cleaned = (extraCaption || "").trim();
  return cleaned ? `${tags.join(" ")} | ${cleaned}` : tags.join(" ");
}

function inferKind(item: MediaItem): MediaKind {
  // If caption explicitly says kind:reel, treat as reel
  if (hasTag(item.caption, "kind:reel")) return "reel";
  if (hasTag(item.caption, "kind:photo")) return "photo";
  // Fallback:
  return item.type === "video" ? "reel" : "photo";
}

function inferScope(item: MediaItem): PublishScope {
  if (hasTag(item.caption, "scope:matches")) return "matches";
  if (hasTag(item.caption, "scope:private")) return "private";
  if (hasTag(item.caption, "scope:public")) return "public";
  return item.privacy === "private" ? "private" : "public";
}

function toCreatedAtMs(value: any): number | null {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) return asNumber;

    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  return null;
}

function sortMediaNewestFirst(items: MediaItem[]) {
  return items
    .map((item, index) => ({
      item,
      index,
      createdAtMs: toCreatedAtMs(item?.createdAt),
    }))
    .sort((a, b) => {
      const aHasCreatedAt = a.createdAtMs != null;
      const bHasCreatedAt = b.createdAtMs != null;

      if (aHasCreatedAt && bHasCreatedAt && a.createdAtMs !== b.createdAtMs) {
        return (b.createdAtMs as number) - (a.createdAtMs as number);
      }

      if (aHasCreatedAt !== bHasCreatedAt) {
        return aHasCreatedAt ? -1 : 1;
      }

      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export default function GallerySection({
  ownerId,
  media,
  uploading,
  setUploading,
  apiFetch,
  apiJson,
  onRefresh,

  // Notification deep-link support
  deepLinkTargetId,
  deepLinkTargetType,
  deepLinkOwnerId,
  deepLinkOpenComments,
  deepLinkOpenInsights,
  deepLinkInsightsTab,
  deepLinkCommentId,
  deepLinkParentId,
  deepLinkReplyId,
}: {
  ownerId: string;
  media: MediaItem[];
  uploading: boolean;
  setUploading: (v: boolean) => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<any>;
  apiJson: (path: string, method: string, body: any) => Promise<any>;
  onRefresh: () => Promise<void> | void;

   deepLinkTargetId?: string;
  deepLinkTargetType?: string;
  deepLinkOwnerId?: string;
  deepLinkOpenComments?: boolean;
  deepLinkOpenInsights?: boolean;
  deepLinkInsightsTab?: "gifts" | "comments";
  deepLinkCommentId?: string;
  deepLinkParentId?: string;
  deepLinkReplyId?: string;
}) {


   const [gridWidth, setGridWidth] = useState(0);

const GRID_GAP = 8;
const CARD_PADDING = 14 * 2; // left + right padding
const CARD_BORDER = 1 * 2;   // left + right border
const ITEMS_PER_ROW = 3;

const usableWidth = gridWidth - CARD_PADDING - CARD_BORDER;

const gridItemSize =
  usableWidth > 0
    ? (usableWidth - GRID_GAP * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW
    : 0;


const [segment, setSegment] = useState<"photos" | "reels">("photos");

// ✅ Local media for instant UI updates
const [localMedia, setLocalMedia] = useState<MediaItem[]>(media || []);
useEffect(() => {
  setLocalMedia(media || []);
}, [media]);

// Upload flow UI
const [publishOpen, setPublishOpen] = useState(false);

  const [pickedAsset, setPickedAsset] = useState<{ uri: string; isVideo: boolean } | null>(null);

  const [kind, setKind] = useState<MediaKind>("photo");
  const [scope, setScope] = useState<PublishScope>("public");
  const [intent, setIntent] = useState<PublishIntent>("discover");
  const [captionText, setCaptionText] = useState("");

  // Fullscreen viewer
const [viewerOpen, setViewerOpen] = useState(false);
const [activeIndex, setActiveIndex] = useState<number>(0);

 const photos = useMemo(
  () => sortMediaNewestFirst(localMedia.filter((m) => inferKind(m) === "photo")),
  [localMedia]
);

const reels = useMemo(
  () => sortMediaNewestFirst(localMedia.filter((m) => inferKind(m) === "reel")),
  [localMedia]
);

const deepLinkConsumedRef = useRef("");

const list = segment === "photos" ? photos : reels;

useEffect(() => {
  const targetId = String(deepLinkTargetId || "").trim();
  if (!targetId) return;
  if (!localMedia.length) return;

  const consumedKey = [
    targetId,
    deepLinkTargetType || "",
    deepLinkOwnerId || "",
    deepLinkOpenComments ? "comments" : "",
    deepLinkOpenInsights ? "insights" : "",
    deepLinkInsightsTab || "",
    deepLinkCommentId || "",
    deepLinkParentId || "",
    deepLinkReplyId || "",
  ].join(":");

  if (deepLinkConsumedRef.current === consumedKey) return;

  const targetItem = localMedia.find(
    (item) =>
      String(item?.id || "") === targetId ||
      String(item?.url || "") === targetId
  );

  if (!targetItem) return;

  const targetKind = inferKind(targetItem);
  const targetList = targetKind === "reel" ? reels : photos;
  const targetIndex = targetList.findIndex(
    (item) =>
      String(item?.id || "") === String(targetItem.id || "") ||
      String(item?.url || "") === String(targetItem.url || "")
  );

  if (targetIndex < 0) return;

  deepLinkConsumedRef.current = consumedKey;
  setSegment(targetKind === "reel" ? "reels" : "photos");
  setActiveIndex(targetIndex);
  setViewerOpen(true);
}, [
  deepLinkTargetId,
  deepLinkTargetType,
  deepLinkOwnerId,
  deepLinkOpenComments,
  deepLinkOpenInsights,
  deepLinkInsightsTab,
  deepLinkCommentId,
  deepLinkParentId,
  deepLinkReplyId,
  localMedia,
  photos,
  reels,
]);

const openPicker = async (target: MediaKind) => {
  if (uploading) return;

  const picked = await pickMedia(target);
  if (!picked) return;

  setPickedAsset(picked);

  setKind(target);
  setScope("public");
  setIntent(target === "reel" ? "letsbuzz" : "discover");
  setCaptionText("");
  setPublishOpen(true);
};


   const savePicked = async () => {
  if (!pickedAsset) return;

  try {
    setUploading(true);

    // 1️⃣ Build caption with tags before upload.
    // Profile reels need this metadata during /stream/complete.
    const caption = buildCaption(kind, scope, intent, captionText);

    // 2️⃣ Upload actual file.
    // - Images go to private Cloudflare R2.
    // - Profile reels go to Cloudflare Stream direct upload.
    const uploaded = await uploadRomBuzzMedia(
      pickedAsset.uri,
      pickedAsset.isVideo ? "video" : "image",
      {
        purpose: pickedAsset.isVideo ? "profile_reel" : "gallery-photo",
        privacy: scope,
        caption,
        context: pickedAsset.isVideo ? "profile_reel" : "profile_gallery_photo",
        filename: pickedAsset.isVideo ? "profile-reel.mp4" : "gallery-photo.jpg",
      }
    );

    // 3️⃣ Cloudflare Stream profile reels are already saved by /stream/complete.
    // Do not call /upload-media again for videos, or Stream metadata can be lost.
    if (pickedAsset.isVideo) {
      if (!uploaded?.streamUid) {
        throw new Error("Stream upload did not return video UID");
      }

      console.log("STREAM PROFILE REEL UPLOAD RESPONSE:", JSON.stringify(uploaded, null, 2));

      setPublishOpen(false);
      setPickedAsset(null);

      await onRefresh();

      Alert.alert("Gallery", "Reel uploaded!");
      return;
    }

    const storedValue = uploaded?.r2Key || uploaded?.key || uploaded?.url || "";
    if (!storedValue) {
      throw new Error("Upload did not return media key");
    }

    // 4️⃣ Save R2 photo metadata to backend.
    // IMPORTANT:
    // - Send r2Key/fileKey when available.
    // - Send privacy directly as public/matches/private.
    // - Do NOT patch matches into private after this.
    const saved = await apiJson("/upload-media", "POST", {
      fileKey: uploaded?.r2Key || uploaded?.key || "",
      r2Key: uploaded?.r2Key || uploaded?.key || "",
      fileUrl: uploaded?.r2Key || uploaded?.key ? "" : uploaded?.url || "",
      type: "image",
      caption,
      privacy: scope,
    });

    console.log("UPLOAD RESPONSE:", JSON.stringify(saved, null, 2));

    setPublishOpen(false);
    setPickedAsset(null);

    await onRefresh();

    Alert.alert("Gallery", "Uploaded!");
  } catch (e: any) {
    Alert.alert("Gallery", e?.message || "Upload failed");
  } finally {
    setUploading(false);
  }
};


 const openViewer = (item: MediaItem) => {
  const idx = list.findIndex((m) => m.id === item.id);
  setActiveIndex(idx >= 0 ? idx : 0);
  setViewerOpen(true);
};



 const closeViewer = () => {
  setViewerOpen(false);
};

const closePublish = () => {
  setPublishOpen(false);
  setPickedAsset(null);
};

 const togglePrivacyQuick = async () => {
  const current = media[activeIndex];
  if (!current?.id) return;

  try {
    setUploading(true);
    await apiJson(`/media/${current.id}/privacy`, "PATCH", {});
    Alert.alert("Privacy", "Updated!");
    closeViewer();
  } catch (e: any) {
    Alert.alert("Privacy", e?.message || "Failed");
  } finally {
    setUploading(false);
  }
};


 const deleteMedia = async () => {
  const current = media[activeIndex];
  if (!current?.id) return;

  Alert.alert("Delete", "Remove this from your gallery?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          setUploading(true);
          await apiJson(`/media/${current.id}`, "DELETE", {});
          closeViewer();
          Alert.alert("Gallery", "Deleted!");
        } catch (e: any) {
          Alert.alert("Gallery", e?.message || "Delete failed");
        } finally {
          setUploading(false);
        }
      },
    },
  ]);
};


 return (
    <View style={{ marginTop: 14 }}>
      {/* Segmented header */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gallery</Text>
        <Text style={styles.cardBody}>
          Photos for Discover vibes, Reels for personality. Choose who sees what.
        </Text>

       <GalleryTabs
  active={segment}
  photosCount={photos.length}
  reelsCount={reels.length}
  onChange={setSegment}
/>


        {/* Add buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <Pressable
            onPress={() => openPicker("photo")}
            style={[styles.addBtn, { borderColor: "rgba(216,52,95,0.35)" }]}
          >
            <Ionicons name="add-circle" size={18} color={RBZ.c2} />
            <Text style={[styles.addBtnText, { color: RBZ.c2 }]}>Add Photo</Text>
          </Pressable>

          <Pressable
            onPress={() => openPicker("reel")}
            style={[styles.addBtn, { borderColor: "rgba(181,23,158,0.35)" }]}
          >
            <Ionicons name="add-circle" size={18} color={RBZ.c4} />
            <Text style={[styles.addBtnText, { color: RBZ.c4 }]}>Add Reel</Text>
          </Pressable>
        </View>
      </View>

   {/* Grid */}
<View
  style={[styles.card, { marginTop: 12 }]}
  onLayout={(e) => {
    const w = e.nativeEvent.layout.width;
    setGridWidth((prev) => (Math.abs(prev - w) < 1 ? prev : w));
  }}
>
  <Text style={styles.cardTitle}>
    {segment === "photos" ? "Your Photos" : "Your Reels"}
  </Text>


  {/* 🔄 Pull to refresh (lightweight) */}
  <Pressable
    onPress={() => onRefresh?.()}
    style={{ alignSelf: "flex-end", marginTop: 6 }}
  >
    <Text style={{ color: RBZ.muted, fontWeight: "700", fontSize: 12 }}>
      Pull down to refresh
    </Text>
  </Pressable>

{gridItemSize > 0 && list.length === 0 ? (
  <View style={styles.emptyWrap}>
    <Ionicons
      name={segment === "photos" ? "images-outline" : "videocam-outline"}
      size={42}
      color={RBZ.muted}
    />
    <Text style={styles.emptyTitle}>
      {segment === "photos"
        ? "No photos yet"
        : "No reels yet"}
    </Text>
    <Text style={styles.emptySub}>
      {segment === "photos"
        ? "Add a photo to show your vibe."
        : "Reels help people feel your personality."}
    </Text>
  </View>
) : (
  gridItemSize > 0 &&
  (segment === "photos" ? (
    <PhotoGrid
      items={photos}
      size={gridItemSize}
      onOpen={openViewer}
    />
  ) : (
    <ReelGrid
      items={reels}
      size={gridItemSize}
      onOpen={openViewer}
    />
  ))
)}

      </View>

      <ProfileUploadPreview
        visible={publishOpen}
        asset={pickedAsset}
        kind={kind}
        scope={scope}
        intent={intent}
        captionText={captionText}
        uploading={uploading}
        onClose={closePublish}
        onPublish={savePicked}
        onScopeChange={setScope}
        onIntentChange={setIntent}
        onCaptionChange={setCaptionText}
      />

    <FullscreenViewer
  item={viewerOpen ? list[activeIndex] : null}
  items={list}
  index={activeIndex}
  onChangeIndex={setActiveIndex}
  onClose={closeViewer}
  ownerId={ownerId}
  apiFetch={apiFetch}
  apiJson={apiJson}
  deepLinkOpenComments={deepLinkOpenComments}
  deepLinkOpenInsights={deepLinkOpenInsights}
  deepLinkInsightsTab={deepLinkInsightsTab}
  deepLinkCommentId={deepLinkCommentId}
  deepLinkParentId={deepLinkParentId}
  deepLinkReplyId={deepLinkReplyId}

  // ✅ instant UI updates
  onLocalPatch={(updated: MediaItem) => {
    setLocalMedia((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  }}
  onLocalDelete={(deletedId: string) => {
    setLocalMedia((prev) => prev.filter((m) => m.id !== deletedId));
    void Promise.resolve(onRefresh?.()).catch(() => {});
  }}
/>

  </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: RBZ.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: RBZ.ink,
  },
  cardBody: {
    marginTop: 6,
    color: RBZ.muted,
    lineHeight: 18,
  },

  segmentWrap: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.25)",
    backgroundColor: "rgba(216,52,95,0.06)",
    borderRadius: 999,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: RBZ.c2,
    borderColor: "rgba(216,52,95,0.60)",
  },
  segmentBtnActiveAlt: {
    backgroundColor: RBZ.c4,
    borderColor: "rgba(181,23,158,0.60)",
  },
  segmentText: {
    fontWeight: "800",
    color: RBZ.ink,
  },

  addBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: RBZ.soft,
  },
  addBtnText: {
    fontWeight: "800",
  },

  grid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridItem: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.soft,
  },
  gridImg: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.10)",
  },
  reelPill: {
    position: "absolute",
    left: 7,
    bottom: 7,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "rgba(181,23,158,0.92)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reelPillText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 12,
  },

  backdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.40)",
  },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    maxHeight: "85%",
    backgroundColor: RBZ.white,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.10)",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 50,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.18)",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: RBZ.ink,
  },
  sheetSub: {
    marginTop: 6,
    color: RBZ.muted,
    lineHeight: 18,
  },
  sheetLabel: {
    marginTop: 10,
    fontWeight: "900",
    color: RBZ.ink,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontWeight: "900",
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.12)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: RBZ.ink,
    backgroundColor: "rgba(248,250,252,1)",
  },
  toolsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  toolBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.10)",
    backgroundColor: "rgba(248,250,252,1)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  toolText: {
    fontSize: 11,
    fontWeight: "800",
    color: RBZ.ink,
  },
  publishBtn: {
    marginTop: 12,
    backgroundColor: RBZ.c1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  publishBtnText: {
    color: RBZ.white,
    fontWeight: "900",
  },
  noteTiny: {
    marginTop: 8,
    fontSize: 11,
    color: RBZ.muted,
    lineHeight: 15,
  },

  viewerWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
  },
  viewerTop: {
    position: "absolute",
    top: 18,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 10,
  },
  viewerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBody: {
    width: "100%",
    height: "72%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerMedia: {
    width: "100%",
    height: "100%",
  },
  viewerMeta: {
    position: "absolute",
    bottom: 20,
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  metaPill: {
    backgroundColor: RBZ.c2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  metaPillAlt: {
    backgroundColor: RBZ.c4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  metaText: {
    color: RBZ.white,
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  sheetHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

sheetCloseBtn: {
  width: 36,
  height: 36,
  borderRadius: 999,
  backgroundColor: "rgba(17,24,39,0.06)",
  justifyContent: "center",
  alignItems: "center",
},
sheetScroll: {
  paddingBottom: 16,
},
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: RBZ.ink,
  },
  emptySub: {
    fontSize: 13,
    color: RBZ.muted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 220,
  },

});
