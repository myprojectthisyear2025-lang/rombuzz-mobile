/** Chat video URL selection and bounded, session-only reuse of the sender's local file. */
const localVideos = new Map<string, { uri: string; expires: number }>();
const MAX_LOCAL_VIDEOS = 32;
const LOCAL_LIFETIME = 6 * 60 * 60 * 1000;

export function chatVideoUri(message: any): string {
  return [message?.playback?.hls, message?.previewUrl, message?.signedUrl,
    message?.url, message?.mediaUrl]
    .map(value => String(value || "").trim())
    .find(value => /^(https?|file|content|blob|data):/i.test(value) &&
      !/\.(jpg|jpeg|png|gif|webp|avif)(?:[?#]|$)/i.test(value)) || "";
}

function decoded(message: any) {
  try {
    return String(message?.text || "").startsWith("::RBZ::")
      ? { ...message, ...JSON.parse(message.text.slice(7)) } : message;
  } catch { return message; }
}

function localKey(message: any) {
  const identity = message?.streamUid || message?.cloudflareStream?.uid || message?.id;
  return identity ? `${message?.from || ""}:${message?.to || ""}:${identity}` : "";
}

export function rememberSentChatVideo(existing: any, incoming: any) {
  if (!existing?._temp) return;
  const before = decoded(existing), after = decoded(incoming);
  const uri = chatVideoUri(before), key = localKey(after);
  if (before?.mediaType !== "video" || after?.mediaType !== "video" ||
    !/^(file|content):/i.test(uri) || !/^https?:/i.test(chatVideoUri(after)) || !key) return;
  localVideos.delete(key);
  localVideos.set(key, { uri, expires: Date.now() + LOCAL_LIFETIME });
  while (localVideos.size > MAX_LOCAL_VIDEOS) localVideos.delete(localVideos.keys().next().value!);
}

export function sentChatVideoUri(message: any): string | undefined {
  const key = localKey(message), entry = localVideos.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) { localVideos.delete(key); return undefined; }
  return entry.uri;
}