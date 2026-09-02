/**
 * ============================================================
 * 📁 File: src/features/onboarding/firstSignupTourStorage.ts
 * 🎯 Purpose: Track whether the current user should see the
 *    one-time RomBuzz first-signup feature tour.
 *
 * Usage:
 *   New account creation marks the tour pending.
 *   Normal login clears stale pending state.
 *   The tour clears itself after Finish or Skip.
 * ============================================================
 */

import * as SecureStore from "expo-secure-store";

const PENDING_USER_KEY =
  "RBZ_FIRST_SIGNUP_TOUR_PENDING_USER";

function getUserId(user: unknown): string {
  if (
    !user ||
    typeof user !== "object"
  ) {
    return "";
  }

  const value = user as {
    id?: unknown;
    _id?: unknown;
  };

  return String(
    value.id || value._id || ""
  ).trim();
}

export async function markFirstSignupTourPending(
  user: unknown
) {
  const userId = getUserId(user);

  if (!userId) {
    return;
  }

  await SecureStore.setItemAsync(
    PENDING_USER_KEY,
    userId
  );
}

export async function clearFirstSignupTourPending() {
  await SecureStore.deleteItemAsync(
    PENDING_USER_KEY
  );
}

export async function shouldShowFirstSignupTour(
  user: unknown
) {
  const userId = getUserId(user);

  if (!userId) {
    return false;
  }

  try {
    const pendingUserId =
      await SecureStore.getItemAsync(
        PENDING_USER_KEY
      );

    return pendingUserId === userId;
  } catch {
    return false;
  }
}