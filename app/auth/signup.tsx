/**
 * Path: app/auth/signup.tsx
 * Purpose: Route entry for the redesigned RomBuzz signup flow.
 * Behavior: Email OTP, Google signup, Apple signup, and navigation stay unchanged.
 */

import SignupScreenView from "../../src/features/auth/signup/SignupScreenView";
import { useSignupController } from "../../src/features/auth/signup/useSignupController";

export default function SignupScreen() {
  const controller = useSignupController();
  return <SignupScreenView controller={controller} />;
}