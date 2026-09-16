import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

/** Reply preview and edit state above the message input. */
export default function ChatComposerContext() {
  const {
    replyingTo,
    setReplyingTo,
    replyingSenderLabel,
    replyingPreviewText,
    editId,
    setEditId,
    setText,
    setInputHeight,
    setComposerExpanded,
    setComposerActionsOpen,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  return (
    <>
      {replyingTo ? (
        <View style={styles.replyComposerBar}>
          <View style={styles.replyComposerAccent} />
          <View style={styles.replyComposerBody}>
            <Text style={styles.replyComposerLabel} numberOfLines={1}>
              Replying to {replyingSenderLabel}
            </Text>
            <Text style={styles.replyComposerText} numberOfLines={2}>
              {replyingPreviewText}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            onPress={() => setReplyingTo(null)}
            hitSlop={10}
            style={styles.replyComposerClose}
          >
            <Ionicons name="close" size={16} color={colors.iconMuted} />
          </Pressable>
        </View>
      ) : null}
      {editId ? (
        <View style={styles.editChip}>
          <Ionicons name="pencil" size={14} color={colors.white} />
          <Text style={styles.editChipText}>Editing</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
            hitSlop={12}
            onPress={() => {
              setEditId(null);
              setText("");
              setInputHeight(44);
              setComposerExpanded(false);
              setComposerActionsOpen(false);
            }}
          >
            <Ionicons name="close" size={16} color={colors.white} />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
