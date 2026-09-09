/**
 * Path: src/features/profile/edit/ProfileEditScreen.tsx
 * Purpose: Extracted Edit Profile modal host that preserves existing edit targets and handlers.
 * Used by: app/(tabs)/profile.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProfileEditBioEditor from "./ProfileEditBioEditor";
import ProfileEditDetailsEditor from "./ProfileEditDetailsEditor";
import ProfileEditInterestsEditor from "./ProfileEditInterestsEditor";
import ProfileEditVoiceEditor from "./ProfileEditVoiceEditor";
import { createProfileEditStyles } from "./profileEdit.styles";
import type {
  ProfileEditForm,
  ProfileEditTarget,
} from "./profileEditTypes";

type Props = {
  editTarget: ProfileEditTarget;
  setEditTarget: React.Dispatch<
    React.SetStateAction<ProfileEditTarget>
  >;

  form: ProfileEditForm;
  setForm: React.Dispatch<
    React.SetStateAction<ProfileEditForm>
  >;

  saveProfile: () => Promise<void>;

  interestOptions: string[];
  hobbyOptions: string[];

  recording: boolean;
  voiceUrl: string;
  voiceDurationSec: number;
  playing: boolean;

  startRecording: () => void;
  stopRecording: (autoStop?: boolean) => void;
  playVoice: () => void;
  deleteVoiceIntro: () => void;
};

const TITLES: Record<
  Exclude<ProfileEditTarget, null>,
  string
> = {
  bio: "Edit bio",
  interests: "Interests & hobbies",
  voice: "Voice intro",
  info: "Profile info",
  all: "Edit profile",
};

export default function ProfileEditScreen(
  props: Props
) {
  const { colors } = useRomBuzzTheme();
  const styles =
    createProfileEditStyles(colors);

  const insets = useSafeAreaInsets();
  const target = props.editTarget;

  const close = () =>
    props.setEditTarget(null);

  const savesOnDone =
    target !== null &&
    target !== "voice";

  const handleDone = () => {
    if (savesOnDone) {
      void props.saveProfile();
      return;
    }

    close();
  };

  return (
    <Modal
      visible={target !== null}
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={[
          styles.root,
          {
            paddingTop: insets.top,
            paddingBottom:
              insets.bottom,
          },
        ]}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <View
            style={styles.headerSide}
          >
            <Pressable
              onPress={close}
              hitSlop={8}
              style={
                styles.headerIcon
              }
            >
              <Ionicons
                name="close"
                size={23}
                color={colors.icon}
              />
            </Pressable>
          </View>

          <Text
            style={
              styles.headerTitle
            }
            numberOfLines={1}
          >
            {target
              ? TITLES[target]
              : "Edit profile"}
          </Text>

          <View
            style={[
              styles.headerSide,
              styles.headerSideRight,
            ]}
          >
            <Pressable
              onPress={handleDone}
              hitSlop={8}
            >
              <Text
                style={
                  styles.headerAction
                }
              >
                {savesOnDone
                  ? "Save"
                  : "Done"}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {target === "bio" && (
            <ProfileEditBioEditor
              form={props.form}
              setForm={
                props.setForm
              }
            />
          )}

          {target ===
            "interests" && (
            <ProfileEditInterestsEditor
              form={props.form}
              setForm={
                props.setForm
              }
              interestOptions={
                props.interestOptions
              }
              hobbyOptions={
                props.hobbyOptions
              }
            />
          )}

          {target ===
            "voice" && (
            <ProfileEditVoiceEditor
              recording={
                props.recording
              }
              voiceUrl={
                props.voiceUrl
              }
              voiceDurationSec={
                props.voiceDurationSec
              }
              playing={
                props.playing
              }
              startRecording={
                props.startRecording
              }
              stopRecording={
                props.stopRecording
              }
              playVoice={
                props.playVoice
              }
              deleteVoiceIntro={
                props.deleteVoiceIntro
              }
            />
          )}

          {target === "info" && (
            <ProfileEditDetailsEditor
              form={props.form}
              setForm={
                props.setForm
              }
              fullEdit={false}
            />
          )}

          {target === "all" && (
            <ProfileEditDetailsEditor
              form={props.form}
              setForm={
                props.setForm
              }
              fullEdit
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}