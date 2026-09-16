import React from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useChatWindow } from "./ChatWindowContext";
import { useChatWindowStyles } from "./styles/useChatWindowStyles";
import ChatThreadHeader from "./components/ChatThreadHeader";
import ChatThreadMessages from "./components/ChatThreadMessages";
import ChatComposer from "./components/ChatComposer";
import ChatThreadOverlays from "./components/ChatThreadOverlays";
import {
  ChatFloatingControls,
  ChatTypingIndicator,
} from "./components/ChatThreadStatus";

/** The single composition point for the mobile chat window. */
export function ChatWindowView() {
  const { keyboardOpen, IOS_KEYBOARD_VERTICAL_OFFSET } = useChatWindow();
  const { styles } = useChatWindowStyles();
  return (
    <View style={styles.container}>
      <ChatThreadHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardOpen ? "padding" : undefined}
        keyboardVerticalOffset={
          keyboardOpen && Platform.OS === "ios"
            ? IOS_KEYBOARD_VERTICAL_OFFSET
            : 0
        }
      >
        <ChatThreadMessages />
        <ChatTypingIndicator />
        <ChatComposer />
        <ChatFloatingControls />
      </KeyboardAvoidingView>
      <ChatThreadOverlays />
    </View>
  );
}

export default ChatWindowView;
