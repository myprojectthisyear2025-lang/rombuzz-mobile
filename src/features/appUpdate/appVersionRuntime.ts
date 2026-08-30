/**
 * ============================================================
 * 📁 File: src/features/appUpdate/appVersionRuntime.ts
 * 🎯 Purpose: Identify RomBuzz platform, build channel,
 *    installed native version, and native build number.
 *
 * Usage:
 *   Read once by the global app-update gate during startup.
 * ============================================================
 */

import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

export type RomBuzzPlatform =
  | "android"
  | "ios";

export type RomBuzzAppChannel =
  | "development"
  | "preview"
  | "production";

export type AppVersionRuntime = {
  platform: RomBuzzPlatform;
  channel: RomBuzzAppChannel;
  installedVersion: string;
  nativeBuildVersion: string;
  applicationId: string;
};

function resolveChannel(): RomBuzzAppChannel {
  const rawValue = String(
    Constants.expoConfig?.extra?.appVariant || ""
  )
    .trim()
    .toLowerCase();

  if (
    rawValue === "development" ||
    rawValue === "preview" ||
    rawValue === "production"
  ) {
    return rawValue;
  }

  // Fail-safe:
  // never assume production when environment is unknown.
  return "development";
}

export function getAppVersionRuntime():
  | AppVersionRuntime
  | null {
  if (
    Platform.OS !== "android" &&
    Platform.OS !== "ios"
  ) {
    return null;
  }

  const nativeVersion =
    Application.nativeApplicationVersion?.trim() ||
    "";

  const configVersion = String(
    Constants.expoConfig?.version || ""
  ).trim();

  const installedVersion =
    nativeVersion || configVersion;

  if (!installedVersion) {
    return null;
  }

  return {
    platform: Platform.OS,
    channel: resolveChannel(),
    installedVersion,
    nativeBuildVersion:
      Application.nativeBuildVersion?.trim() || "",
    applicationId:
      Application.applicationId?.trim() || "",
  };
}