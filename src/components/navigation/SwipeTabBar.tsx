import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import SwipeTabIcons from "./SwipeTabIcons";

const { width } = Dimensions.get("window");

export default function SwipeTabBar() {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;
  const [page, setPage] = useState(0);

  const goToPage = (next: number) => {
    setPage(next);
    Animated.spring(translateX, {
      toValue: -width * next,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const onGestureEnd = ({ nativeEvent }: any) => {
    const { translationX, velocityX } = nativeEvent;

    // Swipe LEFT → page 2
    if ((translationX < -60 || velocityX < -800) && page === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      goToPage(1);
      return;
    }

    // Swipe RIGHT → page 1
    if ((translationX > 60 || velocityX > 800) && page === 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      goToPage(0);
      return;
    }

    // Snap back
    Animated.spring(translateX, {
      toValue: -page * width,
      useNativeDriver: true,
    }).start();
  };

  return (
    <GestureHandlerRootView>
      <PanGestureHandler onEnded={onGestureEnd}>
        <View style={styles.wrapper}>
          <Animated.View
            style={[
              styles.container,
              { transform: [{ translateX }] },
            ]}
          >
            <SwipeTabIcons
              routes={[
                "homepage",
                "chat",
                "social-stats",
                "notifications",
                "profile",
              ]}
              onPress={(r) => router.push(`../(tabs)/${r}`)}
            />

            <SwipeTabIcons
              routes={[
                "letsbuzz",
                "discover",
                "microbuzz",
                "filter",
                "upgrade",
              ]}
              onPress={(r) => router.push(`../(tabs)/${r}`)}
            />
          </Animated.View>

          {/* Page dots */}
          <View style={styles.dots}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  page === i && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    width,
    height: 88,
    backgroundColor: "#b1123c",
  },
  container: {
    flexDirection: "row",
    width: width * 2,
    height: 70,
  },
  dots: {
    position: "absolute",
    bottom: 6,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: "#ffffff",
  },
});
