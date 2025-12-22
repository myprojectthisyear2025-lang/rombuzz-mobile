/**
 * ============================================================================
 * 📁 File: app/filter.tsx
 * 🎯 RomBuzz Mobile — Discover Filters (Premium)
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

/* 🎨 RomBuzz Palette */
const COLORS = {
  primary: "#b1123c",
  secondary: "#d8345f",
  accent: "#e9486a",
  highlight: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
};

export default function FilterScreen() {
  const router = useRouter();

  const [distance, setDistance] = useState(25);
  const [age, setAge] = useState<[number, number]>([21, 35]);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [photosOnly, setPhotosOnly] = useState(true);

  return (
    <View style={styles.container}>
      {/* 🔝 Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Filters</Text>
        <Pressable onPress={() => {}}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 📍 Distance */}
        <Section title="Distance">
          <Text style={styles.valueText}>{distance} miles</Text>
          <Slider
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={distance}
            onValueChange={setDistance}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={COLORS.highlight}
          />
        </Section>

        {/* 🎂 Age */}
        <Section title="Age Range">
          <Text style={styles.valueText}>
            {age[0]} – {age[1]}
          </Text>
          <Slider
            minimumValue={18}
            maximumValue={60}
            step={1}
            value={age[1]}
            onValueChange={(v) => setAge([age[0], v])}
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={COLORS.accent}
          />
        </Section>

        {/* ❤️ Looking For */}
        <Section title="Looking For">
          <TagRow
            tags={["Dating", "Serious", "Friends", "Not Sure"]}
          />
        </Section>

        {/* 👤 Interested In */}
        <Section title="Interested In">
          <TagRow tags={["Men", "Women", "Everyone"]} />
        </Section>

        {/* 📏 Height */}
        <Section title="Height">
          <TagRow tags={["< 5'5", "5'6 - 6'0", "6'0+"]} />
        </Section>

        {/* 🎓 Education */}
        <Section title="Education">
          <TagRow
            tags={[
              "High School",
              "College",
              "Graduate",
              "PhD",
            ]}
          />
        </Section>

        {/* 🍷 Lifestyle */}
        <Section title="Lifestyle">
          <TagRow tags={["Drinks", "Smokes", "Fitness", "Spiritual"]} />
        </Section>

        {/* 🔔 Toggles */}
        <Toggle label="Online now" value={onlineOnly} onChange={setOnlineOnly} />
        <Toggle
          label="Verified profiles only"
          value={verifiedOnly}
          onChange={setVerifiedOnly}
        />
        <Toggle
          label="Has photos"
          value={photosOnly}
          onChange={setPhotosOnly}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ✅ Apply */}
      <View style={styles.footer}>
        <Pressable style={styles.applyButton} onPress={() => router.back()}>
          <Text style={styles.applyText}>Apply Filters</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* =================== UI PARTS =================== */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <View style={styles.tagsRow}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleText}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: COLORS.primary }}
        thumbColor={COLORS.highlight}
      />
    </View>
  );
}

/* =================== STYLES =================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  resetText: {
    color: COLORS.highlight,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  applyText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
