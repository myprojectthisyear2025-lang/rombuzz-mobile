/**
 * ============================================================
 * 📁 File: app/auth/login.tsx
 * 🎯 Purpose: Expo Router entry point for the RomBuzz login screen.
 *
 * LOCATION:
 *   app/auth/login.tsx
 *
 * USED BY:
 *   Expo Router when the user opens /auth/login.
 *
 * RESPONSIBILITIES:
 *   - Create the login controller.
 *   - Render the modular login screen.
 * ============================================================
 */

import LoginScreenView from "../../src/features/auth/login/LoginScreenView";
import { useLoginController } from "../../src/features/auth/login/useLoginController";

export default function LoginScreen() {
  const controller = useLoginController();
  return <LoginScreenView controller={controller} />;
}