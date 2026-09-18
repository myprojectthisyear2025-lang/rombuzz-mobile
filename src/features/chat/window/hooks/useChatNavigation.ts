import type { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

type NavigationArgs = {
  router: ReturnType<typeof useRouter>;
  peerId: string;
  headerName: string;
  peerAvatar: string;
};
export function useChatNavigation({
  router,
  peerId,
  headerName,
  peerAvatar,
}: NavigationArgs) {
  const videoCallLaunchRef = useRef(false);
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
    },
    [],
  );

  const handleOpenMeetMiddle = () => {
    if (!peerId) return;

    router.push({
      pathname: "/meet-middle/[peerId]" as any,
      params: {
        peerId,
        name: headerName,
        avatar: peerAvatar,
        source: "chat-header",
      },
    });
  };

  const handleStartVideoCall = () => {
    if (!peerId || videoCallLaunchRef.current) return;

    // Prevent rapid double taps without making the button feel blocked.
    videoCallLaunchRef.current = true;

    router.push({
      pathname: "/video-call/[callId]",
      params: {
        callId: "pending",
        peerId,
        role: "caller",
        pending: "1",
        startedAtMs: String(Date.now()),
      },
    });

    launchTimerRef.current = setTimeout(() => {
      videoCallLaunchRef.current = false;
      launchTimerRef.current = null;
    }, 800);
  };

  return { handleOpenMeetMiddle, handleStartVideoCall };
}
