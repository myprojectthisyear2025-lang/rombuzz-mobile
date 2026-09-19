/**
 * Path: src/features/auth/login/AppleLoginButton.ios.tsx
 * Purpose: Render Apple's native login button with RomBuzz light/dark appearance.
 * Used by: LoginForm.tsx on iOS.
 */

import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

import { loginFormStyles as styles } from "./loginFormStyles";

type Props = {
  disabled: boolean;
  onPress: () => void;
};

export default function AppleLoginButton({
  disabled,
  onPress,
}: Props) {
  const [available, setAvailable] = useState(false);
  const { isDark } = useRomBuzzTheme();

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
      pointerEvents={
        disabled ? "none" : "auto"
      }
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          AppleAuthentication
            .AppleAuthenticationButtonType.SIGN_IN
        }
        buttonStyle={
          isDark
            ? AppleAuthentication
                .AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication
                .AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={16}
        style={styles.appleButton}
        onPress={onPress}
      />
    </View>
  );
}