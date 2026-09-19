/**
 * Path: app/auth/register-full/steps/Step6Summary.tsx
 * Purpose: Final signup review screen with preserved registration and audio behavior.
 */

import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { RegisterForm } from "../index";
import { useStep6SummaryStyles } from "../styles/useStep6SummaryStyles";
import Step6ReviewSections from "./Step6ReviewSections";

type Props = {
  email: string;
  form: RegisterForm;
  error: string;
  busy: boolean;
  onBack: () => void;
  onFinish: () => void;
};

const PROGRESS_ITEMS = [
  { label: "Basics", complete: true },
  { label: "About You", complete: true },
  { label: "Preferences", complete: true },
  { label: "Review", complete: false },
];

export default function Step6Summary({
  email,
  form,
  error,
  busy,
  onBack,
  onFinish,
}: Props) {
  const { styles, colors } = useStep6SummaryStyles();

  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [loadingSound, setLoadingSound] = React.useState(false);
  const [duration, setDuration] = React.useState<number | null>(null);

  const handlePlayPause = async () => {
    try {
      if (!form.voiceUrl) return;

      if (!sound) {
        setLoadingSound(true);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: form.voiceUrl },
          { shouldPlay: true }
        );

        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate(
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;

            if (status.durationMillis) {
              setDuration(status.durationMillis);
            }

            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        );

        setLoadingSound(false);
        return;
      }

      const status = await sound.getStatusAsync();

      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log("Audio error:", err);
      setLoadingSound(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const finishAndGoHome = async () => {
    await onFinish();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Review & Finish
      </Text>

      <Text style={styles.sectionSubtitle}>
        Take one last look before creating your profile.
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressLine} />

        {PROGRESS_ITEMS.map((item, index) => {
          const active =
            index === PROGRESS_ITEMS.length - 1;

          return (
            <View
              key={item.label}
              style={styles.progressItem}
            >
              <View
                style={[
                  styles.progressCircle,
                  active &&
                    styles.progressCircleActive,
                ]}
              >
                {item.complete ? (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={colors.white}
                  />
                ) : (
                  <Text style={styles.progressNumber}>
                    4
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.progressLabel,
                  active &&
                    styles.progressLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.reviewScroll}
        contentContainerStyle={styles.reviewContent}
        showsVerticalScrollIndicator={false}
      >
        <Step6ReviewSections
          email={email}
          form={form}
          duration={duration}
          isPlaying={isPlaying}
          loadingSound={loadingSound}
          onPlayPause={handlePlayPause}
        />

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.danger}
            />

            <Text style={styles.error}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.finishBtn,
            busy &&
              styles.finishBtnDisabled,
          ]}
          onPress={finishAndGoHome}
          disabled={busy}
          activeOpacity={0.88}
        >
          {busy ? (
            <ActivityIndicator
              color={colors.white}
            />
          ) : (
            <Text style={styles.finishText}>
              Finish & Create My RomBuzz
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}