/**
 * Path: src/features/discoverFilters/discoverFilterModel.ts
 * Purpose: Shared Discover Filter state, normalization, and helpers.
 */

import {
    relationshipStyleKeyFromValue,
} from "@/src/constants/relationshipStyles";

export type DiscoverFilters = {
  rangeMiles: number;
  ageMin: number;
  ageMax: number;
  gender: string;

  lookingFor: string[];
  vibe: string[];
  relationshipStyle: string[];
  bodyType: string[];
  fitnessLevel: string[];
  smoking: string[];
  drinking: string[];
  workoutFrequency: string[];
  diet: string[];
  sleepSchedule: string[];
  educationLevel: string[];
  travelStyle: string[];
  petsPreference: string[];
  zodiac: string[];
  loveLanguage: string[];
  interest: string[];

  onlineOnly: boolean;
  verifiedOnly: boolean;
  photosOnly: boolean;
};

export const DEFAULT_FILTERS:
  DiscoverFilters = {
    rangeMiles: 25,

    ageMin: 21,
    ageMax: 55,

    gender: "",

    lookingFor: [],
    vibe: [],
    relationshipStyle: [],
    bodyType: [],
    fitnessLevel: [],
    smoking: [],
    drinking: [],
    workoutFrequency: [],
    diet: [],
    sleepSchedule: [],
    educationLevel: [],
    travelStyle: [],
    petsPreference: [],
    zodiac: [],
    loveLanguage: [],
    interest: [],

    onlineOnly: false,
    verifiedOnly: false,
    photosOnly: true,
  };

const ARRAY_KEYS:
  (keyof DiscoverFilters)[] = [
    "lookingFor",
    "vibe",
    "relationshipStyle",
    "bodyType",
    "fitnessLevel",
    "smoking",
    "drinking",
    "workoutFrequency",
    "diet",
    "sleepSchedule",
    "educationLevel",
    "petsPreference",
    "zodiac",
    "loveLanguage",
    "interest",
  ];

export function normalizeFilterState(
  value:
    | Partial<DiscoverFilters>
    | null
    | undefined
): DiscoverFilters {
  const merged = {
    ...DEFAULT_FILTERS,
    ...(value || {}),
  } as DiscoverFilters;

  const relationshipStyle =
    relationshipStyleKeyFromValue(
      Array.isArray(
        merged.relationshipStyle
      )
        ? merged
            .relationshipStyle[0]
        : ""
    );

  return {
    ...merged,

    relationshipStyle:
      relationshipStyle
        ? [relationshipStyle]
        : [],

    // Preserved from latest
    // RomBuzz mobile behavior.
    // Travel Style is legacy /
    // web-only.
    travelStyle: [],
  };
}

export function parseIncoming(
  raw: unknown
): DiscoverFilters {
  if (
    typeof raw !== "string" ||
    !raw.trim()
  ) {
    return normalizeFilterState(
      DEFAULT_FILTERS
    );
  }

  try {
    const parsed =
      JSON.parse(
        decodeURIComponent(raw)
      );

    return normalizeFilterState(
      parsed &&
        typeof parsed ===
          "object"
        ? parsed
        : {}
    );
  } catch {
    return normalizeFilterState(
      DEFAULT_FILTERS
    );
  }
}

export function toggleInArray(
  list: string[],
  value: string
) {
  return list.includes(value)
    ? list.filter(
        (item) =>
          item !== value
      )
    : [
        ...list,
        value,
      ];
}

export function countActiveFilters(
  filters: DiscoverFilters
) {
  let count = 0;

  ARRAY_KEYS.forEach(
    (key) => {
      const value =
        filters[key];

      if (
        Array.isArray(
          value
        ) &&
        value.length > 0
      ) {
        count += 1;
      }
    }
  );

  if (filters.gender) {
    count += 1;
  }

  if (
    filters.rangeMiles !==
    DEFAULT_FILTERS.rangeMiles
  ) {
    count += 1;
  }

  if (
    filters.ageMin !==
      DEFAULT_FILTERS.ageMin ||
    filters.ageMax !==
      DEFAULT_FILTERS.ageMax
  ) {
    count += 1;
  }

  if (
    filters.onlineOnly
  ) {
    count += 1;
  }

  if (
    filters.verifiedOnly
  ) {
    count += 1;
  }

  if (
    filters.photosOnly !==
    DEFAULT_FILTERS.photosOnly
  ) {
    count += 1;
  }

  return count;
}