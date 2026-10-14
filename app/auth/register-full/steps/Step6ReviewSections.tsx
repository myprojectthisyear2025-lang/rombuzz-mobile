/**
 * File: app/auth/register-full/steps/Step6ReviewSections.tsx
 * Purpose: Displays the final signup information, interests, and voice intro.
 * Uses SignupReviewPhotos for ordered photo previews with loading/error states.
 * Preserves existing information and voice playback controls.
 * Replaces the unconditional success message with an honest review reminder.
 */
import SignupReviewPhotos from "@/src/features/auth/onboarding/photos/SignupReviewPhotos";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LOOKING_FOR, RegisterForm } from "../index";
import { useStep6SummaryStyles } from "../styles/useStep6SummaryStyles";

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

export default function Step6ReviewSections({
  email, form, duration, isPlaying, loadingSound, onPlayPause,
}: Props) {
  const { styles: s, colors: c } = useStep6SummaryStyles();

  const lookingFor = LOOKING_FOR.find(
    (item) => item.key === form.lookingFor,
  )?.label || form.lookingFor || "—";

  const information = [
    {
      icon: "person-outline", label: "Name",
      value: `${form.firstName} ${form.lastName}`.trim(),
    },
    { icon: "mail-outline", label: "Email", value: email },
    {
      icon: "male-female-outline",
      label: "Gender", value: form.gender,
    },
    {
      icon: "calendar-outline",
      label: "Date of Birth", value: form.dob,
    },
    {
      icon: "heart-outline",
      label: "Looking for", value: lookingFor,
    },
    {
      icon: "people-outline", label: "Interested in",
      value: form.interestedIn.join(", "),
    },
    {
      icon: "hourglass-outline", label: "Age range",
      value: `${form.ageMin} – ${form.ageMax}`,
    },
    {
      icon: "location-outline", label: "Distance",
      value: form.distance >= 1000
        ? "1000+ miles" : `${form.distance} miles`,
    },
    ...(form.phone ? [{
      icon: "call-outline", label: "Phone", value: form.phone,
    }] : []),
  ];

  const durationSeconds = duration
    ? duration / 1000 : Number(form.voiceDurationSec || 0);

  return (
    <>
      <View style={s.reviewCard}>
        <View style={s.cardTitleRow}>
          <Ionicons name="person-outline" size={18} color={c.text} />
          <Text style={s.cardTitle}>Your Information</Text>
        </View>
        <View style={s.informationList}>
          {information.map((item, index) => (
            <View
              key={item.label}
              style={[
                s.infoRow,
                index === information.length - 1 && s.infoRowLast,
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={15}
                color={c.textMuted}
                style={s.infoIcon}
              />
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={s.infoValue}>{item.value || "—"}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.reviewCard}>
        <View style={s.cardTitleRow}>
          <Ionicons name="sparkles" size={18} color={c.brand} />
          <Text style={s.cardTitle}>Interests</Text>
        </View>
        {form.interests.length ? (
          <View style={s.interestsWrap}>
            {form.interests.map((interest) => (
              <View key={interest} style={s.interestChip}>
                <Text style={s.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.emptyText}>No interests selected</Text>
        )}
      </View>

      <SignupReviewPhotos photos={form.photos} />

      <View style={s.reviewCard}>
        <View style={s.cardTitleRow}>
          <Ionicons name="mic-outline" size={18} color={c.brand} />
          <Text style={s.cardTitle}>Voice Intro</Text>
        </View>
        {form.voiceUrl ? (
          <View style={s.voiceRow}>
            <TouchableOpacity
              style={s.voicePlayBtn}
              onPress={onPlayPause}
              disabled={loadingSound}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={17}
                color={c.white}
              />
            </TouchableOpacity>
            <View style={s.waveform}>
              {WAVEFORM.map((height, index) => (
                <View key={index} style={[s.waveBar, { height }]} />
              ))}
            </View>
            <Text style={s.voiceDuration}>
              {durationSeconds > 0
                ? `${durationSeconds.toFixed(1)}s` : "Ready"}
            </Text>
          </View>
        ) : (
          <Text style={s.emptyText}>No voice intro added</Text>
        )}
      </View>

      <View style={s.readyCard}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={c.textSecondary}
        />
        <View style={s.readyTextWrap}>
          <Text style={s.readyTitle}>Review before finishing</Text>
          <Text style={s.readySubtitle}>
            You can still go back and edit anything before finishing.
          </Text>
        </View>
      </View>
    </>
  );
}