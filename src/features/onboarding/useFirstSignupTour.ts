/**
 * Path: src/features/onboarding/useFirstSignupTour.ts
 * Purpose: Control genuine-signup Tour visibility and safe Settings replay.
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
  subscribeToFirstSignupTourReplay,
} from "./firstSignupTourReplay";

import {
  clearFirstSignupTourPending,
  shouldShowFirstSignupTour,
} from "./firstSignupTourStorage";

export type FirstSignupTourEntry =
  | "signup"
  | "settings";

export function useFirstSignupTour() {
  const [
    visible,
    setVisible,
  ] = useState(false);

  const [
    ready,
    setReady,
  ] = useState(false);

  const [
    entry,
    setEntry,
  ] =
    useState<FirstSignupTourEntry>(
      "signup"
    );

  useEffect(() => {
    let alive = true;
    let replayRequested =
      false;

    const replaySubscription =
      subscribeToFirstSignupTourReplay(
        () => {
          replayRequested =
            true;

          setEntry("settings");
          setReady(true);
          setVisible(true);
        }
      );

    (async () => {
      try {
        const user =
          await rbzGetCurrentUser(
            true
          );

        const shouldShow =
          await shouldShowFirstSignupTour(
            user
          );

        if (
          alive &&
          !replayRequested
        ) {
          setEntry("signup");
          setVisible(
            shouldShow
          );
        }
      } catch {
        if (
          alive &&
          !replayRequested
        ) {
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

      replaySubscription.remove();
    };
  }, []);

  const complete =
    useCallback(
      async () => {
        setVisible(false);

        // Settings replay is presentation-only.
        // Never mutate genuine first-signup state.
        if (
          entry === "signup"
        ) {
          await clearFirstSignupTourPending()
            .catch(() => {});
        }
      },
      [entry]
    );

  return {
    visible:
      ready && visible,

    entry,

    complete,
  };
}