/**
 * Path: src/features/auth/signup/AppleSignupButton.ios.tsx
 * Purpose: Render Apple's native signup button with RomBuzz light/dark appearance.
 */

import * as AppleAuthentication from "expo-apple-authentication";

import {
  useEffect,
  useState,
} from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

type Props = {
  disabled: boolean;
  onPress: () => void;
};

export default function AppleSignupButton({
  disabled,
  onPress,
}: Props) {
  const [
    available,
    setAvailable,
  ] = useState(false);

  const {
    isDark,
  } = useRomBuzzTheme();

  useEffect(() => {
    AppleAuthentication
      .isAvailableAsync()
      .then(setAvailable)
      .catch(
        () =>
          setAvailable(false)
      );
  }, []);

  if (!available) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrapper,

        disabled &&
          styles.disabled,
      ]}
      pointerEvents={
        disabled
          ? "none"
          : "auto"
      }
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          AppleAuthentication
            .AppleAuthenticationButtonType
            .SIGN_UP
        }
        buttonStyle={
          isDark
            ? AppleAuthentication
                .AppleAuthenticationButtonStyle
                .WHITE
            : AppleAuthentication
                .AppleAuthenticationButtonStyle
                .BLACK
        }
        cornerRadius={16}
        style={styles.button}
        onPress={onPress}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    wrapper: {
      width: "100%",
      height: 52,
      marginBottom: 10,
    },

    button: {
      width: "100%",
      height: 52,
    },

    disabled: {
      opacity: 0.6,
    },
  });