/**
 * Path: src/features/chat/list/chatListPresentation.ts
 * Purpose: Chat row identity, message previews, and visible-list equality.
 */

export type MatchUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  profilePic?: string;
  photo?: string;

  lastMessageTime?: any;
  lastMessage?: any;
  updatedAt?: any;
  createdAt?: any;
};

export const safeId = (u: any) => String(u?.id || u?._id || "");

export const fullName = (u: any) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "RomBuzz User";

const FALLBACK_AVATAR =
  "https://i.pravatar.cc/200?img=12";

export const rawAvatarUrl = (u: any) =>
  String(
    u?.avatar ||
      u?.profilePic ||
      u?.photo ||
      ""
  ).trim();

export const avatarUrl = (u: any) =>
  rawAvatarUrl(u) || FALLBACK_AVATAR;

function avatarAssetKey(value: string) {
  const clean = String(value || "").trim();

  if (!clean) return "";

  try {
    const parsed = new URL(clean);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return clean.split("?")[0];
  }
}

function parseAmzDate(value: string) {
  const match = String(value || "").match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/
  );

  if (!match) return 0;

  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6])
  );
}

function signedAvatarExpiryMs(value: string) {
  try {
    const parsed = new URL(value);

    const directExpiry =
      parsed.searchParams.get("Expires") ||
      parsed.searchParams.get("expires");

    if (directExpiry) {
      const numeric = Number(directExpiry);

      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric < 1_000_000_000_000
          ? numeric * 1000
          : numeric;
      }
    }

    const signedAt = parseAmzDate(
      parsed.searchParams.get("X-Amz-Date") || ""
    );

    const lifetimeSec = Number(
      parsed.searchParams.get("X-Amz-Expires") || 0
    );

    if (signedAt && lifetimeSec > 0) {
      return signedAt + lifetimeSec * 1000;
    }
  } catch {}

  return 0;
}

export function shouldRefreshAvatarUrl(
  currentValue: string,
  nextValue: string
) {
  const current = String(currentValue || "").trim();
  const next = String(nextValue || "").trim();

  if (!next || current === next) return false;
  if (!current) return true;

  if (next === FALLBACK_AVATAR) {
    return false;
  }

  if (current === FALLBACK_AVATAR) {
    return true;
  }

  if (avatarAssetKey(current) !== avatarAssetKey(next)) {
    return true;
  }

  const expiresAt = signedAvatarExpiryMs(current);

  return expiresAt > 0 && expiresAt <= Date.now() + 30_000;
}

export function makeRoomId(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

// ✅ Same tag as chat window (prevents ::RBZ:: blob in previews)
export const RBZ_TAG = "::RBZ::";

export const safePreviewText = (lastMessage: any, myId: string) => {
  if (!lastMessage) return "Say Hello!";

  const senderId = String(
    lastMessage?.from ??
    lastMessage?.fromId ??
    lastMessage?.senderId ??
    lastMessage?.userId ??
    ""
  );

  const isMine = !!myId && !!senderId && String(senderId) === String(myId);

  const withMinePrefix = (value: string) => {
    const clean = String(value || "").trim();
    if (!clean) return "Say Hello!";
    return isMine ? `You: ${clean}` : clean;
  };

  const directType = String(lastMessage?.type || "").toLowerCase();
  if (
    directType === "video_call" ||
    directType === "video-call" ||
    directType === "call" ||
    directType === "call_history"
  ) {
    const status = String(
      lastMessage?.status ||
      lastMessage?.callStatus ||
      lastMessage?.lastReason ||
      ""
    ).toLowerCase();

    if (status === "missed" || status === "ring_timeout" || status === "no_answer") {
      return withMinePrefix("Missed video call");
    }

    if (status === "declined") {
      return withMinePrefix("Video call declined");
    }

    if (status === "canceled") {
      return withMinePrefix("Video call canceled");
    }

    return withMinePrefix("Video call ended");
  }

  // Most direct preview
  if (typeof lastMessage?.preview === "string" && lastMessage.preview.trim()) {
    return withMinePrefix(lastMessage.preview);
  }

  // Try common text fields
  const rawText =
    lastMessage?.text ??
    lastMessage?.message ??
    lastMessage?.body ??
    "";

  // Decode ::RBZ:: payloads
  if (typeof rawText === "string" && rawText.startsWith(RBZ_TAG)) {
    try {
      const payload = JSON.parse(rawText.slice(RBZ_TAG.length));

      if (payload?.type === "text" && typeof payload?.text === "string" && payload.text.trim()) {
        return withMinePrefix(payload.text);
      }

      if (payload?.type === "media") {
        if (payload?.mediaType === "image") return withMinePrefix("📷 Photo");
        if (payload?.mediaType === "video") return withMinePrefix("🎥 Video");
        if (payload?.mediaType === "audio") return withMinePrefix("🎙 Voice message");
        return withMinePrefix("📎 Attachment");
      }

      if (payload?.type === "share_post") {
        return withMinePrefix("🖼 Shared a post");
      }

      if (payload?.type === "share_reel") {
        return withMinePrefix("🎬 Shared a reel");
      }

      if (payload?.type === "share_profile_media") {
        const mediaType = String(payload?.mediaType || "").toLowerCase();

        if (mediaType === "reel" || mediaType === "video") {
          return withMinePrefix("🎬 Shared a reel");
        }

        if (mediaType === "photo" || mediaType === "image") {
          return withMinePrefix("🖼 Shared a photo");
        }

        return withMinePrefix("📎 Shared profile media");
      }

      if (payload?.type === "chat_gift") {
        const giftName =
          String(
            payload?.gift?.name ||
            payload?.giftName ||
            payload?.name ||
            ""
          ).trim();

        return withMinePrefix(giftName ? `🎁 Sent ${giftName}` : "🎁 Sent a gift");
      }

      if (payload?.type === "gift") {
        const giftName =
          String(
            payload?.gift?.name ||
            payload?.giftName ||
            payload?.name ||
            ""
          ).trim();

        return withMinePrefix(giftName ? `🎁 Sent ${giftName}` : "🎁 Sent a gift");
      }
    } catch {
      // fall through
    }
  }

  if (typeof rawText === "string" && rawText.trim()) {
    return withMinePrefix(rawText);
  }

  // Useful fallback for messages with attachment fields but no text
  if (lastMessage?.mediaUrl || lastMessage?.url) {
    return withMinePrefix("📎 Attachment");
  }

  return "Say Hello!";
};

export function sameChatListForPaint(a: MatchUser[], b: MatchUser[]) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];

    if (safeId(left) !== safeId(right)) return false;

    // Keep a healthy signed avatar URL stable to prevent blinking,
    // but allow fresh /matches data to replace an expired URL or
    // a genuinely changed profile image.
    if (
      shouldRefreshAvatarUrl(
        rawAvatarUrl(left),
        rawAvatarUrl(right)
      )
    ) {
      return false;
    }

    if (fullName(left) !== fullName(right)) return false;

    const leftLast = String(
      left?.lastMessage?.id ||
      left?.lastMessage?._id ||
      left?.lastMessageTime ||
      left?.updatedAt ||
      ""
    );

    const rightLast = String(
      right?.lastMessage?.id ||
      right?.lastMessage?._id ||
      right?.lastMessageTime ||
      right?.updatedAt ||
      ""
    );

    if (leftLast !== rightLast) return false;
  }

  return true;
}
