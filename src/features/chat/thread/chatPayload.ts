/**
 * ============================================================
 * 📁 File: src/features/chat/thread/chatPayload.ts
 * 🎯 Purpose: Handles RomBuzz chat message payload encoding,
 *    decoding, message dedupe, and reply snapshot preservation.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *   - future extracted chat message components
 *   - future extracted chat composer/send helpers
 *
 * What this file owns:
 *   - RBZ_TAG: the prefix used to identify structured RomBuzz payloads.
 *   - encodePayload(): converts an object into a ::RBZ:: chat message string.
 *   - maybeDecode(): safely decodes ::RBZ:: message text into a normal object.
 *   - decodeCached(): memoized decoder for long chat threads.
 *   - dedupeById(): removes duplicate messages by id while keeping latest version.
 *   - mergeReplySnapshot(): preserves reply preview data during optimistic
 *     temp-message replacement.
 *
 * Why this file exists:
 *   - The chat thread file is over 4000 lines.
 *   - Shared media, profile shares, reels, view-once payloads, and other
 *     special messages all depend on consistent ::RBZ:: decoding.
 *   - Socket events and optimistic messages can create duplicate ids if
 *     dedupe behavior is not centralized.
 *
 * Runtime behavior:
 *   - This file preserves the exact existing encode/decode/dedupe behavior.
 *   - It does not change sending, sockets, replies, media, reactions,
 *     pinned messages, deleted messages, or unread logic.
 * ============================================================
 */

import type { Msg } from "./chatTypes";

export const RBZ_TAG = "::RBZ::";

export const encodePayload = (obj: any) => `${RBZ_TAG}${JSON.stringify(obj)}`;

// ✅ Parse ::RBZ:: only once per message version (huge win on long threads)
const decodedCacheRef = {
  current: new Map<string, { sig: string; val: any }>(),
};

export const maybeDecode = (m: any) => {
  if (!m) return m;

  if (typeof m?.text === "string" && m.text.startsWith(RBZ_TAG)) {
    try {
      const payload = JSON.parse(m.text.slice(RBZ_TAG.length));

      // ✅ Important:
      // Some backend unlock events/messages may include fresh top-level gift
      // metadata while the encoded ::RBZ:: text still contains the original
      // locked gift payload. The server/top-level gift metadata must win here,
      // otherwise the UI can keep rendering the old locked/black state.
      return {
        ...m,
        ...payload,
        gift:
          payload?.gift || m?.gift
            ? {
                ...(payload?.gift || {}),
                ...(m?.gift || {}),
              }
            : undefined,
      };
    } catch {
      return m;
    }
  }

  return m;
};

export const decodeCached = (m: any) => {
  const id = String(m?.id || "");
  if (!id) return maybeDecode(m);

  // ✅ IMPORTANT: reactions must be part of the signature,
  // otherwise reaction updates won't re-render until refresh.
  const reactionsSig = (() => {
    try {
      return JSON.stringify(m?.reactions || {});
    } catch {
      return "";
    }
  })();

  const replySig = (() => {
    try {
      return JSON.stringify(m?.replyTo || null);
    } catch {
      return "";
    }
  })();

  const pinSig = `${String(m?.pinned || "")}|${String(m?.pinnedAt || "")}|${String(
    m?.pinnedBy || ""
  )}|${String(m?.action || "")}|${String(m?.actorId || "")}|${String(
    m?.actorName || ""
  )}|${String(m?.pinnedTargetId || "")}`;

  const giftSig = (() => {
    try {
      return JSON.stringify(m?.gift || null);
    } catch {
      return "";
    }
  })();

  const mediaSig = (() => {
    try {
      return JSON.stringify({
        url: m?.url || "",
        mediaUrl: m?.mediaUrl || "",
        previewUrl: m?.previewUrl || "",
        signedUrl: m?.signedUrl || "",
        thumbnailUrl: m?.thumbnailUrl || "",
        streamUid: m?.streamUid || "",
        cloudflareStream: m?.cloudflareStream || null,
        playback: m?.playback || null,
        storage: m?.storage || "",
        provider: m?.provider || "",
        status: m?.status || "",
      });
    } catch {
      return "";
    }
  })();

  // sig changes if message text/deleted/edited/seen/reactions/replyTo/pin/gift/media state changes
  const sig = `${String(m?.text || "")}|${String(m?.deleted || "")}|${String(
    m?.edited || ""
  )}|${String(m?.seen || "")}|${reactionsSig}|${replySig}|${pinSig}|${giftSig}|${mediaSig}`;

  const hit = decodedCacheRef.current.get(id);
  if (hit && hit.sig === sig) return hit.val;

  const val = maybeDecode(m);
  decodedCacheRef.current.set(id, { sig, val });
  return val;
};

function hasTextValue(value: any) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasObjectValue(value: any) {
  return !!value && typeof value === "object";
}

function mergeMessagePreserveContent(existing: Msg, incoming: Msg): Msg {
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

export function dedupeById(list: Msg[]) {
  const map = new Map<string, Msg>();

  for (const m of list) {
    const id = String(m?.id || "");
    if (!id) continue;

    const existing = map.get(id);
    map.set(id, existing ? mergeMessagePreserveContent(existing, m) : m);
  }

  return Array.from(map.values());
}

export const mergeReplySnapshot = (existing: Msg, incoming: Msg): Msg =>
  mergeMessagePreserveContent(existing, incoming);