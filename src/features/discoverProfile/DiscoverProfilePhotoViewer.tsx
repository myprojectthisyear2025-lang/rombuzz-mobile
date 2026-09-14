/**
 * Path: src/features/discoverProfile/DiscoverProfilePhotoViewer.tsx
 * Purpose: Discover-only fullscreen viewer with looping photos, dots, zoom, and swipe-down close.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ImageView from "react-native-image-viewing";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOOP_CYCLES = 101;
const MIDDLE_CYCLE = Math.floor(LOOP_CYCLES / 2);

export default function DiscoverProfilePhotoViewer({
  visible,
  photos,
  initialIndex,
  title,
  onClose,
  onIndexChange,
}: {
  visible: boolean;
  photos: string[];
  initialIndex: number;
  title: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const didOpenRef = useRef(false);

  const safeInitial = Math.max(
    0,
    Math.min(initialIndex, Math.max(photos.length - 1, 0))
  );

  const [openIndex, setOpenIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(safeInitial);

  const images = useMemo(() => {
    if (photos.length <= 1) {
      return photos.map((uri) => ({ uri }));
    }

    return Array.from({ length: LOOP_CYCLES }, () => photos)
      .flat()
      .map((uri) => ({ uri }));
  }, [photos]);

  useEffect(() => {
    if (visible && !didOpenRef.current) {
      didOpenRef.current = true;
      setActiveIndex(safeInitial);

      setOpenIndex(
        photos.length > 1
          ? MIDDLE_CYCLE * photos.length + safeInitial
          : safeInitial
      );

      return;
    }

    if (!visible) {
      didOpenRef.current = false;
    }
  }, [photos.length, safeInitial, visible]);

  const handleIndexChange = useCallback(
    (physicalIndex: number) => {
      if (!photos.length) return;

      const logicalIndex =
        ((physicalIndex % photos.length) + photos.length) %
        photos.length;

      setActiveIndex(logicalIndex);
      onIndexChange(logicalIndex);
    },
    [onIndexChange, photos.length]
  );

  const Header = useCallback(
    () => (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>
    ),
    [insets.top, onClose, title]
  );

  const Footer = useCallback(
    () => (
      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.dots}>
          {photos.map((_, index) => (
            <View
              key={`discover-dot-${index}`}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>
    ),
    [activeIndex, insets.bottom, photos]
  );

  if (!photos.length) return null;

  return (
    <ImageView
      images={images}
      imageIndex={openIndex}
      visible={visible}
      onRequestClose={onClose}
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
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  title: {
    flex: 1,
    marginHorizontal: 10,
    textAlign: "center",
    color: "#fff",
    fontFamily: RBZFont.bold,
    fontSize: 15,
  },

  headerSpacer: {
    width: 44,
    height: 44,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    alignItems: "center",
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(12,12,14,0.48)",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.38)",
  },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F52E64",
  },
});