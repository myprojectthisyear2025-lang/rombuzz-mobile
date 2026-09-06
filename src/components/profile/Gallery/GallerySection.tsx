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
import ProfileGalleryContent from "@/src/features/profile/gallery/ProfileGalleryContent";
import type { ProfileGalleryMediaItem } from "@/src/features/profile/gallery/profileGalleryTypes";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import FullscreenViewer from "./FullscreenViewer";
import { pickMedia } from "./MediaUploader";
import ProfileUploadPreview from "./ProfileUploadPreview";

import {
  Alert,
  View,
} from "react-native";

type MediaItem = ProfileGalleryMediaItem;

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
  <View>
    <ProfileGalleryContent
      active={segment}
      photos={photos}
      reels={reels}
      onChange={setSegment}
      onAddPhoto={() =>
        openPicker("photo")
      }
      onAddReel={() =>
        openPicker("reel")
      }
      onOpen={openViewer}
    />

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
