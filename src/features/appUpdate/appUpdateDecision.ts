/**
 * ============================================================
 * 📁 File: src/features/appUpdate/appUpdateDecision.ts
 * 🎯 Purpose: Convert a validated version policy into an update state.
 *
 * Usage:
 *   Fresh policies may require an update. Cached policies may only
 *   produce an optional update, never a hard lock.
 * ============================================================
 */

import type { AppVersionPolicy } from "./appVersionPolicy";
import { compareAppVersions } from "./versionCompare";

export type AppUpdateDecision =
  | {
      kind: "none";
    }
  | {
      kind: "optional";
      latestVersion: string;
      storeUrl: string;
      message: string;
    }
  | {
      kind: "required";
      latestVersion: string;
      minimumSupportedVersion: string;
      storeUrl: string;
      message: string;
    };

export function decideAppUpdate(
  installedVersion: string,
  policy: AppVersionPolicy | null,
  source: "fresh" | "cached"
): AppUpdateDecision {
  if (
    !policy?.enabled ||
    !policy.latestVersion ||
    !policy.minimumSupportedVersion ||
    !policy.storeUrl
  ) {
    return { kind: "none" };
  }

  const vsMinimum = compareAppVersions(
    installedVersion,
    policy.minimumSupportedVersion
  );

  const vsLatest = compareAppVersions(
    installedVersion,
    policy.latestVersion
  );

  if (
    vsMinimum === null ||
    vsLatest === null
  ) {
    return { kind: "none" };
  }

  if (
    source === "fresh" &&
    vsMinimum === -1
  ) {
    return {
      kind: "required",
      latestVersion: policy.latestVersion,
      minimumSupportedVersion:
        policy.minimumSupportedVersion,
      storeUrl: policy.storeUrl,
      message:
        policy.requiredMessage ||
        "This version of RomBuzz is no longer supported. Update RomBuzz to continue.",
    };
  }

  if (vsLatest === -1) {
    return {
      kind: "optional",
      latestVersion: policy.latestVersion,
      storeUrl: policy.storeUrl,
      message:
        policy.optionalMessage ||
        "A newer version of RomBuzz is available.",
    };
  }

  return { kind: "none" };
}