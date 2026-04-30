/**
 * ============================================================
 * 📁 File: src/features/chat/thread/ChatMediaViewerController.tsx
 * 🎯 Purpose: Fullscreen media viewer controller for RomBuzz chat thread
 *
 * Used by:
 *  - app/chat/[peerId].tsx
 *
 * What this file owns:
 *  - Chat fullscreen photo viewer state
 *  - Chat fullscreen video viewer state
 *  - Building the photo viewer item list from chat messages
 *  - Opening and closing image/video viewers
 *  - Handling view-once / view-twice close behavior
 *
 * Why this file exists:
 *  - app/chat/[peerId].tsx was growing over 4000 lines
 *  - Media viewer logic is isolated and does not need to live
 *    inside the main chat thread screen
 *  - This keeps the chat screen smaller without touching layout,
 *    scroll behavior, composer, or message bubble rendering
 *
 * Important:
 *  - This file does NOT change chat layout
 *  - This file does NOT change composer behavior
 *  - This file does NOT change message rendering
 *  - It only controls fullscreen image/video media viewing
 * ============================================================
 */

import MediaViewer from "@/src/components/chat/MediaViewer";
import RBZImageViewer from "@/src/components/media/RBZImageViewer";
import React, { useCallback, useMemo, useState } from "react";
import type { Msg } from "./chatTypes";

type ViewerItem = {
  id: string | number;
  url: string;
  title?: string;
};

type ChatMediaViewerControllerArgs = {
  messages: Msg[];
  isExpoGo: boolean;
  maybeDecodeMessage: (message: any) => any;
  isExpiredMessage: (message: any) => boolean;
  getMaxViews: (message: any) => 1 | 2 | undefined;
  consumeEphemeralView: (message: any) => Promise<void>;
};

export function useChatMediaViewerController({
  messages,
  isExpoGo,
  maybeDecodeMessage,
  isExpiredMessage,
  getMaxViews,
  consumeEphemeralView,
}: ChatMediaViewerControllerArgs) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerItems, setImageViewerItems] = useState<ViewerItem[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [videoViewerMsg, setVideoViewerMsg] = useState<any | null>(null);

  const buildChatImageViewerItems = useCallback(
    (activeMsg?: any) => {
      const items = messages
        .map((raw) => maybeDecodeMessage(raw))
        .filter((msg: any) => {
          if (!msg || isExpiredMessage(msg)) return false;

          const isDirectImage =
            msg?.mediaType === "image" &&
            !!String(msg?.url || "").trim();

          const isSharedImage =
            msg?.type === "share_post" &&
            !!String(msg?.mediaUrl || "").trim();

          const isSharedProfilePhoto =
            msg?.type === "share_profile_media" &&
            String(msg?.mediaType || "").toLowerCase() === "photo" &&
            !!String(msg?.mediaUrl || "").trim();

          return isDirectImage || isSharedImage || isSharedProfilePhoto;
        })
        .map((msg: any) => ({
          id: String(msg?.id || msg?.url || msg?.mediaUrl || Math.random()),
          url: String(msg?.url || msg?.mediaUrl || "").trim(),
          title:
            msg?.type === "share_profile_media"
              ? `${String(msg?.ownerName || "Shared")}'s Photo`
              : "Photo",
        }))
        .filter((item) => !!item.url);

      if (!items.length && activeMsg) {
        const fallbackUrl = String(activeMsg?.url || activeMsg?.mediaUrl || "").trim();

        if (fallbackUrl) {
          return [
            {
              id: String(activeMsg?.id || fallbackUrl),
              url: fallbackUrl,
              title: "Photo",
            },
          ];
        }
      }

      return items;
    },
    [messages, maybeDecodeMessage, isExpiredMessage]
  );

  const openImageViewer = useCallback(
    (message: any) => {
      const items = buildChatImageViewerItems(message);
      const activeId = String(message?.id || message?.url || message?.mediaUrl || "");
      const foundIndex = items.findIndex((item) => String(item.id) === activeId);

      setImageViewerItems(items);
      setImageViewerIndex(foundIndex >= 0 ? foundIndex : 0);
      setImageViewerOpen(true);
    },
    [buildChatImageViewerItems]
  );

  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
  }, []);

  const openVideoViewer = useCallback((message: any) => {
    setVideoViewerMsg(message);
    setVideoViewerOpen(true);
  }, []);

  const closeVideoViewer = useCallback(() => {
    setVideoViewerOpen(false);
    setVideoViewerMsg(null);
  }, []);

  const closeImageViewerWithEphemeralCheck = useCallback(async () => {
    const activeImage = imageViewerItems[imageViewerIndex];

    const matchedMessage = messages
      .map((raw) => maybeDecodeMessage(raw))
      .find((msg: any) => {
        const candidateUrl = String(msg?.url || msg?.mediaUrl || "").trim();
        return candidateUrl && candidateUrl === String(activeImage?.url || "").trim();
      });

    if (matchedMessage && getMaxViews(matchedMessage)) {
      await consumeEphemeralView(matchedMessage);
    }

    closeImageViewer();
  }, [
    imageViewerItems,
    imageViewerIndex,
    messages,
    maybeDecodeMessage,
    getMaxViews,
    consumeEphemeralView,
    closeImageViewer,
  ]);

  const closeVideoViewerWithEphemeralCheck = useCallback(async () => {
    if (videoViewerMsg && getMaxViews(videoViewerMsg)) {
      await consumeEphemeralView(videoViewerMsg);
    }

    closeVideoViewer();
  }, [videoViewerMsg, getMaxViews, consumeEphemeralView, closeVideoViewer]);

  const mediaViewerNode = useMemo(
    () => (
      <>
        <RBZImageViewer
          visible={imageViewerOpen}
          items={imageViewerItems}
          initialIndex={imageViewerIndex}
          title="Photo"
          onIndexChange={setImageViewerIndex}
          onClose={closeImageViewerWithEphemeralCheck}
        />

        <MediaViewer
          visible={videoViewerOpen}
          uri={videoViewerMsg?.url || videoViewerMsg?.mediaUrl || ""}
          mediaType="video"
          muted={!!videoViewerMsg?.muted}
          maxViews={getMaxViews(videoViewerMsg)}
          allowDownload={!isExpoGo && !getMaxViews(videoViewerMsg)}
          onClose={closeVideoViewerWithEphemeralCheck}
        />
      </>
    ),
    [
      imageViewerOpen,
      imageViewerItems,
      imageViewerIndex,
      closeImageViewerWithEphemeralCheck,
      videoViewerOpen,
      videoViewerMsg,
      getMaxViews,
      isExpoGo,
      closeVideoViewerWithEphemeralCheck,
    ]
  );

  return {
    openImageViewer,
    openVideoViewer,
    mediaViewerNode,
  };
}