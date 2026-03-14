/**
 * ============================================================================
 * 📁 File: src/components/profile/Gallery/GallerySection.tsx
 * 🎯 Purpose: Profile → Gallery tab (Photos + Reels, upload, publish scope, fullscreen)
 *
 * Backend (NO backend changes):
 *  - POST  /upload-media         → save media item into user.media[]
 *  - PATCH /media/:id/privacy    → set public/private (we map matches-only/private via caption tags)
 *
 * Caption Tags (stored inside `caption` so no backend changes):
 *  - kind:photo | kind:reel
 *  - scope:public | scope:matches | scope:private
 *  - intent:discover | intent:viewprofile | intent:letsbuzz | intent:firstimpression
 *
 * Example caption:
 *  "kind:photo scope:matches intent:letsbuzz"
 * ============================================================================
 */

import { uploadToCloudinaryUnsigned } from "@/src/config/uploadMedia";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import GalleryTabs from "./GalleryTabs";

import React, { useEffect, useMemo, useState } from "react";
import FullscreenViewer from "./FullscreenViewer";
import { pickMedia } from "./MediaUploader";
import PhotoGrid from "./PhotoGrid";
import ReelGrid from "./ReelGrid";

import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
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
  privacy?: "public" | "private";
  createdAt?: number;
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

function MediaPreview({
  uri,
  isVideo,
}: {
  uri: string;
  isVideo: boolean;
}) {
  return (
    <View
      style={{
        width: "100%",
        height: 220,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#000",
        marginBottom: 12,
      }}
    >
      {isVideo ? (
        <Video
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          isMuted
        />
      ) : (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}



export default function GallerySection({
  ownerId,
  media,
  uploading,
  setUploading,
  apiFetch,
  apiJson,
  onRefresh,
}: {
  ownerId: string;
  media: MediaItem[];
  uploading: boolean;
  setUploading: (v: boolean) => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<any>;
  apiJson: (path: string, method: string, body: any) => Promise<any>;
  onRefresh: () => Promise<void> | void;
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
  () => localMedia.filter((m) => inferKind(m) === "photo"),
  [localMedia]
);

const reels = useMemo(
  () => localMedia.filter((m) => inferKind(m) === "reel"),
  [localMedia]
);


  const list = segment === "photos" ? photos : reels;

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

    // 1️⃣ Upload to Cloudinary (shared helper)
    const cloudUrl = await uploadToCloudinaryUnsigned(
      pickedAsset.uri,
      pickedAsset.isVideo ? "video" : "image"
    );

    // 2️⃣ Build caption with tags
    const caption = buildCaption(kind, scope, intent, captionText);

    // 3️⃣ Save metadata to backend
    const saved = await apiJson("/upload-media", "POST", {
      fileUrl: cloudUrl,
      type: pickedAsset.isVideo ? "video" : "image",
      caption,
    });
    console.log("UPLOAD RESPONSE:", JSON.stringify(saved, null, 2));


    // 4️⃣ Map scope → backend privacy
    const backendPrivacy = scope === "public" ? "public" : "private";

    const newest =
      Array.isArray(saved?.media) && saved.media.length > 0
        ? saved.media[0]
        : null;

    if (newest?.id) {
      await apiJson(`/media/${newest.id}/privacy`, "PATCH", {
        privacy: backendPrivacy,
      });
    }

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

      {/* Publish sheet (immediately after pick) */}
      <Modal visible={publishOpen} transparent animationType="fade" onRequestClose={() => setPublishOpen(false)}>
<Pressable
  style={styles.backdrop}
  onPress={() => setPublishOpen(false)}
  pointerEvents="box-none"
/>
<View style={styles.sheet}>
  <View style={styles.sheetHandle} />

  {/* Header row */}
  <View style={styles.sheetHeader}>
    <Text style={styles.sheetTitle}>Publish settings</Text>

    <Pressable onPress={closePublish} style={styles.sheetCloseBtn}>
      <Ionicons name="close" size={20} color={RBZ.ink} />
    </Pressable>
  </View>

  {/* 🔽 SCROLLABLE CONTENT */}
 <ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.sheetScroll}
  keyboardShouldPersistTaps="handled"
  bounces
>

    <Text style={styles.sheetSub}>
      This decides where the upload appears across Discover / ViewProfile / LetsBuzz.
    </Text>

{pickedAsset && (
  <MediaPreview
    uri={pickedAsset.uri}
    isVideo={pickedAsset.isVideo}
  />
)}



    {/* Who can see this */}
    <Text style={styles.sheetLabel}>Who can see this?</Text>
    <View style={styles.choiceRow}>
      <ChoiceChip label="Public" active={scope === "public"} onPress={() => setScope("public")} tone="c2" />
      <ChoiceChip label="Matched-only" active={scope === "matches"} onPress={() => setScope("matches")} tone="c4" />
      <ChoiceChip label="Private" active={scope === "private"} onPress={() => setScope("private")} tone="ink" />
    </View>

    {/* Intent */}
    <Text style={[styles.sheetLabel, { marginTop: 12 }]}>Intent</Text>
    <View style={styles.choiceRow}>
      <ChoiceChip label="Discover" active={intent === "discover"} onPress={() => setIntent("discover")} tone="c2" />
      <ChoiceChip label="ViewProfile" active={intent === "viewprofile"} onPress={() => setIntent("viewprofile")} tone="c3" />
    </View>
    <View style={[styles.choiceRow, { marginTop: 8 }]}>
      <ChoiceChip label="LetsBuzz" active={intent === "letsbuzz"} onPress={() => setIntent("letsbuzz")} tone="c4" />
      <ChoiceChip label="First Impression" active={intent === "firstimpression"} onPress={() => setIntent("firstimpression")} tone="ink" />
    </View>

    {/* Caption */}
    <Text style={[styles.sheetLabel, { marginTop: 12 }]}>Caption (optional)</Text>
    <TextInput
      value={captionText}
      onChangeText={setCaptionText}
      placeholder="Add a short vibe…"
      placeholderTextColor="rgba(17,24,39,0.35)"
      style={styles.input}
    />

    {/* Tools */}
    <View style={styles.toolsRow}>
      <ToolBtn icon="crop-outline" label="Crop" />
      <ToolBtn icon="color-filter-outline" label="Filters" />
      <ToolBtn icon="text-outline" label="Text" />
      <ToolBtn icon="sparkles-outline" label="Edit" />
    </View>

    <Text style={styles.noteTiny}>
      Editor tools above are the UI shell. Next step: we wire Crop/Text/Filters into a dedicated RBZ Editor screen.
    </Text>
  </ScrollView>

  {/* 🔒 FIXED FOOTER BUTTON */}
  <Pressable onPress={savePicked} style={styles.publishBtn} disabled={uploading}>
    <Text style={styles.publishBtnText}>
      {uploading ? "Uploading…" : "Publish"}
    </Text>
    <Ionicons name="arrow-forward" size={16} color={RBZ.white} />
  </Pressable>
</View>
 </Modal>

    <FullscreenViewer
  item={viewerOpen ? list[activeIndex] : null}
  items={list}
  index={activeIndex}
  onChangeIndex={setActiveIndex}
  onClose={closeViewer}
  ownerId={ownerId}
  apiFetch={apiFetch}
  apiJson={apiJson}

  // ✅ instant UI updates
  onLocalPatch={(updated: MediaItem) => {
    setLocalMedia((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  }}
  onLocalDelete={(deletedId: string) => {
    setLocalMedia((prev) => prev.filter((m) => m.id !== deletedId));
  }}
/>

  </View>
  );
}

function ToolBtn({ icon, label }: { icon: any; label: string }) {
  return (
    <Pressable style={styles.toolBtn}>
      <Ionicons name={icon} size={18} color={RBZ.ink} />
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
  tone,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone: keyof typeof RBZ;
}) {
  const border =
    tone === "ink" ? "rgba(17,24,39,0.25)" : tone === "c2" ? "rgba(216,52,95,0.35)" : "rgba(181,23,158,0.35)";
  const bg =
    active
      ? tone === "ink"
        ? "rgba(17,24,39,0.92)"
        : tone === "c2"
        ? RBZ.c2
        : RBZ.c4
      : "rgba(255,255,255,0.65)";

  const color = active ? RBZ.white : (tone === "ink" ? RBZ.ink : RBZ[tone]);

  return (
    <Pressable onPress={onPress} style={[styles.chip, { borderColor: border, backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </Pressable>
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
