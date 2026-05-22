/**
 * ============================================================
 * 📁 File: src/features/videoCall/VideoCallHistoryBubble.tsx
 * 🎥 Purpose: Call history bubble for RomBuzz chat.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *
 * What it fixes:
 *   - Catches new backend call messages: type = "call"
 *   - Catches old saved call messages that only have text
 *   - Forces clean wording:
 *       ended    -> Video call + duration
 *       missed   -> Missed call + Call back
 *       declined -> Declined call
 *       canceled -> Canceled call
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const RBZ = {
  c1: "#b1123c",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  line: "rgba(0,0,0,0.08)",
};

type Props = {
  message: any;
  myId: string;
  peerName: string;
  peerAvatar: string;
  onOpenPeerProfile: () => void;
  onCallBack: () => void;
  onLongPress: () => void;
};

function lower(value: any) {
  return String(value || "").trim().toLowerCase();
}

function getRawText(message: any) {
  return String(message?.text || message?.preview || "").trim();
}

export function isVideoCallHistoryMessage(message: any) {
  const type = lower(message?.type);
  const callType = lower(message?.callType);
  const callId = String(message?.callId || "").trim();
  const callStatus = lower(message?.callStatus || message?.status || message?.lastReason);
  const text = lower(getRawText(message));

  if (type === "call" || type === "video_call" || type === "video-call" || type === "call_history") {
    return true;
  }

  if (callId || callType === "video" || callStatus) {
    return true;
  }

  return (
    text.includes("video call") ||
    text.includes("missed call") ||
    text.includes("missed video call") ||
    text.includes("declined call") ||
    text.includes("video call declined") ||
    text.includes("canceled call") ||
    text.includes("video call canceled")
  );
}

function formatDuration(totalSeconds: number) {
  const secs = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  if (!secs) return "";

  const mins = Math.floor(secs / 60);
  const rem = secs % 60;

  if (mins <= 0) return `${rem}s`;
  return `${mins}m ${String(rem).padStart(2, "0")}s`;
}



function formatCallExactDateTime(message: any) {
  const raw =
    message?.callEndedAt ||
    message?.createdAt ||
    message?.time ||
    message?.callStartedAt ||
    message?.updatedAt;

  if (!raw) return "";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function extractDurationFromText(text: string) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const minutesSeconds = raw.match(/(\d+)\s*m(?:in)?\s*(\d+)?\s*s?/i);
  if (minutesSeconds) {
    const mins = Number(minutesSeconds[1] || 0);
    const secs = Number(minutesSeconds[2] || 0);
    if (mins > 0) return `${mins}m ${String(secs).padStart(2, "0")}s`;
  }

  const secondsOnly = raw.match(/(\d+)\s*s\b/i);
  if (secondsOnly) {
    const secs = Number(secondsOnly[1] || 0);
    if (secs > 0) return `${secs}s`;
  }

  return "";
}

function normalizeCallStatus(message: any) {
  const explicit = lower(message?.callStatus || message?.status || message?.lastReason);
  const text = lower(getRawText(message));

  if (explicit === "missed" || explicit === "ring_timeout" || explicit === "no_answer") {
    return "missed";
  }

  if (explicit === "declined") return "declined";
  if (explicit === "canceled" || explicit === "cancelled") return "canceled";
  if (explicit === "ended" || explicit === "accepted" || explicit === "complete" || explicit === "completed") {
    return "ended";
  }

  if (text.includes("missed")) return "missed";
  if (text.includes("declined")) return "declined";
  if (text.includes("canceled") || text.includes("cancelled")) return "canceled";
  if (text.includes("ended") || text.includes("video call")) return "ended";

  return "ended";
}

export default function VideoCallHistoryBubble({
  message,
  myId,
  peerName,
  peerAvatar,
  onOpenPeerProfile,
  onCallBack,
  onLongPress,
}: Props) {
  const [showExactTime, setShowExactTime] = useState(false);

  const status = normalizeCallStatus(message);

  const isMine = String(message?.from || "") === String(myId || "");
  const rawText = getRawText(message);

  const durationLabel =
    formatDuration(Number(message?.callDurationSeconds || 0)) ||
    extractDurationFromText(rawText);

  const isMissed = status === "missed";
  const isDeclined = status === "declined";
  const isCanceled = status === "canceled";
  const isCompleted = status === "ended";

  let title = "Video call";
  if (isMissed) title = "Missed call";
  else if (isDeclined) title = "Declined call";
  else if (isCanceled) title = "Canceled call";
  else if (isCompleted) title = "Video call";

     const subtitle = isCompleted ? durationLabel : "";
  const exactTimeLabel = formatCallExactDateTime(message);
  const negative = isMissed || isDeclined || isCanceled;
  const showPeerAvatar = !isMine;

  return (
    <View style={[styles.wrap, isMine ? styles.wrapMine : styles.wrapPeer]}>
      <View style={styles.historyRow}>
        {showPeerAvatar ? (
          <Pressable
            onPress={onOpenPeerProfile}
            hitSlop={8}
            style={styles.peerAvatarBtn}
          >
            <Image source={{ uri: peerAvatar }} style={styles.peerAvatar} />
          </Pressable>
        ) : null}

              <Pressable
          onPress={() => setShowExactTime((prev) => !prev)}
          onLongPress={onLongPress}
          delayLongPress={260}
          style={[
            styles.card,
            isMine ? styles.cardMine : styles.cardPeer,
            negative ? styles.cardNegative : styles.cardPositive,
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              negative ? styles.iconWrapNegative : styles.iconWrapPositive,
            ]}
          >
            <Ionicons
              name={isMissed ? "videocam-off" : "videocam"}
              size={18}
              color={negative ? "#c62828" : RBZ.white}
            />
          </View>

          <View style={styles.textCol}>
            <Text
              style={[styles.title, negative ? styles.titleNegative : null]}
              numberOfLines={1}
            >
              {title}
            </Text>

                     {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}

            {showExactTime && exactTimeLabel ? (
              <Text style={styles.exactTimeText} numberOfLines={1}>
                {exactTimeLabel}
              </Text>
            ) : null}
          </View>

          {isMissed ? (
            <Pressable onPress={onCallBack} style={styles.callBackBtn} hitSlop={8}>
              <Ionicons name="call" size={14} color={RBZ.white} />
              <Text style={styles.callBackText}>Call back</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "50%",
    maxWidth: 330,
    minWidth: 240,
    marginVertical: 4,
  },
  wrapMine: {
    alignSelf: "flex-end",
  },
  wrapPeer: {
    alignSelf: "flex-start",
  },

  historyRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  peerAvatarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flexShrink: 0,
  },
  peerAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },

  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
  },
  cardMine: {
    borderTopRightRadius: 8,
  },
  cardPeer: {
    borderTopLeftRadius: 8,
  },

  cardPositive: {
    backgroundColor: "#ffffff",
    borderColor: RBZ.line,
  },
  cardNegative: {
    backgroundColor: "#fff5f5",
    borderColor: "rgba(198,40,40,0.16)",
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconWrapPositive: {
    backgroundColor: RBZ.c1,
  },
  iconWrapNegative: {
    backgroundColor: "rgba(198,40,40,0.10)",
  },

  textCol: {
    flex: 1,
    minWidth: 105,
    flexShrink: 1,
  },
  title: {
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  titleNegative: {
    color: "#c62828",
  },
  subtitle: {
    marginTop: 2,
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "800",
  },
  exactTimeText: {
    marginTop: 3,
    color: RBZ.gray,
    fontSize: 11,
    fontWeight: "700",
  },

  callBackBtn: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: RBZ.c1,
    flexShrink: 0,
  },
  callBackText: {
    color: RBZ.white,
    fontSize: 12,
    fontWeight: "900",
  },
});