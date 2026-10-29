/** Chat media viewer with horizontal video swiping, a centered header, and one active player. */
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useRef, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatVideoControls from "./ChatVideoControls";
import ChatVideoPager, { type ChatVideoPage } from "./ChatVideoPager";
import { chatMediaViewerStyles as styles } from "./chatMediaViewerStyles";
import { useChatVideoPlayback } from "./useChatVideoPlayback";

type Props = {
  visible: boolean;
  onClose: () => void;
  uri: string;
  localUri?: string;
  mediaType: "image" | "video";
  muted?: boolean;
  maxViews?: 1 | 2;
  allowDownload?: boolean;
  onViewed?: () => void;
  items?: ChatVideoPage[];
  index?: number;
  total?: number;
  onIndexChange?: (index: number) => void;
};
type SessionProps = Props & { controlsVisible: boolean; onToggleControls: () => void };

function ViewerSession({ uri, localUri, mediaType, muted = false, onViewed,
  controlsVisible, onToggleControls }: SessionProps) {
  const insets = useSafeAreaInsets();
  const player = useChatVideoPlayback(mediaType === "video" ? uri : "", localUri, onViewed);
  const [isMuted, setIsMuted] = useState(muted);
  const imageViewed = useRef(false);
  const video = mediaType === "video";
  return <View style={styles.screen}>
    {video ? (!player.error ? <Video key={player.key} ref={player.videoRef}
      source={player.source} style={styles.media} resizeMode={ResizeMode.CONTAIN}
      shouldPlay={player.playing} isMuted={isMuted} useNativeControls={false}
      progressUpdateIntervalMillis={250} onPlaybackStatusUpdate={player.onStatus}
      onReadyForDisplay={player.onReady} onError={player.fail} /> : null) :
      <Image source={{ uri }} style={styles.media} resizeMode="contain" onLoad={() => {
        if (!imageViewed.current) { imageViewed.current = true; onViewed?.(); }
      }} />}
    {video ? <Pressable accessibilityLabel="Show video controls" style={styles.tapSurface}
      onPress={onToggleControls} /> : null}
    {video && (controlsVisible || player.error) ? <ChatVideoControls player={player}
      muted={isMuted} onToggleMute={() => setIsMuted(value => !value)} bottomInset={insets.bottom} /> : null}
  </View>;
}

function ViewerContent(props: Props) {
  const insets = useSafeAreaInsets();
  const pages = props.mediaType === "video" ? props.items || [] : [];
  const [index, setIndex] = useState(() => Math.max(0,
    Math.min(props.index || 0, Math.max(0, (pages.length || props.total || 1) - 1))));
  const [controlsVisible, setControlsVisible] = useState(true);
  const maxViews = pages[index]?.maxViews || props.maxViews;
  const total = pages.length || props.total || 1;
  const session = { ...props, controlsVisible,
    onToggleControls: () => setControlsVisible(value => !value) };
  return <View style={styles.screen}>
    {pages.length > 0 ? <ChatVideoPager items={pages} initialIndex={index}
      scrollEnabled={!pages.some(page => !!page.maxViews)}
      onIndexChange={next => {
        setIndex(next);
        setControlsVisible(true);
        props.onIndexChange?.(next);
      }}
      renderActive={(page, pageIndex) => <ViewerSession key={`${page.id}:${pageIndex}:${page.uri}`}
        {...session} uri={page.uri} localUri={page.localUri} muted={page.muted} maxViews={page.maxViews} />} /> :
      <ViewerSession key={`${props.mediaType}:${props.uri}`} {...session} />}
    <View pointerEvents="box-none" style={[header.row, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close media viewer"
        onPress={props.onClose} style={header.close} hitSlop={8}>
        <Ionicons name="close" size={24} color="#fff" />
      </Pressable>
      {maxViews ? <View style={styles.viewBadge}>
        <Ionicons name="eye-outline" size={15} color="#fff" />
        <Text style={styles.viewBadgeText}>{maxViews === 1 ? "View once" : "View twice"}</Text>
      </View> : <>
        <View style={header.center} pointerEvents="none">
          <Text style={header.title}>{props.mediaType === "video" ? "Video" : "Photo"}</Text>
          {props.mediaType === "video" ? <Text style={header.count}
            accessibilityLabel={`Video ${index + 1} of ${total}`}>{index + 1} of {total}</Text> : null}
        </View>
        <View style={styles.headerSpacer} />
      </>}
    </View>
  </View>;
}

export default function MediaViewer(props: Props) {
  if (!props.visible) return null;
  return <Modal visible animationType="fade" transparent={false} statusBarTranslucent
    navigationBarTranslucent onRequestClose={props.onClose}>
    <ViewerContent {...props} />
  </Modal>;
}

const header = StyleSheet.create({
  row: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    paddingHorizontal: 14, paddingBottom: 8, flexDirection: "row", alignItems: "center" },
  close: { width: 44, height: 44, borderRadius: 14, alignItems: "center",
    justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" },
  center: { flex: 1, marginHorizontal: 10, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 16, fontWeight: "800" },
  count: { color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "600", marginTop: 2 },
});