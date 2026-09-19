/**
 * Path: src/features/auth/passwordRecovery/resetPasswordTypes.ts
 * Purpose: Shared presentation props for the reset-password flow.
 */

import type {
    Dispatch,
    SetStateAction,
} from "react";

export type ResetStrength = {
  label: string;
  color: string;
  level: number;
};

export type ResetPasswordViewProps = {
  code: string;
  setCode: (
    value: string
  ) => void;

  verified: boolean;

  password: string;
  setPassword: (
    value: string
  ) => void;

  confirm: string;
  setConfirm: (
    value: string
  ) => void;

  showPassword: boolean;

  setShowPassword:
    Dispatch<
      SetStateAction<boolean>
    >;

  loading: boolean;

  error:
    | string
    | null;

  cooldown: number;

  strength:
    ResetStrength;

  handleVerifyCode:
    () => void;

  handleResendCode:
    () => void;

  handleSetPassword:
    () => void;
};