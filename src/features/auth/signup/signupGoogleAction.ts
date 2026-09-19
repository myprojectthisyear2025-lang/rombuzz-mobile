/**
 * Path: src/features/auth/signup/signupGoogleAction.ts
 * Purpose: Run the existing native Google signup exchange without UI concerns.
 */

import {
    GoogleSignin,
    statusCodes,
} from "@react-native-google-signin/google-signin";

import axios from "axios";

import {
    API_BASE,
} from "@/src/config/api";

export type GoogleSignupResult =
  | {
      kind: "cancelled";
    }
  | {
      kind: "account_exists";
    }
  | {
      kind: "error";
      message: string;
    }
  | {
      kind: "ready";
      email: string;
      firstName: string;
      lastName: string;
      avatar: string;
      ticket: string;
    };

export async function runGoogleSignup(
  googleWebClientId: string
): Promise<GoogleSignupResult> {
  if (!googleWebClientId) {
    return {
      kind: "error",
      message:
        "Google signup is not configured.",
    };
  }

  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog:
        true,
    });

    await GoogleSignin
      .signOut()
      .catch(() => {});

    const signInResult: any =
      await GoogleSignin.signIn();

    if (
      signInResult?.type ===
      "cancelled"
    ) {
      return {
        kind: "cancelled",
      };
    }

    if (
      !GoogleSignin
        .getCurrentUser()
    ) {
      return {
        kind: "cancelled",
      };
    }

    const tokens =
      await GoogleSignin.getTokens();

    const idToken =
      tokens?.idToken || "";

    if (!idToken) {
      return {
        kind: "error",
        message:
          "Google signup failed. No Google token received.",
      };
    }

    const res =
      await axios.post(
        `${API_BASE}/auth/google`,
        {
          token: idToken,
          mode: "signup",
        },
        {
          validateStatus:
            (status) =>
              status >= 200 &&
              status < 500,
        }
      );

    const {
      status,
      googleProfile,
      googleSignupTicket,
      error: serverError,
    } = res.data || {};

    if (
      status ===
        "account_exists" ||
      res.status === 409
    ) {
      return {
        kind:
          "account_exists",
      };
    }

    if (
      !res.status ||
      res.status >= 400
    ) {
      return {
        kind: "error",

        message:
          serverError ||
          "Google signup failed. Please try again.",
      };
    }

    if (
      status !==
        "google_signup_ready" ||
      !googleProfile?.email
    ) {
      return {
        kind: "error",

        message:
          "Google signup failed. Invalid response from server.",
      };
    }

    return {
      kind: "ready",

      email:
        googleProfile.email,

      firstName:
        googleProfile.firstName ||
        "",

      lastName:
        googleProfile.lastName ||
        "",

      avatar:
        googleProfile.avatar ||
        "",

      ticket:
        String(
          googleSignupTicket ||
            ""
        ),
    };
  } catch (err: any) {
    const message =
      String(
        err?.message || ""
      );

    if (
      err?.code ===
        statusCodes
          .SIGN_IN_CANCELLED ||
      message.includes(
        "cancel"
      ) ||
      message.includes(
        "getTokens requires a user to be signed in"
      )
    ) {
      return {
        kind: "cancelled",
      };
    }

    console.error(
      "Unexpected Google signup error:",
      err
    );

    return {
      kind: "error",

      message:
        err?.response?.data
          ?.error ||
        err?.message ||
        "Google signup failed. Please try again.",
    };
  }
}