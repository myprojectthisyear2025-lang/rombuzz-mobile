/**
 * Path: src/features/profile/edit/profileEditTypes.ts
 * Purpose: Shared Edit Profile targets and form types without changing backend field names.
 * Used by: app/(tabs)/profile.tsx and Edit Profile UI components.
 */

export type ProfileVisibility =
  | "public"
  | "matches"
  | "hidden";

export type ProfileEditTarget =
  | "bio"
  | "interests"
  | "voice"
  | "info"
  | "all"
  | null;

export type ProfileEditForm = {
  firstName: string;
  lastName: string;
  gender: string;
  genderVisibility: string;
  pronouns: string;
  orientation: string;
  orientationVisibility: string;
  dob: string;

  city: string;
  country: string;
  hometown: string;
  latitude: number | null;
  longitude: number | null;
  distanceVisibility: string;
  travelMode: boolean;
  travelVibes: string[];

  bio: string;
  voiceUrl?: string;
  vibeTags: string[];

  lookingFor: string;
  relationshipStyle: string;
  interestedIn: string[];

  height: string;
  bodyType: string;
  fitnessLevel: string;

  smoking: string;
  drinking: string;
  workoutFrequency: string;
  diet: string;
  sleepSchedule: string;

  educationLevel: string;
  school: string;
  jobTitle: string;
  company: string;
  languages: string[];

  religion: string;
  politicalViews: string;
  zodiac: string;

  interests: string[];
  hobbies: string[];
  favoriteMusic: string[];
  favoriteMovies: string[];
  travelStyle: string;
  petsPreference: string;

  likes: string[];
  dislikes: string[];
  favorites: any[];

  visibilityMode: ProfileVisibility;
  fieldVisibility: Record<
    string,
    ProfileVisibility
  >;
};