import React from "react";
import ChatCameraModal from "@/src/components/chat/ChatCameraModal";
import ChatPlusModal from "@/src/components/chat/ChatPlusModal";
import { useChatWindow } from "../ChatWindowContext";
import ChatMessageActionsSheet from "./ChatMessageActionsSheet";
import ChatReplyIdeasSheet from "./ChatReplyIdeasSheet";
import ChatMessageReport from "./ChatMessageReport";

export default function ChatThreadOverlays() {
  const {
    plusOpen,
    setPlusOpen,
    cameraOpen,
    setCameraOpen,
    sendGalleryMedia,
    sendCameraMedia,
    mediaViewerNode,
  } = useChatWindow();
  return (
    <>
      {plusOpen ? (
        <ChatPlusModal
          visible={plusOpen}
          onClose={() => setPlusOpen(false)}
          onSendPayload={async (payload) => {
            await sendGalleryMedia({
              localUri: payload.localUri,
              mediaType: payload.mediaType,
              ephemeral: payload.ephemeral,
              gift: payload.gift,
              overlayText: payload.overlayText || "",
              duration: payload.duration,
            });
          }}
        />
      ) : null}
      {cameraOpen ? (
        <ChatCameraModal
          visible={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCaptured={async (items) => {
            const item = items[0];
            if (!item) return;
            await sendCameraMedia({
              uri: item.uri,
              mediaType: item.mediaType,
              visibility: item.visibility,
              previewMuted: item.previewMuted,
              overlayText: item.overlayText || "",
              gift: item.gift,
              duration: item.duration,
            });
          }}
        />
      ) : null}
      {mediaViewerNode}
      <ChatReplyIdeasSheet />
      <ChatMessageActionsSheet />
      <ChatMessageReport />
    </>
  );
}
