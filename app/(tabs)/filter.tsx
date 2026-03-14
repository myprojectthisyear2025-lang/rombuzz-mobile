/**
 * ============================================================================
 * 📁 File: app/filter.tsx
 * 🎯 RomBuzz Mobile — Discover Filters (working + selectable)
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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

type DiscoverFilters = {
  rangeMiles: number;
  ageMin: number;
  ageMax: number;
  gender: string;
  lookingFor: string[];
  vibe: string[];
  relationshipStyle: string[];
  bodyType: string[];
  fitnessLevel: string[];
  smoking: string[];
  drinking: string[];
  workoutFrequency: string[];
  diet: string[];
  sleepSchedule: string[];
  educationLevel: string[];
  travelStyle: string[];
  petsPreference: string[];
  zodiac: string[];
  loveLanguage: string[];
  interest: string[];
  onlineOnly: boolean;
  verifiedOnly: boolean;
  photosOnly: boolean;
};

const DEFAULT_FILTERS: DiscoverFilters = {
  rangeMiles: 25,
  ageMin: 21,
  ageMax: 35,
  gender: "",
  lookingFor: [],
  vibe: [],
  relationshipStyle: [],
  bodyType: [],
  fitnessLevel: [],
  smoking: [],
  drinking: [],
  workoutFrequency: [],
  diet: [],
  sleepSchedule: [],
  educationLevel: [],
  travelStyle: [],
  petsPreference: [],
  zodiac: [],
  loveLanguage: [],
  interest: [],
  onlineOnly: false,
  verifiedOnly: false,
  photosOnly: true,
};

const LOOKING_FOR_OPTIONS = [
  { label: "Serious", value: "serious" },
  { label: "Casual", value: "casual" },
  { label: "Friends", value: "friends" },
  { label: "GymBuddy", value: "gymbuddy" },
  { label: "Flirty", value: "flirty" },
  { label: "Chill", value: "chill" },
  { label: "Timepass", value: "timepass" },
  { label: "ONS", value: "ons" },
  { label: "Threesome", value: "threesome" },
  { label: "OnlyFans", value: "onlyfans" },
];

const VIBE_OPTIONS = [
  { label: "Romantic", value: "romantic" },
  { label: "Flirty", value: "flirty" },
  { label: "Chill", value: "chill" },
  { label: "Adventurous", value: "adventurous" },
  { label: "Funny", value: "funny" },
  { label: "Serious", value: "serious" },
];

const RELATIONSHIP_STYLE_OPTIONS = [
  { label: "Monogamy", value: "monogamy" },
  { label: "Long-term", value: "long-term" },
  { label: "Short-term", value: "short-term" },
  { label: "Open", value: "open" },
];

const BODY_TYPE_OPTIONS = [
  { label: "Slim", value: "slim" },
  { label: "Average", value: "average" },
  { label: "Athletic", value: "athletic" },
  { label: "Curvy", value: "curvy" },
  { label: "Plus-size", value: "plus-size" },
];

const FITNESS_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Active", value: "active" },
  { label: "Athlete", value: "athlete" },
  { label: "Gym Lover", value: "gym lover" },
];

const SMOKING_OPTIONS = [
  { label: "Never", value: "never" },
  { label: "Sometimes", value: "sometimes" },
  { label: "Regularly", value: "regularly" },
];

const DRINKING_OPTIONS = [
  { label: "Never", value: "never" },
  { label: "Socially", value: "socially" },
  { label: "Often", value: "often" },
];

const WORKOUT_OPTIONS = [
  { label: "Rarely", value: "rarely" },
  { label: "1-2x week", value: "1-2x week" },
  { label: "3-5x week", value: "3-5x week" },
  { label: "Daily", value: "daily" },
];

const DIET_OPTIONS = [
  { label: "Anything", value: "anything" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "Keto", value: "keto" },
  { label: "Halal", value: "halal" },
];

const SLEEP_OPTIONS = [
  { label: "Early Bird", value: "early bird" },
  { label: "Night Owl", value: "night owl" },
  { label: "Flexible", value: "flexible" },
];

const EDUCATION_OPTIONS = [
  { label: "High School", value: "high school" },
  { label: "College", value: "college" },
  { label: "Graduate", value: "graduate" },
  { label: "PhD", value: "phd" },
];

const TRAVEL_OPTIONS = [
  { label: "Homebody", value: "homebody" },
  { label: "Weekend Trips", value: "weekend trips" },
  { label: "Frequent Traveler", value: "frequent traveler" },
];

const PET_OPTIONS = [
  { label: "Love Dogs", value: "love dogs" },
  { label: "Love Cats", value: "love cats" },
  { label: "Any Pets", value: "any pets" },
  { label: "No Pets", value: "no pets" },
];

const ZODIAC_OPTIONS = [
  { label: "Aries", value: "aries" },
  { label: "Taurus", value: "taurus" },
  { label: "Gemini", value: "gemini" },
  { label: "Cancer", value: "cancer" },
  { label: "Leo", value: "leo" },
  { label: "Virgo", value: "virgo" },
  { label: "Libra", value: "libra" },
  { label: "Scorpio", value: "scorpio" },
  { label: "Sagittarius", value: "sagittarius" },
  { label: "Capricorn", value: "capricorn" },
  { label: "Aquarius", value: "aquarius" },
  { label: "Pisces", value: "pisces" },
];

const LOVE_OPTIONS = [
  { label: "Words", value: "words" },
  { label: "Quality Time", value: "quality time" },
  { label: "Gifts", value: "gifts" },
  { label: "Acts", value: "acts" },
  { label: "Touch", value: "touch" },
];

const INTEREST_OPTIONS = [
  { label: "Music", value: "music" },
  { label: "Movies", value: "movies" },
  { label: "Gym", value: "gym" },
  { label: "Travel", value: "travel" },
  { label: "Food", value: "food" },
  { label: "Gaming", value: "gaming" },
];

function parseIncoming(raw: unknown): DiscoverFilters {
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_FILTERS;

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return {
      ...DEFAULT_FILTERS,
      ...parsed,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function toggleInArray(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

export default function FilterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ discoverFilters?: string }>();

  const incoming = useMemo(
    () => parseIncoming(params.discoverFilters),
    [params.discoverFilters]
  );

  const [filters, setFilters] = useState<DiscoverFilters>(incoming);

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const applyFilters = () => {
    router.replace({
      pathname: "/(tabs)/discover",
      params: {
        discoverFilters: encodeURIComponent(JSON.stringify(filters)),
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* 🔝 Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={COLORS.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>Filters</Text>

        <Pressable onPress={resetAll}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Section title="Distance">
          <Text style={styles.valueText}>{filters.rangeMiles} miles</Text>
          <Slider
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={filters.rangeMiles}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, rangeMiles: v }))
            }
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={COLORS.highlight}
          />
        </Section>

        <Section title="Age Min">
          <Text style={styles.valueText}>{filters.ageMin}</Text>
          <Slider
            minimumValue={18}
            maximumValue={60}
            step={1}
            value={filters.ageMin}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                ageMin: Math.min(v, prev.ageMax),
              }))
            }
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={COLORS.accent}
          />
        </Section>

        <Section title="Age Max">
          <Text style={styles.valueText}>{filters.ageMax}</Text>
          <Slider
            minimumValue={18}
            maximumValue={60}
            step={1}
            value={filters.ageMax}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                ageMax: Math.max(v, prev.ageMin),
              }))
            }
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={COLORS.accent}
          />
        </Section>

        <Section title="Interested In">
          <SingleTagRow
            options={[
              { label: "All", value: "" },
              { label: "Men", value: "male" },
              { label: "Women", value: "female" },
            ]}
            selected={filters.gender}
            onSelect={(value) =>
              setFilters((prev) => ({ ...prev, gender: value }))
            }
          />
        </Section>

        <Section title="Looking For">
          <MultiTagRow
            options={LOOKING_FOR_OPTIONS}
            selected={filters.lookingFor}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                lookingFor: toggleInArray(prev.lookingFor, value),
              }))
            }
          />
        </Section>

        <Section title="Vibe">
          <MultiTagRow
            options={VIBE_OPTIONS}
            selected={filters.vibe}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                vibe: toggleInArray(prev.vibe, value),
              }))
            }
          />
        </Section>

        <Section title="Relationship Style">
          <MultiTagRow
            options={RELATIONSHIP_STYLE_OPTIONS}
            selected={filters.relationshipStyle}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                relationshipStyle: toggleInArray(prev.relationshipStyle, value),
              }))
            }
          />
        </Section>

        <Section title="Body Type">
          <MultiTagRow
            options={BODY_TYPE_OPTIONS}
            selected={filters.bodyType}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                bodyType: toggleInArray(prev.bodyType, value),
              }))
            }
          />
        </Section>

        <Section title="Fitness Level">
          <MultiTagRow
            options={FITNESS_OPTIONS}
            selected={filters.fitnessLevel}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                fitnessLevel: toggleInArray(prev.fitnessLevel, value),
              }))
            }
          />
        </Section>

        <Section title="Smoking">
          <MultiTagRow
            options={SMOKING_OPTIONS}
            selected={filters.smoking}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                smoking: toggleInArray(prev.smoking, value),
              }))
            }
          />
        </Section>

        <Section title="Drinking">
          <MultiTagRow
            options={DRINKING_OPTIONS}
            selected={filters.drinking}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                drinking: toggleInArray(prev.drinking, value),
              }))
            }
          />
        </Section>

        <Section title="Workout Frequency">
          <MultiTagRow
            options={WORKOUT_OPTIONS}
            selected={filters.workoutFrequency}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                workoutFrequency: toggleInArray(prev.workoutFrequency, value),
              }))
            }
          />
        </Section>

        <Section title="Diet">
          <MultiTagRow
            options={DIET_OPTIONS}
            selected={filters.diet}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                diet: toggleInArray(prev.diet, value),
              }))
            }
          />
        </Section>

        <Section title="Sleep Schedule">
          <MultiTagRow
            options={SLEEP_OPTIONS}
            selected={filters.sleepSchedule}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                sleepSchedule: toggleInArray(prev.sleepSchedule, value),
              }))
            }
          />
        </Section>

        <Section title="Education Level">
          <MultiTagRow
            options={EDUCATION_OPTIONS}
            selected={filters.educationLevel}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                educationLevel: toggleInArray(prev.educationLevel, value),
              }))
            }
          />
        </Section>

        <Section title="Travel Style">
          <MultiTagRow
            options={TRAVEL_OPTIONS}
            selected={filters.travelStyle}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                travelStyle: toggleInArray(prev.travelStyle, value),
              }))
            }
          />
        </Section>

        <Section title="Pets Preference">
          <MultiTagRow
            options={PET_OPTIONS}
            selected={filters.petsPreference}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                petsPreference: toggleInArray(prev.petsPreference, value),
              }))
            }
          />
        </Section>

        <Section title="Zodiac">
          <MultiTagRow
            options={ZODIAC_OPTIONS}
            selected={filters.zodiac}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                zodiac: toggleInArray(prev.zodiac, value),
              }))
            }
          />
        </Section>

        <Section title="Love Language">
          <MultiTagRow
            options={LOVE_OPTIONS}
            selected={filters.loveLanguage}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                loveLanguage: toggleInArray(prev.loveLanguage, value),
              }))
            }
          />
        </Section>

        <Section title="Interests">
          <MultiTagRow
            options={INTEREST_OPTIONS}
            selected={filters.interest}
            onToggle={(value) =>
              setFilters((prev) => ({
                ...prev,
                interest: toggleInArray(prev.interest, value),
              }))
            }
          />
        </Section>

        <Toggle
          label="Online now"
          value={filters.onlineOnly}
          onChange={(v) => setFilters((prev) => ({ ...prev, onlineOnly: v }))}
        />

        <Toggle
          label="Verified profiles only"
          value={filters.verifiedOnly}
          onChange={(v) =>
            setFilters((prev) => ({ ...prev, verifiedOnly: v }))
          }
        />

        <Toggle
          label="Has photos"
          value={filters.photosOnly}
          onChange={(v) => setFilters((prev) => ({ ...prev, photosOnly: v }))}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyText}>Apply Filters</Text>
        </Pressable>
      </View>
    </View>
  );
}

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

function MultiTagRow({
  options,
  selected,
  onToggle,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.tagsRow}>
      {options.map((item) => {
        const active = selected.includes(item.value);

        return (
          <Pressable
            key={item.value}
            onPress={() => onToggle(item.value)}
            style={[styles.tag, active && styles.tagActive]}
          >
            <Text style={[styles.tagText, active && styles.tagTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SingleTagRow({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.tagsRow}>
      {options.map((item) => {
        const active = selected === item.value;

        return (
          <Pressable
            key={item.value || "all"}
            onPress={() => onSelect(item.value)}
            style={[styles.tag, active && styles.tagActive]}
          >
            <Text style={[styles.tagText, active && styles.tagTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
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
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tagActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  tagTextActive: {
    color: COLORS.white,
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