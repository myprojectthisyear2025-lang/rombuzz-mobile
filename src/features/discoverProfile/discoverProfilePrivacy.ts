/**
 * Path: src/features/discoverProfile/discoverProfilePrivacy.ts
 * Purpose: Preserve Discover Profile public-field selection and field visibility rules.
 * Used by: Discover Profile API hydration and read-only information sections.
 */

export function pickPublicFields(u: any) {
  if (!u) return {};

  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: u.name,
    dob: u.dob,
    avatar: u.avatar,
    bio: u.bio,
    city: u.city,
    gender: u.gender,
    orientation: u.orientation,
    height: u.height,
    lookingFor: u.lookingFor,
    interests: u.interests,
    hobbies: u.hobbies,
    media: u.media,
    photos: u.photos,

    distanceMeters:
      u.distanceMeters,

    distanceUnit:
      u.distanceUnit,

    distanceValue:
      u.distanceValue,

    distanceText:
      u.distanceText,

    distanceSource:
      u.distanceSource,

    isOnline:
      u.isOnline,

    favorites:
      u.favorites,

    voiceIntro:
      u.voiceIntro,

    visibilityMode:
      u.visibilityMode,

    fieldVisibility:
      u.fieldVisibility,

    pronouns:
      u.pronouns,

    country:
      u.country,

    hometown:
      u.hometown,

    travelMode:
      u.travelMode,

    travelVibes:
      Array.isArray(
        u.travelVibes
      )
        ? u.travelVibes
        : [],

    relationshipStyle:
      u.relationshipStyle,

    bodyType:
      u.bodyType,

    fitnessLevel:
      u.fitnessLevel,

    smoking:
      u.smoking,

    drinking:
      u.drinking,

    workoutFrequency:
      u.workoutFrequency,

    diet:
      u.diet,

    sleepSchedule:
      u.sleepSchedule,

    educationLevel:
      u.educationLevel,

    school:
      u.school,

    jobTitle:
      u.jobTitle,

    company:
      u.company,

    languages:
      u.languages,

    religion:
      u.religion,

    politicalViews:
      u.politicalViews,

    zodiac:
      u.zodiac,

    favoriteMusic:
      u.favoriteMusic,

    favoriteMovies:
      u.favoriteMovies,

    petsPreference:
      u.petsPreference,

    likes:
      u.likes,

    dislikes:
      u.dislikes,
  };
}

export function hasDiscoverValue(
  value: any
) {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      value.trim().length >
      0
    );
  }

  if (
    Array.isArray(value)
  ) {
    return (
      value.length > 0
    );
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value === true;
  }

  return true;
}

export function discoverText(
  value: any
) {
  if (
    !hasDiscoverValue(
      value
    )
  ) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "";
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .filter(Boolean)
      .join(", ");
  }

  return String(value);
}

export function discoverChipItems(
  value: any
): string[] {
  const raw =
    Array.isArray(value)
      ? value
      : typeof value ===
          "string"
        ? value.split(",")
        : [];

  const seen =
    new Set<string>();

  return raw
    .map((item) =>
      String(
        item || ""
      ).trim()
    )
    .filter((item) => {
      if (!item) {
        return false;
      }

      const key =
        item.toLowerCase();

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    });
}

export function showDiscoverField(
  user: any,
  field: string,
  value: any
) {
  if (
    !hasDiscoverValue(
      value
    )
  ) {
    return false;
  }

  if (
    user?.visibilityMode ===
    "hidden"
  ) {
    return false;
  }

  const visibility =
    user?.fieldVisibility?.[
      field
    ];

  if (
    !visibility ||
    visibility ===
      "public"
  ) {
    return true;
  }

  if (
    visibility ===
    "matches"
  ) {
    return false;
  }

  return false;
}