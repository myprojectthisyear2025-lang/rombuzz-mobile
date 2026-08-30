/**
 * ============================================================
 * 📁 File: src/features/appUpdate/appVersionPolicy.ts
 * 🎯 Purpose: Fetch, validate, and cache RomBuzz version policy.
 *
 * Usage:
 *   Used by AppUpdateGate during startup. Fresh failures fail open.
 *   Cached policies are short-lived and never force an update alone.
 * ============================================================
 */

import { rbzApiJson } from "@/src/performance/api/rbzApiClient";
import {
    rbzCacheGet,
    rbzCacheKey,
    rbzCacheSet,
} from "@/src/performance/cache/rbzCache";
import type {
    AppVersionRuntime,
    RomBuzzAppChannel,
    RomBuzzPlatform,
} from "./appVersionRuntime";
import {
    compareAppVersions,
    parseAppVersion,
} from "./versionCompare";

const REQUEST_TIMEOUT_MS = 4_500;
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_OPTIONAL_MESSAGE =
  "A newer version of RomBuzz is available.";

const DEFAULT_REQUIRED_MESSAGE =
  "This version of RomBuzz is no longer supported. Update RomBuzz to continue.";

export type AppVersionPolicy = {
  schemaVersion: 1;
  enabled: boolean;
  platform: RomBuzzPlatform;
  channel: RomBuzzAppChannel;
  latestVersion?: string;
  minimumSupportedVersion?: string;
  storeUrl?: string;
  optionalMessage?: string;
  requiredMessage?: string;
};

function policyCacheKey(runtime: AppVersionRuntime) {
  return rbzCacheKey(
    "RBZ",
    "app-version-policy",
    runtime.channel,
    runtime.platform
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidStoreUrl(platform: RomBuzzPlatform, value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return false;

    return platform === "android"
      ? url.hostname === "play.google.com"
      : url.hostname === "apps.apple.com";
  } catch {
    return false;
  }
}

export function validateAppVersionPolicy(
  raw: unknown,
  runtime: AppVersionRuntime
): AppVersionPolicy | null {
  if (!isRecord(raw)) return null;

  if (
    raw.schemaVersion !== 1 ||
    typeof raw.enabled !== "boolean"
  ) {
    return null;
  }

  if (
    raw.platform !== runtime.platform ||
    raw.channel !== runtime.channel
  ) {
    return null;
  }

  if (!raw.enabled) {
    return {
      schemaVersion: 1,
      enabled: false,
      platform: runtime.platform,
      channel: runtime.channel,
    };
  }

  const latestVersion = cleanString(raw.latestVersion);

  const minimumSupportedVersion = cleanString(
    raw.minimumSupportedVersion
  );

  const storeUrl = cleanString(raw.storeUrl);

  if (
    !parseAppVersion(latestVersion) ||
    !parseAppVersion(minimumSupportedVersion) ||
    compareAppVersions(
      minimumSupportedVersion,
      latestVersion
    ) === 1 ||
    !isValidStoreUrl(runtime.platform, storeUrl)
  ) {
    return null;
  }

  return {
    schemaVersion: 1,
    enabled: true,
    platform: runtime.platform,
    channel: runtime.channel,
    latestVersion,
    minimumSupportedVersion,
    storeUrl,

    optionalMessage:
      cleanString(raw.optionalMessage) ||
      DEFAULT_OPTIONAL_MESSAGE,

    requiredMessage:
      cleanString(raw.requiredMessage) ||
      DEFAULT_REQUIRED_MESSAGE,
  };
}

export async function loadCachedAppVersionPolicy(
  runtime: AppVersionRuntime
): Promise<AppVersionPolicy | null> {
  const cached = await rbzCacheGet<unknown>(
    policyCacheKey(runtime),
    null
  );

  if (
    !cached.hit ||
    !cached.savedAt ||
    Date.now() - cached.savedAt > CACHE_MAX_AGE_MS
  ) {
    return null;
  }

  return validateAppVersionPolicy(
    cached.value,
    runtime
  );
}

export async function fetchFreshAppVersionPolicy(
  runtime: AppVersionRuntime
): Promise<AppVersionPolicy | null> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const raw = await rbzApiJson<unknown>(
      `/app-version?platform=${encodeURIComponent(
        runtime.platform
      )}&channel=${encodeURIComponent(runtime.channel)}`,
      {
        method: "GET",
        auth: false,
        signal: controller.signal,
      }
    );

    const policy = validateAppVersionPolicy(
      raw,
      runtime
    );

    if (!policy) {
      return null;
    }

    await rbzCacheSet(
      policyCacheKey(runtime),
      policy
    );

    return policy;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}