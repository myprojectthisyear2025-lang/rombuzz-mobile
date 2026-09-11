/**
 * Path: src/features/microbuzz/MicroBuzzGenderSelector.tsx
 * Purpose: Compact tap-to-change MicroBuzz gender preference control.
 */

import {
  Ionicons,
} from "@expo/vector-icons";

import React, {
  useState,
} from "react";

import {
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

import type {
  MicroBuzzGender,
} from "./microBuzzTypes";

const OPTIONS: Array<{
  label: string;
  value: MicroBuzzGender;
}> = [
  {
    label: "Women",
    value: "female",
  },
  {
    label: "Men",
    value: "male",
  },
  {
    label: "Everyone",
    value: "everyone",
  },
];

type Props = {
  value: MicroBuzzGender;

  onChange: (
    value: MicroBuzzGender
  ) => void;
};

export default function MicroBuzzGenderSelector({
  value,
  onChange,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const selectedLabel =
    OPTIONS.find(
      (option) =>
        option.value === value
    )?.label || "Everyone";

  function select(
    next: MicroBuzzGender
  ) {
    onChange(next);
    setMenuOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() =>
          setMenuOpen(true)
        }
        style={({ pressed }) => [
          styles.control,
          {
            backgroundColor:
              colors.surface,

            borderColor:
              colors.border,
          },

          pressed &&
            styles.pressed,
        ]}
      >
        <View
          style={[
            styles.iconBubble,
            {
              backgroundColor:
                colors.brandSoft,
            },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={17}
            color={
              colors.brand
            }
          />
        </View>

        <View
          style={styles.copy}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Show me
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.value,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            {selectedLabel}
          </Text>
        </View>

        <Ionicons
          name="chevron-down"
          size={15}
          color={
            colors.iconMuted
          }
        />
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setMenuOpen(false)
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
          onPress={() =>
            setMenuOpen(false)
          }
        >
          <Pressable
            style={[
              styles.menu,
              {
                backgroundColor:
                  colors.surfaceRaised,

                borderColor:
                  colors.border,
              },
            ]}
            onPress={() => {}}
          >
            <Text
              style={[
                styles.menuTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Show me
            </Text>

            {OPTIONS.map(
              (option) => {
                const selected =
                  option.value ===
                  value;

                return (
                  <Pressable
                    key={
                      option.value
                    }
                    onPress={() =>
                      select(
                        option.value
                      )
                    }
                    style={({ pressed }) => [
                      styles.option,

                      selected && {
                        backgroundColor:
                          colors.brandSoft,
                      },

                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            selected
                              ? colors.brand
                              : colors.text,

                          fontFamily:
                            selected
                              ? RBZFont.bold
                              : RBZFont.medium,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>

                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={
                          colors.brand
                        }
                      />
                    ) : null}
                  </Pressable>
                );
              }
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles =
  StyleSheet.create({
    control: {
      flex: 1,
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    iconBubble: {
      width: 30,
      height: 30,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },

    copy: {
      flex: 1,
      minWidth: 0,
    },

    title: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.bold,
    },

    value: {
      marginTop: 1,
      fontSize: 9.5,
      fontFamily:
        RBZFont.medium,
    },

    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    menu: {
      width: "100%",
      maxWidth: 310,
      borderRadius: 22,
      borderWidth: 1,
      padding: 10,
    },

    menuTitle: {
      paddingHorizontal: 10,
      paddingVertical: 9,
      fontSize: 14,
      fontFamily:
        RBZFont.extraBold,
    },

    option: {
      minHeight: 48,
      borderRadius: 14,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    optionText: {
      fontSize: 13,
    },

    pressed: {
      opacity: 0.62,
    },
  });