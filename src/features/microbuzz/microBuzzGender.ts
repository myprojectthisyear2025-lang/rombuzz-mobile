/**
 * Path: src/features/microbuzz/microBuzzGender.ts
 * Purpose: Starts MicroBuzz gender from the user's latest Discover filter.
 */

import {
    loadSavedDiscoverFilters,
} from "@/src/features/discover/discoverFilterStorage";

import type {
    MicroBuzzGender,
} from "./microBuzzTypes";

function normalizeGender(
  value: unknown
): MicroBuzzGender {
  const gender =
    String(
      value || ""
    ).toLowerCase();

  if (
    gender === "male"
  ) {
    return "male";
  }

  if (
    gender === "female"
  ) {
    return "female";
  }

  return "everyone";
}

export async function loadMicroBuzzDefaultGender():
Promise<MicroBuzzGender> {
  try {
    const saved =
      await loadSavedDiscoverFilters<{
        gender: string;
      }>({
        gender: "",
      });

    return normalizeGender(
      saved?.gender
    );
  } catch {
    return "everyone";
  }
}