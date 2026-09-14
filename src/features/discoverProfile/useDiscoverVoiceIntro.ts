/**
 * Path: src/features/discoverProfile/useDiscoverVoiceIntro.ts
 * Purpose: Preserve Discover Profile voice-intro playback behavior.
 * Used by: DiscoverProfileScreen.tsx.
 */

import { Audio } from "expo-av";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export function useDiscoverVoiceIntro(
  user: any
) {
  const soundRef =
    useRef<Audio.Sound | null>(
      null
    );

  const [
    playing,
    setPlaying,
  ] = useState(false);

  const voiceUrl =
    useMemo(() => {
      if (!user) {
        return "";
      }

      if (
        user.voiceIntro
      ) {
        return user.voiceIntro;
      }

      if (
        Array.isArray(
          user.favorites
        )
      ) {
        const value =
          user.favorites.find(
            (
              entry: string
            ) =>
              typeof entry ===
                "string" &&
              entry.startsWith(
                "voice:"
              )
          );

        return value
          ? value.replace(
              "voice:",
              ""
            )
          : "";
      }

      return "";
    }, [user]);

  useEffect(() => {
    return () => {
      soundRef.current
        ?.unloadAsync()
        .catch(
          () => {}
        );
    };
  }, []);

  const toggleVoice =
    async () => {
      try {
        if (!voiceUrl) {
          return;
        }

        if (
          playing &&
          soundRef.current
        ) {
          await soundRef.current.stopAsync();

          setPlaying(
            false
          );

          return;
        }

        await soundRef.current
          ?.unloadAsync()
          .catch(
            () => {}
          );

        const {
          sound,
        } =
          await Audio.Sound.createAsync(
            {
              uri:
                voiceUrl,
            },
            {
              shouldPlay:
                true,
            }
          );

        soundRef.current =
          sound;

        setPlaying(true);

        sound.setOnPlaybackStatusUpdate(
          (
            status: any
          ) => {
            if (
              status?.didJustFinish
            ) {
              setPlaying(
                false
              );
            }
          }
        );
      } catch {}
    };

  return {
    voiceUrl,
    playing,
    toggleVoice,
  };
}