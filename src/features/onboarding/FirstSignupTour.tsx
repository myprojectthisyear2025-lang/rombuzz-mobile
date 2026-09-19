/**
 * Path: src/features/onboarding/FirstSignupTour.tsx
 * Purpose: Shared RomBuzz product Tour for genuine signup and Settings replay.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useRomBuzzTypography } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createFirstSignupTourStyles } from "./FirstSignupTour.styles";
import FirstSignupTourPreview from "./FirstSignupTourPreview";
import { FIRST_SIGNUP_TOUR_STEPS } from "./firstSignupTourSteps";
import { useFirstSignupTour } from "./useFirstSignupTour";

export default function FirstSignupTour() {
  const { colors, isDark } = useRomBuzzTheme();
  const fontsLoaded = useRomBuzzTypography();
  const styles = useMemo(() => createFirstSignupTourStyles(colors), [colors]);
  const { visible, entry, complete } = useFirstSignupTour();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const step = FIRST_SIGNUP_TOUR_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === FIRST_SIGNUP_TOUR_STEPS.length - 1;
  const isReplay = entry === "settings";

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [fade, index]);

  const goBack = () => {
    if (!isFirst) setIndex((current) => current - 1);
  };

  const goNext = async () => {
    if (isLast) {
      await complete();
      return;
    }
    setIndex((current) => current + 1);
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
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>Rom</Text>

              <Text
                style={[
                  styles.brand,
                  styles.brandAccent,
                ]}
              >
                Buzz
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isReplay
                  ? "Close Tour"
                  : "Skip Tour"
              }
              onPress={() =>
                void complete()
              }
              style={({
                pressed,
              }) => [
                styles.closeButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.closeText
                }
              >
                {isReplay
                  ? "Close"
                  : "Skip"}
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.progressWrap
            }
          >
            <View
              style={
                styles.progressRow
              }
            >
              {FIRST_SIGNUP_TOUR_STEPS.map(
                (
                  item,
                  itemIndex
                ) => (
                  <View
                    key={item.id}
                    style={[
                      styles.progressSegment,
                      {
                        backgroundColor:
                          itemIndex <=
                          index
                            ? colors.brand
                            : colors.borderStrong,
                      },
                    ]}
                  />
                )
              )}
            </View>
          </View>

          <Animated.View
            style={{
              flex: 1,
              opacity: fade,
            }}
          >
            <ScrollView
              style={
                styles.bodyScroll
              }
              contentContainerStyle={
                styles.bodyContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              <View
                style={
                  styles.stepMeta
                }
              >
                <View
                  style={
                    styles.kickerWrap
                  }
                >
                  <View
                    style={
                      styles.kickerIcon
                    }
                  >
                    <Ionicons
                      name={step.icon}
                      size={15}
                      color={
                        colors.brand
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.kicker
                    }
                  >
                    {step.kicker}
                  </Text>
                </View>

                <Text
                  style={
                    styles.counter
                  }
                >
                  {index + 1} /{" "}
                  {
                    FIRST_SIGNUP_TOUR_STEPS.length
                  }
                </Text>
              </View>

              <Text
                style={
                  styles.title
                }
              >
                {step.title}
              </Text>

              <Text
                style={
                  styles.description
                }
              >
                {step.description}
              </Text>

              <View
                style={
                  styles.previewWrap
                }
              >
                <FirstSignupTourPreview
                  preview={
                    step.preview
                  }
                />
              </View>

              <View
                style={
                  styles.hint
                }
              >
                <View
                  style={
                    styles.hintIcon
                  }
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color={
                      colors.brand
                    }
                  />
                </View>

                <Text
                  style={
                    styles.hintText
                  }
                >
                  {step.hint}
                </Text>
              </View>
            </ScrollView>
          </Animated.View>

          <View
            style={
              styles.bottomBar
            }
          >
            <Pressable
              accessibilityRole="button"
              disabled={isFirst}
              onPress={goBack}
              style={({
                pressed,
              }) => [
                styles.backButton,
                isFirst &&
                  styles.backDisabled,
                pressed &&
                  !isFirst &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={
                  colors.icon
                }
              />

              <Text
                style={
                  styles.backText
                }
              >
                Back
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                void goNext()
              }
              style={({
                pressed,
              }) => [
                styles.nextButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.nextText
                }
              >
                {isLast
                  ? "Start exploring"
                  : "Next"}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color={
                  colors.white
                }
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}