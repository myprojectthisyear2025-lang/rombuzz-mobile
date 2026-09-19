/**
 * Path: app/auth/register-full/steps/Step6ReviewSections.tsx
 * Purpose: Presentational review cards for the final RomBuzz signup screen.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    LOOKING_FOR,
    RegisterForm,
} from "../index";
import {
    useStep6SummaryStyles,
} from "../styles/useStep6SummaryStyles";

type Props = {
  email: string;
  form: RegisterForm;
  duration: number | null;
  isPlaying: boolean;
  loadingSound: boolean;
  onPlayPause: () => void;
};

const WAVEFORM = [
  8, 14, 20, 11, 24, 16, 28, 18,
  10, 22, 14, 25, 18, 12, 27, 20,
  9, 17, 24, 13, 19, 11, 16, 8,
];

function getPhotoUri(photo: any) {
  if (typeof photo === "string") {
    return photo.trim();
  }

  return String(
    photo?.uri ||
      photo?.url ||
      photo?.secureUrl ||
      photo?.secure_url ||
      photo?.src ||
      photo?.imageUrl ||
      photo?.photoUrl ||
      ""
  ).trim();
}

export default function Step6ReviewSections({
  email,
  form,
  duration,
  isPlaying,
  loadingSound,
  onPlayPause,
}: Props) {
  const { styles, colors } =
    useStep6SummaryStyles();

  const lookingFor =
    LOOKING_FOR.find(
      (item) =>
        item.key === form.lookingFor
    )?.label ||
    form.lookingFor ||
    "—";

  const information = [
    {
      icon: "person-outline",
      label: "Name",
      value:
        `${form.firstName} ${form.lastName}`.trim(),
    },
    {
      icon: "mail-outline",
      label: "Email",
      value: email,
    },
    {
      icon: "male-female-outline",
      label: "Gender",
      value: form.gender,
    },
    {
      icon: "calendar-outline",
      label: "Date of Birth",
      value: form.dob,
    },
    {
      icon: "heart-outline",
      label: "Looking for",
      value: lookingFor,
    },
    {
      icon: "people-outline",
      label: "Interested in",
      value: form.interestedIn.join(", "),
    },
    {
      icon: "hourglass-outline",
      label: "Age range",
      value: `${form.ageMin} – ${form.ageMax}`,
    },
    {
      icon: "location-outline",
      label: "Distance",
      value:
        form.distance >= 1000
          ? "1000+ miles"
          : `${form.distance} miles`,
    },
    ...(form.phone
      ? [
          {
            icon: "call-outline",
            label: "Phone",
            value: form.phone,
          },
        ]
      : []),
  ];

  const photoUris = form.photos
    .map(getPhotoUri)
    .filter(Boolean);

  const visiblePhotos =
    photoUris.slice(0, 5);

  const remainingPhotos =
    Math.max(
      form.photos.length -
        visiblePhotos.length,
      0
    );

  const durationSeconds =
    duration
      ? duration / 1000
      : Number(
          form.voiceDurationSec || 0
        );

  return (
    <>
      <View style={styles.reviewCard}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name="person-outline"
            size={18}
            color={colors.text}
          />

          <Text style={styles.cardTitle}>
            Your Information
          </Text>
        </View>

        <View style={styles.informationList}>
          {information.map(
            (item, index) => (
              <View
                key={item.label}
                style={[
                  styles.infoRow,
                  index ===
                    information.length - 1 &&
                    styles.infoRowLast,
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={15}
                  color={colors.textMuted}
                  style={styles.infoIcon}
                />

                <Text style={styles.infoLabel}>
                  {item.label}
                </Text>

                <Text style={styles.infoValue}>
                  {item.value || "—"}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name="sparkles"
            size={18}
            color={colors.brand}
          />

          <Text style={styles.cardTitle}>
            Interests
          </Text>
        </View>

        {form.interests.length ? (
          <View style={styles.interestsWrap}>
            {form.interests.map(
              (interest) => (
                <View
                  key={interest}
                  style={styles.interestChip}
                >
                  <Text
                    style={styles.interestText}
                  >
                    {interest}
                  </Text>
                </View>
              )
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No interests selected
          </Text>
        )}
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.photoHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons
              name="images-outline"
              size={18}
              color={colors.text}
            />

            <Text style={styles.cardTitle}>
              Photos
            </Text>
          </View>

          <Text style={styles.photoCount}>
            {form.photos.length} uploaded
          </Text>
        </View>

        {visiblePhotos.length ? (
          <View style={styles.photosRow}>
            {visiblePhotos.map(
              (uri, index) => (
                <Image
                  key={`${uri}-${index}`}
                  source={{ uri }}
                  style={styles.photoThumb}
                />
              )
            )}

            {remainingPhotos > 0 ? (
              <View style={styles.photoMore}>
                <Text
                  style={styles.photoMoreText}
                >
                  +{remainingPhotos}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            {form.photos.length
              ? `${form.photos.length} photos uploaded`
              : "No photos uploaded"}
          </Text>
        )}
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name="mic-outline"
            size={18}
            color={colors.brand}
          />

          <Text style={styles.cardTitle}>
            Voice Intro
          </Text>
        </View>

        {form.voiceUrl ? (
          <View style={styles.voiceRow}>
            <TouchableOpacity
              style={styles.voicePlayBtn}
              onPress={onPlayPause}
              disabled={loadingSound}
              activeOpacity={0.85}
            >
              <Ionicons
                name={
                  isPlaying
                    ? "pause"
                    : "play"
                }
                size={17}
                color={colors.white}
              />
            </TouchableOpacity>

            <View style={styles.waveform}>
              {WAVEFORM.map(
                (height, index) => (
                  <View
                    key={index}
                    style={[
                      styles.waveBar,
                      { height },
                    ]}
                  />
                )
              )}
            </View>

            <Text style={styles.voiceDuration}>
              {durationSeconds > 0
                ? `${durationSeconds.toFixed(
                    1
                  )}s`
                : "Ready"}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No voice intro added
          </Text>
        )}
      </View>

      <View style={styles.readyCard}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.textSecondary}
        />

        <View style={styles.readyTextWrap}>
          <Text style={styles.readyTitle}>
            Everything looks good!
          </Text>

          <Text style={styles.readySubtitle}>
            You can still go back and edit
            anything before finishing.
          </Text>
        </View>
      </View>
    </>
  );
}