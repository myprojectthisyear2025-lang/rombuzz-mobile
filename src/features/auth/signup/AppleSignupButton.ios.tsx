/**
 * ============================================================
 * 📁 File: src/features/auth/signup/AppleSignupButton.ios.tsx
 * 🎯 Purpose: Native Sign up with Apple button for iOS.
 *
 * LOCATION:
 *   src/features/auth/signup/AppleSignupButton.ios.tsx
 *
 * USED BY:
 *   RomBuzz signup form on iOS.
 *
 * RESPONSIBILITIES:
 *   - Check Apple authentication availability.
 *   - Render Apple's native signup button.
 *   - Respect the signup screen busy state.
 * ============================================================
 */

import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    View,
} from "react-native";

type Props = {
  disabled: boolean;
  onPress: () => void;
};

export default function AppleSignupButton({
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

  if (!available) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrapper,
        disabled && styles.disabled,
      ]}
      pointerEvents={
        disabled ? "none" : "auto"
      }
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          AppleAuthentication
            .AppleAuthenticationButtonType.SIGN_UP
        }
        buttonStyle={
          AppleAuthentication
            .AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={20}
        style={styles.button}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 54,
    marginTop: 11,
  },

  button: {
    width: "100%",
    height: 54,
  },

  disabled: {
    opacity: 0.7,
  },
});