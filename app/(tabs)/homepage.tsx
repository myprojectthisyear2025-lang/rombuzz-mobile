/**
 * ============================================================================
 * 📁 File: app/(tabs)/home.tsx
 * 🎯 Screen: RomBuzz Mobile — Home Hub (Complete Version)
 *
 * YOU GET:
 *  - Top-left: ❤️ Let'sBuzz (Home-only)
 *  - Top-right: Filter + 👑 Upgrade (detached crown)
 *  - Center: MicroBuzz + Discover (big premium cards)
 *  - Bottom bar: ALWAYS visible (handled by app/(tabs)/_layout.tsx)
 *
 * NOTE:
 *  - Uses ONLY your palette:
 *    ["#b1123c", "#d8345f", "#e9486a", "#b5179e"]
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
} as const;

const logo = require("@/assets/images/logo.png");
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();


  // Home logo behavior (tap = scroll, double tap = instant)
  const lastTapRef = useRef<number>(0);

  // Crown respect rule (no animation if recently opened)
  const [upgradeOpenedRecently, setUpgradeOpenedRecently] = useState(false);

  // Let'sBuzz pulse animation control
  const [letsBuzzPulsing, setLetsBuzzPulsing] = useState(false);

const [firstName, setFirstName] = useState<string>("");

useEffect(() => {
  const loadUser = async () => {
    try {
      const raw = await AsyncStorage.getItem("RBZ_USER");
      if (!raw) return;

      const user = JSON.parse(raw);
      if (user?.firstName) {
        setFirstName(user.firstName);
      }
    } catch (err) {
      console.warn("Failed to load user for home greeting");
    }
  };

  loadUser();
}, []);

  const scrollToTop = (instant = false) => {
    scrollRef.current?.scrollTo({ y: 0, animated: !instant });
  };

  const onHomeLogoPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 260) {
      scrollToTop(true);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    scrollToTop(false);
  };

  const openUpgrade = () => {
    setUpgradeOpenedRecently(true);
    // reset after a bit (simple respect rule)
    setTimeout(() => setUpgradeOpenedRecently(false), 15000);
    router.push("/upgrade");
  };

return (
  <SafeAreaView style={styles.safe}>
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />


      {/* ================= TOP BAR (HOME ONLY) ================= */}
<View style={[styles.topBar, { paddingTop: insets.top }]}>
        {/* Left: Let'sBuzz with conditional pulse */}
        <Pressable
          onPress={() => router.push("/letsbuzz")}
          style={[styles.topIconBtn, letsBuzzPulsing && styles.pulsingBtn]}
          hitSlop={10}
        >
          <Ionicons name="heart" size={24} color={RBZ.c3} />
        </Pressable>

        {/* Center brand chip + scroll behavior */}
        <Pressable onPress={onHomeLogoPress} style={styles.topCenter} hitSlop={10}>
          <View style={styles.brandChip}>
            <Image source={logo} style={styles.brandLogo} />
            <Text style={styles.brandText}>RomBuzz</Text>
          </View>
        </Pressable>

        {/* Right: Filter + Crown (detached) */}
        <View style={styles.topRight}>
          <Pressable
            onPress={() => router.push("/filter")}
            style={styles.topIconBtn}
            hitSlop={10}
          >
            <Ionicons name="options" size={22} color={RBZ.white} />
          </Pressable>

          {/* Crown slightly detached (NOT flush) */}
          <Pressable
            onPress={openUpgrade}
            style={[styles.topIconBtn, styles.crownDetached]}
            hitSlop={10}
          >
            <Ionicons
              name={upgradeOpenedRecently ? "diamond-outline" : "diamond"}
              size={22}
              color={RBZ.white}
            />
          </Pressable>
        </View>
      </View>

      {/* ================= CONTENT ================= */}
     <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 90 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >

        {/* HERO */}
        <View style={styles.hero}>
          {/* soft orbs (palette only) */}
          <View style={[styles.orb, styles.orbA]} />
          <View style={[styles.orb, styles.orbB]} />
          <View style={[styles.orb, styles.orbC]} />

          <View style={styles.heroHeader}>
            <Image source={logo} style={styles.heroLogo} />
            <Text style={styles.heroTitle}>
                  Hey{" "}
                  <Text style={styles.heroName}>
                    {firstName}
                  </Text>{" "}
                  👋Bitch
                </Text>

            <Text style={styles.heroSub}>
              Ready to make real connections?

            </Text>
          </View>

          {/* Center cards */}
          <View style={styles.cardGrid}>
           <Pressable
                onPress={() => router.push("/(tabs)/microbuzz")}
                style={({ pressed }) => [
                  styles.bigCard,
                  styles.cardMicro,
                  pressed && styles.cardPressed,
                ]}
              >

              <View style={styles.cardTopRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="flash" size={22} color={RBZ.white} />
                </View>
                <View style={styles.liveChip}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>MicroBuzz</Text>
              <Text style={styles.cardDesc}>
                Go live now - match in real time with nearby users. Instant connections.
              </Text>

              <View style={styles.cardCTA}>
                <Text style={styles.cardCTAText}>Real-time matching</Text>
                <Ionicons name="arrow-forward" size={18} color={RBZ.white} />
              </View>
            </Pressable>

            <Pressable
                onPress={() => router.push("/(tabs)/discover")}
                style={({ pressed }) => [
                  styles.bigCard,
                  styles.cardDiscover,
                  pressed && styles.cardPressed,
                ]}
              >

              <View style={styles.cardTopRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="compass" size={22} color={RBZ.white} />
                </View>
              </View>

              <Text style={styles.cardTitle}>Discover</Text>
              <Text style={styles.cardDesc}>
                Explore matches - clean filters, calm swipes, better intent.
              </Text>

              <View style={styles.cardCTA}>
                <Text style={styles.cardCTAText}>Start swiping</Text>
                <Ionicons name="arrow-forward" size={18} color={RBZ.white} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* WHY ROMBUZZ (simple, premium, not noisy) */}
        <View style={styles.whyWrap}>
          <Text style={styles.sectionTitle}>
            Why choose <Text style={styles.sectionBrand}>RomBuzz</Text>?
          </Text>
          <Text style={styles.sectionSub}>
Experience dating that feels natural, spontaneous, and authentic where Romance meets Buzz.          </Text>

          <View style={styles.whyList}>
            <WhyCard
              icon="people"
              title="Meet Real People"
              desc="Discover authentic connections with people who share your interests and are ready to meet now."
            />
            <WhyCard
              icon="chatbubble"
              title="Instant connection"
              desc="Start meaningful conversations instantly with real-time matching and live chat features."
            />
            <WhyCard
              icon="shield-checkmark"
              title="Safe & Secure"
              desc="Your privacy and safety are our top priority with verified profiles and secure communication."
            />

          </View>
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

function WhyCard({
  icon,
  title,
  desc,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.whyCard}>
      <View style={styles.whyIcon}>
        <Ionicons name={icon} size={22} color={RBZ.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.whyTitle}>{title}</Text>
        <Text style={styles.whyDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
  flex: 1,
  backgroundColor: RBZ.c1,
},
screen: {
  flex: 1,
  backgroundColor: RBZ.c1,
},
  
  // Top Bar
 topBar: {
  height: 58,
  paddingHorizontal: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: RBZ.c1,
  borderBottomWidth: 1,
  borderBottomColor: RBZ.c2,
},
  topIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: RBZ.c3,
  },
  pulsingBtn: {
    borderColor: RBZ.c3,
    shadowColor: RBZ.c3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  topCenter: { flex: 1, alignItems: "center" },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: RBZ.c3,
  },
  brandLogo: { width: 18, height: 18, resizeMode: "contain" },
  brandText: { color: RBZ.white, fontWeight: "900", letterSpacing: 0.4 },

  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  crownDetached: {
    marginLeft: 6,
    backgroundColor: RBZ.c4,
  },

  // Hero Section
 hero: {
  paddingHorizontal: 16,
  paddingTop: 22,
  paddingBottom: 26,
  overflow: "hidden",
  backgroundColor: RBZ.c1,
},
  orb: { position: "absolute", borderRadius: 999, opacity: 0.35 },
  orbA: { width: 220, height: 220, backgroundColor: RBZ.c4, top: -70, left: -70 },
  orbB: { width: 260, height: 260, backgroundColor: RBZ.c3, bottom: -90, right: -90 },
  orbC: { width: 160, height: 160, backgroundColor: RBZ.c2, top: 40, right: -60 },

  heroHeader: { alignItems: "center", paddingTop: 8, paddingBottom: 14 },
  heroLogo: { width: 64, height: 64, resizeMode: "contain", marginBottom: 10 },
  heroTitle: { color: RBZ.white, fontSize: 26, fontWeight: "900" },
  heroName: { color: RBZ.c3 },
  heroSub: {
    marginTop: 8,
    color: RBZ.white,
    opacity: 0.9,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
    fontWeight: "600",
  },

  // Cards
  cardGrid: { gap: 12, marginTop: 10 },
  bigCard: {
    borderRadius: 24,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: RBZ.c3,
  },
cardMicro: {
  backgroundColor: RBZ.c2,
  shadowColor: RBZ.c3,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 14,
  elevation: 8,
}, 
cardDiscover: {
  backgroundColor: RBZ.c2,
  opacity: 0.95,
},

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: RBZ.c1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RBZ.c3,
  },

  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: RBZ.c1,
    borderWidth: 1,
    borderColor: RBZ.c3,
  },
  liveDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: RBZ.c3 },
  liveText: { color: RBZ.white, fontWeight: "900", letterSpacing: 0.5, fontSize: 12 },

  cardTitle: { color: RBZ.white, fontWeight: "900", fontSize: 20, marginBottom: 6 },
  cardDesc: { color: RBZ.white, opacity: 0.9, lineHeight: 19, fontWeight: "600" },

  cardCTA: {
  marginTop: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: 18,
  backgroundColor: RBZ.c1,
  borderWidth: 1,
  borderColor: RBZ.c3,
},

  cardCTAText: { color: RBZ.white, fontWeight: "900" },

  // Why Section
 whyWrap: {
  paddingHorizontal: 16,
  paddingTop: 26,
  paddingBottom: 28,
  backgroundColor: RBZ.white,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  marginTop: 8,
},

sectionTitle: {
  color: RBZ.c1,
  fontSize: 22,
  fontWeight: "900",
  marginBottom: 6,
},

  sectionBrand: { color: RBZ.c3 },
  sectionSub: {
  marginTop: 6,
  color: RBZ.c2,
  lineHeight: 20,
  fontWeight: "600",
},

cardPressed: {
  transform: [{ scale: 0.97 }],
  opacity: 0.9,
},

  whyList: { marginTop: 14, gap: 10 },
  whyCard: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
  padding: 16,
  borderRadius: 20,
  backgroundColor: RBZ.white,
  borderWidth: 1,
  borderColor: RBZ.c2,
  shadowColor: RBZ.c2,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 4,
},

  whyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: RBZ.c4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RBZ.c3,
  },
whyTitle: {
  color: RBZ.c1,
  fontWeight: "900",
  marginBottom: 4,
},
whyDesc: {
  color: RBZ.c2,
  lineHeight: 18,
  fontWeight: "600",
},
});