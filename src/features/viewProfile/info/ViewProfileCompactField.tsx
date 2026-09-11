/**
 * Path: src/features/viewProfile/info/ViewProfileCompactField.tsx
 * Purpose: Responsive compact field/grid primitives for matched-user View Profile.
 * Used by: View Profile details and lifestyle information only.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

type IconName =
  React.ComponentProps<
    typeof Ionicons
  >["name"];

type FieldProps = {
  label: string;
  value: string | number;
  icon: IconName;
};

export function ViewProfileInfoGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.grid}>
      {children}
    </View>
  );
}

export default function ViewProfileCompactField({
  label,
  value,
  icon,
}: FieldProps) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View style={styles.item}>
      <View style={styles.labelRow}>
        <Ionicons
          name={icon}
          size={13}
          color={colors.iconMuted}
        />

        <Text
          style={[
            styles.label,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.value,
          {
            color: colors.text,
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
    grid: {
      paddingVertical: 11,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
      columnGap: 14,
      rowGap: 12,
    },

    item: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 92,
      minWidth: 92,
      maxWidth: "100%",
    },

    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    label: {
      flexShrink: 1,
      fontFamily:
        RBZFont.medium,
      fontSize: 11.5,
      lineHeight: 15,
    },

    value: {
      marginTop: 3,
      fontFamily:
        RBZFont.medium,
      fontSize: 12.5,
      lineHeight: 17,
    },
  });