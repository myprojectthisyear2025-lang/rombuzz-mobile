/**
 * Path: src/features/profile/info/sections/ProfileLocationSection.tsx
 * Purpose: Extracted Location profile rows while preserving Country, Hometown, and Travel Vibe flows.
 * Used by: ProfileInfoTab.
 */

import React from "react";
import ProfileInfoChipField from "../ProfileInfoChipField";
import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

type Props = {
  form: any;
  toTitle: (value?: string) => string;

  setCountryQuery:
    (value: string) => void;

  setCountryResults:
    (value: string[]) => void;

  setEditingField:
    (value: any) => void;

  setTextOpen:
    (value: any) => void;

  setTravelVibeOpen:
    (value: boolean) => void;
};

export default function ProfileLocationSection({
  form,
  toTitle,
  setCountryQuery,
  setCountryResults,
  setEditingField,
  setTextOpen,
  setTravelVibeOpen,
}: Props) {
  return (
    <ProfileInfoSection title="Location">
      <ProfileInfoRow
        label="Country"
        value={form.country}
        onPress={() => {
          setCountryQuery("");
          setCountryResults([]);
          setEditingField("country");
        }}
      />

      <ProfileInfoRow
        label="Hometown"
        value={toTitle(
          form?.hometown
        )}
        onPress={() => {
          setTextOpen({
            field: "hometown",
            title: "Hometown",
            value: String(
              form?.hometown || ""
            ),
            placeholder:
              "e.g., Chicago, IL",
          });
        }}
      />

      <ProfileInfoChipField
        label="Travel Vibe"
        values={
          Array.isArray(
            form?.travelVibes
          )
            ? form.travelVibes
            : []
        }
        placeholder="Add your travel vibe"
        onPress={() =>
          setTravelVibeOpen(true)
        }
      />
    </ProfileInfoSection>
  );
}