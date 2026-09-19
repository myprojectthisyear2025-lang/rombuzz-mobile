/**
 * Path: src/features/auth/passwordRecovery/ResetPasswordControls.tsx
 * Purpose: Reusable visual controls for the reset-password flow.
 */

import {
    Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    recoveryStyles as styles,
} from "./passwordRecoveryStyles";

export function PasswordField({
  toggle,
  ...props
}: any) {
  return (
    <View
      style={[
        styles.inputShell,
        props.theme.inputShell,
      ]}
    >
      <Ionicons
        name="lock-closed-outline"
        size={18}
        style={
          props.theme.inputIcon
        }
      />

      <TextInput
        style={[
          styles.input,
          props.theme.input,
        ]}
        placeholder={
          props.placeholder
        }
        placeholderTextColor={
          props.colors.textMuted
        }
        secureTextEntry={
          !props.showPassword
        }
        value={props.value}
        onChangeText={
          props.onChangeText
        }
      />

      {toggle ? (
        <TouchableOpacity
          style={[
            styles.eyeButton,
            props.theme.eyeButton,
          ]}
          onPress={toggle}
          activeOpacity={0.72}
        >
          <Ionicons
            name={
              props.showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={19}
            style={
              props.theme.eyeIcon
            }
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function ErrorBox({
  error,
  theme,
}: any) {
  return (
    <View
      style={[
        styles.statusBox,
        theme.errorBox,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          theme.errorText,
        ]}
      >
        {error}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  loading,
  onPress,
  label,
  colors,
  theme,
}: any) {
  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        theme.primaryButton,
        loading &&
          styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator
          color={colors.white}
        />
      ) : (
        <Text
          style={[
            styles.primaryButtonText,
            theme.primaryButtonText,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}