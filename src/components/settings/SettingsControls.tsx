/**
 * Path: src/components/settings/SettingsControls.tsx
 * Purpose: Shared theme-aware fields, actions, and feedback for Settings forms.
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";

export function SettingsField({
  label,
  passwordVisible,
  onTogglePassword,
  style,
  ...props
}: TextInputProps & {
  label: string;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
}) {
  const { colors } = useRomBuzzTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: focused ? colors.borderStrong : colors.border,
            opacity: props.editable === false ? 0.6 : 1,
          },
        ]}
      >
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.brand}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.input, { color: colors.text }, style]}
        />
        {onTogglePassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${passwordVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
            onPress={onTogglePassword}
            style={styles.eye}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={colors.iconMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function SettingsButton({
  label,
  onPress,
  busy = false,
  disabled = false,
  variant = "primary",
}: {
  label: string;
  onPress: () => void | Promise<void>;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { colors } = useRomBuzzTheme();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const working = busy || pending;
  const inactive = disabled || working;
  const filled = variant === "primary";
  const foreground = inactive
    ? colors.textSecondary
    : filled
      ? colors.white
      : variant === "danger"
        ? colors.danger
        : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: working }}
      disabled={inactive}
      onPress={async () => {
        if (pendingRef.current) return;
        pendingRef.current = true;
        setPending(true);
        try {
          await onPress();
        } finally {
          pendingRef.current = false;
          setPending(false);
        }
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: inactive
            ? colors.surfaceMuted
            : filled
              ? pressed
                ? colors.brandPressed
                : colors.brand
              : colors.surface,
          borderColor: inactive ? colors.border : filled ? colors.brand : colors.borderStrong,
          opacity: pressed && !filled ? 0.65 : 1,
        },
      ]}
    >
      {working ? <ActivityIndicator size="small" color={foreground} /> : null}
      <Text style={[styles.buttonText, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function SettingsNotice({
  children,
  error = false,
  loading = false,
}: {
  children: React.ReactNode;
  error?: boolean;
  loading?: boolean;
}) {
  const { colors } = useRomBuzzTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.brand} />
      ) : (
        <Ionicons
          name={error ? "alert-circle-outline" : "checkmark-circle-outline"}
          size={18}
          color={error ? colors.danger : colors.iconMuted}
        />
      )}
      <Text style={[styles.noticeText, { color: error ? colors.danger : colors.textSecondary }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 12 },
  label: { fontSize: 12.5, fontFamily: RBZFont.semiBold, marginBottom: 7 },
  inputShell: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: RBZFont.medium,
  },
  eye: { width: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  button: {
    minHeight: 50,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { flexShrink: 1, fontSize: 14, fontFamily: RBZFont.bold, textAlign: "center" },
  notice: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  noticeText: { flex: 1, fontSize: 12.5, lineHeight: 19, fontFamily: RBZFont.medium },
});
