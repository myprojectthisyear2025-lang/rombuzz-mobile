/**
 * Path: src/features/profile/info/sections/.
 * Purpose: Extracted Basics profile rows while preserving existing picker state and callbacks.
 * Used by: ProfileInfoTab.
 */

import {
  LOOKING_FOR_OPTIONS,
  lookingForLabelFromValue,
} from "@/src/constants/lookingFor";

import React from "react";
import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

type Props = {
  form: any;
  age: number | null;

  toTitle: (value?: string) => string;
  parseHeight: (value?: string) => any;

  setEditingField: (value: any) => void;
  setSelectOpen: (value: any) => void;
  setHeightTemp: (value: any) => void;

  CITY_OPTIONS: string[];
  GENDER_OPTIONS: string[];
  ORIENTATION_OPTIONS: string[];
};

export default function ProfileBasicsSection({
  form,
  age,
  toTitle,
  parseHeight,
  setEditingField,
  setSelectOpen,
  setHeightTemp,
  CITY_OPTIONS,
  GENDER_OPTIONS,
  ORIENTATION_OPTIONS,
}: Props) {
  return (
    <ProfileInfoSection title="Basics">
      <ProfileInfoRow
        label="City"
        value={toTitle(form.city)}
        onPress={() => {
          setEditingField("city");
          setSelectOpen({
            field: "city",
            title: "City",
            options: CITY_OPTIONS,
            value: toTitle(form.city),
          });
        }}
      />

      <ProfileInfoRow
        label="Gender"
        value={toTitle(form.gender)}
        onPress={() => {
          setEditingField("gender");
          setSelectOpen({
            field: "gender",
            title: "Gender",
            options: GENDER_OPTIONS,
            value: toTitle(form.gender),
          });
        }}
      />

      <ProfileInfoRow
        label="Orientation"
        value={toTitle(form.orientation)}
        onPress={() => {
          setEditingField(
            "orientation"
          );

          setSelectOpen({
            field: "orientation",
            title: "Orientation",
            options:
              ORIENTATION_OPTIONS,
            value: toTitle(
              form.orientation
            ),
          });
        }}
      />

      <ProfileInfoRow
        label="Looking for"
        value={lookingForLabelFromValue(
          form.lookingFor
        )}
        onPress={() => {
          setEditingField(
            "lookingFor"
          );

          setSelectOpen({
            field: "lookingFor",
            title: "Looking for",
            options:
              LOOKING_FOR_OPTIONS.map(
                (option) =>
                  option.label
              ),
            value:
              lookingForLabelFromValue(
                form.lookingFor
              ),
          });
        }}
      />

      <ProfileInfoRow
        label="Height"
        value={toTitle(form.height)}
        onPress={() => {
          setEditingField("height");
          setHeightTemp(
            parseHeight(form.height)
          );
        }}
      />

      {age !== null && (
        <ProfileInfoRow
          label="Age"
          value={age}
          placeholder=""
        />
      )}
    </ProfileInfoSection>
  );
}