import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

const REACTIONS = [
  "👍",
  "👎",
  "👏",
  "🙌",
  "😍",
  "🥰",
  "😘",
  "🤔",
  "🤯",
  "😭",
  "😴",
  "😎",
  "🤝",
  "🙏",
  "🎉",
  "💯",
  "👀",
  "🤍",
  "💜",
  "🫶",
];

/** Shares the action-sheet modal so iOS never has two reaction modals open. */
export default function ChatReactionPicker() {
  const { setEmojiPickerOpen, sheetMsg, reactTo } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  return (
    <>
      <View style={styles.emojiPickerHeader}>
        <Text style={styles.emojiPickerTitle}>More reactions</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to message actions"
          onPress={() => setEmojiPickerOpen(false)}
          style={styles.emojiPickerClose}
        >
          <Ionicons name="close" size={18} color={colors.icon} />
        </Pressable>
      </View>
      <View style={styles.emojiPickerGrid}>
        {REACTIONS.map((emoji) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`React ${emoji}`}
            style={styles.emojiPickerBtn}
            onPress={() => {
              if (!sheetMsg) return;
              setEmojiPickerOpen(false);
              reactTo(sheetMsg, emoji);
            }}
          >
            <Text style={styles.emojiPickerBtnText}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
