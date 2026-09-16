import React from "react";
import RBZReportSheet from "@/src/components/reporting/RBZReportSheet";
import { useChatWindow } from "../ChatWindowContext";

export default function ChatMessageReport() {
  const {
    reportMsg,
    reportMsgDecoded,
    reportSheetOpen,
    setReportSheetOpen,
    setReportMsg,
    reportMsgOwnerId,
    reportMsgPreview,
    myId,
    peerId,
    headerName,
    peerAvatar,
    roomId,
  } = useChatWindow();
  if (!reportMsg) return null;
  const close = () => {
    setReportSheetOpen(false);
    setReportMsg(null);
  };
  return (
    <RBZReportSheet
      visible={reportSheetOpen}
      onClose={close}
      onSubmitted={close}
      target={{
        targetType: "chat_message",
        targetId: String(reportMsgDecoded?.id || reportMsg.id || ""),
        reportedUserId: reportMsgOwnerId,
        targetOwnerId: reportMsgOwnerId,
        source: "mobile_chat_message",
        title:
          reportMsgOwnerId === String(myId)
            ? "Your message"
            : `${headerName}'s message`,
        subtitle: reportMsgPreview || "Chat message",
        avatar: reportMsgOwnerId === String(myId) ? "" : peerAvatar,
        evidenceSnapshot: {
          screen: "chat_thread",
          roomId,
          messageId: String(reportMsgDecoded?.id || reportMsg.id || ""),
          messageType: String(
            reportMsgDecoded?.type || reportMsg.type || "text",
          ),
          messagePreview: reportMsgPreview,
          messageFrom: String(reportMsgDecoded?.from || reportMsg.from || ""),
          messageTo: String(reportMsgDecoded?.to || reportMsg.to || ""),
          messageTime: String(
            reportMsgDecoded?.time ||
              reportMsgDecoded?.createdAt ||
              reportMsg.time ||
              reportMsg.createdAt ||
              "",
          ),
          peerId,
          peerName: headerName,
          peerAvatar,
          reporterId: myId,
          isOwnMessage: reportMsgOwnerId === String(myId),
          hasReply: !!reportMsgDecoded?.replyTo,
          isPinned: !!reportMsgDecoded?.pinned,
          isDeleted: !!reportMsgDecoded?.deleted,
        },
      }}
    />
  );
}
