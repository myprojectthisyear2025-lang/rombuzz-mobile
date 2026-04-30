/**
 * ============================================================
 *  File: FullscreenViewer.tsx
 *  Purpose: Lightweight fullscreen gallery shell/controller.
 *
 * Responsibilities:
 *   - Keeps the original GallerySection-facing component/API unchanged
 *   - Handles modal shell, header, caption, options, edit caption, visibility, and delete
 *   - Delegates photo fullscreen paging/zoom/swipe behavior to GalleryPhotoViewer
 *   - Delegates video fullscreen paging/playback/swipe behavior to GalleryVideoViewer
 *   - Mounts GalleryInsightsSheet only for insights/gifts/private comment features
 *
 * Dependencies:
 *   - GalleryPhotoViewer.tsx       → Photo fullscreen carousel, zoom, pan, swipe navigation
 *   - GalleryVideoViewer.tsx       → Video fullscreen carousel, playback, scrubber, swipe navigation
 *   - GalleryInsightsSheet.tsx     → Insights, gifts, and private comment threads
 * ============================================================
 */
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GalleryInsightsSheet from "./GalleryInsightsSheet";
import GalleryPhotoViewer from "./GalleryPhotoViewer";
import GalleryVideoViewer from "./GalleryVideoViewer";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",

  white: "#ffffff",
  bg: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  line: "#e5e7eb",
};

type Scope = "public" | "matches" | "private";

type FullscreenViewerProps = {
  item: any;
  items: any[];
  index: number;
  onChangeIndex: (i: number) => void;
  onClose: () => void;
  ownerId: string;
  apiFetch: (path: string, init?: RequestInit) => Promise<any>;
  apiJson: (path: string, method: string, body: any) => Promise<any>;
  onLocalPatch?: (updated: any) => void;
  onLocalDelete?: (deletedId: string) => void;
};

function splitCaption(caption: string) {
  const raw = String(caption || "");
  const parts = raw.split("|");
  const tags = (parts[0] || "").trim();
  const extra = (parts.slice(1).join("|") || "").trim();
  return { tags, extra };
}

function upsertTag(tags: string, key: string, value: string) {
  const arr = tags ? tags.split(/\s+/).filter(Boolean) : [];
  const filtered = arr.filter((t) => !t.startsWith(`${key}:`));
  filtered.push(`${key}:${value}`);
  return filtered.join(" ").trim();
}

function buildCaptionWithScope(oldCaption: string, scope: Scope, extraOverride?: string) {
  const { tags, extra } = splitCaption(oldCaption || "");
  const nextTags = upsertTag(tags, "scope", scope);
  const finalExtra = typeof extraOverride === "string" ? extraOverride.trim() : extra;
  return finalExtra ? `${nextTags} | ${finalExtra}` : nextTags;
}

function inferScopeFromCaption(caption: string): Scope {
  const t = String(caption || "");
  if (t.includes("scope:matches")) return "matches";
  if (t.includes("scope:private")) return "private";
  if (t.includes("scope:public")) return "public";
  return "public";
}

function isVideoItem(rowItem: any) {
  const type = String(rowItem?.type || "").toLowerCase();
  const url = String(rowItem?.url || "").toLowerCase();
  return type === "video" || type === "reel" || /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(url);
}

export default function FullscreenViewer({
  item,
  items,
  index,
  onChangeIndex,
  onClose,
  ownerId,
  apiFetch,
  apiJson,
  onLocalPatch,
  onLocalDelete,
}: FullscreenViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const SCREEN_RATIO = 9 / 16;
  const mediaHeight = height * 0.78;
  const mediaWidth = Math.min(width, height * SCREEN_RATIO);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [visOpen, setVisOpen] = useState(false);

  const safeItems = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const safeIndex = Math.max(0, Math.min(index || 0, Math.max(0, safeItems.length - 1)));
  const current = safeItems[safeIndex] || item || null;

  const captionText = useMemo(() => {
    if (!current?.caption) return "";
    const parts = String(current.caption).split("|");
    return (parts.slice(1).join("|") || "").trim();
  }, [current?.caption]);

  const mediaId = useMemo(() => String(current?.id || item?.id || ""), [current?.id, item?.id]);

  async function saveCaption(extraText: string) {
    if (!current?.id) return;

    const nextCaption = buildCaptionWithScope(
      current.caption || "",
      inferScopeFromCaption(current.caption || ""),
      extraText
    );

    onLocalPatch?.({ ...current, caption: nextCaption });
    await apiJson(`/media/${current.id}`, "PATCH", { caption: nextCaption });

    setEditOpen(false);
    setOptionsOpen(false);
  }

  async function applyVisibility(scope: Scope) {
    if (!current?.id) return;

    const nextCaption = buildCaptionWithScope(current.caption || "", scope);
    const backendPrivacy = scope === "public" ? "public" : "private";

    onLocalPatch?.({ ...current, caption: nextCaption, privacy: backendPrivacy });
    await apiJson(`/media/${current.id}`, "PATCH", { caption: nextCaption, privacy: backendPrivacy });

    setVisOpen(false);
    setOptionsOpen(false);
  }

  async function deleteCurrent() {
    if (!current?.id) return;

    onLocalDelete?.(String(current.id));
    await apiJson(`/media/${current.id}`, "DELETE", {});

    setOptionsOpen(false);

    if ((safeItems?.length || 0) <= 1) {
      onClose();
      return;
    }

    const nextIndex = Math.max(0, Math.min(safeIndex, safeItems.length - 2));
    onChangeIndex(nextIndex);
  }

  const mediaViewerProps = {
    items: safeItems,
    index: safeIndex,
    activeIndex: safeIndex,
    onChangeIndex,
    onClose,
    mediaWidth,
    mediaHeight,
    screenWidth: width,
    screenHeight: height,
    insets,
  };

  return (
    <Modal transparent={false} animationType="fade" visible={!!item} onRequestClose={onClose}>
      {!item ? null : (
        <View style={styles.wrap}>
          <StatusBar hidden />

          <View style={[styles.headerBar, { paddingTop: insets.top + 6 }]}>
            <Pressable onPress={onClose} style={styles.headerBtn}>
              <Ionicons name="close" size={22} color={RBZ.ink} />
            </Pressable>

            <Pressable onPress={() => setOptionsOpen(true)} style={styles.headerBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={RBZ.ink} />
            </Pressable>
          </View>

          {isVideoItem(current) ? (
            <GalleryVideoViewer {...mediaViewerProps} />
          ) : (
            <GalleryPhotoViewer {...mediaViewerProps} />
          )}

          {captionText ? (
            <View style={[styles.captionWrap, { bottom: insets.bottom + 40 }]}>
              <Text style={styles.captionText} numberOfLines={3}>
                {captionText}
              </Text>
            </View>
          ) : null}

          <GalleryInsightsSheet
            ownerId={ownerId}
            mediaId={mediaId}
            apiFetch={apiFetch}
            apiJson={apiJson}
            bottomInset={insets.bottom}
          />

          <Modal visible={optionsOpen} transparent animationType="slide" onRequestClose={() => setOptionsOpen(false)}>
            <Pressable style={styles.backdrop} onPress={() => setOptionsOpen(false)} />

            <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>    Options</Text>

              <Pressable
                style={styles.optionRow}
                onPress={() => {
                  const { extra } = splitCaption(String(current?.caption || ""));
                  setEditDraft(extra);
                  setEditOpen(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color={RBZ.c3} />
                <Text style={styles.optionText}>Edit caption</Text>
              </Pressable>

              <Pressable style={styles.optionRow} onPress={() => setVisOpen(true)}>
                <Ionicons name="eye-outline" size={18} color={RBZ.c3} />
                <Text style={styles.optionText}>Change visibility</Text>
              </Pressable>

              <Pressable
                style={styles.optionRow}
                onPress={() => {
                  setOptionsOpen(false);
                  Alert.alert("Delete media?", "This action cannot be undone.", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        deleteCurrent().catch(() => {});
                      },
                    },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={RBZ.c3} />
                <Text style={[styles.optionText, { color: RBZ.c3 }]}>Delete media</Text>
              </Pressable>
            </View>
          </Modal>
        </View>
      )}

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>     Edit caption</Text>

          <TextInput
            value={editDraft}
            onChangeText={setEditDraft}
            placeholder="Write a short vibe…"
            placeholderTextColor="rgba(17,24,39,0.45)"
            style={[
              styles.input,
              {
                marginTop: 12,
                backgroundColor: "rgba(248,250,252,1)",
                borderColor: "rgba(17,24,39,0.12)",
                color: RBZ.ink,
              },
            ]}
            multiline
          />

          <Pressable
            onPress={() => {
              saveCaption(editDraft).catch(() => {});
            }}
            style={[
              styles.optionRow,
              { marginTop: 12, justifyContent: "center", backgroundColor: RBZ.c1, borderRadius: 14 },
            ]}
          >
            <Text style={{ color: RBZ.white, fontWeight: "900" }}>Save</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={visOpen} transparent animationType="slide" onRequestClose={() => setVisOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>      Visibility</Text>

          <Pressable style={styles.optionRow} onPress={() => applyVisibility("public").catch(() => {})}>
            <Ionicons name="globe-outline" size={18} color={RBZ.c2} />
            <Text style={styles.optionText}>Public</Text>
          </Pressable>

          <Pressable style={styles.optionRow} onPress={() => applyVisibility("matches").catch(() => {})}>
            <Ionicons name="people-outline" size={18} color={RBZ.c4} />
            <Text style={styles.optionText}>Matched-only</Text>
          </Pressable>

          <Pressable style={styles.optionRow} onPress={() => applyVisibility("private").catch(() => {})}>
            <Ionicons name="lock-closed-outline" size={18} color={RBZ.ink} />
            <Text style={styles.optionText}>Private</Text>
          </Pressable>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#000000",
  },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: RBZ.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: RBZ.line,
    maxHeight: "82%",
  },

  handle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: RBZ.line,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  sheetTitle: {
    color: RBZ.ink,
    fontSize: 16,
    fontWeight: "900",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: RBZ.line,
  },

  optionText: {
    color: RBZ.ink,
    fontWeight: "800",
    fontSize: 15,
  },

  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    fontWeight: "700",
  },

  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 100,
  },

  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: RBZ.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  captionWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 20,
  },

  captionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
});
