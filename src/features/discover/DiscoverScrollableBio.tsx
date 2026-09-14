/**
 * Path: src/features/discover/DiscoverScrollableBio.tsx
 * Purpose: Show a Discover bio in a compact vertically scrollable area when the bio is long.
 * Used by: app/(tabs)/discover.tsx.
 */

import React, { useMemo } from "react";
import {
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
} from "react-native";
import {
    Gesture,
    GestureDetector,
} from "react-native-gesture-handler";

type Props = {
  bio: string;
  textStyle: StyleProp<TextStyle>;
};

export default function DiscoverScrollableBio({
  bio,
  textStyle,
}: Props) {
  const scrollGesture = useMemo(
    () =>
      Gesture.Native().disallowInterruption(
        true
      ),
    []
  );

  return (
    <GestureDetector gesture={scrollGesture}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        directionalLockEnabled
        bounces={false}
        overScrollMode="never"
      >
        <Text style={textStyle}>
          {bio}
        </Text>
      </ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 62,
  },

  content: {
    paddingBottom: 2,
  },
});