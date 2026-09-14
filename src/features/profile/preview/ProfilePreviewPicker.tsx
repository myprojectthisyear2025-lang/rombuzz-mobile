/**
 * Path: src/features/profile/preview/ProfilePreviewPicker.tsx
 * Purpose: Centered profile preview picker modal for before-match and after-match preview.
 * Used by: app/(tabs)/(root)/profile.tsx
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export type ProfilePreviewMode =
  | "before"
  | "after";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (
    mode: ProfilePreviewMode
  ) => void;
};

export default function ProfilePreviewPicker({
  visible,
  onClose,
  onSelect,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surface,
              borderColor:
                colors.border,
            },
          ]}
        >
          <View
            style={styles.titleRow}
          >
            <View style={styles.titleCopy}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                ]}
              >
                Profile Preview
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                See your profile exactly
                as other people do.
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Close profile preview"
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeButton,
                {
                  backgroundColor:
                    colors.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name="close"
                size={18}
                color={colors.icon}
              />
            </Pressable>
          </View>

          <PreviewChoice
            icon="sparkles-outline"
            title="Before Match"
            description="What people see when they open your profile from Discover."
            onPress={() =>
              onSelect("before")
            }
          />

          <PreviewChoice
            icon="people-outline"
            title="After Match"
            description="What a matched user sees when they open your profile."
            onPress={() =>
              onSelect("after")
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PreviewChoice({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor:
            colors.surfaceMuted,
          borderColor:
            colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.choiceIcon,
          {
            backgroundColor:
              colors.brandSoft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.brand}
        />
      </View>

      <View style={styles.choiceCopy}>
        <Text
          style={[
            styles.choiceTitle,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.choiceDescription,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.iconMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.48)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth:
      StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: 12,
    marginBottom: 2,
  },

  titleCopy: {
    flex: 1,
  },

  title: {
    fontFamily: RBZFont.bold,
    fontSize: 18,
    lineHeight: 24,
  },

  subtitle: {
    marginTop: 4,
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
    lineHeight: 17,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  choice: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  choiceCopy: {
    flex: 1,
  },

  choiceTitle: {
    fontFamily:
      RBZFont.semiBold,
    fontSize: 15,
    lineHeight: 19,
  },

  choiceDescription: {
    marginTop: 2,
    fontFamily: RBZFont.medium,
    fontSize: 11.5,
    lineHeight: 15,
  },

  pressed: {
    opacity: 0.72,
  },
});