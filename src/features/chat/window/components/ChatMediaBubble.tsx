/**
 * 📁 File: src/features/chat/window/components/ChatMediaBubble.tsx
 * 🎯 Purpose: Raised 3D chat photo/video frames that preserve media proportions.
 * Used by: Chat message rendering in the mobile chat window.
 * Layout: Fits media proportionally inside the existing maximum bubble frame.
 */
import ChatVideoPoster from "@/src/components/chat/ChatVideoPoster";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { diagnosticImage } from "@/src/performance/diagnostics/media";
import React, { useState } from "react";
import { useChatWindow } from "../ChatWindowContext";
import { getMediaKey } from "../hooks/chatMediaUtils";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import ChatBubbleSurface from "./ChatBubbleSurface";
import {
  ChatHeartBurst,
  ChatProtectedMediaOverlay,
  ChatVideoPlayBadge,
} from "./ChatMediaEffects";
import type { ChatMessagePresentation } from "./chatMessagePresentation";

const PerfImage = diagnosticImage("chat-media");

type MediaSize = { width: number; height: number };
const MEDIA_BORDER = 4;

function fitMediaSize(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
): MediaSize {
  const innerMaxWidth = maxWidth - MEDIA_BORDER;
  const innerMaxHeight = maxWidth * (4 / 3) - MEDIA_BORDER;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: innerMaxWidth, height: innerMaxHeight };
  }

  const scale = Math.min(
    innerMaxWidth / sourceWidth,
    innerMaxHeight / sourceHeight,
  );

  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
  };
}

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
    openImageViewer,
    openVideoViewer,
    handleMessageTap,
    openSheet,
  } = useChatWindow();
  const { styles, BUBBLE_MAX_W } = useChatWindowStyles();
  const { m, isMine } = model;
  const [sourceSize, setSourceSize] = useState<MediaSize>({
    width: 0,
    height: 0,
  });

  if (isExpired(m)) return null;

  const maxViews = getMaxViews(m);
  const isVideo = m.mediaType === "video";
  const mediaSize = fitMediaSize(
    sourceSize.width,
    sourceSize.height,
    BUBBLE_MAX_W,
  );
  const mediaFrameStyle = {
    width: mediaSize.width,
    height: mediaSize.height,
    aspectRatio: mediaSize.width / mediaSize.height,
  };

  return (
    <ChatBubbleSurface
      isMine={isMine}
      maxWidth={BUBBLE_MAX_W}
      variant="media"
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
      style={{ width: mediaSize.width + MEDIA_BORDER, marginVertical: 6 }}
    >
      {isVideo ? (
        <ChatVideoPoster
          message={m}
          style={[
            styles.mediaThumb,
            maxViews ? styles.mediaProtectedThumb : null,
            mediaFrameStyle,
          ]}
          protectedMedia={!!maxViews}
          onSize={setSourceSize}
        />
      ) : (
        <PerfImage
          source={{ uri: m.url }}
          style={[
            styles.mediaThumb,
            maxViews ? styles.mediaProtectedThumb : null,
            mediaFrameStyle,
          ]}
          resizeMode="contain"
          onLoad={(event) =>
            setSourceSize({
              width: event.nativeEvent.source.width,
              height: event.nativeEvent.source.height,
            })
          }
          blurRadius={maxViews ? 48 : 0}
        />
      )}
      {isVideo && !maxViews ? <ChatVideoPlayBadge /> : null}
      {maxViews ? <ChatProtectedMediaOverlay maxViews={maxViews} /> : null}
      <ChatHeartBurst messageKey={getMediaKey(m)} />
    </ChatBubbleSurface>
  );
}