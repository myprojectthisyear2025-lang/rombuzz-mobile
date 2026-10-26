/**
 * 📁 File: src/features/videoCall/videoCallNotificationActions.ts
 * 🎯 Purpose: Handles Answer and Decline actions from incoming-call pushes.
 * Used by: app/_layout.tsx notification response handlers.
 */

import { Alert } from "react-native";
import { acceptVideoCall, declineVideoCall } from "./videoCallApi";

export type AcceptedCallRoute = {
  pathname: "/video-call/[callId]";
  params: {
    callId: string;
    channelName: string;
    appId: string;
    token: string;
    uid: string;
    role: "receiver";
  };
};

export async function handleVideoCallNotificationAction(
  response: any,
  onAccepted: (route: AcceptedCallRoute) => void,
): Promise<boolean> {
  const actionId = String(response?.actionIdentifier || "");
  if (actionId !== "ANSWER_CALL" && actionId !== "DECLINE_CALL") return false;

  const data = response?.notification?.request?.content?.data || {};
  const type = String(data.type || data.notificationType || "");
  if (!type.includes("video_call")) return false;

  const callId = String(data.callId || data.videoCallId || "").trim();
  if (!callId) {
    Alert.alert("Video call", "This call notification is missing its call ID.");
    return true;
  }

  try {
    if (actionId === "DECLINE_CALL") {
      await declineVideoCall(callId);
      return true;
    }

    const result = await acceptVideoCall(callId);
    onAccepted({
      pathname: "/video-call/[callId]",
      params: {
        callId: result.call.id,
        channelName: result.call.channelName,
        appId: result.token?.appId || "",
        token: result.token?.token || "",
        uid: result.token?.uid || "",
        role: "receiver",
      },
    });
  } catch (err: any) {
    Alert.alert(
      "Video call",
      err?.message || "This call may have expired or ended.",
    );
  }

  return true;
}