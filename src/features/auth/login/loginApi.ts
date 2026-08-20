/**
 * ============================================================
 * 📁 File: src/features/auth/login/loginApi.ts
 * 🎯 Purpose: Email and Google login requests for RomBuzz.
 *
 * LOCATION:
 *   src/features/auth/login/loginApi.ts
 *
 * USED BY:
 *   useLoginController.ts
 *
 * RESPONSIBILITIES:
 *   - Submit email/password login.
 *   - Run native Google login and exchange its token with RomBuzz.
 * ============================================================
 */

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import axios from "axios";
import { Platform } from "react-native";

import { API_BASE } from "../../../config/api";
import type { LoginResult } from "./loginTypes";

function serverMessage(data: any, fallback: string) {
  return data?.error || data?.message || fallback;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<LoginResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ email: email.trim(), password }),
    });

    let data: any = {};

    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (data.status === "no_account") {
      return {
        kind: "error",
        message: "Account doesn't exist. Please create a new account first.",
      };
    }

    if (!res.ok) {
      return {
        kind: "error",
        message: serverMessage(
          data,
          "Login failed. Please check your email and password.",
        ),
      };
    }

    if (!data.token || !data.user) {
      return {
        kind: "error",
        message: "Invalid login response from server.",
      };
    }

    return {
      kind: "success",
      status: data.status,
      token: data.token,
      user: data.user,
    };
  } catch (err: any) {
    return {
      kind: "error",
      message:
        err?.name === "AbortError"
          ? "Login request timed out. Please try again."
          : "Network error. Please try again.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function loginWithGoogle(
  googleWebClientId: string,
): Promise<LoginResult> {
  if (!googleWebClientId) {
    return {
      kind: "error",
      message: "Google login is not configured.",
    };
  }

  try {
    GoogleSignin.configure({
      webClientId: googleWebClientId,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });

    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    await GoogleSignin.signOut().catch(() => {});

    const signInResult: any = await GoogleSignin.signIn();

    if (signInResult?.type === "cancelled") {
      return { kind: "cancelled" };
    }

    if (!GoogleSignin.getCurrentUser()) {
      return { kind: "cancelled" };
    }

    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens?.idToken || "";

    if (!idToken) {
      return {
        kind: "error",
        message: "Google login failed. No Google token received.",
      };
    }

    const res = await axios.post(
      `${API_BASE}/auth/google`,
      { token: idToken, mode: "login" },
      {
        validateStatus: (status) =>
          status >= 200 && status < 500,
      },
    );

    const data = res.data || {};

    if (data.status === "no_account" || res.status === 404) {
      return {
        kind: "error",
        message: "No account associated with this email. Sign up to continue.",
      };
    }

    if (res.status >= 400) {
      return {
        kind: "error",
        message: serverMessage(
          data,
          "Google login failed. Please try again.",
        ),
      };
    }

    if (!data.token || !data.user) {
      return {
        kind: "error",
        message: "Invalid Google login response from server.",
      };
    }

    return {
      kind: "success",
      status: data.status,
      token: data.token,
      user: data.user,
    };
  } catch (err: any) {
    const message = String(err?.message || "");

    if (
      err?.code === statusCodes.SIGN_IN_CANCELLED ||
      message.toLowerCase().includes("cancel") ||
      message.includes("getTokens requires a user to be signed in")
    ) {
      return { kind: "cancelled" };
    }

    console.error("Unexpected Google login error:", err);

    return {
      kind: "error",
      message:
        err?.response?.data?.error ||
        err?.message ||
        "Google login failed. Please try again.",
    };
  }
}