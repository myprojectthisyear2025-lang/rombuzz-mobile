/**
 * Path: src/features/microbuzz/MicroBuzzIncomingBuzz.tsx
 * Purpose: Centered incoming Buzz popup that overlays the MicroBuzz radar without changing Buzz actions.
 * Used by: app/(tabs)/microbuzz.tsx
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";

import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

type Props = {
  visible: boolean;
  selfieUrl?: string;
  name: string;
  age: string | number;
  onAvatarPress: () => void;
  onAccept: () => void;
  onNotNow: () => void;
  onIgnore: () => void;
  onReport: () => void;
};

export default function MicroBuzzIncomingBuzz({
  visible,
  selfieUrl,
  name,
  age,
  onAvatarPress,
  onAccept,
  onNotNow,
  onIgnore,
  onReport,
}: Props) {
  const {
    colors,
    isDark,
  } = useRomBuzzTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor:
              isDark
                ? "rgba(5,5,8,0.34)"
                : "rgba(23,23,28,0.18)",
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surfaceRaised,

              borderColor:
                colors.borderStrong,
            },
          ]}
        >
          <Pressable
            onPress={
              onAvatarPress
            }
            disabled={!selfieUrl}
            style={
              styles.avatarButton
            }
          >
            {selfieUrl ? (
              <Image
                source={{
                  uri: selfieUrl,
                }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  {
                    backgroundColor:
                      colors.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={
                    colors.iconMuted
                  }
                />
              </View>
            )}
          </Pressable>

          <View
            style={styles.content}
          >
            <View
              style={
                styles.eyebrowRow
              }
            >
              <View
                style={[
                  styles.signalDot,
                  {
                    backgroundColor:
                      colors.brand,
                  },
                ]}
              />

              <Text
                style={[
                  styles.eyebrow,
                  {
                    color:
                      colors.brand,
                  },
                ]}
              >
                Incoming Buzz
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.name,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {name}
              {age !== ""
                ? `, ${age}`
                : ""}
            </Text>

            <Text
              style={[
                styles.sub,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Wants to connect nearby
            </Text>

            <View
              style={styles.actions}
            >
              <Pressable
                onPress={onAccept}
                style={({
                  pressed,
                }) => [
                  styles.accept,
                  {
                    backgroundColor:
                      colors.brand,
                  },
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="heart"
                  size={15}
                  color={
                    colors.white
                  }
                />

                <Text
                  style={[
                    styles.acceptText,
                    {
                      color:
                        colors.white,
                    },
                  ]}
                >
                  Accept
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  onNotNow
                }
                style={({
                  pressed,
                }) => [
                  styles.secondary,
                  {
                    backgroundColor:
                      colors.surfaceMuted,

                    borderColor:
                      colors.border,
                  },
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.secondaryText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Not now
                </Text>
              </Pressable>
            </View>
          </View>

          <View
            style={
              styles.utilityActions
            }
          >
            <Pressable
              onPress={onReport}
              hitSlop={8}
              style={
                styles.utilityButton
              }
            >
              <Ionicons
                name="ellipsis-vertical"
                size={19}
                color={
                  colors.iconMuted
                }
              />
            </Pressable>

            <Pressable
              onPress={onIgnore}
              hitSlop={8}
              style={
                styles.utilityButton
              }
            >
              <Ionicons
                name="close"
                size={20}
                color={
                  colors.iconMuted
                }
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingTop: 72,
    },

    card: {
      width: "100%",
      maxWidth: 360,
      minHeight: 156,
      borderRadius: 24,
      borderWidth: 1,
      padding: 14,
      flexDirection: "row",
      gap: 12,
    },

    avatarButton: {
      width: 86,
      alignSelf: "stretch",
    },

    avatar: {
      width: 86,
      height: 114,
      borderRadius: 18,
    },

    avatarFallback: {
      width: 86,
      height: 114,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    content: {
      flex: 1,
      paddingTop: 3,
      minWidth: 0,
    },

    eyebrowRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    signalDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    eyebrow: {
      fontSize: 10.5,
      fontFamily:
        RBZFont.bold,
    },

    name: {
      marginTop: 6,
      fontSize: 17,
      fontFamily:
        RBZFont.extraBold,
    },

    sub: {
      marginTop: 2,
      fontSize: 10.5,
      fontFamily:
        RBZFont.medium,
    },

    actions: {
      flexDirection: "row",
      gap: 7,
      marginTop: 15,
    },

    accept: {
      flex: 1,
      minHeight: 39,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    acceptText: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
    },

    secondary: {
      flex: 1,
      minHeight: 39,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryText: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
    },

    utilityActions: {
      position: "absolute",
      right: 8,
      top: 7,
      flexDirection: "row",
    },

    utilityButton: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    pressed: {
      opacity: 0.66,
    },
  });