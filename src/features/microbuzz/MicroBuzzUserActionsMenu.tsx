/**
 * Path: src/features/microbuzz/MicroBuzzUserActionsMenu.tsx
 * Purpose: Shared Report / session Ignore / global Block menu.
 */

import {
    Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
    Alert,
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
  name?: string;
  onClose: () => void;
  onReport: () => void;
  onIgnore: () => void;
  onBlock: () => void;
};

export default function MicroBuzzUserActionsMenu({
  visible,
  name,
  onClose,
  onReport,
  onIgnore,
  onBlock,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  function confirmBlock() {
    Alert.alert(
      `Block ${
        name ||
        "this user"
      }?`,

      "They will be blocked across RomBuzz, not just MicroBuzz.",

      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style:
            "destructive",

          onPress:
            onBlock,
        },
      ]
    );
  }

  const rows = [
    {
      icon:
        "flag-outline" as const,

      title:
        "Report",

      sub:
        "Report this MicroBuzz user",

      action:
        onReport,

      danger:
        false,
    },

    {
      icon:
        "eye-off-outline" as const,

      title:
        "Ignore for this session",

      sub:
        "Hide them until you end this MicroBuzz session",

      action:
        onIgnore,

      danger:
        false,
    },

    {
      icon:
        "ban-outline" as const,

      title:
        "Block user",

      sub:
        "Block them across RomBuzz",

      action:
        confirmBlock,

      danger:
        true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
    >
      <Pressable
        style={[
          styles.overlay,
          {
            backgroundColor:
              colors.overlay,
          },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surfaceRaised,

              borderColor:
                colors.border,
            },
          ]}
          onPress={() => {}}
        >
          {rows.map(
            (row) => (
              <Pressable
                key={
                  row.title
                }
                onPress={
                  row.action
                }
                style={({
                  pressed,
                }) => [
                  styles.row,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor:
                        colors.brandSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      row.icon
                    }
                    size={18}
                    color={
                      row.danger
                        ? "#E5484D"
                        : colors.brand
                    }
                  />
                </View>

                <View
                  style={
                    styles.copy
                  }
                >
                  <Text
                    style={[
                      styles.title,
                      {
                        color:
                          row.danger
                            ? "#E5484D"
                            : colors.text,
                      },
                    ]}
                  >
                    {row.title}
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
                    {row.sub}
                  </Text>
                </View>
              </Pressable>
            )
          )}

          <Pressable
            onPress={onClose}
            style={
              styles.cancel
            }
          >
            <Text
              style={[
                styles.cancelText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent:
        "center",
      paddingHorizontal: 24,
    },

    card: {
      width: "100%",
      maxWidth: 380,
      alignSelf: "center",
      borderWidth: 1,
      borderRadius: 24,
      padding: 10,
    },

    row: {
      minHeight: 66,
      borderRadius: 17,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    icon: {
      width: 36,
      height: 36,
      borderRadius: 13,
      alignItems: "center",
      justifyContent:
        "center",
    },

    copy: {
      flex: 1,
    },

    title: {
      fontSize: 13,
      fontFamily:
        RBZFont.bold,
    },

    sub: {
      marginTop: 2,
      fontSize: 10.5,
      lineHeight: 14,
      fontFamily:
        RBZFont.medium,
    },

    cancel: {
      minHeight: 44,
      alignItems: "center",
      justifyContent:
        "center",
    },

    cancelText: {
      fontSize: 12.5,
      fontFamily:
        RBZFont.semiBold,
    },

    pressed: {
      opacity: 0.62,
    },
  });