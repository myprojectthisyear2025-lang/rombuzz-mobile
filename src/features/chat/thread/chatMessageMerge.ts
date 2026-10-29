/** Merge partial chat messages while retaining replies, media, and the sender's local video. */
import type { Msg } from "./chatTypes";
import { rememberSentChatVideo } from "./chatVideoSource";

function hasTextValue(value: any) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasObjectValue(value: any) {
  return !!value && typeof value === "object";
}

export function mergeMessagePreserveContent(existing: Msg, incoming: Msg): Msg {
  rememberSentChatVideo(existing, incoming);
  const next: Msg = {
    ...existing,
    ...incoming,
  };

  // ✅ Do not let partial socket preview payloads erase real text.
  if (!hasTextValue((incoming as any)?.text) && hasTextValue((existing as any)?.text)) {
    next.text = existing.text;
  }

  // ✅ Do not let preview payloads erase message type/media fields.
  if (!hasTextValue((incoming as any)?.type) && hasTextValue((existing as any)?.type)) {
    next.type = existing.type;
  }

  if (!hasTextValue((incoming as any)?.mediaType) && hasTextValue((existing as any)?.mediaType)) {
    (next as any).mediaType = (existing as any).mediaType;
  }

  if (!hasTextValue((incoming as any)?.url) && hasTextValue((existing as any)?.url)) {
    (next as any).url = (existing as any).url;
  }

  if (!hasTextValue((incoming as any)?.mediaUrl) && hasTextValue((existing as any)?.mediaUrl)) {
    (next as any).mediaUrl = (existing as any).mediaUrl;
  }

  if (!hasTextValue((incoming as any)?.previewUrl) && hasTextValue((existing as any)?.previewUrl)) {
    (next as any).previewUrl = (existing as any).previewUrl;
  }

  if (!hasTextValue((incoming as any)?.signedUrl) && hasTextValue((existing as any)?.signedUrl)) {
    (next as any).signedUrl = (existing as any).signedUrl;
  }

  if (!hasObjectValue((incoming as any)?.playback) && hasObjectValue((existing as any)?.playback)) {
    (next as any).playback = (existing as any).playback;
  }

  if (!hasObjectValue((incoming as any)?.gift) && hasObjectValue((existing as any)?.gift)) {
    (next as any).gift = (existing as any).gift;
  }

  next.replyTo = incoming?.replyTo || existing?.replyTo || undefined;

  return next;
}