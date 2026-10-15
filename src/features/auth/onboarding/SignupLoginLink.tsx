/**
 * File: src/features/auth/onboarding/SignupLoginLink.tsx
 * Purpose: Lets users abandon signup and open the login screen.
 * Stops signup autosaving before clearing the saved draft and session.
 * Passes only the email to login; signup passwords and tickets are cleared.
 * Clears navigation history so Back cannot reopen the abandoned signup.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Keyboard, Pressable, Text } from "react-native";
import { clearSession } from "../rbzSession";
import { clearOnboardingDraft } from "./rbzOnboardingDraft";

type Props = {
  email: string;
  onLeaving: () => void;
  onFailure: () => void;
};

export default function SignupLoginLink({
  email, onLeaving, onFailure,
}: Props) {
  const router = useRouter();
  const { colors } = useRomBuzzTheme();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const openLogin = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    Keyboard.dismiss();
    onLeaving();

    try {
      await clearSession();
      await clearOnboardingDraft();
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace({
        pathname: "/auth/login",
        params: { email: email.trim() },
      });
    } catch {
      onFailure();
      running.current = false;
      setBusy(false);
      Alert.alert("Login", "Could not exit signup. Please try again.");
    }
  };

  return (
    <Pressable
      onPress={openLogin}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Already have an account? Log in"
      style={{
        alignItems: "center",
        paddingVertical: 14,
        opacity: busy ? 0.5 : 1,
      }}
    >
      <Text style={{
        fontFamily: RBZFont.medium,
        fontSize: 12,
        color: colors.textSecondary,
      }}>
        {busy ? "Opening login…" : "Already have an account? "}
        {!busy && (
          <Text style={{
            fontFamily: RBZFont.bold,
            color: colors.text,
          }}>
            Log in
          </Text>
        )}
      </Text>
    </Pressable>
  );
}