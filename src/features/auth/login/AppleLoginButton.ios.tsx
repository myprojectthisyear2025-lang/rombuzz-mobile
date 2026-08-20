/**
 * ============================================================
 * 📁 File: src/features/auth/login/AppleLoginButton.ios.tsx
 * 🎯 Purpose: Render Apple's native login button on iOS only.
 *
 * LOCATION:
 *   src/features/auth/login/AppleLoginButton.ios.tsx
 *
 * USED BY:
 *   LoginForm.tsx on iOS.
 * ============================================================
 */

import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { styles } from "./loginStyles";

type Props = {
  disabled: boolean;
  onPress: () => void;
};

export default function AppleLoginButton({
  disabled,
  onPress,
}: Props) {
  const [available, setAvailable] =
    useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  if (!available) return null;

  return (
    <View
      style={[
        styles.appleButtonWrap,
        disabled && styles.disabledButton,
      ]}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          AppleAuthentication
            .AppleAuthenticationButtonType.SIGN_IN
        }
        buttonStyle={
          AppleAuthentication
            .AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={20}
        style={styles.appleButton}
        onPress={onPress}
      />
    </View>
  );
}