/**
 * ============================================================================
 * 📁 File: src/constants/lookingFor.ts
 * 🎯 Purpose: Single source of truth for RomBuzz "Looking For" preferences.
 *
 * Used by:
 * - Signup
 * - Profile
 * - Discover
 * - Discover Filter
 * - Public profile labels
 *
 * Keeps legacy values backward-compatible while ensuring every RomBuzz screen
 * uses the same relationship-intention catalog.
 * ============================================================================
 */

export type LookingForOption = {
  key: string;
  label: string;
  icon: string;
};

export const LOOKING_FOR_OPTIONS: LookingForOption[] = [
  {
    key: "life-partner",
    label: "Life Partner",
    icon: "heart",
  },
  {
    key: "long-term",
    label: "Long-Term",
    icon: "heart-circle",
  },
  {
    key: "short-term",
    label: "Short-Term Dating",
    icon: "sparkles",
  },
  {
    key: "casual",
    label: "Casual Dating",
    icon: "cafe",
  },
  {
    key: "friendship",
    label: "Friendship",
    icon: "people",
  },
  {
    key: "new-connections",
    label: "New Connections",
    icon: "people-circle",
  },
  {
    key: "figuring-it-out",
    label: "Go With the Flow",
    icon: "compass",
  },
];

export const LOOKING_FOR_WITH_ALL: LookingForOption[] = [
  {
    key: "",
    label: "All",
    icon: "apps",
  },
  ...LOOKING_FOR_OPTIONS,
];

export const LOOKING_FOR_FILTER_OPTIONS = LOOKING_FOR_OPTIONS.map(
  ({ key, label }) => ({
    label,
    value: key,
  })
);

/**
 * Maps values already stored by older RomBuzz versions to the new catalog.
 * This prevents existing users from suddenly showing blank preferences.
 */
const LEGACY_LOOKING_FOR_ALIASES: Record<string, string> = {
  serious: "long-term",
  "serious relationship": "long-term",
  "long term": "long-term",
  longterm: "long-term",

  casual: "casual",
  "casual dating": "casual",

  friends: "friendship",
  friend: "friendship",

  chill: "new-connections",
  flirty: "new-connections",

  unsure: "figuring-it-out",
  "not sure": "figuring-it-out",
  exploring: "figuring-it-out",
};

/**
 * Values from old explicit categories are intentionally not converted into
 * another person's romantic intent. They safely fall back to New Connections.
 */
const LEGACY_REMOVED_VALUES = new Set([
  "gymbuddy",
  "gym buddy",
  "timepass",
  "ons",
  "one night stand",
  "one-night stand",
  "one-night-stand",
  "threesome",
  "onlyfans",
  "only fans",
  "only-fans",
]);

export function lookingForKeyFromValue(
  value?: string | null
): string {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const normalized = raw.toLowerCase();

  const directKey = LOOKING_FOR_OPTIONS.find(
    (option) => option.key === normalized
  );

  if (directKey) {
    return directKey.key;
  }

  const labelMatch = LOOKING_FOR_OPTIONS.find(
    (option) => option.label.toLowerCase() === normalized
  );

  if (labelMatch) {
    return labelMatch.key;
  }

  if (LEGACY_REMOVED_VALUES.has(normalized)) {
    return "new-connections";
  }

  return LEGACY_LOOKING_FOR_ALIASES[normalized] || raw;
}

export function lookingForLabelFromValue(
  value?: string | null
): string {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const key = lookingForKeyFromValue(raw);

  const match = LOOKING_FOR_OPTIONS.find(
    (option) => option.key === key.toLowerCase()
  );

  return match?.label || raw;
}