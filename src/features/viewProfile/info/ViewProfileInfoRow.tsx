/**
 * Path: src/features/viewProfile/info/ViewProfileInfoRow.tsx
 * Purpose: Responsive read-only field row for matched-user View Profile details.
 * Used by: View Profile information components only.
 */

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = {
  label: string;
  value: string | number;
};

export default function ViewProfileInfoRow({
  label,
  value,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.value,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    row: {
      minHeight: 54,

      flexDirection: "row",
      alignItems: "flex-start",

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      paddingVertical: 13,
    },

    label: {
      flexShrink: 0,

      fontFamily:
        RBZFont.semiBold,

      fontSize: 15,
      lineHeight: 20,
    },

    value: {
      flex: 1,
      flexShrink: 1,

      marginLeft: 16,

      fontFamily:
        RBZFont.medium,

      fontSize: 13,
      lineHeight: 19,

      textAlign: "right",
    },
  });