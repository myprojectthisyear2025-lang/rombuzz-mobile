/**
 * ============================================================
 * 📁 File: src/features/onboarding/useFirstSignupTour.ts
 * 🎯 Purpose: Control visibility and completion of the signup tour.
 *
 * Usage:
 *   Used only by FirstSignupTour after authenticated tabs mount.
 * ============================================================
 */

import {
    rbzGetCurrentUser,
} from "@/src/performance/api/rbzApiClient";
import {
    useCallback,
    useEffect,
    useState,
} from "react";
import {
    clearFirstSignupTourPending,
    shouldShowFirstSignupTour,
} from "./firstSignupTourStorage";

export function useFirstSignupTour() {
  const [visible, setVisible] =
    useState(false);

  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Force current SecureStore user instead of using
        // a possibly stale in-memory account.
        const user =
          await rbzGetCurrentUser(true);

        const shouldShow =
          await shouldShowFirstSignupTour(
            user
          );

        if (alive) {
          setVisible(shouldShow);
        }
      } catch {
        if (alive) {
          setVisible(false);
        }
      } finally {
        if (alive) {
          setReady(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const complete = useCallback(async () => {
    // Hide immediately. Storage cleanup can finish afterward.
    setVisible(false);

    await clearFirstSignupTourPending()
      .catch(() => {});
  }, []);

  return {
    visible: ready && visible,
    complete,
  };
}