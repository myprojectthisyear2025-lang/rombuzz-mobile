/**
 * File: app/auth/login.tsx
 * Purpose: Opens the existing modular RomBuzz login screen.
 * Prefills the email when a user switches from signup to login.
 * Clears the login password when receiving that email.
 * Preserves the existing login controller and provider actions.
 */
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import LoginScreenView from "../../src/features/auth/login/LoginScreenView";
import { useLoginController } from "../../src/features/auth/login/useLoginController";

export default function LoginScreen() {
  const controller = useLoginController();
  const params = useLocalSearchParams<{
    email?: string | string[];
  }>();
  const incomingEmail = Array.isArray(params.email)
    ? params.email[0]
    : params.email;
  const { setEmail, setPassword } = controller;

  useEffect(() => {
    if (incomingEmail === undefined) return;
    setEmail(String(incomingEmail).trim());
    setPassword("");
  }, [incomingEmail, setEmail, setPassword]);

  return <LoginScreenView controller={controller} />;
}