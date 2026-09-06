/**
 * Path: src/features/home/HomeNotificationButton.tsx
 * Purpose: Home-header notification shortcut using the existing RomBuzz unread state.
 * Used by: app/(tabs)/homepage.tsx.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
    useEffect,
    useState,
} from "react";

import {
    DeviceEventEmitter,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

const UNREAD_KEY =
  "RBZ_notif_unread_total";

export default function HomeNotificationButton() {
  const router = useRouter();

  const { colors } =
    useRomBuzzTheme();

  const [unread, setUnread] =
    useState(0);

  useEffect(() => {
    let alive = true;

    SecureStore.getItemAsync(
      UNREAD_KEY
    )
      .then((raw) => {
        if (!alive) return;

        const count =
          Math.max(
            0,
            Number(raw || 0) || 0
          );

        setUnread(count);
      })
      .catch(() => {});

    const sub =
      DeviceEventEmitter.addListener(
        "rbz:notif:unread-total",
        (payload: any) => {
          const count =
            Math.max(
              0,
              Number(
                payload?.total || 0
              ) || 0
            );

          setUnread(count);
        }
      );

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
      onPress={() =>
        router.push(
          "/(tabs)/notifications"
        )
      }
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor:
              colors.surfaceMuted,

            borderColor:
              colors.border,
          },
        ]}
      >
        <Ionicons
          name="notifications-outline"
          size={21}
          color={colors.icon}
        />

        {unread > 0 ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  colors.brand,

                borderColor:
                  colors.background,
              },
            ]}
          >
            <Text
              style={styles.badgeText}
            >
              {unread > 99
                ? "99+"
                : String(unread)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 64,
    minHeight: 54,

    alignItems: "center",

    justifyContent: "center",
  },

  iconWrap: {
    width: 38,
    height: 38,

    borderRadius: 13,

    borderWidth:
      StyleSheet.hairlineWidth,

    alignItems: "center",

    justifyContent: "center",
  },

  badge: {
    position: "absolute",

    right: -7,
    top: -6,

    minWidth: 18,
    height: 18,

    paddingHorizontal: 5,

    borderRadius: 999,

    borderWidth: 2,

    alignItems: "center",

    justifyContent: "center",
  },

  badgeText: {
    color: "#FFFFFF",

    fontSize: 9,

    fontFamily:
      RBZFont.extraBold,
  },

  pressed: {
    opacity: 0.55,
  },
});