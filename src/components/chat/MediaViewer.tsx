/**
 * ============================================================
 * 📁 File: src/components/chat/MediaViewer.tsx
 * 🎯 Purpose: Fullscreen media viewer for chat (image/video)
 *
 * Used by:
 *  - app/chat/[peerId].tsx
 *
 * Features:
 *  - Tap close button
 *  - Shows View-once / View-twice badge
 *  - Download enabled ONLY for keep-mode
 *    (uses share sheet so it works in Expo Go)
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, Text, View } from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
};

type Props = {
  visible: boolean;
  onClose: () => void;

  uri: string;
  mediaType: "image" | "video";
  muted?: boolean;

  // undefined => keep mode
  maxViews?: 1 | 2;

  // hide/disable download when maxViews exists
  allowDownload: boolean;

  // called once when viewer opens (used to increment view count)
  onViewed?: () => void;
};

export default function MediaViewer({
  visible,
  onClose,
  uri,
  mediaType,
  muted = false,
  maxViews,
  allowDownload,
  onViewed,
}: Props) {
  const [busy, setBusy] = useState(false);

  const badgeText = useMemo(() => {
    if (!maxViews) return null;
    return maxViews === 1 ? "View once" : "View twice";
  }, [maxViews]);

  // fire onViewed once per open
  const [didView, setDidView] = useState(false);
  React.useEffect(() => {
    if (!visible) {
      setDidView(false);
      return;
    }
    if (!didView) {
      setDidView(true);
      onViewed?.();
    }
  }, [visible, didView, onViewed]);

  const download = async () => {
    try {
      setBusy(true);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Download", "Sharing is not available on this device.");
        return;
      }

      const ext = mediaType === "video" ? "mp4" : "jpg";
const baseDir =
  (FileSystem as any).documentDirectory ||
  (FileSystem as any).cacheDirectory ||
  "";

const localPath = `${baseDir}rbz_${Date.now()}.${ext}`;

      const res = await FileSystem.downloadAsync(uri, localPath);
      await Sharing.shareAsync(res.uri);
    } catch (e: any) {
      Alert.alert("Download failed", e?.message || "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {/* top bar */}
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 54 : 24,
            left: 14,
            right: 14,
            zIndex: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.16)",
            }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {badgeText ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 10,
                  height: 34,
                  borderRadius: 16,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.16)",
                }}
              >
                <Ionicons name="eye" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>{badgeText}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                if (!allowDownload) return;
                download();
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: allowDownload ? RBZ.c4 : "rgba(255,255,255,0.10)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
                opacity: allowDownload ? 1 : 0.55,
              }}
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name={allowDownload ? "download" : "lock-closed"} size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>

        {/* media */}
        {mediaType === "video" ? (
          <Video
            source={{ uri }}
            style={{ flex: 1 }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isMuted={muted}
            useNativeControls
          />
        ) : (
          <Image source={{ uri }} style={{ flex: 1 }} resizeMode="contain" />
        )}
      </View>
    </Modal>
  );
}
