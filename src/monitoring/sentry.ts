/**
 * ============================================================
 * 📁 File: src/monitoring/sentry.ts
 * 🎯 Purpose: Initialize Sentry for RomBuzz mobile.
 *
 * Provides:
 *   - JS/native crash reporting
 *   - API performance tracing
 *   - distributed backend tracing
 *   - privacy filtering
 *
 * Logging, screenshots, and replay stay disabled.
 * ============================================================
 */

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import {
    sanitizeSentryBreadcrumb,
    sanitizeSentryEvent,
} from "./sentryPrivacy";

const dsn = (
  process.env.EXPO_PUBLIC_SENTRY_DSN || ""
).trim();

const appId =
  Constants.expoConfig?.android?.package ||
  Constants.expoConfig?.ios?.bundleIdentifier ||
  "";

const environment = appId.endsWith(".dev")
  ? "development"
  : appId.endsWith(".preview")
    ? "preview"
    : "production";

if (dsn) {
  Sentry.init({
    dsn,
    environment,

    sendDefaultPii: false,

    // Keep private RomBuzz logs out of Sentry.
    enableLogs: false,

    // Do not capture user screens/images.
    attachScreenshot: false,
    attachViewHierarchy: false,

    // Full tracing while developing, conservative in production.
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Link mobile API traces to the RomBuzz backend.
    tracePropagationTargets: [
      /^https:\/\/rombuzz-api-ulyk\.onrender\.com/,
    ],

    beforeSend: sanitizeSentryEvent,
      beforeBreadcrumb: sanitizeSentryBreadcrumb,
  });
}

export { Sentry };
