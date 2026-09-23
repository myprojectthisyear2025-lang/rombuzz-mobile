import { diagnosticVideo } from "@/src/performance/diagnostics/media";
import { diagnosticImage } from "@/src/performance/diagnostics/media";
import { ResizeMode } from "expo-av";
import React from "react";
import { Pressable } from "react-native";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { useChatWindow } from "../ChatWindowContext";
import { getMediaKey } from "../hooks/chatMediaUtils";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import type { ChatMessagePresentation } from "./chatMessagePresentation";
import {
  ChatHeartBurst,
  ChatProtectedMediaOverlay,
  ChatVideoPlayBadge,
} from "./ChatMediaEffects";

const PerfVideo = diagnosticVideo("chat-video");
const PerfImage = diagnosticImage("chat-media");


export default function ChatMediaBubble({
  item,
  model,
}: {
  item: Msg;
  model: ChatMessagePresentation;
}) {
  const {
    isExpired,
    getMaxViews,
    getChatVideoUri,
    openImageViewer,
    openVideoViewer,
    handleMessageTap,
    openSheet,
  } = useChatWindow();
  const { styles } = useChatWindowStyles();
  const { m, isMine } = model;
  if (isExpired(m)) return null;
  const maxViews = getMaxViews(m);
  const isVideo = m.mediaType === "video";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        maxViews
          ? `Open view ${maxViews === 1 ? "once" : "twice"} media`
          : `Open ${isVideo ? "video" : "photo"}`
      }
      onPress={() =>
        handleMessageTap(item, m, {
          singleTapAction: () =>
            isVideo ? openVideoViewer(m) : openImageViewer(m),
          enableDoubleTapLove: true,
        })
      }
      onLongPress={() => openSheet(item)}
      style={[styles.mediaWrap, isMine ? styles.mediaMine : styles.mediaPeer]}
    >
      {isVideo ? (
        <PerfVideo
          source={{ uri: getChatVideoUri(m) }}
          style={[
            styles.mediaThumb,
            maxViews ? styles.mediaProtectedThumb : null,
          ]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted={!!m.muted}
        />
      ) : (
        <PerfImage
          source={{ uri: m.url }}
          style={[
            styles.mediaThumb,
            maxViews ? styles.mediaProtectedThumb : null,
          ]}
          resizeMode="cover"
          blurRadius={maxViews ? 48 : 0}
        />
      )}
      {isVideo && !maxViews ? <ChatVideoPlayBadge /> : null}
      {maxViews ? <ChatProtectedMediaOverlay maxViews={maxViews} /> : null}
      <ChatHeartBurst messageKey={getMediaKey(m)} />
    </Pressable>
  );
}
