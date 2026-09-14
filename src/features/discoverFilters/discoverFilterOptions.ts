/**
 * Path: src/features/discoverFilters/discoverFilterOptions.ts
 * Purpose: Existing mobile Discover Filter option catalogs for the redesigned UI.
 */

export type FilterOption = {
  label: string;
  value: string;
};

export const GENDER_OPTIONS:
  FilterOption[] = [
    {
      label: "All",
      value: "",
    },
    {
      label: "Men",
      value: "male",
    },
    {
      label: "Women",
      value: "female",
    },
  ];

export const VIBE_OPTIONS:
  FilterOption[] = [
    {
      label: "Romantic",
      value: "romantic",
    },
    {
      label: "Flirty",
      value: "flirty",
    },
    {
      label: "Chill",
      value: "chill",
    },
    {
      label: "Adventurous",
      value: "adventurous",
    },
    {
      label: "Funny",
      value: "funny",
    },
    {
      label: "Serious",
      value: "serious",
    },
  ];

export const BODY_TYPE_OPTIONS:
  FilterOption[] = [
    {
      label: "Slim",
      value: "slim",
    },
    {
      label: "Average",
      value: "average",
    },
    {
      label: "Athletic",
      value: "athletic",
    },
    {
      label: "Curvy",
      value: "curvy",
    },
    {
      label: "Plus-size",
      value: "plus-size",
    },
  ];

export const FITNESS_OPTIONS:
  FilterOption[] = [
    {
      label: "Beginner",
      value: "beginner",
    },
    {
      label: "Active",
      value: "active",
    },
    {
      label: "Athlete",
      value: "athlete",
    },
    {
      label: "Gym Lover",
      value: "gym lover",
    },
  ];

export const SMOKING_OPTIONS:
  FilterOption[] = [
    {
      label: "Never",
      value: "never",
    },
    {
      label: "Sometimes",
      value: "sometimes",
    },
    {
      label: "Regularly",
      value: "regularly",
    },
  ];

export const DRINKING_OPTIONS:
  FilterOption[] = [
    {
      label: "Never",
      value: "never",
    },
    {
      label: "Socially",
      value: "socially",
    },
    {
      label: "Often",
      value: "often",
    },
  ];

export const WORKOUT_OPTIONS:
  FilterOption[] = [
    {
      label: "Rarely",
      value: "rarely",
    },
    {
      label: "1-2x week",
      value: "1-2x week",
    },
    {
      label: "3-5x week",
      value: "3-5x week",
    },
    {
      label: "Daily",
      value: "daily",
    },
  ];

export const DIET_OPTIONS:
  FilterOption[] = [
    {
      label: "Anything",
      value: "anything",
    },
    {
      label: "Vegetarian",
      value: "vegetarian",
    },
    {
      label: "Vegan",
      value: "vegan",
    },
    {
      label: "Keto",
      value: "keto",
    },
    {
      label: "Halal",
      value: "halal",
    },
  ];

export const SLEEP_OPTIONS:
  FilterOption[] = [
    {
      label: "Early Bird",
      value: "early bird",
    },
    {
      label: "Night Owl",
      value: "night owl",
    },
    {
      label: "Flexible",
      value: "flexible",
    },
  ];

export const EDUCATION_OPTIONS:
  FilterOption[] = [
    {
      label: "High School",
      value: "high school",
    },
    {
      label: "College",
      value: "college",
    },
    {
      label: "Graduate",
      value: "graduate",
    },
    {
      label: "PhD",
      value: "phd",
    },
  ];

export const PET_OPTIONS:
  FilterOption[] = [
    {
      label: "Love Dogs",
      value: "love dogs",
    },
    {
      label: "Love Cats",
      value: "love cats",
    },
    {
      label: "Any Pets",
      value: "any pets",
    },
    {
      label: "No Pets",
      value: "no pets",
    },
  ];

export const ZODIAC_OPTIONS =
  [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ].map(
    (label) => ({
      label,
      value:
        label.toLowerCase(),
    })
  );

export const LOVE_OPTIONS:
  FilterOption[] = [
    {
      label: "Words",
      value: "words",
    },
    {
      label: "Quality Time",
      value: "quality time",
    },
    {
      label: "Gifts",
      value: "gifts",
    },
    {
      label: "Acts",
      value: "acts",
    },
    {
      label: "Touch",
      value: "touch",
    },
  ];

export const INTEREST_OPTIONS:
  FilterOption[] = [
    {
      label: "Music",
      value: "music",
    },
    {
      label: "Movies",
      value: "movies",
    },
    {
      label: "Gym",
      value: "gym",
    },
    {
      label: "Travel",
      value: "travel",
    },
    {
      label: "Food",
      value: "food",
    },
    {
      label: "Gaming",
      value: "gaming",
    },
  ];