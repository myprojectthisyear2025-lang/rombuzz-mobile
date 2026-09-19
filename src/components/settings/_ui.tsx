/**
 * Path: src/components/settings/_ui.tsx
 * Purpose: Shared Settings layout, flat row groups, and Manrope copy.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont, useRomBuzzTypography } from "@/src/design/rombuzzTypography";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function ScreenShell({
  title,
  children,
  scrollRef,
}: {
  title: string;
  children: React.ReactNode;
  scrollRef?: React.Ref<ScrollView>;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useRomBuzzTheme();
  const fontsLoaded = useRomBuzzTypography();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/(root)/profile");
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: colors.background,
        },
      ]}
    >
      {fontsLoaded ? (
        <>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: colors.surfaceMuted },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.icon} />
            </Pressable>
            <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.text }]}>
              {title}
            </Text>
          </View>
          <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView
              ref={scrollRef}
              style={styles.root}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      ) : (
        <ActivityIndicator style={styles.loader} color={colors.brand} />
      )}
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useRomBuzzTheme();
  const items = React.Children.toArray(children);
  const rowGroup =
    items.length > 0 &&
    items.every(
      (child) => React.isValidElement(child) && (child.type === NavRow || child.type === ToggleRow),
    );
  return (
    <View style={rowGroup ? [styles.rowGroup, { borderColor: colors.border }] : styles.contentGroup}>
      {items.map((child, index) => (
        <React.Fragment key={React.isValidElement(child) ? (child.key ?? index) : index}>
          {child}
          {rowGroup && index < items.length - 1 ? (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

export function NavRow({
  icon,
  label,
  description,
  value,
  onPress,
  danger,
  accent,
  external,
  chevron = true,
}: {
  icon: IconName;
  label: string;
  description?: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  accent?: boolean;
  external?: boolean;
  chevron?: boolean;
}) {
  const { colors } = useRomBuzzTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? colors.danger : accent ? colors.brand : colors.iconMuted}
      />
      <View style={styles.copy}>
        <Text style={[styles.rowText, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        ) : null}
      </View>
      {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
      {chevron ? (
        <Ionicons name={external ? "open-outline" : "chevron-forward"} size={16} color={colors.iconMuted} />
      ) : null}
    </Pressable>
  );
}

export function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useRomBuzzTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.iconMuted} />
      <Text style={[styles.rowText, styles.copy, { color: colors.text }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: colors.brand }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.borderStrong}
      />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const { colors } = useRomBuzzTheme();
  return (
    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
}

export function SmallText({ children }: { children: React.ReactNode }) {
  const { colors } = useRomBuzzTheme();
  return <Text style={[styles.small, { color: colors.textSecondary }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1 },
  header: {
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.65 },
  headerTitle: { flex: 1, fontSize: 24, letterSpacing: -0.7, fontFamily: RBZFont.extraBold },
  scrollContent: { paddingHorizontal: 18, width: "100%", maxWidth: 640, alignSelf: "center" },
  rowGroup: { borderBottomWidth: StyleSheet.hairlineWidth },
  contentGroup: { paddingVertical: 8, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 36 },
  row: {
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: { flex: 1, minWidth: 0 },
  rowText: { fontSize: 14.5, fontFamily: RBZFont.semiBold },
  rowValue: { maxWidth: "30%", fontSize: 12, fontFamily: RBZFont.medium, textAlign: "right" },
  description: { marginTop: 3, fontSize: 12, lineHeight: 17, fontFamily: RBZFont.regular },
  sectionTitle: {
    fontSize: 12,
    fontFamily: RBZFont.bold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 6,
  },
  small: { fontSize: 12.5, fontFamily: RBZFont.regular, marginTop: 10, lineHeight: 19 },
});
