/** Chat media galleries, horizontal video paging, and protected view consumption. */
import MediaViewer from "@/src/components/chat/MediaViewer";
import RBZImageViewer from "@/src/components/media/RBZImageViewer";
import React, { useRef, useState } from "react";
import { chatVideoUri, sentChatVideoUri } from "./chatVideoSource";
import {
  chatImageItems, chatImageUri, chatVideoItems, sameChatMedia,
  type ChatImageItem, type ChatViewerArgs
} from "./chatViewerItems";

export function useChatMediaViewerController(args: ChatViewerArgs) {
  const { getMaxViews, consumeEphemeralView, isExpiredMessage } = args;
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerItems, setImageViewerItems] = useState<ChatImageItem[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [ephemeralImageMsg, setEphemeralImageMsg] = useState<any>(null);
  const [videoItems, setVideoItems] = useState<any[]>([]);
  const [videoIndex, setVideoIndex] = useState(0);
  const viewedVideo = useRef(false);
  const video = videoItems[videoIndex];

  const openImageViewer = (message: any) => {
    if (!message || message.deleted || isExpiredMessage(message)) return;
    if (getMaxViews(message)) { setEphemeralImageMsg(message); return; }
    const items = chatImageItems(args, message);
    const activeId = String(message.id || message.url || message.mediaUrl || "");
    const found = items.findIndex(item => String(item.id) === activeId);
    setImageViewerItems(items);
    setImageViewerIndex(Math.max(0, found));
    setImageViewerOpen(true);
  };
  const openVideoViewer = (message: any) => {
    if (!message || message.deleted || isExpiredMessage(message)) return;
    const items = chatVideoItems(args, message);
    setVideoIndex(Math.max(0, items.findIndex(item => sameChatMedia(item, message))));
    viewedVideo.current = false;
    setVideoItems(items);
  };
  const closeEphemeralImage = async () => {
    const active = ephemeralImageMsg;
    setEphemeralImageMsg(null);
    if (active && getMaxViews(active)) await consumeEphemeralView(active);
  };
  const closeVideo = async () => {
    const active = video, played = viewedVideo.current;
    setVideoItems([]);
    viewedVideo.current = false;
    if (active && played && getMaxViews(active)) await consumeEphemeralView(active);
  };
  const changeVideoIndex = (next: number) => {
    viewedVideo.current = false;
    setVideoIndex(Math.max(0, Math.min(videoItems.length - 1, next)));
  };
  const pages = videoItems.map((message, index) => ({
    id: String(message.id || index), uri: chatVideoUri(message),
    localUri: sentChatVideoUri(message), muted: !!message.muted,
    maxViews: getMaxViews(message),
    thumbnailUrl: String(message.thumbnailUrl || message.playback?.thumbnailUrl || ""),
  }));
  const mediaViewerNode = <>
    <RBZImageViewer visible={imageViewerOpen} items={imageViewerItems}
      initialIndex={imageViewerIndex} title="Photo" onIndexChange={setImageViewerIndex}
      onClose={() => setImageViewerOpen(false)} />
    <MediaViewer visible={!!ephemeralImageMsg} uri={chatImageUri(ephemeralImageMsg)}
      mediaType="image" maxViews={getMaxViews(ephemeralImageMsg)}
      allowDownload={false} onClose={closeEphemeralImage} />
    <MediaViewer visible={!!video} uri={chatVideoUri(video)} localUri={sentChatVideoUri(video)}
      mediaType="video" muted={!!video?.muted} maxViews={getMaxViews(video)}
      items={pages} index={videoIndex} onIndexChange={changeVideoIndex}
      onViewed={() => { viewedVideo.current = true; }}
      allowDownload={false} onClose={closeVideo} />
  </>;
  return { openImageViewer, openVideoViewer, mediaViewerNode };
}