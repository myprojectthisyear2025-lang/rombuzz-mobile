/** Raised shared post/profile media frames use image thumbnails without allocating video players. */
import ChatVideoPoster from "@/src/components/chat/ChatVideoPoster";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, View } from "react-native";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import ChatBubbleSurface from "./ChatBubbleSurface";
import { ChatVideoPlayBadge } from "./ChatMediaEffects";
import type { ChatMessagePresentation } from "./chatMessagePresentation";

export default function ChatSharedMediaBubble({
  item,
  model,
}: {
  item: Msg;
  model: ChatMessagePresentation;
}) {
  const { openSheet, handleMessageTap, openImageViewer, openVideoViewer } =
    useChatWindow();
  const { styles, colors, BUBBLE_MAX_W } = useChatWindowStyles();
  const { m, isMine, isSharedReel, isSharedProfileReel, isSharedProfilePhoto } =
    model;
  if (m?.deleted)
    return (
      <ChatBubbleSurface isMine={isMine} maxWidth={BUBBLE_MAX_W}
        onLongPress={() => openSheet(item)}
      >
        <Text
          style={[styles.msgText, { color: isMine ? "#FFFFFF" : colors.text }]}
        >
          This message was unsent
        </Text>
      </ChatBubbleSurface>
    );
  const isVideo = isSharedReel || isSharedProfileReel;
  const label = isSharedProfileReel
    ? "Shared profile reel"
    : isSharedProfilePhoto
      ? "Shared profile photo"
      : isSharedReel
        ? "Shared reel"
        : "Shared post";
  return (
    <ChatBubbleSurface isMine={isMine} maxWidth={BUBBLE_MAX_W} variant="media"
      accessibilityRole="button"
      accessibilityLabel={`Open ${label.toLowerCase()}`}
      onPress={() =>
        handleMessageTap(item, m, {
          singleTapAction: () => {
            const payload = {
              ...m,
              id: String(m?.id || ""),
              url: String(m?.mediaUrl || ""),
              mediaUrl: String(m?.mediaUrl || ""),
              mediaType: isVideo ? "video" : "image",
            };
            if (isVideo) openVideoViewer(payload);
            else openImageViewer(payload);
          },
          enableDoubleTapLove: true,
        })
      }
      onLongPress={() => openSheet(item)}
      style={{ width: BUBBLE_MAX_W, marginVertical: 6 }}
    >
      {isVideo ? (
        <ChatVideoPoster
          message={{ ...m, url: String(m?.mediaUrl || "") }}
          style={styles.mediaThumb}
          resizeMode="cover"
        />
      ) : (
        <Image
          source={{ uri: String(m?.mediaUrl || "") }}
          style={styles.mediaThumb}
          resizeMode="cover"
        />
      )}
      {isVideo ? <ChatVideoPlayBadge /> : null}
      <View style={styles.mediaOverlay} pointerEvents="none">
        <Ionicons
          name={isVideo ? "play-circle-outline" : "images-outline"}
          size={28}
          color={colors.white}
        />
        <Text style={styles.mediaOverlayText}>{label}</Text>
        <Text style={styles.mediaOverlayText}>Tap to open</Text>
      </View>
    </ChatBubbleSurface>
  );
}