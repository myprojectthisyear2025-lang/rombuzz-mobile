/**
 * ============================================================
 * 📁 File: src/features/auth/login/loginTypes.ts
 * 🎯 Purpose: Shared result types for RomBuzz login providers.
 *
 * USED BY:
 *   Email, Google, Apple login helpers and login controller.
 * ============================================================
 */

export type LoginSuccess = {
  kind: "success";
  status?: string;
  token: string;
  user: any;
};

export type LoginResult =
  | LoginSuccess
  | { kind: "cancelled" }
  | { kind: "error"; message: string };