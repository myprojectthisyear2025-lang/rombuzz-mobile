/** Native horizontal video paging; adjacent pages show thumbnails without loading players. */
import React, { useRef, useState } from "react";
import { FlatList, Image, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

export type ChatVideoPage = {
  id: string;
  uri: string;
  localUri?: string;
  thumbnailUrl?: string;
  muted?: boolean;
  maxViews?: 1 | 2;
};
type Props = {
  items: ChatVideoPage[];
  initialIndex: number;
  scrollEnabled?: boolean;
  onIndexChange: (index: number) => void;
  renderActive: (item: ChatVideoPage, index: number) => React.ReactNode;
};

export default function ChatVideoPager({ items, initialIndex, scrollEnabled = true,
  onIndexChange, renderActive }: Props) {
  const clamp = (index: number) => Math.max(0, Math.min(items.length - 1, index));
  const [activeIndex, setActiveIndex] = useState(() => clamp(initialIndex));
  const [size, setSize] = useState({ width: 0, height: 0 });
  const listRef = useRef<FlatList<ChatVideoPage>>(null);
  const currentIndex = useRef(activeIndex);
  const interacting = useRef(false);
  const layout = useRef({ width: 0, height: 0, initialIndex: activeIndex });
  if (layout.current.width !== size.width || layout.current.height !== size.height) {
    layout.current = { ...size, initialIndex: currentIndex.current };
    interacting.current = false;
  }
  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!size.width || !interacting.current) return;
    const next = clamp(Math.round(event.nativeEvent.contentOffset.x / size.width));
    if (next === currentIndex.current) return;
    currentIndex.current = next;
    setActiveIndex(next);
    onIndexChange(next);
  };
  const move = (offset: number) => {
    interacting.current = true;
    listRef.current?.scrollToIndex({ index: clamp(currentIndex.current + offset), animated: true });
  };

  return <View style={{ flex: 1 }} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    setSize(previous => previous.width === width && previous.height === height
      ? previous : { width, height });
  }}>
    {size.width > 0 && size.height > 0 ? <FlatList
      key={`${size.width}:${size.height}`} ref={listRef}
      data={items} extraData={activeIndex}
      keyExtractor={(item, index) => `${item.id}:${index}`}
      horizontal pagingEnabled bounces={false}
      scrollEnabled={scrollEnabled && items.length > 1}
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={layout.current.initialIndex}
      initialNumToRender={1} windowSize={3} maxToRenderPerBatch={3}
      removeClippedSubviews={false} style={{ flex: 1 }}
      getItemLayout={(_, index) => ({ length: size.width, offset: size.width * index, index })}
      onScrollBeginDrag={() => { interacting.current = true; }}
      onMomentumScrollEnd={event => { settle(event); interacting.current = false; }}
      scrollEventThrottle={32}
      onScroll={event => {
        const x = event.nativeEvent.contentOffset.x;
        if (Math.abs(x - Math.round(x / size.width) * size.width) < 1) settle(event);
      }}
      accessibilityLabel="Video gallery. Swipe left or right to change video."
      accessibilityActions={[{ name: "increment", label: "Next video" }, { name: "decrement", label: "Previous video" }]}
      onAccessibilityAction={event => {
        if (!scrollEnabled) return;
        if (event.nativeEvent.actionName === "increment") move(1);
        if (event.nativeEvent.actionName === "decrement") move(-1);
      }}
      renderItem={({ item, index }) => {
        const thumbnail = item.thumbnailUrl || "";
        const image = /^https?:\/\//i.test(thumbnail) && !/\.(mp4|mov|m4v|webm|m3u8|mpd)(?:[?#]|$)/i.test(thumbnail);
        return <View style={{ width: size.width, height: size.height, backgroundColor: "#050507" }}>
          {index === activeIndex ? renderActive(item, index) : image ?
            <Image source={{ uri: thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="contain" /> : null}
        </View>;
      }}
    /> : null}
  </View>;
}