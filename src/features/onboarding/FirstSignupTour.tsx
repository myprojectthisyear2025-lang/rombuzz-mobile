/**
 * ============================================================
 * 📁 File: src/features/onboarding/FirstSignupTour.tsx
 * 🎯 Purpose: One-time feature tour shown after genuine signup.
 *
 * Usage:
 *   Mounted once in the authenticated tabs layout.
 *   It never auto-opens feature screens or permission prompts.
 * ============================================================
 */

import {
    Ionicons,
} from "@expo/vector-icons";
import {
    LinearGradient,
} from "expo-linear-gradient";
import {
    StatusBar,
} from "expo-status-bar";
import React, {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Image,
    Modal,
    Pressable,
    Text,
    View,
} from "react-native";
import {
    SafeAreaView,
} from "react-native-safe-area-context";
import {
    firstSignupTourStyles as styles,
} from "./FirstSignupTour.styles";
import {
    FIRST_SIGNUP_TOUR_STEPS,
} from "./firstSignupTourSteps";
import {
    useFirstSignupTour,
} from "./useFirstSignupTour";

const logo =
  require("@/assets/images/logo.png");

export default function FirstSignupTour() {
  const {
    visible,
    complete,
  } = useFirstSignupTour();

  const [index, setIndex] =
    useState(0);

  const fade =
    useRef(
      new Animated.Value(1)
    ).current;

  const step =
    FIRST_SIGNUP_TOUR_STEPS[index];

  const isFirst =
    index === 0;

  const isLast =
    index ===
    FIRST_SIGNUP_TOUR_STEPS.length - 1;

  useEffect(() => {
    fade.setValue(0);

    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [
    fade,
    index,
  ]);

  const goBack = () => {
    if (!isFirst) {
      setIndex(
        (current) => current - 1
      );
    }
  };

  const goNext = async () => {
    if (isLast) {
      await complete();
      return;
    }

    setIndex(
      (current) => current + 1
    );
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={goBack}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar style="dark" />

        <View style={styles.screen}>
          <View style={styles.topRow}>
            <Text style={styles.brand}>
              RomBuzz
            </Text>

            <Pressable
              onPress={complete}
              style={styles.skipButton}
            >
              <Text
                style={styles.skipText}
              >
                Skip tour
              </Text>
            </Pressable>
          </View>

          <Animated.View
            style={[
              styles.body,
              {
                opacity: fade,
              },
            ]}
          >
            <Text
              style={styles.eyebrow}
            >
              WELCOME TO ROMBUZZ
            </Text>

            <LinearGradient
              colors={[
                "#B1123C",
                "#D8345F",
                "#E9486A",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.iconHalo}
            >
              <View
                style={styles.iconInner}
              >
                {"useLogo" in step &&
                step.useLogo ? (
                  <Image
                    source={logo}
                    style={styles.logo}
                  />
                ) : "icon" in step ? (
                  <Ionicons
                    name={step.icon}
                    size={48}
                    color="#FFFFFF"
                  />
                ) : null}
              </View>
            </LinearGradient>

            <Text style={styles.title}>
              {step.title}
            </Text>

            <Text
              style={styles.description}
            >
              {step.description}
            </Text>

            <View
              style={styles.progressRow}
            >
              {FIRST_SIGNUP_TOUR_STEPS.map(
                (
                  item,
                  itemIndex
                ) => (
                  <View
                    key={item.id}
                    style={[
                      styles.dot,
                      itemIndex === index &&
                        styles.dotActive,
                    ]}
                  />
                )
              )}
            </View>

            <Text
              style={styles.counter}
            >
              {index + 1} of{" "}
              {
                FIRST_SIGNUP_TOUR_STEPS.length
              }
            </Text>
          </Animated.View>

          <View
            style={styles.bottomRow}
          >
            <Pressable
              accessibilityRole="button"
              disabled={isFirst}
              onPress={goBack}
              style={({ pressed }) => [
                styles.backButton,
                isFirst &&
                  styles.backDisabled,
                pressed && !isFirst
                  ? styles.pressed
                  : null,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#B1123C"
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={goNext}
              style={({ pressed }) => [
                styles.nextButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={styles.nextText}
              >
                {isLast
                  ? "Start Buzzing"
                  : "Next"}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}