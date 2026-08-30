/**
 * ============================================================
 * 📁 File: src/features/appUpdate/RequiredUpdateScreen.tsx
 * 🎯 Purpose: Non-dismissible RomBuzz required-update screen.
 *
 * Usage:
 *   Rendered instead of the normal app whenever a fresh backend
 *   policy confirms that the installed build is unsupported.
 * ============================================================
 */

import { StatusBar } from "expo-status-bar";
import React, {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import {
  requiredUpdateStyles as styles,
} from "./RequiredUpdateScreen.styles";

type Props = {
  latestVersion: string;
  message: string;
  storeUrl: string;
};

export default function RequiredUpdateScreen({
  latestVersion,
  message,
  storeUrl,
}: Props) {
  const [openingStore, setOpeningStore] =
    useState(false);

  const [openError, setOpenError] =
    useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        () => true
      );

    return () => subscription.remove();
  }, []);

  const openStore = async () => {
    if (openingStore) return;

    setOpeningStore(true);
    setOpenError(false);

    try {
      await Linking.openURL(storeUrl);
    } catch {
      setOpenError(true);
    } finally {
      setOpeningStore(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.logoShell}>
          <Image
            source={require(
              "../../../assets/images/logo.png"
            )}
            style={styles.logo}
          />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            UPDATE REQUIRED
          </Text>
        </View>

        <Text style={styles.title}>
          Update RomBuzz
        </Text>

        <Text style={styles.message}>
          {message}
        </Text>

        <Text style={styles.version}>
          Version {latestVersion} is available
        </Text>

        {openError ? (
          <Text style={styles.error}>
            We couldn&apos;t open the store.
            Check your connection and try
            again.
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={openingStore}
          onPress={openStore}
          style={({ pressed }) => [
            styles.button,
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
            <Text style={styles.buttonText}>
              Update RomBuzz
            </Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          You&apos;ll be able to continue as
          soon as RomBuzz is updated.
        </Text>
      </View>
    </SafeAreaView>
  );
}