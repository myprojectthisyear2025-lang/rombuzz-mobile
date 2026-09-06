/**
 * Path: src/features/profile/gallery/upload/ProfileUploadMediaPreview.tsx
 * Purpose: Modern media preview + fullscreen preview for Gallery uploads.
 * Used by: ProfileUploadPreview.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import {
  ResizeMode,
  Video,
} from "expo-av";
import { StatusBar } from "expo-status-bar";
import React, {
  useMemo,
  useState,
} from "react";
import {
  Image,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "./profileUploadPreview.styles";

type Props = {
  asset: {
    uri: string;
    isVideo: boolean;
  } | null;

  isReel: boolean;
};

export default function ProfileUploadMediaPreview({
  asset,
  isReel,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const insets =
    useSafeAreaInsets();

  const { width, height } =
    useWindowDimensions();

  const [
    fullscreenOpen,
    setFullscreenOpen,
  ] = useState(false);

  const frame = useMemo(() => {
    const frameWidth =
      Math.min(
        width - 24,
        520
      );

    const frameHeight = isReel
      ? Math.min(
          frameWidth * 1.52,
          height * 0.56
        )
      : Math.min(
          frameWidth * 0.96,
          height * 0.46
        );

    return {
      width: frameWidth,
      height: frameHeight,
    };
  }, [height, isReel, width]);

  return (
    <>
      <Pressable
        disabled={!asset?.uri}
        onPress={() =>
          setFullscreenOpen(true)
        }
        style={[
          styles.previewFrame,
          frame,
          {
            backgroundColor:
              colors.surfaceMuted,
          },
        ]}
      >
        {asset?.uri ? (
          isReel ? (
            <Video
              source={{
                uri: asset.uri,
              }}
              style={styles.previewMedia}
              resizeMode={
                ResizeMode.COVER
              }
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={{
                uri: asset.uri,
              }}
              style={styles.previewMedia}
              resizeMode="cover"
            />
          )
        ) : (
          <View
            style={
              styles.emptyPreview
            }
          >
            <Ionicons
              name={
                isReel
                  ? "videocam-outline"
                  : "image-outline"
              }
              size={34}
              color={
                colors.iconMuted
              }
            />
          </View>
        )}

        {!!asset?.uri && (
          <View
            style={
              styles.expandButton
            }
          >
            <Ionicons
              name="expand-outline"
              size={17}
              color="#FFFFFF"
            />
          </View>
        )}

        <View
          style={
            styles.mediaTypeBadge
          }
        >
          <Ionicons
            name={
              isReel
                ? "play"
                : "image-outline"
            }
            size={11}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.mediaTypeText
            }
          >
            {isReel
              ? "REEL"
              : "PHOTO"}
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={fullscreenOpen}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setFullscreenOpen(false)
        }
      >
        <StatusBar style="light" />

        <View
          style={styles.fullscreen}
        >
          <Pressable
            onPress={() =>
              setFullscreenOpen(false)
            }
            hitSlop={10}
            style={[
              styles.fullClose,
              {
                top:
                  insets.top + 10,
              },
            ]}
          >
            <Ionicons
              name="close"
              size={21}
              color="#FFFFFF"
            />
          </Pressable>

          {asset?.uri &&
            (isReel ? (
              <Video
                source={{
                  uri: asset.uri,
                }}
                style={
                  styles.fullMedia
                }
                resizeMode={
                  ResizeMode.CONTAIN
                }
                shouldPlay
                isLooping
              />
            ) : (
              <Image
                source={{
                  uri: asset.uri,
                }}
                style={
                  styles.fullMedia
                }
                resizeMode="contain"
              />
            ))}
        </View>
      </Modal>
    </>
  );
}