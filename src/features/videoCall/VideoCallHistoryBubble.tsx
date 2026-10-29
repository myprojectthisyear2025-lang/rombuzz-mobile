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

/** Shows call history with Call back below Missed call inside the same chat bubble. */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { styles } from "./videoCallHistoryBubbleStyles";
import {
  extractDurationFromText,
  formatCallExactDateTime,
  formatDuration,
  getRawText,
  normalizeCallStatus,
} from "./videoCallHistoryUtils";

export { isVideoCallHistoryMessage } from "./videoCallHistoryUtils";

type Props = {
  message: any;
  myId: string;
  peerName: string;
  peerAvatar: string;
  onOpenPeerProfile: () => void;
  onCallBack: () => void;
  onLongPress: () => void;
};

export default function VideoCallHistoryBubble({
  message,
  myId,
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
              color={negative ? "#c62828" : "#ffffff"}
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

            {isMissed ? (
              <Pressable
                onPress={onCallBack}
                style={styles.callBackBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Call back"
              >
                <Ionicons name="call" size={14} color="#ffffff" />
                <Text style={styles.callBackText}>Call back</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}