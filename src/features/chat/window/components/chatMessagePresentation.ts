import { RBZ_TAG, decodeCached } from "@/src/features/chat/thread/chatPayload";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { getMeetMiddleBubblePayload } from "@/src/features/chat/thread/MeetMiddleChatBubble";
import { isVideoCallHistoryMessage } from "@/src/features/videoCall/VideoCallHistoryBubble";
import { isGiftedPaidMedia } from "../hooks/chatMediaUtils";

function formatReactions(reactions?: Record<string, string>) {
  if (!reactions) return "";
  const counts: Record<string, number> = {};
  Object.values(reactions).forEach((emoji) => {
    counts[emoji] = (counts[emoji] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([emoji, count]) => `${emoji}${count > 1 ? count : ""}`)
    .join(" ");
}

/** Branch order is shared by the row and its content renderer. */
export function getChatMessagePresentation(item: Msg, myId: string) {
  const m = decodeCached(item);
  const isMine = String(m?.from) === String(myId);
  const hasSharedUrl =
    typeof m?.mediaUrl === "string" && !!String(m.mediaUrl).trim();
  const isSharedPost = m?.type === "share_post" && hasSharedUrl;
  const isSharedReel = m?.type === "share_reel" && hasSharedUrl;
  const isSharedProfileMedia =
    m?.type === "share_profile_media" && hasSharedUrl;
  const isSharedProfileReel =
    isSharedProfileMedia && String(m?.mediaType || "").toLowerCase() === "reel";
  const isSharedProfilePhoto =
    isSharedProfileMedia &&
    String(m?.mediaType || "").toLowerCase() === "photo";
  const isShared = isSharedPost || isSharedReel || isSharedProfileMedia;
  const isMedia =
    !isShared &&
    (m?.type === "media" ||
      !!m?.url ||
      !!m?.mediaUrl ||
      !!m?.streamUid ||
      !!m?.cloudflareStream?.uid ||
      ["video", "image", "audio"].includes(
        String(m?.mediaType || "").toLowerCase(),
      ));
  const isAudio = m?.mediaType === "audio";
  const isGiftedMedia = isMedia && isGiftedPaidMedia(m);

  // A stream video may have call-like duration/status fields. Media always wins.
  const isVideoCallHistory = !isMedia && isVideoCallHistoryMessage(m);
  const meetMiddlePayload = getMeetMiddleBubblePayload(m);
  const isMeetMiddleConfirmed =
    meetMiddlePayload?.kind === "milestone" &&
    meetMiddlePayload.status === "confirmed";
  const shouldHideMeetMiddleMilestone =
    meetMiddlePayload?.kind === "milestone" &&
    meetMiddlePayload.status !== "confirmed";
  const canSwipeReply =
    !m?.deleted &&
    !m?._temp &&
    !m?.system &&
    !isVideoCallHistory &&
    !meetMiddlePayload;
  const isPinnedMessage = !!m?.pinned && !m?.deleted && !m?._temp;
  const isPlainTextMessage =
    m?.type === "text" &&
    !m?.deleted &&
    typeof m?.text === "string" &&
    !m.text.startsWith(RBZ_TAG);
  const isChatGift =
    m?.type === "chat_gift" &&
    !!m?.gift &&
    !!String(m?.gift?.giftId || "").trim();
  return {
    m,
    isMine,
    isShared,
    isSharedReel,
    isSharedProfileReel,
    isSharedProfilePhoto,
    isMedia,
    isAudio,
    isGiftedMedia,
    isVideoCallHistory,
    isMeetMiddleConfirmed,
    shouldHideMeetMiddleMilestone,
    canSwipeReply,
    isPinnedMessage,
    isPlainTextMessage,
    isChatGift,
    reactLine: formatReactions(m?.reactions),
  };
}

export type ChatMessagePresentation = ReturnType<
  typeof getChatMessagePresentation
>;
