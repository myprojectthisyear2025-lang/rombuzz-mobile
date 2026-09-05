/**
 * ============================================================================
 * 📁 File: src/constants/relationshipStyles.ts
 * 🎯 Purpose: Shared RomBuzz Relationship Style options + legacy compatibility.
 *
 * - One selection only.
 * - Used by Profile, signup, Discover and Discover Filter.
 * - Preserves older mobile/backend values such as monogamous, open and poly.
 * ============================================================================
 */

export type RelationshipStyleOption = {
  key: string;
  label: string;
};

export const RELATIONSHIP_STYLE_OPTIONS: RelationshipStyleOption[] = [
  {
    key: "monogamous",
    label: "Monogamous",
  },
  {
    key: "open-relationship",
    label: "Open Relationship",
  },
  {
    key: "polyamorous",
    label: "Polyamorous",
  },
  {
    key: "exploring",
    label: "Exploring My Options",
  },
  {
    key: "not-sure",
    label: "Not Sure Yet",
  },
  {
    key: "open-to-discuss",
    label: "Open to Discussing",
  },
];

export const RELATIONSHIP_STYLE_FILTER_OPTIONS =
  RELATIONSHIP_STYLE_OPTIONS.map(({ key, label }) => ({
    label,
    value: key,
  }));

const LEGACY_RELATIONSHIP_STYLE_ALIASES: Record<string, string> = {
  monogamy: "monogamous",
  monogamous: "monogamous",

  open: "open-relationship",
  "open relationship": "open-relationship",
  "open-relationship": "open-relationship",

  poly: "polyamorous",
  polyamory: "polyamorous",
  polyamorous: "polyamorous",

  exploring: "exploring",
  "exploring my options": "exploring",

  unsure: "not-sure",
  "not sure": "not-sure",
  "not sure yet": "not-sure",
  "not-sure": "not-sure",

  "open to discussing": "open-to-discuss",
  "open-to-discuss": "open-to-discuss",
};

export function relationshipStyleKeyFromValue(
  value?: string | null
): string {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const normalized = raw.toLowerCase();

  const direct = RELATIONSHIP_STYLE_OPTIONS.find(
    (option) => option.key === normalized
  );

  if (direct) return direct.key;

  const labelMatch = RELATIONSHIP_STYLE_OPTIONS.find(
    (option) => option.label.toLowerCase() === normalized
  );

  if (labelMatch) return labelMatch.key;

  return LEGACY_RELATIONSHIP_STYLE_ALIASES[normalized] || raw;
}

export function relationshipStyleLabelFromValue(
  value?: string | null
): string {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const key = relationshipStyleKeyFromValue(raw);

  const match = RELATIONSHIP_STYLE_OPTIONS.find(
    (option) => option.key === key.toLowerCase()
  );

  return match?.label || raw;
}