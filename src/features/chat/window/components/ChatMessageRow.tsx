import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import SwipeReplyRow from "@/src/features/chat/thread/SwipeReplyRow";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import { getChatMessagePresentation } from "./chatMessagePresentation";
import ChatReplyQuote from "./ChatReplyQuote";
import ChatSpecialMessage from "./ChatSpecialMessage";
import ChatMessageContent from "./ChatMessageContent";

export default function ChatMessageRow({ item }: { item: Msg }) {
  const {
    myId,
    peerId,
    peerAvatar,
    headerName,
    router,
    startReplying,
    scrollToMessage,
    highlightId,
    reactTo,
    lastMyMsgId,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  const model = getChatMessagePresentation(item, myId);
  const {
    m,
    isMine,
    canSwipeReply,
    isPinnedMessage,
    isPlainTextMessage,
    reactLine,
  } = model;
  if (
    model.isVideoCallHistory ||
    model.shouldHideMeetMiddleMilestone ||
    model.isMeetMiddleConfirmed ||
    m?.system ||
    m?.type === "system_pin"
  ) {
    return <ChatSpecialMessage item={item} model={model} />;
  }

  return (
    <SwipeReplyRow
      isMine={isMine}
      disabled={!canSwipeReply}
      onReply={() => startReplying(item)}
      style={[styles.bubbleRow, isMine ? styles.rowMine : styles.rowPeer]}
    >
      {!isMine ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${headerName}'s profile`}
          hitSlop={8}
          style={styles.tinyAvatarBtn}
          onPress={() =>
            router.push({
              pathname: "/view-profile",
              params: {
                userId: peerId,
                fromChat: "1",
                returnTo: `/chat/${peerId}`,
              },
            })
          }
        >
          <Image source={{ uri: peerAvatar }} style={styles.tinyAvatar} />
        </Pressable>
      ) : null}
      <View
        style={[
          styles.messageColumn,
          isMine ? styles.messageColumnMine : styles.messageColumnPeer,
        ]}
      >
        {isPinnedMessage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Highlight pinned message"
            onPress={() => scrollToMessage(String(m.id))}
            hitSlop={8}
            style={[
              styles.pinnedMetaRow,
              isMine ? styles.pinnedMetaRowMine : styles.pinnedMetaRowPeer,
            ]}
          >
            <Ionicons
              name="pin"
              size={12}
              color={colors.brand}
              style={styles.pinnedMetaIcon}
            />
            <Text style={styles.pinnedMetaText}>Pinned</Text>
          </Pressable>
        ) : null}
        {m?.edited && !m?.deleted ? (
          <View
            style={[
              styles.editedRow,
              isMine ? styles.editedRowMine : styles.editedRowPeer,
            ]}
          >
            <Text style={styles.editedRowText}>Edited</Text>
          </View>
        ) : null}
        <View
          style={[
            styles.msgWrap,
            isMine ? styles.msgWrapMine : styles.msgWrapPeer,
            reactLine ? styles.msgWrapWithReact : null,
            String(item.id) === String(highlightId)
              ? styles.msgWrapHighlight
              : null,
          ]}
        >
          {!isPlainTextMessage ? (
            <ChatReplyQuote replyTo={m?.replyTo} isMine={isMine} />
          ) : null}
          <ChatMessageContent item={item} model={model} />
          {reactLine ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reactions ${reactLine}. Remove your reaction`}
              onPress={() => {
                const myEmoji =
                  m?.reactions && myId ? m.reactions[String(myId)] : null;
                if (myEmoji) reactTo(item, myEmoji);
              }}
              hitSlop={10}
              style={[
                styles.reactionPill,
                isMine ? styles.reactionPillMine : styles.reactionPillPeer,
              ]}
            >
              <Text style={styles.reactText}>{reactLine}</Text>
            </Pressable>
          ) : null}
        </View>
        {isMine && String(m?.id) === String(lastMyMsgId) ? (
          <View style={[styles.statusRow, styles.statusRowMine]}>
            <Text style={styles.statusLabel}>{m?.seen ? "Seen" : "Sent"}</Text>
          </View>
        ) : null}
      </View>
    </SwipeReplyRow>
  );
}
