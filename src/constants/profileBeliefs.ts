/**
 * ============================================================================
 * 📁 File: src/constants/profileBeliefs.ts
 * 🎯 Purpose: Shared Religion, Political Views and Zodiac profile choices.
 *
 * - Manual/custom typing remains supported.
 * - Zodiac stores the sign name and displays its symbol.
 * - Options are shared by profile editing/public display helpers.
 * ============================================================================
 */

export type ProfileChoiceOption = {
  label: string;
  value: string;
};

export const RELIGION_OPTIONS: ProfileChoiceOption[] = [
  { label: "Christian", value: "Christian" },
  { label: "Catholic", value: "Catholic" },
  { label: "Protestant", value: "Protestant" },
  { label: "Orthodox Christian", value: "Orthodox Christian" },
  { label: "Anglican", value: "Anglican" },
  { label: "Baptist", value: "Baptist" },
  { label: "Evangelical", value: "Evangelical" },
  { label: "Latter-day Saint", value: "Latter-day Saint" },
  { label: "Jehovah's Witness", value: "Jehovah's Witness" },

  { label: "Muslim", value: "Muslim" },
  { label: "Sunni Muslim", value: "Sunni Muslim" },
  { label: "Shia Muslim", value: "Shia Muslim" },

  { label: "Hindu", value: "Hindu" },
  { label: "Buddhist", value: "Buddhist" },
  { label: "Sikh", value: "Sikh" },
  { label: "Jewish", value: "Jewish" },
  { label: "Jain", value: "Jain" },
  { label: "Baháʼí", value: "Baháʼí" },
  { label: "Taoist", value: "Taoist" },
  { label: "Shinto", value: "Shinto" },
  { label: "Pagan / Wiccan", value: "Pagan / Wiccan" },

  { label: "Spiritual", value: "Spiritual" },
  {
    label: "Spiritual but not religious",
    value: "Spiritual but not religious",
  },
  { label: "Agnostic", value: "Agnostic" },
  { label: "Atheist", value: "Atheist" },
  { label: "Non-religious", value: "Non-religious" },
  {
    label: "Indigenous / Traditional",
    value: "Indigenous / Traditional",
  },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Prefer not to say" },
];

export const POLITICAL_VIEW_OPTIONS: ProfileChoiceOption[] = [
  { label: "Apolitical", value: "Apolitical" },
  { label: "Not Political", value: "Not Political" },
  { label: "Left", value: "Left" },
  { label: "Center-left", value: "Center-left" },
  { label: "Centrist", value: "Centrist" },
  { label: "Center-right", value: "Center-right" },
  { label: "Right", value: "Right" },
  { label: "Liberal", value: "Liberal" },
  { label: "Progressive", value: "Progressive" },
  { label: "Moderate", value: "Moderate" },
  { label: "Conservative", value: "Conservative" },
  { label: "Libertarian", value: "Libertarian" },
  { label: "Social Democrat", value: "Social Democrat" },
  { label: "Socialist", value: "Socialist" },
  { label: "Green", value: "Green" },
  { label: "Independent", value: "Independent" },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Prefer not to say" },
];

export const ZODIAC_OPTIONS: ProfileChoiceOption[] = [
  { label: "♈ Aries", value: "Aries" },
  { label: "♉ Taurus", value: "Taurus" },
  { label: "♊ Gemini", value: "Gemini" },
  { label: "♋ Cancer", value: "Cancer" },
  { label: "♌ Leo", value: "Leo" },
  { label: "♍ Virgo", value: "Virgo" },
  { label: "♎ Libra", value: "Libra" },
  { label: "♏ Scorpio", value: "Scorpio" },
  { label: "♐ Sagittarius", value: "Sagittarius" },
  { label: "♑ Capricorn", value: "Capricorn" },
  { label: "♒ Aquarius", value: "Aquarius" },
  { label: "♓ Pisces", value: "Pisces" },
];

export function zodiacDisplayValue(value?: string | null): string {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const normalized = raw.toLowerCase();

  const match = ZODIAC_OPTIONS.find(
    (option) =>
      option.value.toLowerCase() === normalized ||
      option.label.toLowerCase() === normalized
  );

  return match?.label || raw;
}