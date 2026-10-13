/**
 * 📁 File: src/features/onboarding/FirstSignupTour.tsx
 * 🎯 Purpose: Present RomBuzz's eight-page feature tour.
 * Used by: First-signup onboarding and Settings replay.
 * Preserves: Account-scoped completion, skip, back, and replay behavior.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useRomBuzzTypography } from "@/src/design/rombuzzTypography";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createFirstSignupTourStyles } from "./FirstSignupTour.styles";
import FirstSignupTourPreview from "./FirstSignupTourPreview";
import { FIRST_SIGNUP_TOUR_STEPS } from "./firstSignupTourSteps";
import { useFirstSignupTour } from "./useFirstSignupTour";

const HEADINGS = {
  home: "Start with your vibe",
  discover: "Meet your next connection",
  microbuzz: "Connect in the moment",
  letsbuzz: "See more of your matches",
  chat: "Keep the conversation going",
  social: "See who’s connecting",
  notifications: "Stay in the loop",
  profile: "Make it yours",
};

export default function FirstSignupTour() {
  const { colors, isDark } = useRomBuzzTheme();
  const fontsLoaded = useRomBuzzTypography();
  const styles = useMemo(() => createFirstSignupTourStyles(colors), [colors]);
  const { visible, entry, complete } = useFirstSignupTour();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const total = FIRST_SIGNUP_TOUR_STEPS.length;
  const step = FIRST_SIGNUP_TOUR_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isReplay = entry === "settings";

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    fade.setValue(0);
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fade, index]);

  const goBack = () => {
    if (!isFirst) setIndex((current) => current - 1);
  };

  const goNext = async () => {
    if (isLast) {
      await complete();
      return;
    }
    setIndex((current) => Math.min(current + 1, total - 1));
  };

  const handleRequestClose = () => {
    if (isReplay) {
      void complete();
      return;
    }
    goBack();
  };

  if (!fontsLoaded) return null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleRequestClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>
              Rom<Text style={styles.brandAccent}>Buzz</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isReplay ? "Close Tour" : "Skip Tour"}
              onPress={() => void complete()}
              style={({ pressed }) => [
                styles.closeButton, pressed && styles.pressed,
              ]}
            >
              <Text style={styles.closeText}>{isReplay ? "Close" : "Skip"}</Text>
            </Pressable>
          </View>

          <Animated.View style={[styles.body, { opacity: fade }]}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title} accessibilityRole="header">
                {HEADINGS[step.preview]}
              </Text>
              <Text style={styles.kicker}>{step.title.toUpperCase()}</Text>

              <View style={styles.previewWrap}>
                <FirstSignupTourPreview preview={step.preview} />
              </View>

              <Text style={styles.description}>{step.description}</Text>
              <Text style={styles.hintText}>{step.hint}</Text>
            </ScrollView>
          </Animated.View>

          <View style={styles.footer}>
            <View
              style={styles.progressRow}
              accessible
              accessibilityLabel={`Tour page ${index + 1} of ${total}`}
            >
              <Text style={styles.counter}>{index + 1} / {total}</Text>
              <View style={styles.dots}>
                {FIRST_SIGNUP_TOUR_STEPS.map((item, position) => (
                  <View
                    key={item.id}
                    style={[
                      styles.dot,
                      position === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.bottomBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous tour page"
                disabled={isFirst}
                onPress={goBack}
                style={({ pressed }) => [
                  styles.backButton,
                  isFirst && styles.backDisabled,
                  pressed && !isFirst && styles.pressed,
                ]}
              >
                <Text style={styles.backText}>Back</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isLast ? "Finish tour" : "Next tour page"}
                onPress={() => void goNext()}
                style={({ pressed }) => [
                  styles.nextButton, pressed && styles.pressed,
                ]}
              >
                <Text style={styles.nextText}>{isLast ? "Let’s go" : "Next"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}