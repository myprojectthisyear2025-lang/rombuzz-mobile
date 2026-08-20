/**
 * ============================================================
 * 📁 File: src/features/auth/signup/appleSignup.ios.ts
 * 🎯 Purpose: Native Sign up with Apple flow for iOS.
 *
 * LOCATION:
 *   src/features/auth/signup/appleSignup.ios.ts
 *
 * USED BY:
 *   RomBuzz signup controller on iOS.
 *
 * RESPONSIBILITIES:
 *   - Start native Apple authentication.
 *   - Request name and email permission.
 *   - Send Apple's identity token to RomBuzz backend.
 *   - Return verified profile data for register-full.
 *   - Detect existing accounts and user cancellation.
 * ============================================================
 */

import axios from "axios";
import * as AppleAuthentication from "expo-apple-authentication";

import { API_BASE } from "../../../config/api";

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
  try {
    const available =
      await AppleAuthentication.isAvailableAsync();

    if (!available) {
      return {
        kind: "error",
        message:
          "Sign up with Apple is unavailable on this device.",
      };
    }

    const credential =
      await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication
            .AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication
            .AppleAuthenticationScope.EMAIL,
        ],
      });

    if (!credential.identityToken) {
      return {
        kind: "error",
        message:
          "Apple signup failed. No identity token received.",
      };
    }

    const firstName =
      credential.fullName?.givenName?.trim() || "";

    const lastName =
      credential.fullName?.familyName?.trim() || "";

    const res = await axios.post(
      `${API_BASE}/auth/apple`,
      {
        token: credential.identityToken,
        mode: "signup",
      },
      {
        validateStatus: (status) =>
          status >= 200 && status < 500,
      },
    );

    const data = res.data || {};

    if (
      data.status === "account_exists" ||
      res.status === 409
    ) {
      return {
        kind: "account_exists",
        message:
          data.error ||
          "An account already exists with this Apple ID. Try logging in.",
      };
    }

    if (res.status >= 400) {
      return {
        kind: "error",
        message:
          data.error ||
          "Apple signup failed. Please try again.",
      };
    }

    const appleProfile = data.appleProfile || {};
    const appleSignupTicket =
      String(data.appleSignupTicket || "");

    if (
      data.status !== "apple_signup_ready" ||
      !appleProfile.email ||
      !appleSignupTicket
    ) {
      return {
        kind: "error",
        message:
          "Apple signup failed. Invalid response from server.",
      };
    }

    return {
      kind: "ready",
      appleSignupTicket,
      profile: {
        email: String(appleProfile.email)
          .trim()
          .toLowerCase(),
        appleId: String(
          appleProfile.appleId ||
            credential.user ||
            "",
        ),
        firstName,
        lastName,
      },
    };
  } catch (err: any) {
    if (err?.code === "ERR_REQUEST_CANCELED") {
      return { kind: "cancelled" };
    }

    console.error(
      "Unexpected Apple signup error:",
      err,
    );

    return {
      kind: "error",
      message:
        err?.response?.data?.error ||
        err?.message ||
        "Apple signup failed. Please try again.",
    };
  }
}