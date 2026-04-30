/**
 * ============================================================
 *  File: GalleryPhotoViewer.tsx
 *  Purpose: Fullscreen photo viewer used by the gallery modal.
 * ============================================================
 */
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

type GalleryPhotoViewerProps = {
  items: any[];
  index: number;
  activeIndex: number;
  onChangeIndex: (i: number) => void;
  onClose: () => void;
  mediaWidth: number;
  mediaHeight: number;
  screenWidth: number;
  screenHeight: number;
  insets: EdgeInsets;
};

function isVideoItem(item: any) {
  const type = String(item?.type || "").toLowerCase();
  const url = String(item?.url || "").toLowerCase();
  return type === "video" || type === "reel" || /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(url);
}

function PhotoZoomItem({
  item,
  isActive,
  mediaWidth,
  mediaHeight,
  screenWidth,
  screenHeight,
  onZoomChange,
}: {
  item: any;
  isActive: boolean;
  mediaWidth: number;
  mediaHeight: number;
  screenWidth: number;
  screenHeight: number;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const lastTapRef = useRef(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedX.value = 0;
      savedY.value = 0;
      lastTapRef.current = 0;
      onZoomChange(false);
    }
  }, [isActive, onZoomChange, savedScale, savedX, savedY, scale, translateX, translateY]);

  function resetZoom() {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedX.value = 0;
    savedY.value = 0;
    onZoomChange(false);
  }

  function handlePhotoPress() {
    if (!isActive) return;

    const now = Date.now();
    const diff = now - lastTapRef.current;

    if (diff < 280) {
      if (scale.value > 1.05) {
        resetZoom();
      } else {
        scale.value = withSpring(2.35);
        savedScale.value = 2.35;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedX.value = 0;
        savedY.value = 0;
        onZoomChange(true);
      }

      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
  }

  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .onUpdate((e) => {
        if (!isActive) return;
        scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 4));
      })
      .onEnd(() => {
        if (scale.value <= 1.02) {
          scale.value = withSpring(1);
          savedScale.value = 1;
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          savedX.value = 0;
          savedY.value = 0;
          runOnJS(onZoomChange)(false);
          return;
        }

        savedScale.value = scale.value;
        runOnJS(onZoomChange)(true);
      });
  }, [isActive, onZoomChange, savedScale, savedX, savedY, scale, translateX, translateY]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(2)
      .onUpdate((e) => {
        if (!isActive) return;
        if (scale.value <= 1.02) return;

        const scaledWidth = mediaWidth * scale.value;
        const scaledHeight = mediaHeight * scale.value;

        const maxX = Math.max(0, (scaledWidth - screenWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - screenHeight) / 2);

        translateX.value = Math.max(-maxX, Math.min(maxX, savedX.value + e.translationX));
        translateY.value = Math.max(-maxY, Math.min(maxY, savedY.value + e.translationY));
      })
      .onEnd(() => {
        if (scale.value <= 1.02) return;

        savedX.value = translateX.value;
        savedY.value = translateY.value;
      });
  }, [
    isActive,
    mediaHeight,
    mediaWidth,
    savedX,
    savedY,
    scale,
    screenHeight,
    screenWidth,
    translateX,
    translateY,
  ]);

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Pressable
      onPress={handlePhotoPress}
      style={[styles.photoTouchArea, { width: screenWidth, height: screenHeight }]}
    >
      <GestureDetector gesture={composedGesture}>
        <Animated.Image
          source={{ uri: item?.url }}
          style={[styles.media, { width: mediaWidth, height: mediaHeight }, animatedImageStyle]}
          resizeMode="contain"
        />
      </GestureDetector>
    </Pressable>
  );
}

function PassiveVideoItem({
  item,
  mediaWidth,
  mediaHeight,
}: {
  item: any;
  mediaWidth: number;
  mediaHeight: number;
}) {
  return (
    <Video
      source={{ uri: item?.url }}
      style={[styles.media, { width: mediaWidth, height: mediaHeight }]}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay={false}
      isLooping={false}
      useNativeControls={false}
    />
  );
}

export default function GalleryPhotoViewer({
  items,
  index,
  activeIndex,
  onChangeIndex,
  mediaWidth,
  mediaHeight,
  screenWidth,
  screenHeight,
  insets,
}: GalleryPhotoViewerProps) {
  const listRef = useRef<Animated.FlatList<any>>(null);
  const [photoZoomed, setPhotoZoomed] = useState(false);

  useEffect(() => {
    if (!screenWidth) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: index * screenWidth,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [index, screenWidth]);

  return (
    <Animated.FlatList
      ref={listRef}
      data={items}
      extraData={activeIndex}
      horizontal
      pagingEnabled
      scrollEnabled={!photoZoomed}
      snapToInterval={screenWidth}
      decelerationRate="fast"
      keyExtractor={(rowItem, rowIndex) => String(rowItem?.id || rowItem?.url || rowIndex)}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      getItemLayout={(_, rowIndex) => ({
        length: screenWidth,
        offset: screenWidth * rowIndex,
        index: rowIndex,
      })}
      onMomentumScrollEnd={(e) => {
        const nextIndex = Math.max(
          0,
          Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.x / screenWidth))
        );
        if (nextIndex !== activeIndex) onChangeIndex(nextIndex);
      }}
      renderItem={({ item: rowItem, index: rowIndex }) => {
        const isActive = rowIndex === activeIndex;

        return (
          <View
            style={[
              styles.page,
              {
                width: screenWidth,
                height: screenHeight,
                paddingTop: 16 + insets.top,
              },
            ]}
          >
            {isVideoItem(rowItem) ? (
              <PassiveVideoItem item={rowItem} mediaWidth={mediaWidth} mediaHeight={mediaHeight} />
            ) : (
              <PhotoZoomItem
                item={rowItem}
                isActive={isActive}
                mediaWidth={mediaWidth}
                mediaHeight={mediaHeight}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
                onZoomChange={setPhotoZoomed}
              />
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  photoTouchArea: {
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    alignSelf: "center",
  },
});