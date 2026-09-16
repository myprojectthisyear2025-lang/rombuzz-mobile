import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import MeetMiddleChatBubble from "@/src/features/chat/thread/MeetMiddleChatBubble";
import VideoCallHistoryBubble from "@/src/features/videoCall/VideoCallHistoryBubble";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import type { ChatMessagePresentation } from "./chatMessagePresentation";

export default function ChatSpecialMessage({
  item,
  model,
}: {
  item: Msg;
  model: ChatMessagePresentation;
}) {
  const {
    myId,
    peerId,
    peerAvatar,
    headerName,
    router,
    handleStartVideoCall,
    unsendForMe,
    openSheet,
  } = useChatWindow();
  const { styles } = useChatWindowStyles();
  const {
    m,
    isMine,
    isVideoCallHistory,
    shouldHideMeetMiddleMilestone,
    isMeetMiddleConfirmed,
  } = model;
  if (isVideoCallHistory)
    return (
      <VideoCallHistoryBubble
        message={m}
        myId={myId}
        peerName={headerName}
        peerAvatar={peerAvatar}
        onOpenPeerProfile={() =>
          router.push({
            pathname: "/view-profile",
            params: {
              userId: peerId,
              fromChat: "1",
              returnTo: `/chat/${peerId}`,
            },
          })
        }
        onCallBack={handleStartVideoCall}
        onLongPress={() =>
          Alert.alert(
            "Delete for you?",
            "This message will be deleted for you but other chat member can still see it",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => unsendForMe(item),
              },
            ],
          )
        }
      />
    );
  if (shouldHideMeetMiddleMilestone) return null;
  if (isMeetMiddleConfirmed)
    return (
      <MeetMiddleChatBubble
        message={m}
        isMine={isMine}
        myId={myId}
        peerId={peerId}
        peerName={headerName}
        peerAvatar={peerAvatar}
        onLongPress={() => openSheet(item)}
      />
    );
  const pinAction =
    String(m?.action || "pin") === "unpin" ? "unpinned" : "pinned";
  const actor = String(m?.actorName || "").trim() || "Someone";
  const systemText =
    m?.type === "system_pin"
      ? String(m?.actorId) === String(myId)
        ? `You ${pinAction} a message`
        : `${actor} ${pinAction} a message`
      : String(m?.text || "");
  return (
    <View style={styles.systemRow}>
      <View
        style={[
          styles.systemBubble,
          m?.type === "system_pin" ? styles.systemBubbleAction : null,
        ]}
      >
        <Text style={styles.systemText}>{systemText}</Text>
        {m?.type === "system_pin" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View pinned messages"
            hitSlop={8}
            style={styles.systemActionBtn}
            onPress={() =>
              router.push({
                pathname: "/chat/pinned/[peerId]" as any,
                params: { peerId, name: headerName, avatar: peerAvatar },
              })
            }
          >
            <Text style={styles.systemActionText}>View pinned</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
