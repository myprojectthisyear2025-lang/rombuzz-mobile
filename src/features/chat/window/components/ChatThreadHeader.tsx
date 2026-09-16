import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

export default function ChatThreadHeader() {
  const {
    router,
    insets,
    peerId,
    peerAvatar,
    headerName,
    loadReplyIdeas,
    handleOpenMeetMiddle,
    handleStartVideoCall,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();

  const goBack = () => {
    try {
      globalThis.dispatchEvent?.(
        new CustomEvent("rbz:chat:active", {
          detail: { peerId: null },
        }),
      );
    } catch {}
    router.back();
  };

  return (
    <View style={[styles.topBar, { paddingTop: 8 + insets.top }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        style={styles.topBtn}
        hitSlop={2}
      >
        <Ionicons name="chevron-back" size={22} color={colors.icon} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Conversation details for ${headerName}`}
        onPress={() =>
          router.push({
            pathname: "/chat/thread-info/[peerId]" as any,
            params: { peerId, name: headerName, avatar: peerAvatar },
          })
        }
        style={styles.peerInfo}
      >
        <Image source={{ uri: peerAvatar }} style={styles.peerAvatar} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.peerName} numberOfLines={1}>
            {headerName}
          </Text>
          <Text style={styles.peerSub} numberOfLines={1}>
            Private conversation
          </Text>
        </View>
      </Pressable>
      <View style={styles.topActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get reply ideas"
          onPress={() => loadReplyIdeas("natural")}
          style={styles.topBtn}
          hitSlop={2}
        >
          <Ionicons name="sparkles-outline" size={19} color={colors.brand} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Meet in the Middle"
          onPress={handleOpenMeetMiddle}
          style={styles.topBtn}
          hitSlop={2}
        >
          <MeetMiddleMiniLogo size={21} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start video call"
          onPress={handleStartVideoCall}
          style={styles.topBtn}
          hitSlop={2}
        >
          <Ionicons name="videocam-outline" size={22} color={colors.icon} />
        </Pressable>
      </View>
    </View>
  );
}
