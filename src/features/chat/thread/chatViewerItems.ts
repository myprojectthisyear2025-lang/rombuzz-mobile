/** Builds chat photo/video galleries without paging into protected or deleted videos. */
import { chatVideoUri } from "./chatVideoSource";

export type ChatImageItem = { id: string | number; url: string; title?: string };
export type ChatViewerArgs = {
  messages: any[];
  isExpoGo: boolean;
  maybeDecodeMessage: (message: any) => any;
  isExpiredMessage: (message: any) => boolean;
  getMaxViews: (message: any) => 1 | 2 | undefined;
  consumeEphemeralView: (message: any) => Promise<void>;
};

export function chatImageUri(message: any): string {
  const candidates = [message?.signedUrl, message?.url, message?.mediaUrl, message?.previewUrl]
    .map(value => String(value || "").trim());
  return candidates.find(value => /^https?:\/\//i.test(value)) ||
    candidates.find(value => /^(file|content|blob|data):/i.test(value)) || "";
}

export function chatImageItems(args: ChatViewerArgs, active?: any): ChatImageItem[] {
  const items = args.messages.map(args.maybeDecodeMessage).filter(message => {
    if (!message || message.deleted || args.isExpiredMessage(message) || args.getMaxViews(message)) return false;
    return (String(message.mediaType || "").toLowerCase() === "image" && !!chatImageUri(message)) ||
      (message.type === "share_post" && !!message.mediaUrl) ||
      (message.type === "share_profile_media" && message.mediaType === "photo" && !!message.mediaUrl);
  }).map(message => ({
    id: String(message.id || chatImageUri(message)), url: chatImageUri(message),
    title: message.type === "share_profile_media" ? `${String(message.ownerName || "Shared")}'s Photo` : "Photo",
  })).filter(item => !!item.url);
  if (!items.length && chatImageUri(active)) return [{ id: String(active?.id || chatImageUri(active)), url: chatImageUri(active), title: "Photo" }];
  return items;
}

function restrictedVideo(message: any, args: ChatViewerArgs) {
  return !!args.getMaxViews(message) || !!message?.gift?.locked ||
    Number(message?.gift?.priceBC ?? message?.gift?.amount ?? 0) > 0;
}

export function chatVideoItems(args: ChatViewerArgs, active: any): any[] {
  // Protected items may only be opened through their existing bubble/unlock action.
  if (restrictedVideo(active, args)) return [active];
  const items = args.messages.map(args.maybeDecodeMessage).filter(message => {
    if (!message || message.deleted || args.isExpiredMessage(message) || restrictedVideo(message, args)) return false;
    const video = message.mediaType === "video" || message.type === "share_reel" ||
      (message.type === "share_profile_media" && message.mediaType === "reel");
    return video && !!chatVideoUri(message);
  });
  if (!items.some(message => sameChatMedia(message, active))) items.push(active);
  const seen = new Set<string>();
  return items.filter(message => {
    const key = String(message?.id || chatVideoUri(message));
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function sameChatMedia(first: any, second: any) {
  return first?.id && second?.id ? String(first.id) === String(second.id) :
    !!chatVideoUri(first) && chatVideoUri(first) === chatVideoUri(second);
}