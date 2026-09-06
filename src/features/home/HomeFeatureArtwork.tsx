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
    "@/assets/images/rombuzz-home-microbuzz.jpg"
  ),

  discover: require(
    "@/assets/images/rombuzz-home-discover.jpg"
  ),
} as const;

export default function HomeFeatureArtwork({
  scene,
}: Props) {
  return (
    <Image
      source={ARTWORK[scene]}
      style={styles.image}
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
});