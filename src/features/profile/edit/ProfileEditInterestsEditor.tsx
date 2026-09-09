/**
 * Path: src/features/profile/edit/ProfileEditInterestsEditor.tsx
 * Purpose: Focused Interests and Hobbies editor with the existing 10-item limits.
 * Used by: ProfileEditScreen.
 */

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

import { Ionicons } from "@expo/vector-icons";
import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  ProfileEditForm,
} from "./profileEditTypes";

function ChoiceGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (
    next: string[]
  ) => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View style={styles.group}>
      <View
        style={styles.groupHeader}
      >
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.count,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {selected.length}/10
        </Text>
      </View>

      <View style={styles.wrap}>
        {options.map(
          (option) => {
            const active =
              selected.includes(
                option
              );

            return (
              <Pressable
                key={option}
                onPress={() => {
                  if (active) {
                    return onChange(
                      selected.filter(
                        (item) =>
                          item !==
                          option
                      )
                    );
                  }

                  if (
                    selected.length >=
                    10
                  ) {
                    return;
                  }

                  onChange([
                    ...selected,
                    option,
                  ]);
                }}
                style={[
                  styles.choice,
                  {
                    borderColor:
                      active
                        ? colors.borderStrong
                        : colors.border,

                    backgroundColor:
                      active
                        ? colors.surfaceMuted
                        : colors.surface,
                  },
                ]}
              >
                {active && (
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color={
                      colors.textSecondary
                    }
                  />
                )}

                <Text
                  style={[
                    styles.choiceText,
                    {
                      color: active
                        ? colors.text
                        : colors.textSecondary,

                      fontFamily: active
                        ? RBZFont.semiBold
                        : RBZFont.medium,
                    },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}

export default function ProfileEditInterestsEditor({
  form,
  setForm,
  interestOptions,
  hobbyOptions,
}: {
  form: ProfileEditForm;

  setForm: React.Dispatch<
    React.SetStateAction<
      ProfileEditForm
    >
  >;

  interestOptions: string[];
  hobbyOptions: string[];
}) {
  return (
    <View>
      <ChoiceGroup
        title="Interests"
        options={
          interestOptions
        }
        selected={
          form.interests || []
        }
        onChange={(
          interests
        ) =>
          setForm((prev) => ({
            ...prev,
            interests,
          }))
        }
      />

      <ChoiceGroup
        title="Hobbies"
        options={hobbyOptions}
        selected={
          form.hobbies || []
        }
        onChange={(hobbies) =>
          setForm((prev) => ({
            ...prev,
            hobbies,
          }))
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    group: {
      marginBottom: 26,
    },

    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 10,
    },

    title: {
      fontFamily: RBZFont.bold,
      fontSize: 15,
    },

    count: {
      fontFamily: RBZFont.medium,
      fontSize: 12,
    },

    wrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    choice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    choiceText: {
      fontFamily:
        RBZFont.medium,
      fontSize: 12.5,
    },
  });