/**
 * Path: src/features/profile/info/sections/ProfileFavoritesSection.tsx
 * Purpose: Displays favorite music, movies/shows, and pets profile fields.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
 */

import React from "react";

import ProfileInfoChipField from "../ProfileInfoChipField";
import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

const PETS_OPTIONS = [
  "Dog",
  "Cat",
  "Fish",
  "Bird",
  "Rabbit",
  "Hamster",
  "Guinea Pig",
  "Turtle",
  "Horse",
  "Snake",
  "Other",
  "None",
];

type Props = {
  form: any;

  toTitle: (
    value?: string
  ) => string;

  setTextOpen: (
    value: any
  ) => void;

  setEditingField: (
    value: any
  ) => void;

  setSelectOpen: (
    value: any
  ) => void;
};

const asCommaText = (
  value: any
) => {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .join(", ");
  }

  if (!value) return "";

  return String(value);
};

export default function ProfileFavoritesSection({
  form,
  toTitle,
  setTextOpen,
  setEditingField,
  setSelectOpen,
}: Props) {
  return (
    <ProfileInfoSection title="Favorites">
      <ProfileInfoChipField
        label="Music"
        values={
          form?.favoriteMusic
        }
        placeholder="Add music"
        onPress={() => {
          setTextOpen({
            field:
              "favoriteMusic",

            title:
              "Favorite music genres",

            value:
              asCommaText(
                form?.favoriteMusic
              ),

            placeholder:
              "e.g., Hip-hop, Pop",

            asArray: true,
          });
        }}
      />

      <ProfileInfoChipField
        label="Movies/Shows"
        values={
          form?.favoriteMovies
        }
        placeholder="Add movies or shows"
        onPress={() => {
          setTextOpen({
            field:
              "favoriteMovies",

            title:
              "Favorite movies/shows",

            value:
              asCommaText(
                form?.favoriteMovies
              ),

            placeholder:
              "e.g., Breaking Bad, Interstellar",

            asArray: true,
          });
        }}
      />

      <ProfileInfoRow
        label="Pets"
        value={toTitle(
          form?.petsPreference
        )}
        onPress={() => {
          setEditingField(
            "petsPreference"
          );

          setSelectOpen({
            field:
              "petsPreference",

            title:
              "Pets preference",

            options:
              PETS_OPTIONS,

            value: toTitle(
              form?.petsPreference
            ),
          });
        }}
      />
    </ProfileInfoSection>
  );
}