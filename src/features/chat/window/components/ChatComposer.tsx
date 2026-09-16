import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import ChatComposerActions from "./ChatComposerActions";
import ChatComposerContext from "./ChatComposerContext";

export default function ChatComposer() {
  const {
    COMPOSER_SAFE_BOTTOM_PAD,
    composerExpanded,
    setComposerExpanded,
    composerActionsOpen,
    setComposerActionsOpen,
    text,
    setText,
    isTypingRef,
    typingStopRef,
    emitTyping,
    setKeyboardOpen,
    settleToLatest,
    inputHeight,
    setInputHeight,
    send,
    editId,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();

  return (
    <View
      style={[
        styles.composer,
        { marginBottom: 0, paddingBottom: COMPOSER_SAFE_BOTTOM_PAD },
      ]}
    >
      <ChatComposerContext />
      <View style={styles.composerRow}>
        {!composerExpanded ? (
          <ChatComposerActions />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle attachment actions"
            accessibilityState={{ expanded: composerActionsOpen }}
            onPress={() => setComposerActionsOpen((v) => !v)}
            style={styles.expandActionsBtn}
            hitSlop={2}
          >
            <Ionicons
              name={composerActionsOpen ? "chevron-forward" : "chevron-back"}
              size={18}
              color={colors.brand}
            />
          </Pressable>
        )}
        <View
          style={[
            styles.inputWrap,
            composerExpanded ? styles.inputWrapExpanded : null,
          ]}
        >
          {composerExpanded && composerActionsOpen ? (
            <View style={styles.inlineActionsRow}>
              <ChatComposerActions inline />
            </View>
          ) : null}
          <TextInput
            accessibilityLabel="Message"
            value={text}
            onChangeText={(nextText) => {
              setText(nextText);
              if (!composerExpanded) setComposerExpanded(true);
              if (!isTypingRef.current) {
                isTypingRef.current = true;
                emitTyping(true);
              }
              if (typingStopRef.current) clearTimeout(typingStopRef.current);
              typingStopRef.current = setTimeout(() => {
                isTypingRef.current = false;
                emitTyping(false);
              }, 1200);
            }}
            onFocus={() => {
              setKeyboardOpen(true);
              setComposerExpanded(true);
              settleToLatest(false);
            }}
            onBlur={() => {
              // Real keyboard-hide events restore spacing after Android finishes resizing.
              if (isTypingRef.current) {
                isTypingRef.current = false;
                emitTyping(false);
              }
              if (!String(text || "").trim()) {
                setComposerExpanded(false);
                setComposerActionsOpen(false);
                setInputHeight(44);
              }
            }}
            onContentSizeChange={(event) => {
              setInputHeight(
                Math.max(
                  44,
                  Math.min(
                    120,
                    Math.ceil(event.nativeEvent.contentSize.height),
                  ),
                ),
              );
            }}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              styles.inputMultiline,
              { height: inputHeight },
            ]}
            multiline
            scrollEnabled
            textAlignVertical="top"
            blurOnSubmit={false}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={editId ? "Save message edit" : "Send message"}
            onPress={send}
            style={styles.sendBtn}
          >
            <Ionicons
              name={editId ? "checkmark" : "send"}
              size={18}
              color={colors.white}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
