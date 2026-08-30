/**
 * ============================================================
 * 📁 File: src/features/appUpdate/AppUpdateGate.tsx
 * 🎯 Purpose: Run the global RomBuzz app-version check.
 *
 * Usage:
 *   Wraps the root app. Fresh policies may hard-block unsupported
 *   builds; cached policies can only surface optional updates.
 * ============================================================
 */

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Linking } from "react-native";
import {
  decideAppUpdate,
  type AppUpdateDecision,
} from "./appUpdateDecision";
import {
  fetchFreshAppVersionPolicy,
  loadCachedAppVersionPolicy,
} from "./appVersionPolicy";
import { getAppVersionRuntime } from "./appVersionRuntime";
import {
  markOptionalUpdateHandled,
  shouldShowOptionalUpdate,
} from "./optionalUpdateCooldown";
import OptionalUpdatePrompt from "./OptionalUpdatePrompt";
import RequiredUpdateScreen from "./RequiredUpdateScreen";

type Props = {
  children: React.ReactNode;
};

type OptionalDecision = Extract<
  AppUpdateDecision,
  { kind: "optional" }
>;

type RequiredDecision = Extract<
  AppUpdateDecision,
  { kind: "required" }
>;

export default function AppUpdateGate({
  children,
}: Props) {
  const runtime = useMemo(
    () => getAppVersionRuntime(),
    []
  );

  const [required, setRequired] =
    useState<RequiredDecision | null>(null);

  const [optional, setOptional] =
    useState<OptionalDecision | null>(null);

  useEffect(() => {
    if (!runtime) return;

    let cancelled = false;

    const runCheck = async () => {
      const [freshPolicy, cachedPolicy] =
        await Promise.all([
          fetchFreshAppVersionPolicy(runtime),
          loadCachedAppVersionPolicy(runtime),
        ]);

      if (cancelled) return;

      const source = freshPolicy
        ? "fresh"
        : "cached";

      const policy =
        freshPolicy || cachedPolicy;

      const decision = decideAppUpdate(
        runtime.installedVersion,
        policy,
        source
      );

      if (decision.kind === "required") {
        setOptional(null);
        setRequired(decision);
        return;
      }

      setRequired(null);

      if (decision.kind !== "optional") {
        setOptional(null);
        return;
      }

      const shouldShow =
        await shouldShowOptionalUpdate(
          runtime,
          decision.latestVersion
        );

      if (!cancelled && shouldShow) {
        setOptional(decision);
      }
    };

    runCheck().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [runtime]);

  const handleOptionalUpdate = async () => {
    if (!runtime || !optional) {
      return false;
    }

    try {
      await Linking.openURL(
        optional.storeUrl
      );

      await markOptionalUpdateHandled(
        runtime,
        optional.latestVersion
      );

      setOptional(null);

      return true;
    } catch {
      return false;
    }
  };

  const handleLater = async () => {
    if (!runtime || !optional) {
      setOptional(null);
      return;
    }

    await markOptionalUpdateHandled(
      runtime,
      optional.latestVersion
    );

    setOptional(null);
  };

  if (required) {
    return (
      <RequiredUpdateScreen
        latestVersion={required.latestVersion}
        message={required.message}
        storeUrl={required.storeUrl}
      />
    );
  }

  return (
    <>
      {children}

      {optional ? (
        <OptionalUpdatePrompt
          latestVersion={
            optional.latestVersion
          }
          message={optional.message}
          onLater={handleLater}
          onUpdate={
            handleOptionalUpdate
          }
        />
      ) : null}
    </>
  );
}