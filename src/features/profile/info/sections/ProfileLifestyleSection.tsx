/**
 * Path: src/features/profile/info/sections/ProfileLifestyleSection.tsx
 * Purpose: Displays Lifestyle fields while preserving the existing single-choice picker flow.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
 */

import React from "react";

import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

const SMOKING_OPTIONS = [
  "No",
  "Sometimes",
  "Yes",
];

const DRINKING_OPTIONS = [
  "No",
  "Socially",
  "Yes",
];

const WORKOUT_OPTIONS = [
  "Never",
  "1–2x/week",
  "3–5x/week",
  "Daily",
];

const DIET_OPTIONS = [
  "Anything",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Other",
];

const SLEEP_OPTIONS = [
  "Early bird",
  "Night owl",
];

type Props = {
  form: any;
  toTitle: (value?: string) => string;
  setEditingField: (value: any) => void;
  setSelectOpen: (value: any) => void;
};

export default function ProfileLifestyleSection({
  form,
  toTitle,
  setEditingField,
  setSelectOpen,
}: Props) {
  const openPicker = (
    field: string,
    title: string,
    options: string[],
    value: string
  ) => {
    setEditingField(field);

    setSelectOpen({
      field,
      title,
      options,
      value,
    });
  };

  return (
    <ProfileInfoSection title="Lifestyle">
      <ProfileInfoRow
        label="Smoking"
        value={toTitle(
          form?.smoking
        )}
        onPress={() =>
          openPicker(
            "smoking",
            "Smoking",
            SMOKING_OPTIONS,
            toTitle(form?.smoking)
          )
        }
      />

      <ProfileInfoRow
        label="Drinking"
        value={toTitle(
          form?.drinking
        )}
        onPress={() =>
          openPicker(
            "drinking",
            "Drinking",
            DRINKING_OPTIONS,
            toTitle(form?.drinking)
          )
        }
      />

      <ProfileInfoRow
        label="Workout"
        value={toTitle(
          form?.workoutFrequency
        )}
        onPress={() =>
          openPicker(
            "workoutFrequency",
            "Workout frequency",
            WORKOUT_OPTIONS,
            toTitle(
              form?.workoutFrequency
            )
          )
        }
      />

      <ProfileInfoRow
        label="Diet"
        value={toTitle(
          form?.diet
        )}
        onPress={() =>
          openPicker(
            "diet",
            "Diet",
            DIET_OPTIONS,
            toTitle(form?.diet)
          )
        }
      />

      <ProfileInfoRow
        label="Sleep schedule"
        value={toTitle(
          form?.sleepSchedule
        )}
        onPress={() =>
          openPicker(
            "sleepSchedule",
            "Sleep schedule",
            SLEEP_OPTIONS,
            toTitle(
              form?.sleepSchedule
            )
          )
        }
      />
    </ProfileInfoSection>
  );
}