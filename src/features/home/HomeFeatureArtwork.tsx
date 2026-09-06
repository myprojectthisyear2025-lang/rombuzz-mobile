/**
 * Path: src/features/home/HomeFeatureArtwork.tsx
 * Purpose: Human lifestyle artwork for the Home feature cards.
 * Used by: HomeFeatureCard for MicroBuzz and Discover backgrounds.
 */

import React from "react";
import {
  Image,
  StyleSheet,
} from "react-native";

type Scene =
  | "microbuzz"
  | "discover";

type Props = {
  scene: Scene;
};

const ARTWORK = {
  microbuzz: require(
    "@/assets/images/rombuzz-home-microbuzz.png"
  ),

  discover: require(
    "@/assets/images/rombuzz-home-discover.png"
  ),
} as const;

export default function HomeFeatureArtwork({
  scene,
}: Props) {
  return (
    <Image
      source={ARTWORK[scene]}
      style={[
        styles.image,
        scene === "microbuzz"
          ? styles.microbuzzImage
          : styles.discoverImage,
      ]}
      resizeMode="cover"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  // Keep both faces better framed inside the narrow MicroBuzz card.
  microbuzzImage: {
    transform: [
      { translateX: 11 },
      { scale: 1.2 },

    ],
  },

  // Discover has more people extending toward the right side,
  // so give that artwork slightly more leftward positioning.
  discoverImage: {
    transform: [
      { translateX: 11 },
      { scale: 1.2 },

    ],
  },
});