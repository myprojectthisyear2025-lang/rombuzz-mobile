import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { maybeDecode } from "@/src/features/chat/thread/chatPayload";
import { getReplyPreviewText } from "@/src/features/chat/thread/chatReplyUtils";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { useChatMediaSender } from "@/src/features/chat/thread/useChatMediaSender";
import { useChatThreadFastOpen } from "@/src/features/chat/thread/useChatThreadFastOpen";
import { useChatThreadViewport } from "@/src/features/chat/thread/useChatThreadViewport";
import { useChatComposer } from "./hooks/useChatComposer";
import { useChatEphemeralMedia } from "./hooks/useChatEphemeralMedia";
import { useChatIdentity } from "./hooks/useChatIdentity";
import { useChatKeyboard } from "./hooks/useChatKeyboard";
import { useChatMessageActions } from "./hooks/useChatMessageActions";
import { useChatMessageGestures } from "./hooks/useChatMessageGestures";
import { useChatMessageSheets } from "./hooks/useChatMessageSheets";
import { useChatNavigation } from "./hooks/useChatNavigation";
import { useChatReplyIdeas } from "./hooks/useChatReplyIdeas";
import { useChatTextSender } from "./hooks/useChatTextSender";
import { useChatUnread } from "./hooks/useChatUnread";
import { makeRoomId } from "./realtime/chatRealtimeHelpers";
import { useChatRealtime } from "./realtime/useChatRealtime";

/** Assembles the thread behavior used by the main screen and its components. */
export function useChatWindowController() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    peerId: string;
    name?: string;
    avatar?: string;
    focusMsgId?: string;
  }>();
  const peerId = String(params.peerId || "");
  const focusMsgId = String(params.focusMsgId || "");
  const identity = useChatIdentity({
    peerId,
    name: params.name,
    avatar: params.avatar,
  });
  const { myId, peerName } = identity;
  const roomId = useMemo(() => makeRoomId(myId, peerId), [myId, peerId]);
  const participants = { myId, peerId, roomId };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  // The viewport intentionally receives newest-first data for its inverted list.
  const chatListMessages = useMemo(() => [...messages].reverse(), [messages]);
  const viewport = useChatThreadViewport({
    messages: chatListMessages,
    loading,
    focusMsgId,
    latestAtTop: true,
  });
  const { settleToLatest } = viewport;
  const history = useChatThreadFastOpen({
    ...participants,
    focusMsgId,
    messages,
    loading,
    setMessages,
    setLoading,
    settleToLatest,
  });
  const sheets = useChatMessageSheets(peerId);
  const composer = useChatComposer(sheets.closeSheet);
  const realtime = useChatRealtime({
    ...participants,
    messages,
    loading,
    setMessages,
    settleToLatest,
  });
  const keyboard = useChatKeyboard({
    bottomInset: insets.bottom,
    settleToLatest,
  });
  const ephemeral = useChatEphemeralMedia({ roomId, messages, setMessages });
  const actions = useChatMessageActions({
    ...participants,
    setMessages,
    closeSheet: sheets.closeSheet,
  });
  const gestures = useChatMessageGestures({ myId, reactTo: actions.reactTo });
  const suggestions = useChatReplyIdeas({
    ...participants,
    setText: composer.setText,
  });
  const textSender = useChatTextSender({
    ...participants,
    messages,
    setMessages,
    settleToLatest,
    composer,
  });
  const mediaSender = useChatMediaSender({
    ...participants,
    replyingTo: composer.replyingTo,
    setReplyingTo: composer.setReplyingTo,
    setMessages,
    settleToLatest,
  });
  const navigation = useChatNavigation({
    router,
    peerId,
    headerName: identity.headerName,
    peerAvatar: identity.peerAvatar,
  });
  useChatUnread(peerId);

  const mine = (message: { from?: unknown }) => String(message?.from) === myId;
  const lastMyMsgId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = maybeDecode(messages[i]);
      if (String(message?.from) === myId && !message?.deleted)
        return String(message.id);
    }
    return null;
  }, [messages, myId]);
  const replyingSenderLabel = composer.replyingTo
    ? String(composer.replyingTo.from) === myId
      ? "You"
      : peerName
    : "";
  const replyingPreviewText = composer.replyingTo
    ? getReplyPreviewText(composer.replyingTo)
    : "";

  return {
    router,
    insets,
    peerId,
    roomId,
    focusMsgId,
    messages,
    setMessages,
    loading,
    chatListMessages,
    mine,
    lastMyMsgId,
    replyingSenderLabel,
    replyingPreviewText,
    ...identity,
    ...sheets,
    ...composer,
    ...viewport,
    ...history,
    ...realtime,
    ...keyboard,
    ...ephemeral,
    ...actions,
    ...gestures,
    ...suggestions,
    ...textSender,
    ...mediaSender,
    ...navigation,
  };
}

export type ChatWindowController = ReturnType<typeof useChatWindowController>;
