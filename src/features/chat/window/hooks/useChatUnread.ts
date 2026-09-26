import { useEffect, useSyncExternalStore } from "react";
import { DeviceEventEmitter } from "react-native";
import { useScreenActivity } from "@/src/features/lifecycle/useScreenActivity";
import { chatUnread, markChatRead } from "@/src/features/chat/unread/chatUnread";
import { getSessionSnapshot, subscribeSession } from "@/src/features/auth/rbzSession";

const sessionToken = () => getSessionSnapshot().token;

/** The visible thread marks read; the application owner publishes its response. */
export function useChatUnread(peerId: string) {
  const { active } = useScreenActivity();
  const token = useSyncExternalStore(subscribeSession, sessionToken, sessionToken);
  useEffect(() => {
    if (!peerId || !active || !token) return;
    const leave = chatUnread.enterPeer(peerId);
    DeviceEventEmitter.emit("rbz:chat:active", { peerId });
    void markChatRead(peerId).catch(() => {});
    return () => {
      leave();
      DeviceEventEmitter.emit("rbz:chat:active", { peerId: null });
    };
  }, [peerId, active, token]);
}
