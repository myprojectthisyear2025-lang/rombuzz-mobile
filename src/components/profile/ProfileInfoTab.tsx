/**
 * Path: src/components/profile/ProfileInfoTab.tsx
 * Purpose: Orchestrates Profile About/edit sections, picker state, and save wiring.
 * Used by: app/(tabs)/profile.tsx.
 
 *  ✅ Visibility options as elegant inline toggles
 *  ✅ Beautiful chip styling with hover effects
 *  ✅ Perfectly spaced sections with clear labels
 *  ✅ All functionality preserved
 * ============================================================================
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import {
  lookingForKeyFromValue,
} from "../../constants/lookingFor";
import {
  POLITICAL_VIEW_OPTIONS,
  RELIGION_OPTIONS,
  ZODIAC_OPTIONS,
} from "../../constants/profileBeliefs";
import {
  relationshipStyleKeyFromValue,
} from "../../constants/relationshipStyles";

import ProfileInfoSection from "@/src/features/profile/info/ProfileInfoSection";
import ProfileBackgroundSection from "@/src/features/profile/info/sections/ProfileBackgroundSection";
import ProfileBasicsSection from "@/src/features/profile/info/sections/ProfileBasicsSection";
import ProfileBeliefsSection from "@/src/features/profile/info/sections/ProfileBeliefsSection";
import ProfileBodyBasicsSection from "@/src/features/profile/info/sections/ProfileBodyBasicsSection";
import ProfileDatingSection from "@/src/features/profile/info/sections/ProfileDatingSection";
import ProfileFavoritesSection from "@/src/features/profile/info/sections/ProfileFavoritesSection";
import ProfileIdentitySection from "@/src/features/profile/info/sections/ProfileIdentitySection";
import ProfileInterestsSection from "@/src/features/profile/info/sections/ProfileInterestsSection";
import ProfileLifestyleSection from "@/src/features/profile/info/sections/ProfileLifestyleSection";
import ProfileLocationSection from "@/src/features/profile/info/sections/ProfileLocationSection";
import ProfileVibeSection from "@/src/features/profile/info/sections/ProfileVibeSection";

import LanguagePickerModal from "./LanguagePickerModal";
import ProfileSingleChoicePicker from "./ProfileSingleChoicePicker";
import TravelVibePicker from "./TravelVibePicker";

// ============================================================================
// HELPERS
// ============================================================================

const asText = (v: any) => (v === null || v === undefined ? "" : String(v));

const commaToArray = (v: string) =>
  v.split(",").map((s) => s.trim()).filter(Boolean);

const profileMultiArray = (v: any): string[] => {
  if (Array.isArray(v)) {
    return v
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof v === "string") {
    return commaToArray(v);
  }

  return [];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfileInfoTab(props: any) {
  const { colors } = useRomBuzzTheme();

  const {
    styles,
    RBZ,
    user,
    form,
    editingField,
    setEditingField,
    selectOpen,
    setSelectOpen,
    heightTemp,
    setHeightTemp,
    identityWarnAccepted,
    setIdentityWarnAccepted,
    toTitle,
    parseHeight,
    formatHeight,
    saveSingleField,
    setForm,
    setEditTarget,
    CITY_OPTIONS,
    GENDER_OPTIONS,
    ORIENTATION_OPTIONS,
    recording,
    startRecording,
    stopRecording,
    playVoice,
    deleteVoiceIntro,
    voiceUrl,
    voiceDurationSec,
    playing,
  } = props;

    const formatDuration = (sec: number) => {
    const s = Math.max(0, Math.floor(Number(sec || 0)));
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // State
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [travelVibeOpen, setTravelVibeOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [profileChoiceOpen, setProfileChoiceOpen] = useState<
    null | "religion" | "politicalViews" | "zodiac"
  >(null);
  const cityCacheRef = React.useRef<Record<string, string[]>>({});
  const cityRequestRef = React.useRef(0);

  const [countryQuery, setCountryQuery] = useState("");
  const [countryResults, setCountryResults] = useState<string[]>([]);
  const [textOpen, setTextOpen] = useState<null | {
    field: string;
    title: string;
    value: string;
    placeholder?: string;
    multiline?: boolean;
    asArray?: boolean;
  }>(null);

const age = React.useMemo(() => {
  const dob = user?.dob;
  if (!dob) return null;

  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  if (a < 18) return null;
  return a;
}, [user?.dob]);

// ------------------------------------------------------------------
// HYDRATE FORM FROM USER (SHOW SAVED INFO AFTER RELOAD)
// ------------------------------------------------------------------
React.useEffect(() => {
  if (!user) return;

  setForm((p: any) => ({
    ...p,

    // basics
    city: p.city || user.city || "",
    gender: p.gender || user.gender || "",
    orientation: p.orientation || user.orientation || "",
    lookingFor: p.lookingFor || user.lookingFor || "",
    height: p.height || user.height || "",

    // location
    country: p.country || user.country || "",
    hometown: p.hometown || user.hometown || "",
    travelMode:
      typeof p.travelMode === "boolean"
        ? p.travelMode
        : user.travelMode ?? false,

    // identity
    pronouns: p.pronouns || user.pronouns || "",
    relationshipStyle: p.relationshipStyle || user.relationshipStyle || "",

    // body & lifestyle
    bodyType: p.bodyType || user.bodyType || "",
    fitnessLevel: p.fitnessLevel || user.fitnessLevel || "",
    smoking: p.smoking || user.smoking || "",
    drinking: p.drinking || user.drinking || "",
    workoutFrequency: p.workoutFrequency || user.workoutFrequency || "",
    diet: p.diet || user.diet || "",
    sleepSchedule: p.sleepSchedule || user.sleepSchedule || "",

    // background
    educationLevel: p.educationLevel || user.educationLevel || "",
    school: p.school || user.school || "",
    jobTitle: p.jobTitle || user.jobTitle || "",
    company: p.company || user.company || "",
    languages:
      Array.isArray(p.languages) && p.languages.length
        ? p.languages.slice(0, 5)
        : Array.isArray(user.languages)
        ? user.languages.slice(0, 5)
        : [],

    // beliefs
    religion: p.religion || user.religion || "",
    politicalViews: p.politicalViews || user.politicalViews || "",
    zodiac: p.zodiac || user.zodiac || "",

    // favorites
    favoriteMusic:
      Array.isArray(p.favoriteMusic) && p.favoriteMusic.length
        ? p.favoriteMusic
        : user.favoriteMusic || [],
    favoriteMovies:
      Array.isArray(p.favoriteMovies) && p.favoriteMovies.length
        ? p.favoriteMovies
        : user.favoriteMovies || [],
    travelStyle: p.travelStyle || user.travelStyle || "",
    petsPreference: p.petsPreference || user.petsPreference || "",

    // vibe
    likes:
      profileMultiArray(p.likes).length
        ? profileMultiArray(p.likes).slice(0, 10)
        : profileMultiArray(user.likes).slice(0, 10),

    dislikes:
      profileMultiArray(p.dislikes).length
        ? profileMultiArray(p.dislikes).slice(0, 10)
        : profileMultiArray(user.dislikes).slice(0, 10),

    vibeTags:
      Array.isArray(p.vibeTags) && p.vibeTags.length
        ? p.vibeTags
        : user.vibeTags || [],
  }));
}, [user]);


  // Handle field save
  const handleFieldSave = (field: string, value: any, apiField?: string) => {
    const isIdentityField = field === "gender" || field === "orientation";
    const current = (form as any)?.[field];
    const changed = current !== value;

    const doSave = () => {
      setForm((p: any) => ({ ...p, [field]: value }));
      saveSingleField({ [apiField || field]: value });
      setSelectOpen(null);
      setEditingField(null);
    };

    if (isIdentityField && changed && !identityWarnAccepted) {
      Alert.alert(
        "Confirm change",
        "Changing this affects who can see you on Discover.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => {
              setIdentityWarnAccepted(true);
              doSave();
            },
          },
        ]
      );
      return;
    }

    doSave();
  };

  // City search effect — worldwide, English labels when available.
  React.useEffect(() => {
    const requestId = ++cityRequestRef.current;

    if (selectOpen?.field !== "city") return;

    const q = cityQuery.trim();

    if (q.length < 2) {
      setCityResults([]);
      setCityLoading(false);
      return;
    }

    const cacheKey = q.toLocaleLowerCase("en");
    const cached = cityCacheRef.current[cacheKey];

    if (cached) {
      setCityResults(cached);
      setCityLoading(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setCityLoading(true);

        const url =
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(q)}` +
          `&format=jsonv2&addressdetails=1&namedetails=1` +
          `&accept-language=en&limit=30`;

        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "Accept-Language": "en",
            "User-Agent": "RomBuzzApp/1.0",
          },
        });

        if (!res.ok) {
          throw new Error(`City search failed: ${res.status}`);
        }

        const data = await res.json();

        // Do not allow an older request to replace newer results.
        if (requestId !== cityRequestRef.current) return;

        const mapped = (Array.isArray(data) ? data : [])
          .map((x: any) => {
            const address = x?.address || {};
            const placeType = String(
              x?.addresstype || x?.type || ""
            ).toLowerCase();

            const isLocality = [
              "city",
              "town",
              "village",
              "municipality",
              "hamlet",
            ].includes(placeType);

            const addressCity =
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              address.hamlet ||
              "";

            // Prevent states/counties from appearing as cities.
            if (!addressCity && !isLocality) return "";

            const city =
              x?.namedetails?.["name:en"] ||
              addressCity ||
              x?.name ||
              "";

            const region =
              address.state ||
              address.region ||
              address.province ||
              "";

            const country = address.country || "";

            return [city, region, country]
              .filter(
                (part, index, parts) =>
                  Boolean(part) &&
                  parts.findIndex(
                    (candidate) =>
                      String(candidate).toLowerCase() ===
                      String(part).toLowerCase()
                  ) === index
              )
              .join(", ");
          })
          .filter(Boolean);

        const unique = Array.from(new Set(mapped)) as string[];

        cityCacheRef.current[cacheKey] = unique;
        setCityResults(unique);
      } catch (e) {
        if (requestId === cityRequestRef.current) {
          setCityResults([]);
        }
      } finally {
        if (requestId === cityRequestRef.current) {
          setCityLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(t);
  }, [cityQuery, selectOpen?.field]);

  // Country search effect
  React.useEffect(() => {
    const q = countryQuery.trim().toLowerCase();
    if (q.length < 2) {
      setCountryResults([]);
      return;
    }
    const matches = ["🇦🇫 Afghanistan","🇦🇱 Albania","🇩🇿 Algeria","🇦🇩 Andorra","🇦🇴 Angola","🇦🇬 Antigua and Barbuda","🇦🇷 Argentina","🇦🇲 Armenia",
  "🇦🇺 Australia","🇦🇹 Austria","🇦🇿 Azerbaijan","🇧🇸 Bahamas","🇧🇭 Bahrain","🇧🇩 Bangladesh","🇧🇧 Barbados","🇧🇾 Belarus","🇧🇪 Belgium","🇧🇿 Belize","🇧🇯 Benin",
  "🇧🇹 Bhutan","🇧🇴 Bolivia","🇧🇦 Bosnia and Herzegovina","🇧🇼 Botswana","🇧🇷 Brazil","🇧🇳 Brunei","🇧🇬 Bulgaria","🇧🇫 Burkina Faso","🇧🇮 Burundi","🇰🇭 Cambodia",
  "🇨🇲 Cameroon","🇨🇦 Canada","🇨🇻 Cape Verde","🇨🇫 Central African Republic","🇹🇩 Chad","🇨🇱 Chile","🇨🇳 China","🇨🇴 Colombia","🇰🇲 Comoros","🇨🇷 Costa Rica","🇭🇷 Croatia",
  "🇨🇺 Cuba","🇨🇾 Cyprus","🇨🇿 Czech Republic","🇩🇰 Denmark","🇩🇯 Djibouti","🇩🇲 Dominica","🇩🇴 Dominican Republic","🇪🇨 Ecuador","🇪🇬 Egypt","🇸🇻 El Salvador",
  "🇬🇶 Equatorial Guinea","🇪🇷 Eritrea","🇪🇪 Estonia","🇸🇿 Eswatini","🇪🇹 Ethiopia","🇫🇯 Fiji","🇫🇮 Finland","🇫🇷 France","🇬🇦 Gabon","🇬🇲 Gambia","🇬🇪 Georgia","🇩🇪 Germany",
  "🇬🇭 Ghana","🇬🇷 Greece","🇬🇩 Grenada","🇬🇹 Guatemala","🇬🇳 Guinea","🇬🇼 Guinea-Bissau","🇬🇾 Guyana","🇭🇹 Haiti","🇭🇳 Honduras","🇭🇺 Hungary","🇮🇸 Iceland","🇮🇳 India",
  "🇮🇩 Indonesia","🇮🇷 Iran","🇮🇶 Iraq","🇮🇪 Ireland","🇮🇱 Israel","🇮🇹 Italy","🇯🇲 Jamaica","🇯🇵 Japan","🇯🇴 Jordan","🇰🇿 Kazakhstan","🇰🇪 Kenya","🇰🇮 Kiribati","🇰🇼 Kuwait",
  "🇰🇬 Kyrgyzstan","🇱🇦 Laos","🇱🇻 Latvia","🇱🇧 Lebanon","🇱🇸 Lesotho","🇱🇷 Liberia","🇱🇾 Libya","🇱🇮 Liechtenstein","🇱🇹 Lithuania","🇱🇺 Luxembourg","🇲🇬 Madagascar","🇲🇼 Malawi",
  "🇲🇾 Malaysia","🇲🇻 Maldives","🇲🇱 Mali","🇲🇹 Malta","🇲🇭 Marshall Islands","🇲🇷 Mauritania","🇲🇺 Mauritius","🇲🇽 Mexico","🇫🇲 Micronesia","🇲🇩 Moldova","🇲🇨 Monaco","🇲🇳 Mongolia",
  "🇲🇪 Montenegro","🇲🇦 Morocco","🇲🇿 Mozambique","🇲🇲 Myanmar","🇳🇦 Namibia","🇳🇷 Nauru","🇳🇵 Nepal","🇳🇱 Netherlands","🇳🇿 New Zealand","🇳🇮 Nicaragua","🇳🇪 Niger","🇳🇬 Nigeria",
  "🇰🇵 North Korea","🇲🇰 North Macedonia","🇳🇴 Norway","🇴🇲 Oman","🇵🇰 Pakistan","🇵🇼 Palau","🇵🇸 Palestine","🇵🇦 Panama","🇵🇬 Papua New Guinea","🇵🇾 Paraguay","🇵🇪 Peru","🇵🇭 Philippines",
  "🇵🇱 Poland","🇵🇹 Portugal","🇶🇦 Qatar","🇷🇴 Romania","🇷🇺 Russia","🇷🇼 Rwanda","🇰🇳 Saint Kitts and Nevis","🇱🇨 Saint Lucia","🇻🇨 Saint Vincent and the Grenadines","🇼🇸 Samoa",
  "🇸🇲 San Marino","🇸🇹 Sao Tome and Principe","🇸🇦 Saudi Arabia","🇸🇳 Senegal","🇷🇸 Serbia","🇸🇨 Seychelles","🇸🇱 Sierra Leone","🇸🇬 Singapore","🇸🇰 Slovakia","🇸🇮 Slovenia",
  "🇸🇧 Solomon Islands","🇸🇴 Somalia","🇿🇦 South Africa","🇸🇸 South Sudan","🇰🇷 South Korea","🇪🇸 Spain","🇱🇰 Sri Lanka","🇸🇩 Sudan","🇸🇷 Suriname","🇸🇪 Sweden","🇨🇭 Switzerland",
  "🇸🇾 Syria","🇹🇼 Taiwan","🇹🇯 Tajikistan","🇹🇿 Tanzania","🇹🇭 Thailand","🇹🇱 Timor-Leste","🇹🇬 Togo","🇹🇴 Tonga","🇹🇹 Trinidad and Tobago","🇹🇳 Tunisia","🇹🇷 Turkey","🇹🇲 Turkmenistan",
  "🇹🇻 Tuvalu","🇺🇬 Uganda","🇺🇦 Ukraine","🇦🇪 United Arab Emirates","🇬🇧 United Kingdom","🇺🇸 United States","🇺🇾 Uruguay","🇺🇿 Uzbekistan","🇻🇦 Vatican City","🇻🇪 Venezuela","🇻🇳 Vietnam",
  "🇾🇪 Yemen","🇿🇲 Zambia","🇿🇼 Zimbabwe"
].filter((c) => c.toLowerCase().includes(q));
    setCountryResults(matches);
  }, [countryQuery]);

  // Flat section wrapper — no old card/shadow styling.
  const renderSection = (
    title: string,
    children: React.ReactNode
  ) => (
    <ProfileInfoSection title={title}>
      {children}
    </ProfileInfoSection>
  );

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        paddingBottom: 12,
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
        }}
      >

            {/* ABOUT */}
        {renderSection("About", (
          <>
            <Text
              style={{
                fontFamily: RBZFont.medium,
                fontSize: 15,
                lineHeight: 22,
                color: colors.text,
                marginBottom: 16,
              }}
            >
              {user?.bio
                ? user.bio
                : "Add a bio so people vibe with you."}
            </Text>

            <TouchableOpacity
              onPress={() => setEditTarget("bio")}
              style={{
                minHeight: 46,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderRadius: 10,
                backgroundColor: colors.surfaceMuted,
                borderWidth: 1,
                borderColor: colors.borderStrong,
              }}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.text}
              />

              <Text
                style={{
                  fontFamily: RBZFont.semiBold,
                  fontSize: 15,
                  color: colors.text,
                }}
              >
                Edit Bio
              </Text>
            </TouchableOpacity>
          </>
        ))}

         {/* VOICE INTRO */}
        {renderSection("Voice Intro", (
          <>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: RBZFont.medium,
                    fontSize: 12.5,
                    color: colors.textMuted,
                    marginBottom: 4,
                  }}
                >
                  Up to 60 seconds
                </Text>

                <Text
                  style={{
                    fontFamily: RBZFont.medium,
                    fontSize: 12.5,
                    color: voiceUrl
                      ? colors.textSecondary
                      : colors.brand,
                  }}
                >
                  {voiceUrl
                    ? `Saved duration: ${formatDuration(
                        voiceDurationSec
                      )}`
                    : "Boosts matches by 4x"}
                </Text>
              </View>

              {voiceUrl && (
                <TouchableOpacity
                  onPress={playVoice}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 18,
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons
                    name={playing ? "pause" : "play"}
                    size={14}
                    color={colors.text}
                  />

                  <Text
                    style={{
                      fontFamily: RBZFont.semiBold,
                      fontSize: 12.5,
                      color: colors.text,
                    }}
                  >
                    {playing ? "Pause" : "Play"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {recording ? (
                <TouchableOpacity
                  onPress={() => stopRecording(false)}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: colors.danger,
                  }}
                >
                  <Ionicons
                    name="stop"
                    size={19}
                    color={colors.white}
                  />

                  <Text
                    style={{
                      fontFamily: RBZFont.semiBold,
                      fontSize: 15,
                      color: colors.white,
                    }}
                  >
                    Stop Recording
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={startRecording}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 10,

                    backgroundColor: voiceUrl
                      ? colors.surfaceMuted
                      : colors.brand,

                    borderWidth: 1,

                    borderColor: voiceUrl
                      ? colors.borderStrong
                      : colors.brand,
                  }}
                >
                  <Ionicons
                    name="mic"
                    size={19}
                    color={
                      voiceUrl
                        ? colors.text
                        : colors.white
                    }
                  />

                  <Text
                    style={{
                      fontFamily: RBZFont.semiBold,
                      fontSize: 15,
                      color: voiceUrl
                        ? colors.text
                        : colors.white,
                    }}
                  >
                    {voiceUrl
                      ? "Record Again"
                      : "Record Intro"}
                  </Text>
                </TouchableOpacity>
              )}

              {voiceUrl && !recording && (
                <TouchableOpacity
                  onPress={deleteVoiceIntro}
                  style={{
                    minWidth: 48,
                    minHeight: 48,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: colors.danger,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.white}
                  />
                </TouchableOpacity>
              )}
            </View>
          </>
        ))}

        {/* BASICS */}
        <ProfileBasicsSection
          form={form}
          age={age}
          toTitle={toTitle}
          parseHeight={parseHeight}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
          setHeightTemp={setHeightTemp}
          CITY_OPTIONS={CITY_OPTIONS}
          GENDER_OPTIONS={GENDER_OPTIONS}
          ORIENTATION_OPTIONS={ORIENTATION_OPTIONS}
        />

        {/* IDENTITY */}
        <ProfileIdentitySection
          form={form}
          toTitle={toTitle}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
        />

        {/* LOCATION */}
        <ProfileLocationSection
          form={form}
          toTitle={toTitle}
          setCountryQuery={setCountryQuery}
          setCountryResults={setCountryResults}
          setEditingField={setEditingField}
          setTextOpen={setTextOpen}
          setTravelVibeOpen={setTravelVibeOpen}
        />

        {/* DATING */}
        <ProfileDatingSection
          form={form}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
        />

        {/* BODY & BASICS */}
        <ProfileBodyBasicsSection
          form={form}
          toTitle={toTitle}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
        />

        {/* LIFESTYLE */}
        <ProfileLifestyleSection
          form={form}
          toTitle={toTitle}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
        />

        {/* BACKGROUND */}
        <ProfileBackgroundSection
          form={form}
          toTitle={toTitle}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
          setTextOpen={setTextOpen}
          setLanguagePickerOpen={setLanguagePickerOpen}
        />

        {/* BELIEFS */}
        <ProfileBeliefsSection
          form={form}
          setProfileChoiceOpen={setProfileChoiceOpen}
        />

        {/* FAVORITES */}
        <ProfileFavoritesSection
          form={form}
          toTitle={toTitle}
          setTextOpen={setTextOpen}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
        />

        {/* VIBE */}
        <ProfileVibeSection
          form={form}
          editingField={editingField}
          setEditingField={setEditingField}
          setSelectOpen={setSelectOpen}
          setForm={setForm}
          saveSingleField={saveSingleField}
        />

        {/* INTERESTS */}
        <ProfileInterestsSection
          user={user}
          setEditTarget={setEditTarget}
        />
      </View>

      <TravelVibePicker
              visible={travelVibeOpen}
              selected={
                Array.isArray((form as any)?.travelVibes)
                  ? (form as any).travelVibes
                  : []
              }
              onClose={() => setTravelVibeOpen(false)}
              onSave={(values) => {
                setForm((prev: any) => ({
                  ...prev,
                  travelVibes: values,
                }));

                saveSingleField({
                  travelVibes: values,
                });

                setTravelVibeOpen(false);
              }}
            />

            <LanguagePickerModal
              visible={languagePickerOpen}
              selected={
                Array.isArray((form as any)?.languages)
                  ? (form as any).languages.slice(0, 5)
                  : []
              }
              RBZ={RBZ}
              onClose={() => setLanguagePickerOpen(false)}
              onSave={(values) => {
                const languages = values.slice(0, 5);

                setForm((prev: any) => ({
                  ...prev,
                  languages,
                }));

                saveSingleField({
                  languages,
                });

                setLanguagePickerOpen(false);
              }}
            />
                        <ProfileSingleChoicePicker
              visible={!!profileChoiceOpen}
              title={
                profileChoiceOpen === "religion"
                  ? "Religion"
                  : profileChoiceOpen === "politicalViews"
                  ? "Political views"
                  : "Zodiac sign"
              }
              placeholder={
                profileChoiceOpen === "religion"
                  ? "Type your religion..."
                  : profileChoiceOpen === "politicalViews"
                  ? "Type your political views..."
                  : "Type your zodiac sign..."
              }
              value={
                profileChoiceOpen
                  ? asText((form as any)?.[profileChoiceOpen])
                  : ""
              }
              options={
                profileChoiceOpen === "religion"
                  ? RELIGION_OPTIONS
                  : profileChoiceOpen === "politicalViews"
                  ? POLITICAL_VIEW_OPTIONS
                  : ZODIAC_OPTIONS
              }
              RBZ={RBZ}
              onClose={() => setProfileChoiceOpen(null)}
              onSave={(value) => {
                const field = profileChoiceOpen;

                if (!field) return;

                setForm((prev: any) => ({
                  ...prev,
                  [field]: value,
                }));

                saveSingleField({
                  [field]: value,
                });

                setProfileChoiceOpen(null);
              }}
            />

      {/* ============================================================================
         MODALS (Preserved functionality)
      ============================================================================ */}

      {/* Selection Modal */}
      <Modal visible={!!selectOpen} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxHeight: '80%',
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: RBZ.text,
              marginBottom: 20,
            }}>
              {selectOpen?.title}
            </Text>

            {selectOpen?.field === "city" && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    height: 50,
                    borderWidth: 1,
                    borderColor: RBZ.border,
                    borderRadius: 14,
                    backgroundColor: "#f8f9fa",
                    paddingHorizontal: 14,
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={RBZ.muted}
                  />

                  <TextInput
                    value={cityQuery}
                    onChangeText={setCityQuery}
                    placeholder="Search any city worldwide"
                    placeholderTextColor={RBZ.muted}
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="search"
                    style={{
                      flex: 1,
                      height: "100%",
                      paddingHorizontal: 10,
                      fontSize: 16,
                      color: RBZ.text,
                    }}
                  />

                  {!!cityQuery && (
                    <TouchableOpacity
                      onPress={() => {
                        setCityQuery("");
                        setCityResults([]);
                      }}
                      hitSlop={10}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={RBZ.muted}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    color: RBZ.muted,
                    marginTop: 8,
                    marginBottom: 10,
                  }}
                >
                  {cityQuery.trim().length < 2
                    ? "Search cities and towns worldwide."
                    : cityLoading
                    ? "Searching worldwide…"
                    : cityResults.length
                    ? `${cityResults.length} matching location${
                        cityResults.length === 1 ? "" : "s"
                      }`
                    : "No city found. Try adding the country name."}
                </Text>

                {cityLoading && (
                  <View style={{ paddingVertical: 8 }}>
                    <ActivityIndicator color={RBZ.primary} />
                  </View>
                )}
              </>
            )}

            <ScrollView
              style={{ maxHeight: 400 }}
              keyboardShouldPersistTaps="handled"
            >
              {(
                selectOpen?.field === "city"
                  ? cityResults
                  : (selectOpen?.options || [])
              ).map((opt: string) => {
                const isMulti = !!selectOpen?.multi;

                const active = isMulti
                  ? Array.isArray(selectOpen?.value) &&
                    selectOpen.value.includes(opt)
                  : opt === selectOpen?.value;

                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() =>
                      setSelectOpen((p: any) => {
                        if (!p) return p;

                        // Normal fields remain single-select.
                        if (!p.multi) {
                          return {
                            ...p,
                            value: opt,
                          };
                        }

                        // Multi-select fields toggle individual values.
                        const current = Array.isArray(p.value)
                          ? p.value
                          : p.value
                          ? [String(p.value)]
                          : [];

                        const selected = current.includes(opt);

                        const next = selected
                          ? current.filter(
                              (item: string) => item !== opt
                            )
                          : [...current, opt];

                        return {
                          ...p,
                          value: next,
                        };
                      })
                    }
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 4,
                      borderBottomWidth: 1,
                      borderBottomColor: RBZ.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: active ? RBZ.primary : RBZ.text,
                        fontWeight: active ? "600" : "400",
                      }}
                    >
                      {opt}
                    </Text>

                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={RBZ.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setSelectOpen(null);
                  setEditingField(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#f8f9fa',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: RBZ.text,
                  fontWeight: '600',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

           <TouchableOpacity
                onPress={() => {
                  if (!selectOpen) return;

                  if (
                    (selectOpen.field === "interests" || selectOpen.field === "hobbies") &&
                    Array.isArray(selectOpen.value) &&
                    selectOpen.value.length < 5
                  ) {
                    Alert.alert("Minimum required", "Please select at least 5 items.");
                    return;
                  }

                  const field = selectOpen.field;
                  const rawValue = selectOpen.value;

                const value =
                    field === "lookingFor"
                      ? lookingForKeyFromValue(rawValue)
                      : field === "relationshipStyle"
                      ? relationshipStyleKeyFromValue(rawValue)
                      : field === "travelMode"
                      ? rawValue === "Active"
                      : rawValue;

                  handleFieldSave(field, value);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: RBZ.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                color: RBZ.text,
                  fontWeight: '600',
                }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Height Picker Modal */}
      <Modal visible={editingField === "height"} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Height</Text>
            <View style={{ flexDirection: "row", gap: 20, marginTop: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ textAlign: 'center', marginBottom: 12, color: RBZ.muted }}>Feet</Text>
                <ScrollView style={{ maxHeight: 240 }}>
                  {[4, 5, 6, 7].map((ft: number) => {
                    const active = heightTemp.ft === ft;
                    return (
                      <TouchableOpacity
                        key={ft}
                        onPress={() => setHeightTemp((p: any) => ({ ...p, ft }))}
                        style={{
                          paddingVertical: 16,
                          alignItems: 'center',
                          backgroundColor: active ? RBZ.primary + '15' : 'transparent',
                          borderRadius: 12,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{
                          fontSize: 16,
                          color: active ? RBZ.primary : RBZ.text,
                          fontWeight: active ? '700' : '400',
                        }}>
                          {ft} ft
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{ textAlign: 'center', marginBottom: 12, color: RBZ.muted }}>Inches</Text>
                <ScrollView style={{ maxHeight: 240 }}>
                  {Array.from({ length: 12 }).map((_, i: number) => {
                    const active = heightTemp.inch === i;
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setHeightTemp((p: any) => ({ ...p, inch: i }))}
                        style={{
                          paddingVertical: 16,
                          alignItems: 'center',
                          backgroundColor: active ? RBZ.primary + '15' : 'transparent',
                          borderRadius: 12,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{
                          fontSize: 16,
                          color: active ? RBZ.primary : RBZ.text,
                          fontWeight: active ? '700' : '400',
                        }}>
                          {i} in
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setEditingField(null)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#f8f9fa',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: RBZ.text,
                  fontWeight: '600',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const h = formatHeight(heightTemp.ft, heightTemp.inch);
                  setForm((p: any) => ({ ...p, height: h }));
                  saveSingleField({ height: h });
                  setEditingField(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: RBZ.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                color: RBZ.text,
                  fontWeight: '600',
                }}>
                  Save 
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Text Edit Modal */}
      <Modal visible={!!textOpen} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{textOpen?.title}</Text>
            <TextInput
              value={textOpen?.value || ""}
              onChangeText={(t) => setTextOpen((p) => (p ? { ...p, value: t } : p))}
              placeholder={textOpen?.placeholder || "Type here..."}
              placeholderTextColor={RBZ.muted}
              autoCorrect={false}
              multiline={!!textOpen?.multiline}
              style={{
                height: textOpen?.multiline ? 120 : 48,
                borderWidth: 1,
                borderColor: RBZ.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingTop: textOpen?.multiline ? 12 : 0,
                fontSize: 16,
                marginTop: 20,
                marginBottom: 24,
                backgroundColor: '#f8f9fa',
                textAlignVertical: textOpen?.multiline ? 'top' : 'center',
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setTextOpen(null)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#f8f9fa',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: RBZ.text,
                  fontWeight: '600',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!textOpen) return;
                  const field = textOpen.field;
                  const raw = (textOpen.value || "").trim();
                  const value = textOpen.asArray ? commaToArray(raw) : raw;
                  setForm((p: any) => ({ ...p, [field]: value }));
                  saveSingleField({ [field]: value });
                  setTextOpen(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: RBZ.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                color: RBZ.text,
                  fontWeight: '600',
                }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Modal */}
      <Modal visible={editingField === "country"} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Country</Text>
            <TextInput
              value={countryQuery}
              onChangeText={setCountryQuery}
              placeholder="Start typing country name..."
              placeholderTextColor={RBZ.muted}
              autoFocus
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: RBZ.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                marginBottom: 16,
                backgroundColor: '#f8f9fa',
              }}
            />
            <ScrollView style={{ maxHeight: 300 }}>
              {countryResults.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setForm((p: any) => ({ ...p, country: c }));
                    saveSingleField({ country: c });
                    setEditingField(null);
                  }}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: RBZ.border,
                  }}
                >
                  <Text style={{ fontSize: 16, color: RBZ.text }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setEditingField(null)}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: '#f8f9fa',
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{
                fontSize: 16,
                color: RBZ.text,
                fontWeight: '600',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}