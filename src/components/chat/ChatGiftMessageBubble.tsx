/**
 * ============================================================
 * 📁 Location: src/components/chat/ChatGiftMessageBubble.tsx
 * 🎁 Purpose: Premium chat gift bubble for RomBuzz DM threads.
 *
 * Used by:
 *  - app/chat/[peerId].tsx
 *
 * What this file does:
 *  - Renders chat gift messages created from ::RBZ:: chat_gift payloads.
 *  - Sender sees a clean “gift sent” card.
 *  - Receiver sees an “Unbox” card first, then the gift reveals.
 *  - Uses transparent gift image rendering with no white background.
 *  - Stores local unbox state per transaction so it stays revealed on device.
 *
 * Important:
 *  - This does not deduct BuzzCoin. Purchase already happens through GiftPicker.
 *  - This does not persist opened status to backend yet.
 *  - Backend opened/read receipt can be added later if sender needs “Opened”.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";

import {
  getGiftsByPlacement,
  type RomBuzzGift,
} from "@/src/config/rombuzzGifts";
import ChatGiftRevealAnimation from "@/src/components/chat/ChatGiftRevealAnimation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#fff5f8",
  line: "rgba(177,18,60,0.14)",
  gold: "#D4AF37",
  goldLight: "#F5E6A3",
  rose: "#FFE4E8",
  darkRose: "#8B1E3F",
};

type ChatGiftPayload = {
  giftId?: string;
  transactionId?: string;
  priceBC?: number;
  senderId?: string;
  receiverId?: string;
  roomId?: string;
  opened?: boolean;
  sentAt?: number | string;
};

type Props = {
  gift: ChatGiftPayload;
  isMine: boolean;
  senderName?: string;
  receiverName?: string;
  onLongPress?: () => void;
};

function findGift(giftId?: string): RomBuzzGift | null {
  const id = String(giftId || "").trim();
  if (!id) return null;

  const all = getGiftsByPlacement("chat");
  return all.find((gift) => String(gift.id) === id) || null;
}

function unboxKey(transactionId?: string, giftId?: string) {
  const tx = String(transactionId || "").trim();
  if (tx) return `RBZ_CHAT_GIFT_OPENED_${tx}`;
  return `RBZ_CHAT_GIFT_OPENED_${String(giftId || "unknown")}`;
}

export default function ChatGiftMessageBubble({
  gift,
  isMine,
  senderName = "Someone",
  receiverName = "them",
  onLongPress,
}: Props) {
  const catalogGift = useMemo(() => findGift(gift?.giftId), [gift?.giftId]);
  const [opened, setOpened] = useState(isMine || !!gift?.opened);
  const [showValue, setShowValue] = useState(false);
  const [revealPlaying, setRevealPlaying] = useState(false);
  const [giftImageRenderNonce, setGiftImageRenderNonce] = useState(0);

  // Animation values
  const pulse = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(isMine || gift?.opened ? 1 : 0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const shineRotate = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const ribbonAnim = useRef(new Animated.Value(0)).current;

  const storageKey = useMemo(
    () => unboxKey(gift?.transactionId, gift?.giftId),
    [gift?.giftId, gift?.transactionId]
  );

  useEffect(() => {
    let alive = true;

    if (isMine) {
      setOpened(true);
      setShowValue(true);
      reveal.setValue(1);
      return;
    }

    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(storageKey);
        if (!alive) return;

        if (saved === "1") {
          setOpened(true);
          setShowValue(true);
          reveal.setValue(1);
        }
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, [isMine, reveal, storageKey]);

  // Continuous animations for unopened gift
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const shineLoop = Animated.loop(
      Animated.timing(shineRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const ribbonLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ribbonAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ribbonAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    shineLoop.start();
    ribbonLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      shineLoop.stop();
      ribbonLoop.stop();
    };
  }, [floatY, pulse, shineRotate, ribbonAnim]);

  const imageAnim = useMemo(() => {
    const scale = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });

    const translateY = floatY.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

    return {
      transform: [{ translateY }, { scale }],
    };
  }, [floatY, pulse]);

  const shineTransform = useMemo(() => {
    const rotate = shineRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });
    return {
      transform: [{ rotate }],
    };
  }, [shineRotate]);

  const ribbonTransform = useMemo(() => {
    const scale = ribbonAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.2, 1],
    });
    return {
      transform: [{ scale }],
    };
  }, [ribbonAnim]);

  const revealAnim = useMemo(() => {
    const scale = reveal.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0.5, 0.8, 1.05, 1],
    });

    return {
      opacity: reveal,
      transform: [{ scale }],
    };
  }, [reveal]);

  const particleScale = useMemo(() => {
    return particleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    });
  }, [particleAnim]);

  const sparkleScale = useMemo(() => {
    return sparkleAnim.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0, 1.2, 0.8, 0],
    });
  }, [sparkleAnim]);

  async function openGift() {
    if (opened) return;

    // Start celebration animations
    Animated.parallel([
      Animated.spring(reveal, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
        delay: 150,
      }),
       ]).start(() => {
      setShowValue(true);
    });

    setOpened(true);
    setShowValue(false);
    setRevealPlaying(true);

    try {
      await SecureStore.setItemAsync(storageKey, "1");
    } catch {}
  }

  const priceBC = Number(gift?.priceBC || catalogGift?.priceBC || 0);
  const imageUrl = String(catalogGift?.imageUrl || "").trim();

  useEffect(() => {
    if (!imageUrl) return;

    setGiftImageRenderNonce((prev) => prev + 1);

    Image.prefetch(imageUrl).catch(() => {});
  }, [imageUrl]);

   function finishGiftReveal() {
    reveal.setValue(1);
    pulse.setValue(0);
    floatY.setValue(0);

    const showFinalGift = () => {
      setGiftImageRenderNonce((prev) => prev + 1);
      setRevealPlaying(false);
      setShowValue(true);
    };

    if (!imageUrl) {
      showFinalGift();
      return;
    }

    Image.prefetch(imageUrl)
      .catch(() => {})
      .finally(() => {
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(showFinalGift);
          });
        });
      });
  }

  function replayGiftReveal() {
    if (!opened || revealPlaying) return;

    setRevealPlaying(false);

    requestAnimationFrame(() => {
      setRevealPlaying(true);
    });
  }

  // Particles for unboxing effect
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      const tx = Math.cos(angle) * 50;
      const ty = Math.sin(angle) * 50 - 20;
      particles.push(
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, tx] }) },
                { translateY: particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, ty] }) },
                { scale: particleScale },
              ],
              opacity: particleAnim,
              backgroundColor: i % 2 === 0 ? RBZ.gold : RBZ.c2,
            },
          ]}
        />
      );
    }
    return particles;
  };

   return (
    <Pressable
      onPress={!opened && !isMine ? openGift : replayGiftReveal}
      onLongPress={onLongPress}
      delayLongPress={260}
      style={[
        styles.shell,
        isMine ? styles.shellMine : styles.shellPeer,
        !isMine && !opened && styles.unopenedShell,
        revealPlaying && styles.revealOnlyShell,
      ]}
    >
      {/* Premium gradient background */}
      <View style={styles.gradientBg} />

      {/* Glow effects */}
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      {revealPlaying ? (
        <ChatGiftRevealAnimation
          imageUrl={imageUrl}
          giftId={gift?.giftId}
          transactionId={gift?.transactionId}
          onDone={finishGiftReveal}
        />
      ) : (
        <>
          {/* Shining ring animation */}
          {!opened && !isMine && (
            <Animated.View style={[styles.shineRing, shineTransform]}>
              <View style={styles.shineRingInner} />
            </Animated.View>
          )}

          {/* Particles on unbox */}
          {!isMine && renderParticles()}

          {/* Sparkles on unbox */}
          {!isMine && (
            <Animated.View style={[styles.sparkles, { opacity: sparkleScale, transform: [{ scale: sparkleScale }] }]}>
              <Ionicons name="sparkles" size={24} color={RBZ.gold} />
              <Ionicons name="star" size={18} color={RBZ.c2} style={styles.sparkleOffset} />
            </Animated.View>
          )}

          {/* Header with premium badge */}
          <View style={styles.headerRow}>
        <View style={[styles.headerIcon, opened && styles.headerIconOpened]}>
          <Ionicons
            name={opened ? "diamond" : "gift"}
            size={16}
            color={RBZ.white}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {isMine
              ? `✨ Gift sent to ${receiverName || "them"}`
              : opened
                ? `🎁 Gift from ${senderName || "Someone"}`
                : `💝 ${senderName || "Someone"} sent you a gift`}
          </Text>

          <Text style={styles.subtitle} numberOfLines={1}>
            {isMine
              ? "Delivered with love"
              : opened
                ? "Unboxed with joy ✨"
                : "Tap to reveal your surprise"}
          </Text>
        </View>

        {!opened && !isMine && priceBC > 0 && (
          <View style={styles.mysteryPill}>
            <Ionicons name="help-circle" size={10} color={RBZ.gold} />
            <Text style={styles.mysteryText}>????</Text>
          </View>
        )}

        {opened && priceBC > 0 && showValue && (
          <View style={styles.pricePill}>
            <Ionicons name="diamond" size={12} color={RBZ.gold} />
            <Text style={styles.priceText}>{priceBC} BC</Text>
          </View>
        )}
      </View>

      {/* Gift Stage */}
      <View style={styles.stage}>
              {!opened ? (
          <Pressable onPress={!isMine ? openGift : undefined} style={styles.closedGiftWrapper}>
            <Animated.View style={[styles.closedGift, imageAnim]}>
              {/* Ribbon decoration */}
              <Animated.View style={[styles.ribbonTop, ribbonTransform]}>
                <View style={styles.ribbonBow} />
              </Animated.View>
              
              <View style={styles.giftBox}>
                <Ionicons name="gift" size={52} color={RBZ.c2} />
                <View style={styles.giftLid} />
              </View>
              
              {!isMine && (
                <Animated.View style={[styles.unboxBtn, imageAnim]}>
                  <Text style={styles.unboxText}>UNBOX ✨</Text>
                </Animated.View>
              )}
              
                           {isMine && (
                <View style={styles.sentBadge}>
                  <Text style={styles.sentBadgeText}>Sent with love</Text>
                </View>
              )}
            </Animated.View>
          </Pressable>
              ) : (
          <View style={styles.revealedGift}>
            {imageUrl ? (
              <View style={styles.giftImageContainer}>
                <Image
                  key={`${gift?.transactionId || gift?.giftId || "gift"}-${giftImageRenderNonce}`}
                  source={{ uri: imageUrl }}
                  style={styles.giftImage}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </View>
               ) : (
              <View style={styles.fallbackGift}>
                <Ionicons name="diamond" size={64} color={RBZ.gold} />
                <Ionicons name="sparkles" size={28} color={RBZ.c2} style={styles.fallbackSparkle} />
              </View>
            )}
          </View>
        )}
      </View>

           {/* Footer with premium message */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {catalogGift?.animated ? "⭐ Click to view" : "💎 Premium gift"}
            </Text>
            <View style={styles.footerHeart}>
              <Ionicons name="heart" size={12} color={RBZ.c2} />
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: Math.min(260, SCREEN_WIDTH * 0.7),
    borderRadius: 28,
    padding: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    backgroundColor: RBZ.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
   unopenedShell: {
    borderWidth: 1.5,
    borderColor: RBZ.gold,
    shadowColor: RBZ.gold,
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  revealOnlyShell: {
    minHeight: 264,
    padding: 12,
    borderColor: "rgba(212,175,55,0.48)",
    shadowColor: RBZ.gold,
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  shellMine: {
    backgroundColor: "#FFF8F0",
  },
  shellPeer: {
    backgroundColor: "#FFFFFF",
  },
   gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: "rgba(255,245,248,0.82)",
  },
  glowOne: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    top: -50,
    right: -45,
    backgroundColor: "rgba(216,52,95,0.12)",
  },
  glowTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    bottom: -50,
    left: -45,
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  shineRing: {
    position: "absolute",
    top: "30%",
    left: "25%",
    width: "50%",
    height: "40%",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.4)",
    borderStyle: "dashed",
  },
  shineRingInner: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 2,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerIconOpened: {
    backgroundColor: RBZ.gold,
    shadowColor: RBZ.gold,
  },
  title: {
    color: RBZ.ink,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: RBZ.gray,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  mysteryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  mysteryText: {
    color: RBZ.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  priceText: {
    color: RBZ.gold,
    fontSize: 11,
    fontWeight: "900",
  },
  stage: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    zIndex: 2,
  },
  closedGiftWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  closedGift: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  giftBox: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  giftLid: {
    position: "absolute",
    top: -8,
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: RBZ.c2,
  },
  ribbonTop: {
    position: "absolute",
    top: -12,
    zIndex: 5,
  },
  ribbonBow: {
    width: 20,
    height: 16,
    backgroundColor: RBZ.gold,
    borderRadius: 10,
    transform: [{ rotate: "45deg" }],
  },
  unboxBtn: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: RBZ.c2,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  unboxText: {
    color: RBZ.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  sentBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  sentBadgeText: {
    color: RBZ.gold,
    fontSize: 10,
    fontWeight: "700",
  },
  revealedGift: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  giftImageContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "transparent",
  },
  giftImage: {
    width: 120,
    height: 120,
    backgroundColor: "transparent",
    position: "relative",
    zIndex: 5,
    elevation: 5,
    opacity: 1,
  },
  fallbackGift: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fallbackSparkle: {
    position: "absolute",
    top: -10,
    right: -15,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    zIndex: 2,
  },
  footerText: {
    color: RBZ.gray,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  footerHeart: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,52,95,0.08)",
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    top: "50%",
    left: "50%",
    marginLeft: -3,
    marginTop: -3,
  },
  sparkles: {
    position: "absolute",
    top: "20%",
    left: "35%",
    zIndex: 10,
    flexDirection: "row",
  },
  sparkleOffset: {
    position: "absolute",
    top: -20,
    left: 20,
  },
});