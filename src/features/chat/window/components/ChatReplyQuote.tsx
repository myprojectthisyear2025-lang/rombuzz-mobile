import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ReplySnapshot } from "@/src/features/chat/thread/chatTypes";
import { getReplyPreviewText } from "@/src/features/chat/thread/chatReplyUtils";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

type Props = {
  replyTo?: ReplySnapshot | null;
  isMine: boolean;
  insideBubble?: boolean;
};

export default function ChatReplyQuote({
  replyTo,
  isMine,
  insideBubble = false,
}: Props) {
  const { myId, headerName, scrollToMessage } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  if (!replyTo) return null;
  const replyId = String(replyTo.id || "").trim();
  const sender = String(replyTo.from) === String(myId) ? "You" : headerName;
  const onOutgoingBubble = isMine && insideBubble;
  const content = (
    <>
      <View
        style={[
          styles.replyQuoteAccent,
          onOutgoingBubble && { backgroundColor: colors.white },
        ]}
      />
      <View style={styles.replyQuoteContent}>
        <Text
          numberOfLines={1}
          style={[
            styles.replyQuoteSender,
            isMine ? styles.replyQuoteSenderMine : styles.replyQuoteSenderPeer,
            onOutgoingBubble && { color: colors.white },
          ]}
        >
          {sender}
        </Text>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[
            styles.replyQuoteText,
            isMine ? styles.replyQuoteTextMine : styles.replyQuoteTextPeer,
            onOutgoingBubble && { color: colors.white },
          ]}
        >
          {getReplyPreviewText(replyTo)}
        </Text>
      </View>
    </>
  );
  const quoteStyle = [
    styles.replyQuote,
    isMine ? styles.replyQuoteMine : styles.replyQuotePeer,
    insideBubble ? styles.replyQuoteInside : styles.replyQuoteStandalone,
  ];
  return replyId ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View original message from ${sender}`}
      onPress={() => scrollToMessage(replyId)}
      style={quoteStyle}
    >
      {content}
    </Pressable>
  ) : (
    <View style={quoteStyle}>{content}</View>
  );
}
