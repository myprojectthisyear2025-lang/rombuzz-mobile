/** Structured chat payload encoding/decoding, memoization, and message deduplication. */
import { mergeMessagePreserveContent } from "./chatMessageMerge";
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