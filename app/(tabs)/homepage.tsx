/**
 * ============================================================================
 * 📁 File: app/(tabs)/home.tsx
 * 🎯 Screen: RomBuzz — Premium Dating Hub (Redesigned)
 * 
 * REDESIGN FEATURES:
 *  - Ultra-modern gradient header with fluid design
 *  - Enhanced MicroBuzz & Discover cards with 3D effects
 *  - Clean bottom tab navigation (5 buttons only)
 *  - Sophisticated typography and spacing
 *  - Premium animations and interactive elements
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c1: "#b1123c", // Primary deep red
  c2: "#d8345f", // Secondary pink-red
  c3: "#e9486a", // Light pink-red
  c4: "#ff7b9c", // Very light pink
  c5: "#ffa6bc", // Subtle pink
  white: "#ffffff",
  black: "#1a1a1a",
  gray: "#f8f9fa",
  darkGray: "#6c757d",
} as const;

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [firstName, setFirstName] = useState<string>("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [refreshing, setRefreshing] = useState(false);

  const refreshHome = async () => {
    try {
      setRefreshing(true);

      const raw = await SecureStore.getItemAsync("RBZ_USER");
      if (!raw) return;

      const user = JSON.parse(raw);
      if (user?.firstName) setFirstName(user.firstName);
    } catch (e) {
      console.warn("Home refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await SecureStore.getItemAsync("RBZ_USER");
        if (!raw) return;
        const user = JSON.parse(raw);
        if (user?.firstName) setFirstName(user.firstName);
      } catch (err) {
        console.warn("Failed to load user for home greeting");
      }
    };
    loadUser();

    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* GRADIENT HEADER WITH FLUID DESIGN */}
      <LinearGradient
        colors={[RBZ.c1, RBZ.c2, RBZ.c3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        {/* Fluid background effect */}
        <View style={styles.fluidBackground}>
          <View style={[styles.fluidCircle, styles.fluidCircle1]} />
          <View style={[styles.fluidCircle, styles.fluidCircle2]} />
          <View style={[styles.fluidCircle, styles.fluidCircle3]} />
        </View>

        {/* HEADER CONTENT */}
        <View style={styles.headerContent}>
          {/* Left: Let'sBuzz with enhanced styling */}
          <Pressable
            onPress={() => router.push("/letsbuzz")}
            style={({ pressed }) => [
              styles.headerButton,
              styles.heartButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={[RBZ.c3, RBZ.c2]}
              style={styles.headerButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="heart" size={22} color={RBZ.white} />
            </LinearGradient>
          </Pressable>

          {/* Center: Brand Name Only (Logo Removed) */}
          <View style={styles.brandCenter}>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>RomBuzz</Text>
              <View style={styles.taglineContainer}>
                <Text style={styles.brandTagline}>Romance & Buzz</Text>
              </View>
            </View>
          </View>

          {/* Right: Premium Button */}
          <Pressable
            onPress={() => router.push("/upgrade")}
            style={({ pressed }) => [
              styles.headerButton,
              styles.premiumButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.headerButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={22} color="#8B4513" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* WELCOME SECTION WITH ANIMATION */}
        <Animated.View 
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.welcomeText}>
            Hey{firstName ? ` ${firstName}` : ''} !
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* MAIN CONTENT - Premium Scroll */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHome}
            tintColor={RBZ.c1}
          />
        }
      >
        {/* MAIN ACTION CARDS IN ROW */}
        <Animated.View 
          style={[
            styles.mainCardsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.cardsRow}>
            {/* MicroBuzz Card - Compact Version */}
            <Pressable
              onPress={() => router.push("/(tabs)/microbuzz")}
              style={({ pressed }) => [
                styles.compactCard,
                styles.microbuzzCard,
                pressed && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={[RBZ.c2, RBZ.c3]}
                style={styles.compactCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Card Glow Effect */}
                <View style={styles.compactCardGlow} />
                
                <View style={styles.compactCardHeader}>
                  <View style={styles.compactCardIconContainer}>
                    <View style={styles.compactCardIconGlow} />
                    <LinearGradient
                      colors={[RBZ.c1, RBZ.c2]}
                      style={styles.compactCardIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="flash" size={24} color={RBZ.white} style={styles.iconCenter} />
                    </LinearGradient>
                  </View>
                  <View style={styles.liveBadgePremium}>
                    <View style={styles.livePulsePremium} />
                    <Text style={styles.liveTextPremium}>Instant</Text>
                  </View>
                </View>

                <Text style={styles.compactCardTitle}>MicroBuzz</Text>
                <Text style={styles.compactCardDescription}>
                  Instant real-time matching with people nearby.
                </Text>

                <LinearGradient
                  colors={[RBZ.c1, RBZ.c2]}
                  style={styles.compactCardCTA}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.compactCTAText}>Go Live</Text>
                </LinearGradient>
              </LinearGradient>
            </Pressable>

            {/* Discover Card - Compact Version */}
            <Pressable
              onPress={() => router.push("/(tabs)/discover")}
              style={({ pressed }) => [
                styles.compactCard,
                styles.discoverCard,
                pressed && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={['#9c27b0', '#673ab7']}
                style={styles.compactCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.compactCardGlow} />
                
                <View style={styles.compactCardHeader}>
                  <View style={styles.compactCardIconContainer}>
                    <View style={styles.compactCardIconGlow} />
                    <LinearGradient
                      colors={['#7b1fa2', '#9c27b0']}
                      style={styles.compactCardIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="compass" size={24} color={RBZ.white} style={styles.iconCenter} />
                    </LinearGradient>
                  </View>
                  <View style={styles.matchBadgePremium}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.matchTextPremium}>Tuned</Text>
                  </View>
                </View>

                <Text style={styles.compactCardTitle}>Discover</Text>
                <Text style={styles.compactCardDescription}>
                  Find perfect matches based on your preferences.
                </Text>

                           <LinearGradient
                  colors={['#7b1fa2', '#9c27b0']}
                  style={styles.compactCardCTA}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.compactCTAText}>Find Match</Text>
                </LinearGradient>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        {/* ROMBUZZ PULSE - REAL APP SHORTCUTS */}
        <View style={styles.pulseSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionMiniLabel}>Your RomBuzz pulse</Text>
              <Text style={styles.sectionTitleClean}>Pick your next vibe</Text>
            </View>

            <View style={styles.sectionHeartPill}>
              <Ionicons name="heart" size={16} color={RBZ.c1} />
            </View>
          </View>

          <View style={styles.pulseGrid}>
            <Pressable
              onPress={() => router.push("/(tabs)/microbuzz")}
              style={({ pressed }) => [
                styles.pulseTile,
                pressed && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={["rgba(216,52,95,0.14)", "rgba(255,123,156,0.08)"]}
                style={styles.pulseIconWrap}
              >
                <Ionicons name="radio" size={24} color={RBZ.c1} />
              </LinearGradient>
              <Text style={styles.pulseTitle}>Nearby energy</Text>
              <Text style={styles.pulseText}>See who is active around you.</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/discover")}
              style={({ pressed }) => [
                styles.pulseTile,
                pressed && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={["rgba(156,39,176,0.14)", "rgba(103,58,183,0.08)"]}
                style={styles.pulseIconWrap}
              >
                <Ionicons name="compass" size={24} color="#7B1FA2" />
              </LinearGradient>
              <Text style={styles.pulseTitle}>Curated matches</Text>
              <Text style={styles.pulseText}>Swipe through people who fit you.</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/chat")}
              style={({ pressed }) => [
                styles.pulseTile,
                pressed && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={["rgba(33,150,243,0.14)", "rgba(33,150,243,0.06)"]}
                style={styles.pulseIconWrap}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#1976D2" />
              </LinearGradient>
              <Text style={styles.pulseTitle}>Keep it warm</Text>
              <Text style={styles.pulseText}>Return to chats before the spark fades.</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              style={({ pressed }) => [
                styles.pulseTile,
                pressed && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={["rgba(76,175,80,0.14)", "rgba(76,175,80,0.06)"]}
                style={styles.pulseIconWrap}
              >
                <Ionicons name="person-circle" size={25} color="#2E7D32" />
              </LinearGradient>
              <Text style={styles.pulseTitle}>Polish profile</Text>
              <Text style={styles.pulseText}>Better photos create better starts.</Text>
            </Pressable>
          </View>
        </View>

        {/* SOFT TRUST CARD */}
        <View style={styles.promiseSection}>
          <View style={styles.promiseCard}>
            <View style={styles.promiseIcon}>
              <Ionicons name="shield-checkmark" size={23} color="#2E7D32" />
            </View>

            <View style={styles.promiseTextWrap}>
              <Text style={styles.promiseTitle}>Romance without the chaos.</Text>
              <Text style={styles.promiseText}>
                Verified profiles, reporting tools, blocking, and real-time safety
                signals stay close without crowding your experience.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RBZ.white,
  },
  
  // Premium Header with Fluid Design
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 4,
    overflow: 'hidden',
    shadowColor: RBZ.c1,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  
  fluidBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  
  fluidCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  
  fluidCircle1: {
    width: 300,
    height: 300,
    backgroundColor: RBZ.white,
    top: -150,
    right: -100,
  },
  
  fluidCircle2: {
    width: 200,
    height: 200,
    backgroundColor: RBZ.c4,
    bottom: -50,
    left: -50,
  },
  
  fluidCircle3: {
    width: 150,
    height: 150,
    backgroundColor: RBZ.c5,
    top: 50,
    right: 50,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    zIndex: 1,
  },
  
  headerButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  headerButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  
  heartButton: {
    shadowColor: RBZ.c2,
  },
  
  premiumButton: {
    shadowColor: '#FFD700',
  },
  
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  
  brandCenter: {
    alignItems: 'center',
  },
  
  brandTextContainer: {
    alignItems: 'center',
  },
  
  brandName: {
    color: RBZ.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  
  brandTagline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  
  welcomeSection: {
    alignItems: 'center',
    zIndex: 1,
  },
  
  welcomeText: {
    color: RBZ.white,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // Main Content
  content: {
    flex: 1,
  },
  
  contentContainer: {
    paddingTop: 15,
    paddingBottom: 40,
  },
  
  // Main Cards Section - In Row
  mainCardsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  compactCard: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    minHeight: 220,
  },
  
  compactCardGradient: {
    padding: 18,
    borderRadius: 22,
    flex: 1,
    justifyContent: 'space-between',
  },
  
  compactCardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  microbuzzCard: {
    shadowColor: RBZ.c2,
  },
  
  discoverCard: {
    shadowColor: '#9c27b0',
  },
  
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  
 compactCardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

  
 compactCardIconContainer: {
  position: 'relative',
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
},

  
compactCardIconGlow: {
  position: 'absolute',
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
},

  
  compactCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  
  iconCenter: {
    textAlign: 'center',
  },
  
  liveBadgePremium: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: 'rgba(177, 18, 60, 0.9)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.35)',
},

  
  livePulsePremium: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  
 liveTextPremium: {
  color: RBZ.white,
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 0.4,
},

  
 matchBadgePremium: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: 'rgba(255, 215, 0, 0.22)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(255, 215, 0, 0.35)',
},

  
 matchTextPremium: {
  color: RBZ.white,
  fontSize: 10,
  fontWeight: '800',
},

  
  compactCardTitle: {
    color: RBZ.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  
  compactCardDescription: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  
  compactCardCTA: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  
     compactCTAText: {
    color: RBZ.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // Pulse Section
  pulseSection: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionMiniLabel: {
    color: RBZ.c2,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  sectionTitleClean: {
    color: '#351024',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  sectionHeartPill: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(216, 52, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  pulseTile: {
    width: (width - 52) / 2,
    minHeight: 150,
    borderRadius: 24,
    padding: 16,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: 'rgba(216, 52, 95, 0.09)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 7,
  },

  pulseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  pulseTitle: {
    color: '#351024',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },

  pulseText: {
    color: RBZ.darkGray,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Promise Card
  promiseSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  promiseCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 17,
    borderRadius: 24,
    backgroundColor: '#FFF7FB',
    borderWidth: 1,
    borderColor: 'rgba(216, 52, 95, 0.12)',
  },

  promiseIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  promiseTextWrap: {
    flex: 1,
  },

  promiseTitle: {
    color: '#351024',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },

  promiseText: {
    color: RBZ.darkGray,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
});