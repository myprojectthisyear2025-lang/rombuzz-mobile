import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

export function ChatTypingIndicator() {
  const { typing, headerName } = useChatWindow();
  const { styles } = useChatWindowStyles();
  if (!typing) return null;
  return (
    <View style={styles.typingBarWrap}>
      <View style={styles.typingBar}>
        <View style={styles.typingDot} />
        <Text style={styles.typingBarText} numberOfLines={1}>
          {headerName} is typing…
        </Text>
      </View>
    </View>
  );
}

export function ChatFloatingControls() {
  const {
    visibleTimestamp,
    insets,
    showScrollBtns,
    scrollToTop,
    scrollToLatest,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  return (
    <>
      {visibleTimestamp ? (
        <View
          pointerEvents="none"
          style={[styles.timestampPillWrap, { bottom: 66 + insets.bottom }]}
        >
          <View style={styles.timestampPill}>
            <Text style={styles.timestampPillText}>{visibleTimestamp}</Text>
          </View>
        </View>
      ) : null}
      {showScrollBtns ? (
        <View
          pointerEvents="box-none"
          style={[styles.scrollBtnsWrap, { bottom: 90 + insets.bottom }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scroll to oldest loaded message"
            onPress={scrollToTop}
            style={styles.scrollBtn}
          >
            <Ionicons name="chevron-up" size={18} color={colors.white} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scroll to latest message"
            onPress={() => scrollToLatest(true)}
            style={styles.scrollBtn}
          >
            <Ionicons name="chevron-down" size={18} color={colors.white} />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
