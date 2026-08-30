/**
 * ============================================================
 * 📁 File: src/features/appUpdate/optionalUpdateCooldown.ts
 * 🎯 Purpose: Prevent repeated optional-update prompts.
 *
 * Usage:
 *   Limits each target version to one prompt per app session and
 *   remembers Update/Later choices for 72 hours on this device.
 * ============================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppVersionRuntime } from "./appVersionRuntime";

const COOLDOWN_MS = 72 * 60 * 60 * 1000;
const promptedThisSession = new Set<string>();

type Dismissal = {
  latestVersion: string;
  handledAt: number;
};

function storageKey(runtime: AppVersionRuntime) {
  return [
    "RBZ",
    "app-update",
    "optional",
    runtime.channel,
    runtime.platform,
  ].join(":");
}

function sessionKey(
  runtime: AppVersionRuntime,
  latestVersion: string
) {
  return `${storageKey(runtime)}:${latestVersion}`;
}

export async function shouldShowOptionalUpdate(
  runtime: AppVersionRuntime,
  latestVersion: string
) {
  const currentSessionKey = sessionKey(
    runtime,
    latestVersion
  );

  if (promptedThisSession.has(currentSessionKey)) {
    return false;
  }

  try {
    const raw = await AsyncStorage.getItem(
      storageKey(runtime)
    );

    const parsed = raw
      ? (JSON.parse(raw) as Partial<Dismissal>)
      : null;

    if (
      parsed?.latestVersion === latestVersion &&
      typeof parsed.handledAt === "number" &&
      Date.now() - parsed.handledAt < COOLDOWN_MS
    ) {
      return false;
    }
  } catch {}

  promptedThisSession.add(currentSessionKey);

  return true;
}

export async function markOptionalUpdateHandled(
  runtime: AppVersionRuntime,
  latestVersion: string
) {
  promptedThisSession.add(
    sessionKey(runtime, latestVersion)
  );

  const value: Dismissal = {
    latestVersion,
    handledAt: Date.now(),
  };

  try {
    await AsyncStorage.setItem(
      storageKey(runtime),
      JSON.stringify(value)
    );
  } catch {}
}