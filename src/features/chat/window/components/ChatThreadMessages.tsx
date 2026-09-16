import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";
import ChatMessageRow from "./ChatMessageRow";

export default function ChatThreadMessages() {
  const {
    loading,
    flatRef,
    chatListMessages,
    LIST_BOTTOM_PAD,
    headerName,
    handleContentSizeChange,
    handleScroll,
    handleScrollToIndexFailed,
    loadOlderMessages,
  } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();

  if (loading)
    return (
      <View style={[styles.loading, { gap: 12 }]}>
        <ActivityIndicator color={colors.brand} />
        <Text
          style={{ color: colors.textSecondary, fontFamily: RBZFont.medium }}
        >
          Loading messages…
        </Text>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {!chatListMessages.length && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              padding: 18,
              borderRadius: 24,
              backgroundColor: colors.brandSoft,
            }}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={30}
              color={colors.brand}
            />
          </View>
          <Text
            style={{
              color: colors.text,
              fontFamily: RBZFont.extraBold,
              fontSize: 20,
            }}
          >
            A little hello goes a long way
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: RBZFont.medium,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Start your conversation with {headerName}.
          </Text>
        </View>
      )}
      <FlatList
        ref={flatRef}
        data={chatListMessages}
        inverted
        keyExtractor={(m) => (m._temp ? `temp-${m.id}` : `srv-${m.id}`)}
        renderItem={({ item }) => <ChatMessageRow item={item} />}
        scrollEventThrottle={16}
        removeClippedSubviews
        initialNumToRender={18}
        maxToRenderPerBatch={18}
        windowSize={9}
        updateCellsBatchingPeriod={50}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: LIST_BOTTOM_PAD,
          paddingBottom: 12,
        }}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onEndReached={() => {
          void loadOlderMessages();
        }}
        onEndReachedThreshold={0.25}
      />
    </View>
  );
}
