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
      return { ...m, ...payload };
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

  // sig changes if message text/deleted/edited/seen/reactions/replyTo/pin state changes
  const sig = `${String(m?.text || "")}|${String(m?.deleted || "")}|${String(
    m?.edited || ""
  )}|${String(m?.seen || "")}|${reactionsSig}|${replySig}|${pinSig}`;

  const hit = decodedCacheRef.current.get(id);
  if (hit && hit.sig === sig) return hit.val;

  const val = maybeDecode(m);
  decodedCacheRef.current.set(id, { sig, val });
  return val;
};

export function dedupeById(list: Msg[]) {
  const map = new Map<string, Msg>();

  for (const m of list) {
    map.set(String(m.id), m); // latest wins
  }

  return Array.from(map.values());
}

export const mergeReplySnapshot = (existing: Msg, incoming: Msg): Msg => ({
  ...existing,
  ...incoming,
  replyTo: incoming?.replyTo || existing?.replyTo || undefined,
});