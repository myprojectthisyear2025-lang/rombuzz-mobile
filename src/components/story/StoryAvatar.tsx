import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, Pressable, View } from "react-native";

type Props = {
  uri?: string;
  hasStory: boolean;
  seen?: boolean;
  size?: number;
  onPress?: () => void;
};


const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#fff",
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function StoryAvatar({
  uri,
  hasStory,
  seen = false,
  size = 86,
  onPress,
}: Props) {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasStory) {
      rotate.stopAnimation();
      pulse.stopAnimation();
      rotate.setValue(0);
      pulse.setValue(0);
      return;
    }

    const spin = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );

    spin.start();
    pulsing.start();

    return () => {
      spin.stop();
      pulsing.stop();
    };
  }, [hasStory, rotate, pulse]);

  const spinDeg = useMemo(
    () =>
      rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [rotate]
  );

  const scale = useMemo(
    () =>
      pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.035],
      }),
    [pulse]
  );

  const innerSize = size - 6; // ring thickness
  const image = uri ? (
    <Image
      source={{ uri }}
      style={{
        width: innerSize - 4,
        height: innerSize - 4,
        borderRadius: (innerSize - 4) / 2,
      }}
    />
  ) : (
    <View
      style={{
        width: innerSize - 4,
        height: innerSize - 4,
        borderRadius: (innerSize - 4) / 2,
        backgroundColor: RBZ.c3,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="person" size={34} color={RBZ.white} />
    </View>
  );

 return (
  <Pressable onPress={onPress} hitSlop={10}>
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 🔄 ANIMATED RING ONLY */}
      {hasStory && (
        <AnimatedLinearGradient
colors={seen ? ["#cfcfcf", "#bdbdbd"] : [RBZ.c2, RBZ.c4, RBZ.c3, RBZ.c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            padding: 3,
            transform: [{ rotate: spinDeg }],
          }}
        />
      )}

      {/* 🖼️ STATIC AVATAR (NO ANIMATION) */}
      <View
        style={{
          width: size - 6,
          height: size - 6,
          borderRadius: (size - 6) / 2,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{
              width: size - 10,
              height: size - 10,
              borderRadius: (size - 10) / 2,
            }}
          />
        ) : (
          <View
            style={{
              width: size - 10,
              height: size - 10,
              borderRadius: (size - 10) / 2,
              backgroundColor: RBZ.c3,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={34} color={RBZ.white} />
          </View>
        )}
      </View>
    </View>
  </Pressable>
);

}
