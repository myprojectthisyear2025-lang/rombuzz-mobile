import React from "react";
import { Pressable, Text, View } from "react-native";
import AudioBubble from "@/src/components/chat/AudioBubble";
import ChatGiftMessageBubble from "@/src/components/chat/ChatGiftMessageBubble";
import ChatGiftedMediaBubble from "@/src/components/chat/ChatGiftedMediaBubble";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import type { ChatMessagePresentation } from "./chatMessagePresentation";
import ChatMediaBubble from "./ChatMediaBubble";
import ChatSharedMediaBubble from "./ChatSharedMediaBubble";
import ChatReplyQuote from "./ChatReplyQuote";

type ContentProps = { item: Msg; model: ChatMessagePresentation };

/** Keep gift/audio/paid-media branches ahead of the generic media renderer. */
export default function ChatMessageContent({ item, model }: ContentProps) {
  const {
    headerName,
    myId,
    roomId,
    setMessages,
    isExpired,
    getMaxViews,
    openSheet,
    openImageViewer,
    openVideoViewer,
    handleMessageTap,
    showTimestampForMessage,
  } = useChatWindow();
  const { styles, BUBBLE_MAX_W } = useChatWindowStyles();
  const {
    m,
    isMine,
    isChatGift,
    isAudio,
    isGiftedMedia,
    isMedia,
    isShared,
    isPlainTextMessage,
  } = model;

  if (isChatGift)
    return (
      <ChatGiftMessageBubble
        gift={m.gift}
        isMine={isMine}
        senderName={isMine ? "You" : headerName}
        receiverName={isMine ? headerName : "you"}
        onLongPress={() => openSheet(item)}
      />
    );
  if (isAudio) return <AudioBubble uri={m.url} isMine={isMine} />;
  if (isGiftedMedia)
    return (
      <ChatGiftedMediaBubble
        message={m}
        isMine={isMine}
        myId={myId}
        roomId={roomId}
        maxWidth={BUBBLE_MAX_W}
        isExpired={isExpired(m)}
        isViewOnceOrTwice={!!getMaxViews(m)}
        onUnlocked={(updatedMessage) =>
          setMessages((prev) =>
            prev.map((message) =>
              String(message?.id) === String(updatedMessage?.id)
                ? ({ ...message, ...updatedMessage } as Msg)
                : message,
            ),
          )
        }
        onOpenImage={() => openImageViewer(m)}
        onOpenVideo={() => openVideoViewer(m)}
        onLongPress={() => openSheet(item)}
      />
    );
  if (isMedia) return <ChatMediaBubble item={item} model={model} />;
  if (isShared) return <ChatSharedMediaBubble item={item} model={model} />;

  return (
    <Pressable
      onPress={() =>
        handleMessageTap(item, m, {
          singleTapAction: isPlainTextMessage
            ? () => showTimestampForMessage(item)
            : undefined,
          enableDoubleTapLove: isPlainTextMessage,
        })
      }
      onLongPress={() => openSheet(item)}
      style={{
        alignSelf: "flex-start",
        maxWidth: BUBBLE_MAX_W,
        flexShrink: 0,
        overflow: "visible",
      }}
    >
      <View style={[styles.bubble, isMine ? styles.mine : styles.peer]}>
        <ChatReplyQuote replyTo={m?.replyTo} isMine={isMine} insideBubble />
        <Text
          style={[styles.msgText, isMine ? styles.mineText : styles.peerText]}
        >
          {m?.deleted ? "This message was unsent" : String(m?.text || "")}
        </Text>
      </View>
    </Pressable>
  );
}
