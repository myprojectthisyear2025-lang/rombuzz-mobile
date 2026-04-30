/**
 * ============================================================
 * 📁 File: src/components/media/RBZImageViewer.tsx
 * 🎯 Purpose: Universal fullscreen image viewer for RomBuzz
 *
 * Used by:
 *  - app/(tabs)/view-profile.tsx
 *  - app/(tabs)/profile.tsx
 *  - app/(tabs)/discover-profile.tsx
 *  - app/chat/[peerId].tsx
 *  - LetsBuzz / gallery / any fullscreen image flow
 *
 * Features:
 *  - Tap photo opens fullscreen
 *  - Smooth horizontal swipe between photos
 *  - Pinch to zoom in / out
 *  - Double tap to zoom in / out
 *  - Swipe down to close
 *  - Reusable shared image viewer for the whole app
 *
 * Notes:
 *  - Image-only for now
 *  - Video viewer should be added later as part of the same shared media system
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ImageView from "react-native-image-viewing";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type RBZImageViewerItem = {
  id: string | number;
  url: string;
  title?: string;
  [key: string]: any;
};

type RBZImageViewerProps = {
  visible: boolean;
  items: RBZImageViewerItem[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  FooterComponent?: (args: { imageIndex: number; item?: RBZImageViewerItem }) => React.ReactNode;
};

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

export default function RBZImageViewer({
  visible,
  items,
  initialIndex = 0,
  title,
  onClose,
  onIndexChange,
  FooterComponent,
}: RBZImageViewerProps) {
  const insets = useSafeAreaInsets();
  const didOpenRef = useRef(false);

  const normalizedItems = useMemo(() => {
    const seen = new Set<string>();

    return items.filter((item) => {
      const url = String(item?.url || "").trim();
      if (!url) return false;
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [items]);

  const safeInitialIndex = useMemo(() => {
    if (!normalizedItems.length) return 0;

    const originalSafeIndex = clampIndex(initialIndex, items.length);
    const originalTarget = items[originalSafeIndex];
    const targetUrl = String(originalTarget?.url || "").trim();

    if (!targetUrl) return 0;

    const normalizedIndex = normalizedItems.findIndex(
      (item) => String(item?.url || "").trim() === targetUrl
    );

    return normalizedIndex >= 0 ? normalizedIndex : 0;
  }, [initialIndex, items, normalizedItems]);

  /**
   * IMPORTANT:
   * Keep imageIndex stable while the viewer is open.
   * Re-controlling imageIndex on every swipe causes a visible flash / background peek.
   */
  const [openIndex, setOpenIndex] = useState(safeInitialIndex);
  const [headerIndex, setHeaderIndex] = useState(safeInitialIndex);

  useEffect(() => {
    if (visible && !didOpenRef.current) {
      didOpenRef.current = true;
      setOpenIndex(safeInitialIndex);
      setHeaderIndex(safeInitialIndex);
      return;
    }

    if (!visible && didOpenRef.current) {
      didOpenRef.current = false;
    }
  }, [visible, safeInitialIndex]);

  const images = useMemo(
    () =>
      normalizedItems.map((item) => ({
        uri: item?.url || "",
      })),
    [normalizedItems]
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleIndexChange = useCallback(
    (nextIndex: number) => {
      const safeNext = clampIndex(nextIndex, normalizedItems.length);
      setHeaderIndex(safeNext);
      onIndexChange?.(safeNext);
    },
    [normalizedItems.length, onIndexChange]
  );

  const Header = useCallback(
    ({ imageIndex }: { imageIndex: number }) => {
      const safeIndex = clampIndex(
        Number.isFinite(imageIndex) ? imageIndex : headerIndex,
        normalizedItems.length
      );
      const activeItem = normalizedItems[safeIndex];
      const resolvedTitle = title || activeItem?.title || "Photo";

      return (
        <View
          pointerEvents="box-none"
          style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>

            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {resolvedTitle}
              </Text>
              <Text style={styles.subtitle}>
                {normalizedItems.length > 0 ? safeIndex + 1 : 0} of{" "}
                {normalizedItems.length}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </View>
      );
    },
    [handleClose, headerIndex, insets.top, normalizedItems, title]
  );

  const Footer = useCallback(
    ({ imageIndex }: { imageIndex: number }) => {
      if (!FooterComponent) return null;

      const safeIndex = clampIndex(
        Number.isFinite(imageIndex) ? imageIndex : headerIndex,
        normalizedItems.length
      );
      const activeItem = normalizedItems[safeIndex];

      return (
        <View
          pointerEvents="box-none"
          style={[styles.footerOverlay, { paddingBottom: insets.bottom + 18 }]}
        >
          {FooterComponent({ imageIndex: safeIndex, item: activeItem })}
        </View>
      );
    },
    [FooterComponent, headerIndex, insets.bottom, normalizedItems]
  );

  if (!normalizedItems.length) return null;

  return (
    <ImageView
      images={images}
      imageIndex={openIndex}
      visible={visible}
      onRequestClose={handleClose}
      onImageIndexChange={handleIndexChange}
      animationType="fade"
      presentationStyle="fullScreen"
      backgroundColor="#000000"
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      HeaderComponent={Header}
      FooterComponent={Footer}
    />
  );
}

const styles = StyleSheet.create({
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  headerRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  footerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    paddingHorizontal: 16,
  },
});