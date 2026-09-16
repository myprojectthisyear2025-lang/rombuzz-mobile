import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { formatExactMessageTime } from "@/src/features/chat/thread/chatTimeUtils";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import ChatReactionPicker from "./ChatReactionPicker";

function Action({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { styles, colors } = useChatWindowStyles();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.sheetItem}
    >
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[styles.sheetItemText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function ChatMessageActionsSheet() {
  const {
    sheetOpen,
    closeSheet,
    sheetMsg,
    mine,
    insets,
    reactTo,
    emojiPickerOpen,
    setEmojiPickerOpen,
    startEdit,
    togglePinMessage,
    unsendForAll,
    unsendForMe,
    openMessageReport,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  const dismiss = () =>
    emojiPickerOpen ? setEmojiPickerOpen(false) : closeSheet();
  return (
    <Modal
      visible={sheetOpen}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <Pressable
        style={[
          styles.sheetOverlay,
          {
            paddingTop: Math.max(20, insets.top + 12),
            paddingBottom: Math.max(20, insets.bottom + 12),
          },
        ]}
        onPress={dismiss}
      >
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {emojiPickerOpen ? (
              <ChatReactionPicker />
            ) : (
              <>
                <Text style={styles.sheetTitle}>
                  {sheetMsg
                    ? `${mine(sheetMsg) ? "Sent" : "Received"} • ${formatExactMessageTime(sheetMsg.createdAt ?? sheetMsg.time)}`
                    : "Message"}
                </Text>
                <View style={styles.emojiRow}>
                  {["❤️", "😂", "😮", "😢", "🔥", "😡"].map((emoji) => (
                    <Pressable
                      key={emoji}
                      accessibilityRole="button"
                      accessibilityLabel={`React ${emoji}`}
                      style={styles.emojiBtn}
                      onPress={() => sheetMsg && reactTo(sheetMsg, emoji)}
                    >
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="More reactions"
                    style={styles.emojiBtn}
                    onPress={() => {
                      if (sheetMsg) setEmojiPickerOpen(true);
                    }}
                  >
                    <Ionicons name="add" size={20} color={colors.icon} />
                  </Pressable>
                </View>
                <View style={styles.sheetDivider} />
                {sheetMsg ? (
                  <>
                    {mine(sheetMsg) ? (
                      <Action
                        icon="pencil-outline"
                        label="Edit"
                        onPress={() => startEdit(sheetMsg)}
                      />
                    ) : null}
                    <Action
                      icon={sheetMsg.pinned ? "bookmark" : "bookmark-outline"}
                      label={sheetMsg.pinned ? "Unpin message" : "Pin message"}
                      onPress={() => togglePinMessage(sheetMsg)}
                    />
                    {mine(sheetMsg) ? (
                      <Action
                        icon="trash-outline"
                        label="Unsend for all"
                        danger
                        onPress={() =>
                          Alert.alert("Unsend", "Unsend for everyone?", [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Unsend for all",
                              style: "destructive",
                              onPress: () => unsendForAll(sheetMsg),
                            },
                          ])
                        }
                      />
                    ) : null}
                    <Action
                      icon="flag-outline"
                      label="Report"
                      danger
                      onPress={() => openMessageReport(sheetMsg)}
                    />
                    <Action
                      icon="eye-off-outline"
                      label="Remove for me"
                      onPress={() =>
                        Alert.alert("Remove", "Remove message for you?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => unsendForMe(sheetMsg),
                          },
                        ])
                      }
                    />
                  </>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  style={[styles.sheetItem, { justifyContent: "center" }]}
                  onPress={closeSheet}
                >
                  <Text style={[styles.sheetItemText, { color: colors.brand }]}>
                    Close
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
