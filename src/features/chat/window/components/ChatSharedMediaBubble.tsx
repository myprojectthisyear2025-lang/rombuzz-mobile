import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import type { ChatMessagePresentation } from "./chatMessagePresentation";
import { ChatVideoPlayBadge } from "./ChatMediaEffects";

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
      <Pressable
        onLongPress={() => openSheet(item)}
        style={{
          alignSelf: "flex-start",
          maxWidth: BUBBLE_MAX_W,
          flexShrink: 0,
          overflow: "visible",
        }}
      >
        <View style={[styles.bubble, isMine ? styles.mine : styles.peer]}>
          <Text
            style={[styles.msgText, isMine ? styles.mineText : styles.peerText]}
          >
            This message was unsent
          </Text>
        </View>
      </Pressable>
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label.toLowerCase()}`}
      onPress={() =>
        handleMessageTap(item, m, {
          singleTapAction: () => {
            const payload = {
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
      style={[styles.mediaWrap, isMine ? styles.mediaMine : styles.mediaPeer]}
    >
      {isVideo ? (
        <Video
          source={{ uri: String(m?.mediaUrl || "") }}
          style={styles.mediaThumb}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted
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
    </Pressable>
  );
}
