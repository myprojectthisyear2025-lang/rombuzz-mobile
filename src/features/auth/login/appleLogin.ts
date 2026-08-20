/**
 * ============================================================
 * 📁 File: src/features/auth/login/appleLogin.ts
 * 🎯 Purpose: Non-iOS fallback for Apple login.
 *
 * LOCATION:
 *   src/features/auth/login/appleLogin.ts
 *
 * USED BY:
 *   Android/web builds. Apple login is intentionally unavailable.
 * ============================================================
 */

import type { LoginResult } from "./loginTypes";

export async function loginWithApple(): Promise<LoginResult> {
  return { kind: "cancelled" };
}