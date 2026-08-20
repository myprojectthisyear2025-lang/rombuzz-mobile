/**
 * ============================================================
 * 📁 File: src/features/auth/signup/appleSignup.ts
 * 🎯 Purpose: Non-iOS fallback for Apple signup.
 *
 * LOCATION:
 *   src/features/auth/signup/appleSignup.ts
 *
 * USED BY:
 *   Android/web signup builds.
 *
 * RESPONSIBILITIES:
 *   - Keep the signup controller platform-safe.
 *   - Never invoke Apple authentication outside iOS.
 * ============================================================
 */

export type AppleSignupProfile = {
  email: string;
  appleId: string;
  firstName: string;
  lastName: string;
};

export type AppleSignupResult =
  | {
      kind: "ready";
      profile: AppleSignupProfile;
      appleSignupTicket: string;
    }
  | {
      kind: "account_exists";
      message: string;
    }
  | {
      kind: "cancelled";
    }
  | {
      kind: "error";
      message: string;
    };

export async function signupWithApple(): Promise<AppleSignupResult> {
  return { kind: "cancelled" };
}