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

        {/* PREMIUM STATS DASHBOARD */}
        <View style={styles.statsDashboard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(248,249,250,0.98)']}
            style={styles.statsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statCard}>
              <LinearGradient
                colors={[RBZ.c4, RBZ.c5]}
                style={styles.statIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="infinite" size={28} color={RBZ.c1} />
              </LinearGradient>
              <Text style={styles.statBigNumber}>∞</Text>
              <Text style={styles.statLabelPremium}>Live Connections</Text>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={[RBZ.c4, RBZ.c5]}
                style={styles.statIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="time" size={28} color={RBZ.c1} />
              </LinearGradient>
              <Text style={styles.statBigNumber}>24/7</Text>
              <Text style={styles.statLabelPremium}>Active Matching</Text>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={[RBZ.c4, RBZ.c5]}
                style={styles.statIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="rocket" size={28} color={RBZ.c1} />
              </LinearGradient>
              <Text style={styles.statBigNumber}>0.3s</Text>
              <Text style={styles.statLabelPremium}>Response Time</Text>
            </View>
          </LinearGradient>
        </View>

        {/* WHY ROMBUZ - PREMIUM SECTION */}
        <View style={styles.whySectionPremium}>
          <Text style={styles.sectionTitlePremium}>Why Choose RomBuzz?</Text>
          
          <View style={styles.whyCardsPremium}>
            {[
              {
                icon: 'flash',
                title: 'Real-time Only',
                desc: 'Connect only with people who are online and ready to chat now. No waiting.',
                color: RBZ.c3
              },
              {
                icon: 'videocam',
                title: 'Video First',
                desc: 'See real people in real time. Authentic connections start with video.',
                color: '#2196F3'
              },
              {
                icon: 'shield-checkmark',
                title: 'Safe & Verified',
                desc: 'Every profile is verified. Your safety and privacy are our priority.',
                color: '#4CAF50'
              }
            ].map((item, index) => (
              <View key={index} style={styles.whyCardPremium}>
                <LinearGradient
                  colors={[item.color + '20', item.color + '10']}
                  style={styles.whyIconPremium}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </LinearGradient>
                <Text style={styles.whyTitlePremium}>{item.title}</Text>
                <Text style={styles.whyDescPremium}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* UPGRADE CTA - PREMIUM DESIGN */}
        <Pressable
          onPress={() => router.push("/upgrade")}
          style={({ pressed }) => [
            styles.upgradeCTAPremium,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            style={styles.upgradeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.upgradeGlow} />
            <View style={styles.upgradeContentPremium}>
              <View style={styles.sparkleContainer}>
                <Ionicons name="sparkles" size={28} color="#8B4513" />
              </View>
              <View style={styles.upgradeTextsPremium}>
                <Text style={styles.upgradeTitlePremium}>Unlock Premium Features</Text>
                <Text style={styles.upgradeSubtitlePremium}>
                  Priority matching, unlimited likes, and advanced filters
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={28} color="#8B4513" />
            </View>
          </LinearGradient>
        </Pressable>
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
  
  // Stats Dashboard
  statsDashboard: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  
  statsGradient: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  statBigNumber: {
    color: RBZ.c1,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 6,
  },
  
  statLabelPremium: {
    color: RBZ.darkGray,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  
  // Why Section Premium
  whySectionPremium: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  
  sectionTitlePremium: {
    color: RBZ.c1,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  
  whyCardsPremium: {
    gap: 18,
  },
  
  whyCardPremium: {
    backgroundColor: RBZ.white,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(216, 52, 95, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  
  whyIconPremium: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  
  whyTitlePremium: {
    color: RBZ.black,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  
  whyDescPremium: {
    color: RBZ.darkGray,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Upgrade CTA Premium
  upgradeCTAPremium: {
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  
  upgradeGradient: {
    padding: 25,
    borderRadius: 25,
  },
  
  upgradeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  upgradeContentPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  sparkleContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  upgradeTextsPremium: {
    flex: 1,
    marginHorizontal: 18,
  },
  
  upgradeTitlePremium: {
    color: '#8B4513',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  
  upgradeSubtitlePremium: {
    color: 'rgba(139, 69, 19, 0.85)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});