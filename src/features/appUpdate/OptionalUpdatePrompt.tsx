/**
 * ============================================================
 * 📁 File: src/features/appUpdate/OptionalUpdatePrompt.tsx
 * 🎯 Purpose: Premium dismissible RomBuzz optional-update prompt.
 *
 * Usage:
 *   Shown globally when a newer version exists but the installed
 *   version is still supported. Update and Later are both allowed.
 * ============================================================
 */

import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    Text,
    View,
} from "react-native";
import {
    optionalUpdateStyles as styles,
} from "./OptionalUpdatePrompt.styles";

type Props = {
  latestVersion: string;
  message: string;
  onLater: () => void | Promise<void>;
  onUpdate:
    () => boolean | Promise<boolean>;
};

export default function OptionalUpdatePrompt({
  latestVersion,
  message,
  onLater,
  onUpdate,
}: Props) {
  const [openingStore, setOpeningStore] =
    useState(false);

  const [openError, setOpenError] =
    useState(false);

  const handleUpdate = async () => {
    if (openingStore) return;

    setOpeningStore(true);
    setOpenError(false);

    try {
      const opened = await onUpdate();

      if (!opened) {
        setOpenError(true);
      }
    } catch {
      setOpenError(true);
    } finally {
      setOpeningStore(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onLater}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.logoShell}>
            <Image
              source={require(
                "../../../assets/images/logo.png"
              )}
              style={styles.logo}
            />
          </View>

          <Text style={styles.eyebrow}>
            NEW ROMBUZZ UPDATE
          </Text>

          <Text style={styles.title}>
            A fresh version is ready
          </Text>

          <Text style={styles.message}>
            {message}
          </Text>

          <Text style={styles.version}>
            Version {latestVersion}
          </Text>

          {openError ? (
            <Text style={styles.error}>
              We couldn&apos;t open the
              store. Please try again.
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={openingStore}
            onPress={handleUpdate}
            style={({ pressed }) => [
              styles.updateButton,
              pressed && !openingStore
                ? styles.buttonPressed
                : null,
            ]}
          >
            {openingStore ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.updateText}
              >
                Update
              </Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={openingStore}
            onPress={onLater}
            style={({ pressed }) => [
              styles.laterButton,
              pressed
                ? styles.laterPressed
                : null,
            ]}
          >
            <Text style={styles.laterText}>
              Later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}