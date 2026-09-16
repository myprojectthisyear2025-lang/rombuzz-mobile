import { useMemo, useState } from "react";
import { RBZ_TAG, maybeDecode } from "@/src/features/chat/thread/chatPayload";
import type { Msg } from "@/src/features/chat/thread/chatTypes";

export function useChatMessageSheets(peerId: string) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMsg, setSheetMsg] = useState<Msg | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState<Msg | null>(null);

  const reportMsgDecoded = useMemo(() => {
    if (!reportMsg) return null;
    return maybeDecode(reportMsg as any);
  }, [reportMsg]);

  const reportMsgOwnerId = useMemo(() => {
    if (!reportMsg) return String(peerId || "");
    return String(reportMsgDecoded?.from || reportMsg?.from || peerId || "");
  }, [reportMsg, reportMsgDecoded, peerId]);

  const reportMsgPreview = useMemo(() => {
    if (!reportMsg) return "";

    const decodedText = String(reportMsgDecoded?.text || "").trim();
    const rawText = String(reportMsg?.text || "").trim();

    if (decodedText && !decodedText.startsWith(RBZ_TAG)) {
      return decodedText.slice(0, 240);
    }

    if (rawText && !rawText.startsWith(RBZ_TAG)) {
      return rawText.slice(0, 240);
    }

    if (reportMsgDecoded?.type === "chat_gift") return "RomBuzz gift message";
    if (reportMsgDecoded?.type === "media" || reportMsgDecoded?.url)
      return "Chat media message";
    if (reportMsgDecoded?.type === "share_post") return "Shared LetsBuzz post";
    if (reportMsgDecoded?.type === "share_reel") return "Shared LetsBuzz reel";
    if (reportMsgDecoded?.type === "share_profile_media")
      return "Shared profile media";

    return "RomBuzz rich message";
  }, [reportMsg, reportMsgDecoded]);
  const openSheet = (m: Msg) => {
    setEmojiPickerOpen(false);
    setSheetMsg(m);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setEmojiPickerOpen(false);
    setSheetOpen(false);
    setSheetMsg(null);
  };

  const openMessageReport = (m: Msg) => {
    setReportMsg(m);
    setEmojiPickerOpen(false);
    setSheetOpen(false);
    setSheetMsg(null);
    setReportSheetOpen(true);
  };

  return {
    sheetOpen,
    sheetMsg,
    emojiPickerOpen,
    setEmojiPickerOpen,
    reportSheetOpen,
    setReportSheetOpen,
    reportMsg,
    setReportMsg,
    reportMsgDecoded,
    reportMsgOwnerId,
    reportMsgPreview,
    openSheet,
    closeSheet,
    openMessageReport,
  };
}
