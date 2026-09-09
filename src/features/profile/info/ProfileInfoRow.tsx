/**
 * Path: src/features/profile/info/ProfileInfoRow.tsx
 * Purpose: Compact premium profile field row with current value and optional edit navigation.
 * Used by: Extracted Profile Info category sections and ProfileInfoTab.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type RowValue =
  | string
  | string[]
  | number
  | null
  | undefined;

type Props = {
  label: string;
  value?: RowValue;
  placeholder?: string;
  onPress?: () => void;
  maxItems?: number;
};

function summarizeValue(
  value: RowValue,
  placeholder: string,
  maxItems?: number
) {
  if (Array.isArray(value)) {
    const clean = value
      .map((item) =>
        String(item || "").trim()
      )
      .filter(Boolean)
      .slice(
        0,
        maxItems ??
          Number.MAX_SAFE_INTEGER
      );

    if (!clean.length) {
      return placeholder;
    }

    const visible = clean.slice(0, 2);
    const remaining =
      clean.length - visible.length;

    return remaining > 0
      ? `${visible.join(" · ")} · +${remaining}`
      : visible.join(" · ");
  }

  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value).trim();

  return text || placeholder;
}

export default function ProfileInfoRow({
  label,
  value,
  placeholder = "Add",
  onPress,
  maxItems,
}: Props) {
  const { colors } = useRomBuzzTheme();

  const displayValue =
    summarizeValue(
      value,
      placeholder,
      maxItems
    );

  const hasValue =
    displayValue !== placeholder;

  const content = (
    <>
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

      <View style={styles.right}>
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            {
              color: hasValue
                ? colors.textSecondary
                : colors.textMuted,
            },
          ]}
        >
          {displayValue}
        </Text>

        {!!onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.iconMuted}
          />
        )}
      </View>
    </>
  );

  if (!onPress) {
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
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor:
            colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  pressed: {
    opacity: 0.55,
  },

  label: {
    flexShrink: 0,
    fontFamily: RBZFont.semiBold,
    fontSize: 14.5,
  },

  right: {
    flex: 1,
    marginLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },

  value: {
    maxWidth: "90%",
    fontFamily: RBZFont.medium,
    fontSize: 13.5,
    textAlign: "right",
  },
});