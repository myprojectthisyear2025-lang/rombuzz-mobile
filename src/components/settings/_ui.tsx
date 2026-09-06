/**
 * ==========================================================================
 * 📁 File: src/components/settings/_ui.tsx
 * 🎯 Purpose: Shared modern shell and row components for RomBuzz Settings.
 * ==========================================================================
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

export const RBZ = {
  c1: "#B1123C",
  c2: "#D8345F",
  c3: "#E9486A",
  c4: "#B5179E",
  bg: "#F7F7F8",
  card: "#FFFFFF",
  line: "#ECE9EC",
  text: "#1F1B1E",
  muted: "#736C71",
  soft: "#AAA4A8",
  danger: "#D92D4F",
} as const;

export function ScreenShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useRomBuzzTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/profile");
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={27}
            color={colors.text}
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              28 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colors } = useRomBuzzTheme();

  const items =
    React.Children.toArray(children);

  const isRow = (
    child: React.ReactNode,
  ) =>
    React.isValidElement(child) &&
    (
      child.type === NavRow ||
      child.type === ToggleRow
    );

  const rowGroup =
    items.length > 0 &&
    items.every(isRow);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        rowGroup
          ? styles.rowCard
          : styles.contentCard,
      ]}
    >
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}

          {rowGroup &&
          index < items.length - 1 ? (
            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    colors.border,
                },
              ]}
            />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

export function NavRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useRomBuzzTheme();

  const textColor =
    danger
      ? colors.danger
      : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && {
          backgroundColor:
            colors.surfaceMuted,
        },
      ]}
    >
      <View style={styles.rowLeft}>
        <Ionicons
          name={icon}
          size={21}
          color={
            danger
              ? colors.danger
              : colors.brand
          }
        />

        <Text
          style={[
            styles.rowText,
            {
              color: textColor,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.rowRight}>
        {value ? (
          <Text
            style={[
              styles.rowValue,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {value}
          </Text>
        ) : null}

        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.iconMuted}
        />
      </View>
    </Pressable>
  );
}

export function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useRomBuzzTheme();

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.brand}
        />

        <Text
          style={[
            styles.rowText,
            {
              color: colors.text,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: colors.borderStrong,
          true: colors.brand,
        }}
      />
    </View>
  );
}

export function SectionTitle({
  children,
}: {
  children: string;
}) {
  const { colors } = useRomBuzzTheme();

  return (
    <Text
      style={[
        styles.sectionTitle,
        {
          color:
            colors.textSecondary,
        },
      ]}
    >
      {children}
    </Text>
  );
}

export function SmallText({
  children,
}: {
  children: string;
}) {
  const { colors } = useRomBuzzTheme();

  return (
    <Text
      style={[
        styles.small,
        {
          color:
            colors.textSecondary,
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: RBZ.bg,
  },

  header: {
    height: 62,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.55,
  },

  headerTitle: {
    color: RBZ.text,
    fontSize: 22,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 44,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },

  card: {
    backgroundColor: RBZ.card,
    borderRadius: 20,
    borderWidth:
      StyleSheet.hairlineWidth,
    borderColor: RBZ.line,
    overflow: "hidden",
    marginTop: 8,
  },

  rowCard: {
    paddingVertical: 2,
  },

  contentCard: {
    padding: 16,
  },

  divider: {
    height:
      StyleSheet.hairlineWidth,
    backgroundColor: RBZ.line,
    marginLeft: 52,
  },

  row: {
    minHeight: 58,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowPressed: {
    backgroundColor: "#F6F4F5",
  },

  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  rowValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  rowText: {
    color: RBZ.text,
    fontSize: 16,
    fontWeight: "700",
  },

  sectionTitle: {
    color: RBZ.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 22,
    marginLeft: 4,
  },

  small: {
    color: RBZ.muted,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
});