/**
 * Path: app/auth/reset-password.tsx
 * Purpose: Preserve reset-code verification and password-update behavior.
 * UI: Rendered by the theme-aware ResetPasswordView component.
 */

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  API_BASE,
} from "../../src/config/api";

import ResetPasswordView from "../../src/features/auth/passwordRecovery/ResetPasswordView";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const { email } =
    useLocalSearchParams<{
      email: string;
    }>();

  const [code, setCode] =
    useState("");

  const [
    verified,
    setVerified,
  ] = useState(false);

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirm,
    setConfirm,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    cooldown,
    setCooldown,
  ] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const t = setInterval(
      () =>
        setCooldown(
          (c) => c - 1
        ),
      1000
    );

    return () =>
      clearInterval(t);
  }, [cooldown]);

  const handleResendCode =
    async () => {
      if (cooldown > 0) return;

      setError(null);
      setCooldown(60);

      try {
        await fetch(
          `${API_BASE}/auth/forgot-password`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
            }),
          }
        );
      } catch (err) {
        console.error(
          "Resend code error:",
          err
        );
      }
    };

  const handleVerifyCode =
    async () => {
      setError(null);

      if (
        !code ||
        code.length !== 6
      ) {
        setError(
          "Enter the 6-digit reset code."
        );
        return;
      }

      setLoading(true);

      try {
        const res =
          await fetch(
            `${API_BASE}/auth/verify-reset-code`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  email,
                  code,
                }),
            }
          );

        const data =
          await res
            .json()
            .catch(() => ({}));

        if (!res.ok) {
          setError(
            data?.error ||
              "Invalid reset code."
          );
          return;
        }

        setVerified(true);
      } catch (err) {
        console.error(
          "Verify code error:",
          err
        );

        setError(
          "Network error. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleSetPassword =
    async () => {
      setError(null);

      if (
        password.length < 6
      ) {
        setError(
          "Password must be at least 6 characters."
        );
        return;
      }

      if (
        password !== confirm
      ) {
        setError(
          "Passwords do not match."
        );
        return;
      }

      setLoading(true);

      try {
        const res =
          await fetch(
            `${API_BASE}/auth/reset-password`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  email,
                  code,
                  password,
                }),
            }
          );

        const data =
          await res
            .json()
            .catch(() => ({}));

        if (!res.ok) {
          setError(
            data?.error ||
              "Failed to reset password."
          );
          return;
        }

        router.replace(
          "/auth/login"
        );
      } catch (err) {
        console.error(
          "Reset password error:",
          err
        );

        setError(
          "Network error. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const strength =
    useMemo(() => {
      let score = 0;

      if (
        password.length >= 6
      ) {
        score++;
      }

      if (
        /[A-Z]/.test(password)
      ) {
        score++;
      }

      if (
        /[0-9]/.test(password)
      ) {
        score++;
      }

      if (
        /[^A-Za-z0-9]/.test(
          password
        )
      ) {
        score++;
      }

      const map = [
        {
          label: "Weak",
          color: "#ff4d4f",
          level: 1,
        },
        {
          label: "Fair",
          color: "#faad14",
          level: 2,
        },
        {
          label: "Good",
          color: "#52c41a",
          level: 3,
        },
        {
          label: "Strong",
          color: "#1890ff",
          level: 4,
        },
      ];

      return map[
        Math.min(score, 3)
      ];
    }, [password]);

  return (
    <ResetPasswordView
      code={code}
      setCode={setCode}
      verified={verified}
      password={password}
      setPassword={
        setPassword
      }
      confirm={confirm}
      setConfirm={setConfirm}
      showPassword={
        showPassword
      }
      setShowPassword={
        setShowPassword
      }
      loading={loading}
      error={error}
      cooldown={cooldown}
      strength={strength}
      handleVerifyCode={
        handleVerifyCode
      }
      handleResendCode={
        handleResendCode
      }
      handleSetPassword={
        handleSetPassword
      }
    />
  );
}