/** Renders chat media, gift, and message action overlays. */
import ChatCameraModal from "@/src/components/chat/ChatCameraModal";
import ChatPlusModal from "@/src/components/chat/ChatPlusModal";
import GiftPicker from "@/src/components/gifts/GiftPicker";
import React from "react";
import { useChatWindow } from "../ChatWindowContext";
import ChatMessageActionsSheet from "./ChatMessageActionsSheet";
import ChatMessageReport from "./ChatMessageReport";
import ChatReplyIdeasSheet from "./ChatReplyIdeasSheet";

export default function ChatThreadOverlays() {
  const {
    plusOpen,
    setPlusOpen,
    cameraOpen,
    setCameraOpen,
    giftPickerOpen,
    setGiftPickerOpen,
    peerId,
    roomId,
    peerName,
    sendChatGiftMessage,
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
      {giftPickerOpen ? (
        <GiftPicker
          visible={giftPickerOpen}
          onClose={() => setGiftPickerOpen(false)}
          receiverId={peerId}
          placement="chat"
          targetType="chat"
          targetId={roomId}
          title="Send a Gift"
          subtitle={`Send a gift to ${peerName}.`}
          onSent={sendChatGiftMessage}
        />
      ) : null}
      {mediaViewerNode}
      <ChatReplyIdeasSheet />
      <ChatMessageActionsSheet />
      <ChatMessageReport />
    </>
  );
}
