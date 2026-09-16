import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

const MODES = ["natural", "flirty", "funny", "safe"] as const;

export default function ChatReplyIdeasSheet() {
  const {
    replyIdeasOpen,
    setReplyIdeasOpen,
    replyIdeasLoading,
    replyIdeasError,
    replyIdeas,
    loadReplyIdeas,
    applyReplyIdea,
    insets,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  const close = () => setReplyIdeasOpen(false);
  return (
    <Modal
      visible={replyIdeasOpen}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <Pressable style={styles.replyIdeasOverlay} onPress={close}>
        <Pressable
          style={[
            styles.replyIdeasSheet,
            { paddingBottom: Math.max(18, insets.bottom + 12) },
          ]}
          onPress={() => {}}
        >
          <View style={styles.replyIdeasHeader}>
            <Text style={styles.replyIdeasTitle}>A little inspiration</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close reply ideas"
              onPress={close}
              style={styles.emojiPickerClose}
            >
              <Ionicons name="close" size={20} color={colors.icon} />
            </Pressable>
          </View>
          <View style={styles.replyModeRow}>
            {MODES.map((mode) => (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={`${mode} reply ideas`}
                style={styles.replyModeChip}
                onPress={() => loadReplyIdeas(mode)}
              >
                <Text style={styles.replyModeChipText}>
                  {mode[0].toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          {replyIdeasLoading ? (
            <View
              style={[
                styles.replyIdeasLoadingWrap,
                { flexDirection: "row", alignItems: "center", gap: 10 },
              ]}
            >
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.replyIdeasLoadingText}>Loading ideas…</Text>
            </View>
          ) : null}
          {replyIdeasError ? (
            <Text style={styles.replyIdeasErrorText}>{replyIdeasError}</Text>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.replyIdeasList}
          >
            {replyIdeas.map((idea) => (
              <Pressable
                key={idea.id}
                accessibilityRole="button"
                style={styles.replyIdeaCard}
                onPress={() => applyReplyIdea(idea.text)}
              >
                <Text style={styles.replyIdeaTone}>
                  {String(idea.tone || "idea").toUpperCase()}
                </Text>
                <Text style={styles.replyIdeaText}>{idea.text}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
