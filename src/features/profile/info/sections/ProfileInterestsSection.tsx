/**
 * Path: src/features/profile/info/sections/ProfileInterestsSection.tsx
 * Purpose: Displays all saved Interests and Hobbies as neutral wrapped chips.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
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
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import ProfileInfoSection from "../ProfileInfoSection";

type Props = {
  user: any;

  setEditTarget: (
    value: any
  ) => void;
};

function cleanValues(
  value: any
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      String(item ?? "").trim()
    )
    .filter(Boolean);
}

export default function ProfileInterestsSection({
  user,
  setEditTarget,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const interests =
    cleanValues(user?.interests);

  const hobbies =
    cleanValues(user?.hobbies);

  const renderGroup = (
    title: string,
    values: string[],
    emptyText: string
  ) => (
    <View style={styles.group}>
      <Text
        style={[
          styles.groupTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      {values.length > 0 ? (
        <View style={styles.wrap}>
          {values.map(
            (value, index) => (
              <View
                key={`${value}-${index}`}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      colors.surfaceMuted,

                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {value}
                </Text>
              </View>
            )
          )}
        </View>
      ) : (
        <Text
          style={[
            styles.emptyText,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {emptyText}
        </Text>
      )}
    </View>
  );

  return (
    <ProfileInfoSection title="Interests & Hobbies">
      {renderGroup(
        "Interests",
        interests,
        "No interests added yet"
      )}

      {renderGroup(
        "Hobbies",
        hobbies,
        "No hobbies added yet"
      )}

      <TouchableOpacity
        activeOpacity={0.72}
        onPress={() =>
          setEditTarget("interests")
        }
        style={[
          styles.editButton,
          {
            backgroundColor:
              colors.surfaceMuted,

            borderColor:
              colors.borderStrong,
          },
        ]}
      >
        <Ionicons
          name="create-outline"
          size={18}
          color={colors.text}
        />

        <Text
          style={[
            styles.editText,
            {
              color: colors.text,
            },
          ]}
        >
          Edit Interests & Hobbies
        </Text>
      </TouchableOpacity>
    </ProfileInfoSection>
  );
}

const styles =
  StyleSheet.create({
    group: {
      paddingVertical: 12,
    },

    groupTitle: {
      marginBottom: 9,
      fontFamily:
        RBZFont.semiBold,
      fontSize: 15,
    },

    wrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
      gap: 7,
    },

    chip: {
      maxWidth: "100%",
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    chipText: {
      flexShrink: 1,
      fontFamily:
        RBZFont.medium,
      fontSize: 12.5,
      lineHeight: 17,
    },

    emptyText: {
      fontFamily:
        RBZFont.regular,
      fontSize: 12.5,
    },

    editButton: {
      minHeight: 46,
      marginTop: 6,
      marginBottom: 4,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    editText: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 15,
    },
  });