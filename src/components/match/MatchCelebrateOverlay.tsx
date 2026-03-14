/**
 * ============================================================
 * 📁 File: src/components/match/MatchCelebrateOverlay.tsx
 * 💖 Purpose: Mobile "It's a Match" celebration overlay
 *
 * Triggered by parent via:
 *   <MatchCelebrateOverlay visible matchUser onDone />
 *
 * Behavior:
 *  - Full-screen modal overlay
 *  - Floating hearts animation
 *  - Auto redirect after 3.5s
 * ============================================================
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
};

type Props = {
  visible: boolean;
  matchUser: {
    id: string;
    firstName?: string;
    selfieUrl?: string;
    avatar?: string;
  } | null;
  onDone: () => void;
};

export default function MatchCelebrateOverlay({
  visible,
  matchUser,
  onDone,
}: Props) {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      if (matchUser?.id) {
        onDone();
        router.push(`/chat/${matchUser.id}`);
      }
    }, 3500);

    return () => clearTimeout(t);
  }, [visible]);

  if (!visible || !matchUser) return null;

  const avatar =
    matchUser.avatar ||
    matchUser.selfieUrl ||
    "https://i.pravatar.cc/300";

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.wrap}>
        <Animated.View style={[styles.dim, { opacity: fade }]} />

        {/* Floating hearts */}
        <View style={styles.hearts}>
          {Array.from({ length: 14 }).map((_, i) => (
            <Text key={i} style={styles.heart}>❤️</Text>
          ))}
        </View>

        <Animated.View style={[styles.card, { opacity: fade }]}>
          <LinearGradient
            colors={[RBZ.c1, RBZ.c4]}
            style={styles.cardInner}
          >
            <Text style={styles.small}>ROMBUZZ MATCH</Text>
            <Text style={styles.title}>It’s a Match 💞</Text>

            <Text style={styles.sub}>
              You & {matchUser.firstName || "your match"} liked each other
            </Text>

            <View style={styles.avatars}>
              <Image
                source={{ uri: avatar }}
                style={styles.avatar}
              />
            </View>

            <Text style={styles.hint}>
              Opening your private chat…
            </Text>

            <Pressable
              onPress={() => {
                onDone();
                router.push(`/chat/${matchUser.id}`);
              }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Chat now</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  hearts: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  heart: {
    position: "absolute",
    fontSize: 24,
    opacity: 0.4,
  },
  card: {
    width: "86%",
    borderRadius: 28,
    overflow: "hidden",
  },
  cardInner: {
    padding: 24,
    alignItems: "center",
  },
  small: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: "900",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: RBZ.white,
  },
  sub: {
    color: RBZ.white,
    marginTop: 8,
    textAlign: "center",
  },
  avatars: {
    marginVertical: 18,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: RBZ.white,
  },
  hint: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: RBZ.white,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnText: {
    color: RBZ.c1,
    fontWeight: "900",
  },
});
