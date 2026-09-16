import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import VoiceRecorderButton from "@/src/components/chat/VoiceRecorderButton";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

/** Identical media actions in the collapsed and expanded composer. */
export default function ChatComposerActions({
  inline = false,
}: {
  inline?: boolean;
}) {
  const { roomId, setPlusOpen, setCameraOpen, sendMediaPayload } =
    useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Attach photos or videos"
        hitSlop={2}
        onPress={() => setPlusOpen(true)}
        style={inline ? styles.inlineActionBtn : styles.attachBtn}
      >
        <Ionicons name="images-outline" size={20} color={colors.brand} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open camera"
        hitSlop={2}
        onPress={() => setCameraOpen(true)}
        style={inline ? styles.inlineActionBtn : styles.cameraBtn}
      >
        <Ionicons name="camera-outline" size={20} color={colors.brand} />
      </Pressable>
      <View style={inline ? styles.inlineVoiceWrap : styles.voiceActionSlot}>
        <VoiceRecorderButton
          roomId={roomId}
          onSend={(url, meta) => {
            sendMediaPayload({
              type: "media",
              mediaType: "audio",
              url,
              previewUrl: meta?.previewUrl,
              storage: meta?.storage,
            });
          }}
        />
      </View>
    </>
  );
}
