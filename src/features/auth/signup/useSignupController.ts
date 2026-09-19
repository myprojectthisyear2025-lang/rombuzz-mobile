/**
 * Path: src/features/auth/signup/useSignupController.ts
 * Purpose: Preserve RomBuzz email OTP, Google, Apple, timer, and navigation behavior.
 */

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { TextInput } from "react-native";

import { API_BASE } from "@/src/config/api";
import { signupWithApple } from "./appleSignup";
import { runGoogleSignup } from "./signupGoogleAction";

export function useSignupController() {
  const router = useRouter();
  const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId || "";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const codeRef = useRef<TextInput | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: googleWebClientId,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
  }, [googleWebClientId]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(
      () => setCountdown((value) => value - 1),
      1000
    );

    return () => clearTimeout(timer);
  }, [countdown]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const changeEmail = (value: string) => {
    setEmail(value);
    clearMessages();
    setCode("");
  };

  const changeCode = (value: string) => {
    setCode(value);
    clearMessages();
  };

  const sendCode = async () => {
    clearMessages();

    const trimmed = email.trim().toLowerCase();

    if (
      !trimmed ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    ) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/auth/send-code`,
        { email: trimmed }
      );

      if (res.data?.success) {
        setSuccess(
          "Verification code sent! Check inbox/spam."
        );

        setStep(2);
        setCountdown(60);

        setTimeout(
          () => codeRef.current?.focus(),
          250
        );
      } else {
        setError(
          res.data?.error ||
            "Failed to send code."
        );
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          "Error sending code."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    clearMessages();

    const trimmedEmail =
      email.trim().toLowerCase();

    const trimmedCode =
      code.trim();

    if (
      !trimmedCode ||
      trimmedCode.length !== 6
    ) {
      setError(
        "Please enter a 6-digit code."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/auth/verify-code`,
        {
          email: trimmedEmail,
          code: trimmedCode,
        }
      );

      if (!res.data?.success) {
        throw new Error(
          "Invalid verification code."
        );
      }

      const ticket = String(
        res.data?.emailSignupTicket || ""
      );

      setSuccess(
        "Email verified! Redirecting..."
      );

      setTimeout(() => {
        router.replace({
          pathname:
            "/auth/register-full",

          params: {
            verifiedEmail:
              trimmedEmail,

            authProvider:
              "email",

            signupVerificationTicket:
              ticket,
          },
        });
      }, 600);
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Invalid or expired verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup =
    async () => {
      setLoading(true);
      setGoogleLoading(true);
      clearMessages();

      try {
        const result =
          await runGoogleSignup(
            googleWebClientId
          );

        if (
          result.kind ===
          "cancelled"
        ) {
          return;
        }

        if (
          result.kind ===
          "account_exists"
        ) {
          setError(
            "An account already exists with this Gmail. Try logging in."
          );

          setTimeout(
            () =>
              router.replace(
                "/auth/login"
              ),
            900
          );

          return;
        }

        if (
          result.kind ===
          "error"
        ) {
          setError(
            result.message
          );

          return;
        }

        router.replace({
          pathname:
            "/auth/register-full",

          params: {
            verifiedEmail:
              result.email,

            googleFirstName:
              result.firstName,

            googleLastName:
              result.lastName,

            googleAvatar:
              result.avatar,

            authProvider:
              "google",

            signupVerificationTicket:
              result.ticket,
          },
        });
      } finally {
        setLoading(false);
        setGoogleLoading(false);
      }
    };

  const handleAppleSignup =
    async () => {
      setLoading(true);
      setAppleLoading(true);
      clearMessages();

      try {
        const result =
          await signupWithApple();

        if (
          result.kind ===
          "cancelled"
        ) {
          return;
        }

        if (
          result.kind ===
          "account_exists"
        ) {
          setError(
            result.message
          );

          setTimeout(
            () =>
              router.replace(
                "/auth/login"
              ),
            900
          );

          return;
        }

        if (
          result.kind ===
          "error"
        ) {
          setError(
            result.message
          );

          return;
        }

        router.replace({
          pathname:
            "/auth/register-full",

          params: {
            verifiedEmail:
              result.profile.email,

            appleFirstName:
              result.profile
                .firstName || "",

            appleLastName:
              result.profile
                .lastName || "",

            authProvider:
              "apple",

            appleSignupTicket:
              result.appleSignupTicket,
          },
        });
      } catch (err: any) {
        console.error(
          "Unexpected Apple signup error:",
          err
        );

        setError(
          err?.message ||
            "Apple signup failed. Please try again."
        );
      } finally {
        setLoading(false);
        setAppleLoading(false);
      }
    };

  const backToEmail = () => {
    setStep(1);
    clearMessages();
  };

  return {
    email,
    code,
    step,
    countdown,
    loading,
    googleLoading,
    appleLoading,
    error,
    success,
    codeRef,

    isBusy:
      loading ||
      googleLoading ||
      appleLoading,

    changeEmail,
    changeCode,
    sendCode,
    verifyCode,
    handleGoogleSignup,
    handleAppleSignup,
    backToEmail,

    goToLogin: () =>
      router.push(
        "/auth/login"
      ),
  };
}