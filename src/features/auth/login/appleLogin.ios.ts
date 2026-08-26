/**
 * ============================================================
 * 📁 File: src/features/auth/login/appleLogin.ios.ts
 * 🎯 Purpose: Native iOS Sign in with Apple login request.
 *
 * LOCATION:
 *   src/features/auth/login/appleLogin.ios.ts
 *
 * USED BY:
 *   useLoginController.ts on iOS only.
 * ============================================================
 */

import axios from "axios";
import * as AppleAuthentication from "expo-apple-authentication";

import { API_BASE } from "../../../config/api";
import type { LoginResult } from "./loginTypes";

export async function loginWithApple(): Promise<LoginResult> {
  try {
    const available =
      await AppleAuthentication.isAvailableAsync();

    if (!available) {
      return {
        kind: "error",
        message:
          "Sign in with Apple is unavailable on this device.",
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
          "Apple login failed. No identity token received.",
      };
    }

    if (!credential.authorizationCode) {
      return {
        kind: "error",
        message:
          "Apple login failed. No authorization code received.",
      };
    }

    const res = await axios.post(
      `${API_BASE}/auth/apple`,
      {
        token:
          credential.identityToken,

        authorizationCode:
          credential.authorizationCode,

        mode: "login",
      },
      {
        validateStatus: (status) =>
          status >= 200 && status < 500,
      },
    );

    const data = res.data || {};

    if (
      data.status === "no_account" ||
      res.status === 404
    ) {
      return {
        kind: "error",
        message:
          "No account associated with this Apple ID. Sign up to continue.",
      };
    }

    if (res.status >= 400) {
      return {
        kind: "error",
        message:
          data.error ||
          "Apple login failed. Please try again.",
      };
    }

    if (!data.token || !data.user) {
      return {
        kind: "error",
        message:
          "Invalid Apple login response from server.",
      };
    }

    return {
      kind: "success",
      status: data.status,
      token: data.token,
      user: data.user,
    };
  } catch (err: any) {
    if (err?.code === "ERR_REQUEST_CANCELED") {
      return { kind: "cancelled" };
    }

    console.error(
      "Unexpected Apple login error:",
      err,
    );

    return {
      kind: "error",
      message:
        err?.response?.data?.error ||
        err?.message ||
        "Apple login failed. Please try again.",
    };
  }
}