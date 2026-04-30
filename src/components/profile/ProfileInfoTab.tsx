/**
 * ============================================================================
 * 📁 File: src/components/profile/ProfileInfoTab.tsx
 * 🎯 Purpose: Profile → Info tab (Sleek, modern dating app UI)
 *
 * ENHANCEMENTS:
 *  ✅ Clean, minimalist design with perfect spacing
 *  ✅ Elegant cards with subtle borders and shadows  
 *  ✅ Professional typography and visual hierarchy
 *  ✅ Visibility options as elegant inline toggles
 *  ✅ Beautiful chip styling with hover effects
 *  ✅ Perfectly spaced sections with clear labels
 *  ✅ All functionality preserved
 * ============================================================================
 */

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

// ============================================================================
// CONSTANTS
// ============================================================================

const LOOKING_FOR_MAP = [
  { key: "serious", label: "Serious", icon: "heart" },
  { key: "casual", label: "Casual", icon: "flash" },
  { key: "friends", label: "Friends", icon: "people" },
  { key: "gymbuddy", label: "GymBuddy", icon: "fitness" },
  { key: "flirty", label: "Flirty", icon: "sparkles" },
  { key: "chill", label: "Chill", icon: "leaf" },
  { key: "timepass", label: "Timepass", icon: "hourglass" },
];


const PRONOUN_OPTIONS = ["He/Him", "She/Her", "They/Them", "Custom"];
const RELATIONSHIP_STYLE_OPTIONS = ["Monogamous", "Open", "Poly"];
const BODY_TYPE_OPTIONS = ["Slim", "Average", "Athletic", "Curvy", "Muscular", "A little extra", "Prefer not to say"];
const FITNESS_LEVEL_OPTIONS = ["Not active", "Sometimes", "Active", "Very active"];
const SMOKING_OPTIONS = ["No", "Sometimes", "Yes"];
const DRINKING_OPTIONS = ["No", "Socially", "Yes"];
const WORKOUT_OPTIONS = ["Never", "1–2x/week", "3–5x/week", "Daily"];
const DIET_OPTIONS = ["Non-veg", "Vegetarian", "Vegan", "Keto", "Other"];
const SLEEP_OPTIONS = ["Early bird", "Night owl"];
const EDUCATION_OPTIONS = ["High school", "College", "Undergraduate", "Graduate", "PhD", "Trade school", "Prefer not to say"];
const PETS_OPTIONS = ["Dog","Cat","Fish","Bird","Rabbit","Hamster","Guinea Pig","Turtle","Horse","Snake","Other","None"];
const LIKE_OPTIONS = [
  "Coffee",
  "Tea",
  "Late-night talks",
  "Deep conversations",
  "Road trips",
  "Night drives",
  "Gym",
  "Yoga",
  "Meditation",
  "Running",
  "Dogs",
  "Cats",
  "Pets",
  "Sunsets",
  "Sunrises",
  "Beaches",
  "Mountains",
  "Nature walks",
  "Cooking",
  "Baking",
  "Trying new food",
  "Street food",
  "Music",
  "Live concerts",
  "Festivals",
  "Podcasts",
  "Audiobooks",
  "Movies",
  "TV shows",
  "Anime",
  "Gaming",
  "Board games",
  "Books",
  "Reading",
  "Writing",
  "Photography",
  "Travel",
  "Spontaneous plans",
  "Dancing",
  "Art",
  "Museums",
  "Minimalism",
  "Fashion",
  "Streetwear",
  "Perfumes",
  "Self-care",
  "Skincare",
  "Journaling",
  "Long walks",
  "Rainy days",
  "Honesty",
  "Kindness",
  "Ambition",
  "Stability",
  "Romance",
  "Surprises",
  "Spontaneity",
];


const DISLIKE_OPTIONS = [
  "Smoking",
  "Drugs",
  "Dishonesty",
  "Lies",
  "Manipulation",
  "Gaslighting",
  "Cheating",
  "Ghosting",
  "Breadcrumbing",
  "Rudeness",
  "Arrogance",
  "Entitlement",
  "Judgmental people",
  "Closed mindset",
  "Negativity",
  "Drama",
  "Toxic behavior",
  "Disrespect",
  "Aggression",
  "Anger issues",
  "Passive aggression",
  "Loud chewing",
  "Bad hygiene",
  "Messiness",
  "Oversharing",
  "No boundaries",
  "Clinginess",
  "Jealousy",
  "Over-controlling",
  "Unreliability",
  "Inconsistency",
  "Excuses",
  "Victim mindset",
  "Laziness",
  "No ambition",
  "Lack of effort",
  "Late replies",
  "Dry texting",
  "No communication",
  "Overuse of phone",
  "Phone addiction",
  "Fake personas",
  "Attention seeking",
  "Disloyalty",
  "Public embarrassment",
  "Unkindness",
  "No accountability",
];


// ============================================================================
// HELPERS
// ============================================================================

const asText = (v: any) => (v === null || v === undefined ? "" : String(v));
const asCommaText = (v: any) => {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (!v) return "";
  return String(v);
};
const safeArray = (v: any): string[] =>
  Array.isArray(v) ? v.filter(Boolean) : [];

const commaToArray = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

const lookingForLabelFromValue = (val?: string) => {
  if (!val) return "";
  const byLabel = LOOKING_FOR_MAP.find((x) => x.label.toLowerCase() === val.toLowerCase());
  if (byLabel) return byLabel.label;
  const byKey = LOOKING_FOR_MAP.find((x) => x.key === val);
  return byKey ? byKey.label : val;
};

const getVisibilityLabel = (value: any) => {
  const str = String(value || "").toLowerCase();
  return str === "hide" || str === "hidden" || str === "false" ? "Hidden" : "Visible";
};

const getVisibilityColor = (value: any, RBZ: any) => {
  const str = String(value || "").toLowerCase();
  return str === "hide" || str === "hidden" || str === "false" ? RBZ.muted : RBZ.success;
};

const toggleVisibility = (current: any) => {
  const str = String(current || "").toLowerCase();
  return str === "hide" || str === "hidden" || str === "false" ? "show" : "hide";
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfileInfoTab(props: any) {
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
    LOOKINGFOR_OPTIONS,
    LIKE_CHIP_OPTIONS,
    DISLIKE_CHIP_OPTIONS,
     recording,
    startRecording,
    stopRecording,
    playVoice,
    deleteVoiceIntro,
    voiceUrl,
    voiceDurationSec,
    playing,
    Chip,
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
  const cityCacheRef = React.useRef<Record<string, string[]>>({});

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
// ---------------- SAFE DERIVED VALUES ----------------
const safeVibeTags: string[] = Array.isArray(form?.vibeTags)
  ? form.vibeTags
  : [];

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
        ? p.languages
        : user.languages || [],

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
      Array.isArray(p.likes) && p.likes.length
        ? p.likes
        : user.likes || [],
    dislikes:
      Array.isArray(p.dislikes) && p.dislikes.length
        ? p.dislikes
        : user.dislikes || [],
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

  // Handle visibility toggle
  const handleVisibilityToggle = (field: string) => {
    const current = (form as any)?.[field];
    const newValue = toggleVisibility(current);
    setForm((p: any) => ({ ...p, [field]: newValue }));
    saveSingleField({ [field]: newValue });
  };

  // City search effect
  React.useEffect(() => {
    if (selectOpen?.field !== "city") return;
    const q = cityQuery.trim();
    if (q.length < 3) {
      setCityResults([]);
      return;
    }
const t = setTimeout(async () => {
  try {
    // ✅ cache hit
    const cached = cityCacheRef.current[q.toLowerCase()];
    if (cached) {
      setCityResults(cached);
      return;
    }

    setCityLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=20`;

        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "RomBuzzApp/1.0",
          },
        });
        const data = await res.json();
        const mapped: string[] = (Array.isArray(data) ? data : [])
          .map((x: any) => {
            const city = x?.address?.city || x?.address?.town || x?.address?.village || 
                        x?.address?.municipality || x?.address?.county || x?.address?.state || "";
            const country = x?.address?.country || "";
            return `${city}${country ? ", " + country : ""}`.trim();
          })
          .filter(Boolean);
        setCityResults(Array.from(new Set(mapped)));
      } catch (e) {
        setCityResults([]);
      } finally {
        setCityLoading(false);
      }
    }, 450);
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

  // Render Info Row
  const renderInfoRow = (label: string, value: string, onPress: () => void, options?: any) => {
    const isPlaceholder = !value || value === "Select" || value === "Add";
    
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: RBZ.border,
        }}
      >
        <Text style={{
          fontSize: 16,
          color: RBZ.text,
          fontWeight: '500',
        }}>
          {label}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{
            fontSize: 16,
            color: isPlaceholder ? RBZ.muted : RBZ.text,
            maxWidth: 200,
            textAlign: 'right',
          }}>
            {isPlaceholder ? (value || "Select") : value}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={RBZ.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  // Render Section
  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <Text style={{
        fontSize: 20,
        fontWeight: '700',
        color: RBZ.text,
        marginBottom: 20,
      }}>
        {title}
      </Text>
      {children}
    </View>
  );

  // Render Field with Visibility
  const renderFieldWithVisibility = (
    label: string, 
    field: string, 
    value: any, 
    visibilityField?: string, 
    options?: string[]
  ) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: RBZ.border,
    }}>
      <TouchableOpacity
        onPress={() => {
          if (options) {
            setEditingField(field);
            setSelectOpen({
              field,
              title: label,
              options,
              value: toTitle(value),
            });
          } else {
            setTextOpen({
              field,
              title: label,
              value: asText(value),
              placeholder: `Enter ${label.toLowerCase()}`,
            });
          }
        }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{
          fontSize: 16,
          color: RBZ.text,
          fontWeight: '500',
        }}>
          {label}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{
            fontSize: 16,
            color: !value ? RBZ.muted : RBZ.text,
          }}>
            {toTitle(value) || "Select"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={RBZ.muted} />
        </View>
      </TouchableOpacity>
      
      {visibilityField && (
        <TouchableOpacity
          onPress={() => handleVisibilityToggle(visibilityField)}
          style={{
            marginLeft: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: getVisibilityColor((form as any)?.[visibilityField], RBZ) + '15',
          }}
        >
          <Ionicons
            name={
              getVisibilityLabel((form as any)?.[visibilityField]) === "Visible"
                ? "eye-outline"
                : "eye-off-outline"
            }
            size={18}
            color={getVisibilityColor((form as any)?.[visibilityField], RBZ)}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ padding: 16 }}>

            {/* ABOUT */}
        {renderSection("About", (
          <>
            <Text style={{
              fontSize: 16,
              color: RBZ.text,
              lineHeight: 24,
              marginBottom: 16,
            }}>
              {user?.bio ? user.bio : "Add a bio so people vibe with you."}
            </Text>
            <TouchableOpacity
              onPress={() => setEditTarget("bio")}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: RBZ.primary + '10',
              }}
            >
              <Ionicons name="create-outline" size={18} color={RBZ.primary} />
              <Text style={{
                fontSize: 16,
                color: RBZ.primary,
                fontWeight: '600',
              }}>
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
              <View>
                <Text style={{
                  fontSize: 14,
                  color: RBZ.muted,
                  marginBottom: 4,
                }}>
                  Up to 60 seconds
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: RBZ.success,
                  fontWeight: '500',
                }}>
                  {voiceUrl
                    ? `Saved duration: ${formatDuration(voiceDurationSec)}`
                    : "Boosts matches by 4x"}
                </Text>
              </View>

              {voiceUrl && (
                <TouchableOpacity
                  onPress={playVoice}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: RBZ.success + '15',
                  }}
                >
                  <Ionicons name={playing ? "pause" : "play"} size={14} color={RBZ.success} />
                  <Text style={{ fontSize: 12, color: RBZ.success, fontWeight: '600' }}>
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#ef4444',
                  }}
                >
                  <Ionicons name="stop" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600' }}>
                    Stop Recording
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={startRecording}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: voiceUrl ? RBZ.background : RBZ.primary,
                    borderWidth: voiceUrl ? 1 : 0,
                    borderColor: RBZ.border,
                  }}
                >
                  <Ionicons name="mic" size={20} color={voiceUrl ? RBZ.text : '#fff'} />
                  <Text style={{
                    fontSize: 16,
                    color: voiceUrl ? RBZ.text : '#fff',
                    fontWeight: '600',
                  }}>
                    {voiceUrl ? "Record Again" : "Record Intro"}
                  </Text>
                </TouchableOpacity>
              )}

              {voiceUrl && !recording && (
                <TouchableOpacity
                  onPress={deleteVoiceIntro}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#ef4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </>
        ))}

        {/* BASICS */}
        {renderSection("Basics", (
          <>
            {renderInfoRow("City", toTitle(form.city), () => {
              setEditingField("city");
              setSelectOpen({
                field: "city",
                title: "City",
                options: CITY_OPTIONS,
                value: toTitle(form.city),
              });
            })}
            
            {renderFieldWithVisibility("Gender", "gender", form.gender, "genderVisibility", GENDER_OPTIONS)}
            
            {renderFieldWithVisibility("Orientation", "orientation", form.orientation, "orientationVisibility", ORIENTATION_OPTIONS)}
            
            {renderInfoRow("Looking for", lookingForLabelFromValue(form.lookingFor), () => {
              setEditingField("lookingFor");
              setSelectOpen({
                field: "lookingFor",
                title: "Looking for",
                options: LOOKINGFOR_OPTIONS,
                value: lookingForLabelFromValue(form.lookingFor),
              });
            })}
            
            {renderInfoRow("Height", toTitle(form.height), () => {
              setEditingField("height");
              setHeightTemp(parseHeight(form.height));
            })}

    {age !== null && (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  }}>
    <Text style={{
      fontSize: 16,
      color: RBZ.text,
      fontWeight: '500',
    }}>
      Age
    </Text>
    <Text style={{
      fontSize: 16,
      color: RBZ.text,
      fontWeight: '600',
    }}>
      {age}
    </Text>
  </View>
)}
          </>
        ))}

        {/* IDENTITY */}
        {renderSection("Identity", (
          <>
            {renderInfoRow("Pronouns", toTitle(form.pronouns), () => {
              setEditingField("pronouns");
              setSelectOpen({
                field: "pronouns",
                title: "Pronouns",
                options: PRONOUN_OPTIONS,
                value: toTitle(form.pronouns),
              });
            })}
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
            }}>
 
              <TouchableOpacity
                onPress={() => handleVisibilityToggle("genderVisibility")}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: getVisibilityColor((form as any)?.genderVisibility, RBZ) + '15',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: getVisibilityColor((form as any)?.genderVisibility, RBZ),
                }}>
                  {getVisibilityLabel((form as any)?.genderVisibility)}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
            }}>
              <TouchableOpacity
                onPress={() => handleVisibilityToggle("orientationVisibility")}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: getVisibilityColor((form as any)?.orientationVisibility, RBZ) + '15',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: getVisibilityColor((form as any)?.orientationVisibility, RBZ),
                }}>
                  {getVisibilityLabel((form as any)?.orientationVisibility)}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ))}

        {/* LOCATION */}
        {renderSection("Location", (
          <>
            {renderInfoRow("Country", form.country, () => {
              setCountryQuery("");
              setCountryResults([]);
              setEditingField("country");
            })}
            
            {renderInfoRow("Hometown", toTitle((form as any)?.hometown), () => {
              setTextOpen({
                field: "hometown",
                title: "Hometown",
                value: asText((form as any)?.hometown),
                placeholder: "e.g., Chicago, IL",
              });
            })}
            
            {renderInfoRow("Travel mode", (form as any)?.travelMode ? "Active" : "Inactive", () => {
              setEditingField("travelMode");
              setSelectOpen({
                field: "travelMode",
                title: "Travel mode",
                options: ["Inactive", "Active"],
                value: (form as any)?.travelMode ? "Active" : "Inactive",
              });
            })}
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
            }}>
              <View>
                <Text style={{
                  fontSize: 16,
                  color: RBZ.text,
                  fontWeight: '500',
                  marginBottom: 4,
                }}>
                  Distance visibility
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: RBZ.muted,
                }}>
                  {getVisibilityLabel((form as any)?.distanceVisibility)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleVisibilityToggle("distanceVisibility")}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: getVisibilityColor((form as any)?.distanceVisibility, RBZ) + '15',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: getVisibilityColor((form as any)?.distanceVisibility, RBZ),
                }}>
                  {getVisibilityLabel((form as any)?.distanceVisibility)}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ))}

        {/* DATING */}
        {renderSection("Dating", (
          <>
            {renderInfoRow("Relationship style", toTitle((form as any)?.relationshipStyle), () => {
              setEditingField("relationshipStyle");
              setSelectOpen({
                field: "relationshipStyle",
                title: "Relationship style",
                options: RELATIONSHIP_STYLE_OPTIONS,
                value: toTitle((form as any)?.relationshipStyle),
              });
            })}
          </>
        ))}

        {/* BODY & BASICS */}
        {renderSection("Body & Basics", (
          <>
            {renderInfoRow("Body type", toTitle((form as any)?.bodyType), () => {
              setEditingField("bodyType");
              setSelectOpen({
                field: "bodyType",
                title: "Body type",
                options: BODY_TYPE_OPTIONS,
                value: toTitle((form as any)?.bodyType),
              });
            })}
            
            {renderInfoRow("Fitness level", toTitle((form as any)?.fitnessLevel), () => {
              setEditingField("fitnessLevel");
              setSelectOpen({
                field: "fitnessLevel",
                title: "Fitness level",
                options: FITNESS_LEVEL_OPTIONS,
                value: toTitle((form as any)?.fitnessLevel),
              });
            })}
          </>
        ))}

        {/* LIFESTYLE */}
        {renderSection("Lifestyle", (
          <>
            {renderInfoRow("Smoking", toTitle((form as any)?.smoking), () => {
              setEditingField("smoking");
              setSelectOpen({
                field: "smoking",
                title: "Smoking",
                options: SMOKING_OPTIONS,
                value: toTitle((form as any)?.smoking),
              });
            })}
            
            {renderInfoRow("Drinking", toTitle((form as any)?.drinking), () => {
              setEditingField("drinking");
              setSelectOpen({
                field: "drinking",
                title: "Drinking",
                options: DRINKING_OPTIONS,
                value: toTitle((form as any)?.drinking),
              });
            })}
            
            {renderInfoRow("Workout frequency", toTitle((form as any)?.workoutFrequency), () => {
              setEditingField("workoutFrequency");
              setSelectOpen({
                field: "workoutFrequency",
                title: "Workout frequency",
                options: WORKOUT_OPTIONS,
                value: toTitle((form as any)?.workoutFrequency),
              });
            })}
            
            {renderInfoRow("Diet", toTitle((form as any)?.diet), () => {
              setEditingField("diet");
              setSelectOpen({
                field: "diet",
                title: "Diet",
                options: DIET_OPTIONS,
                value: toTitle((form as any)?.diet),
              });
            })}
            
            {renderInfoRow("Sleep schedule", toTitle((form as any)?.sleepSchedule), () => {
              setEditingField("sleepSchedule");
              setSelectOpen({
                field: "sleepSchedule",
                title: "Sleep schedule",
                options: SLEEP_OPTIONS,
                value: toTitle((form as any)?.sleepSchedule),
              });
            })}
          </>
        ))}

        {/* BACKGROUND */}
        {renderSection("Background", (
          <>
            {renderInfoRow("Education level", toTitle((form as any)?.educationLevel), () => {
              setEditingField("educationLevel");
              setSelectOpen({
                field: "educationLevel",
                title: "Education level",
                options: EDUCATION_OPTIONS,
                value: toTitle((form as any)?.educationLevel),
              });
            })}
            
            {renderInfoRow("School", toTitle((form as any)?.school), () => {
              setTextOpen({
                field: "school",
                title: "School / University",
                value: asText((form as any)?.school),
                placeholder: "e.g., UCLA",
              });
            })}
            
            {renderInfoRow("Job title", toTitle((form as any)?.jobTitle), () => {
              setTextOpen({
                field: "jobTitle",
                title: "Job title",
                value: asText((form as any)?.jobTitle),
                placeholder: "e.g., Software Engineer",
              });
            })}
            
            {renderInfoRow("Company", toTitle((form as any)?.company), () => {
              setTextOpen({
                field: "company",
                title: "Company / Workplace",
                value: asText((form as any)?.company),
                placeholder: "e.g., Google",
              });
            })}
            
            {renderInfoRow("Languages", asCommaText((form as any)?.languages), () => {
              setTextOpen({
                field: "languages",
                title: "Languages (comma separated)",
                value: asCommaText((form as any)?.languages),
                placeholder: "e.g., English, Spanish",
                asArray: true,
              });
            })}
          </>
        ))}

        {/* BELIEFS */}
        {renderSection("Beliefs", (
          <>
            {renderInfoRow("Religion", toTitle((form as any)?.religion), () => {
              setTextOpen({
                field: "religion",
                title: "Religion",
                value: asText((form as any)?.religion),
                placeholder: "Optional",
              });
            })}
            
            {renderInfoRow("Political views", toTitle((form as any)?.politicalViews), () => {
              setTextOpen({
                field: "politicalViews",
                title: "Political views",
                value: asText((form as any)?.politicalViews),
                placeholder: "Optional",
              });
            })}
            
            {renderInfoRow("Zodiac", toTitle((form as any)?.zodiac), () => {
              setTextOpen({
                field: "zodiac",
                title: "Zodiac sign",
                value: asText((form as any)?.zodiac),
                placeholder: "e.g., Leo",
              });
            })}
          </>
        ))}

        {/* FAVORITES */}
        {renderSection("Favorites", (
          <>
            {renderInfoRow("Favorite music", asCommaText((form as any)?.favoriteMusic), () => {
              setTextOpen({
                field: "favoriteMusic",
                title: "Favorite music genres",
                value: asCommaText((form as any)?.favoriteMusic),
                placeholder: "e.g., Hip-hop, Pop",
                asArray: true,
              });
            })}
            
            {renderInfoRow("Favorite movies/shows", asCommaText((form as any)?.favoriteMovies), () => {
              setTextOpen({
                field: "favoriteMovies",
                title: "Favorite movies/shows",
                value: asCommaText((form as any)?.favoriteMovies),
                placeholder: "e.g., Breaking Bad, Interstellar",
                asArray: true,
              });
            })}
            
            {renderInfoRow("Travel style", toTitle((form as any)?.travelStyle), () => {
              setTextOpen({
                field: "travelStyle",
                title: "Travel style",
                value: asText((form as any)?.travelStyle),
                placeholder: "e.g., Road trips, Luxury, Backpacking",
              });
            })}
            
            {renderInfoRow("Pets preference", toTitle((form as any)?.petsPreference), () => {
              setEditingField("petsPreference");
              setSelectOpen({
                field: "petsPreference",
                title: "Pets preference",
                options: PETS_OPTIONS,
                value: toTitle((form as any)?.petsPreference),
              });
            })}
          </>
        ))}

        {/* VIBE */}
      {renderSection("Vibe", (
        
       <>
       {/* LIKES & DISLIKES — CHIP MULTI PICKER */}
{(editingField === "likes" || editingField === "dislikes") && (
  <View style={{ marginTop: 16 }}>
    <Text style={{
      fontSize: 16,
      fontWeight: "600",
      color: RBZ.text,
      marginBottom: 12,
    }}>
      {editingField === "likes" ? "Select Likes (max 10)" : "Select Dislikes (max 10)"}
    </Text>

    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {(editingField === "likes" ? LIKE_OPTIONS : DISLIKE_OPTIONS).map((x: string) => {
        const selected = safeArray(
          editingField === "likes" ? form.likes : form.dislikes
        ).includes(x);

        return (
          <TouchableOpacity
            key={x}
            onPress={() => {
              setForm((p: any) => {
                const key = editingField!;
                const arr = safeArray(p[key]);
                const idx = arr.indexOf(x);

                if (idx >= 0) arr.splice(idx, 1);
                else {
                  if (arr.length >= 10) return p;
                  arr.push(x);
                }

                return { ...p, [key]: arr };
              });
            }}
          style={{
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: selected
    ? (editingField === "likes" ? "#d8345f30" : "#b5179e30")
    : RBZ.border,
  backgroundColor: selected
    ? (editingField === "likes" ? "#d8345f15" : "#b5179e15")
    : "#fff",
  }}

          >
           <Text
  style={{
    fontSize: 14,
    color: selected
      ? editingField === "likes"
        ? "#d8345f"
        : "#b5179e"
      : RBZ.text,
    fontWeight: selected ? "600" : "400",
  }}
  >

              {x}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>

    <TouchableOpacity
      onPress={() => {
        const field = editingField!;
        saveSingleField({ [field]: safeArray(form[field]) });
        setEditingField(null);
      }}
      style={{
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: RBZ.primary,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
        Save
      </Text>
    </TouchableOpacity>
  </View>
  )}

        {renderInfoRow(
          "Vibe tags",
          safeVibeTags.length ? safeVibeTags.join(", ") : "Add",
          () => {
            setSelectOpen({
              field: "vibeTags",
              title: "Vibe tags",
              options: [
                "Chill", "Romantic", "Funny", "Introvert", "Ambivert", "Extrovert",
                "Deep thinker", "Spontaneous", "Calm", "Chaotic good"
              ],
              value: safeVibeTags,
              multi: true,
            });
          }
        )}

     {/* Likes / Dislikes */}
       <View style={{ marginTop: 24 }}>
          {/* LIKES */}
          <Text
            style={{
              fontSize: 16,
              color: RBZ.text,
              fontWeight: "500",
              marginBottom: 12,
            }}
          >
            Likes
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(Array.isArray(form.likes) ? form.likes : []).slice(0, 10).map((x: string) => (
              <View
                key={x}
                style={{
                  backgroundColor: "#d8345f15",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#d8345f30",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#d8345f",
                    fontWeight: "500",
                  }}
                >
                  {x}
                </Text>
              </View>
            ))}

            {(!form.likes || form.likes.length === 0) && (
              <Text style={{ color: RBZ.muted, fontStyle: "italic" }}>
                No likes added yet
              </Text>
            )}
          </View>

     <TouchableOpacity
  onPress={() => {
    setEditingField("likes");
  }}


            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: RBZ.background,
              borderWidth: 1,
              borderColor: RBZ.border,
              marginTop: 16,
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color={RBZ.text} />
            <Text style={{ fontSize: 16, color: RBZ.text, fontWeight: "600" }}>
              Edit Likes
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 32 }}>
          {/* DISLIKES */}
          <Text
            style={{
              fontSize: 16,
              color: RBZ.text,
              fontWeight: "500",
              marginBottom: 12,
            }}
          >
            Dislikes
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(Array.isArray(form.dislikes) ? form.dislikes : []).slice(0, 10).map((x: string) => (
              <View
                key={x}
                style={{
                  backgroundColor: "#b5179e15",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#b5179e30",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#b5179e",
                    fontWeight: "500",
                  }}
                >
                  {x}
                </Text>
              </View>
            ))}

            {(!form.dislikes || form.dislikes.length === 0) && (
              <Text style={{ color: RBZ.muted, fontStyle: "italic" }}>
                No dislikes added yet
              </Text>
            )}
          </View>

        <TouchableOpacity
  onPress={() => {
    setEditingField("dislikes");
  }}

            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: RBZ.background,
              borderWidth: 1,
              borderColor: RBZ.border,
              marginTop: 16,
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color={RBZ.text} />
            <Text style={{ fontSize: 16, color: RBZ.text, fontWeight: "600" }}>
              Edit Dislikes
            </Text>
          </TouchableOpacity>
        </View>
          </>
        ))}

        {/* INTERESTS */}
        {renderSection("Interests & Hobbies", (
          <>
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                color: RBZ.text,
                fontWeight: '500',
                marginBottom: 12,
              }}>
                Interests
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(Array.isArray(user?.interests) ? user.interests : []).slice(0, 10).map((x: string) => (
                  <View key={x} style={{
                    backgroundColor: '#d8345f15',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#d8345f30',
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: '#d8345f',
                      fontWeight: '500',
                    }}>
                      {x}
                    </Text>
                  </View>
                ))}
                {(!user?.interests || user.interests?.length === 0) && (
                  <Text style={{ color: RBZ.muted, fontStyle: 'italic' }}>
                    No interests added yet
                  </Text>
                )}
              </View>
            </View>
            
            <View>
              <Text style={{
                fontSize: 16,
                color: RBZ.text,
                fontWeight: '500',
                marginBottom: 12,
              }}>
                Hobbies
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(Array.isArray(user?.hobbies) ? user.hobbies : []).slice(0, 10).map((x: string) => (
                  <View key={x} style={{
                    backgroundColor: '#b5179e15',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#b5179e30',
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: '#b5179e',
                      fontWeight: '500',
                    }}>
                      {x}
                    </Text>
                  </View>
                ))}
                {(!user?.hobbies || user.hobbies?.length === 0) && (
                  <Text style={{ color: RBZ.muted, fontStyle: 'italic' }}>
                    No hobbies added yet
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => setEditTarget("interests")}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: RBZ.background,
                borderWidth: 1,
                borderColor: RBZ.border,
                marginTop: 20,
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={RBZ.text} />
              <Text style={{
                fontSize: 16,
                color: RBZ.text,
                fontWeight: '600',
              }}>
                Edit Interests & Hobbies
              </Text>
            </TouchableOpacity>
          </>
        ))}
      </View>

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
                <TextInput
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  placeholder="Search city worldwide..."
                  placeholderTextColor={RBZ.muted}
                  autoCorrect={false}
                  style={{
                    height: 48,
                    borderWidth: 1,
                    borderColor: RBZ.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    marginBottom: 12,
                    backgroundColor: '#f8f9fa',
                  }}
                />
                {cityLoading && (
                  <View style={{ paddingVertical: 10 }}>
                    <ActivityIndicator color={RBZ.primary} />
                  </View>
                )}
              </>
            )}

            <ScrollView style={{ maxHeight: 400 }}>
              {(
                selectOpen?.field === "city"
                  ? (cityQuery.trim().length >= 3 ? cityResults : (selectOpen?.options || []))
                  : (selectOpen?.options || [])
              ).map((opt: string) => {
                const active = opt === selectOpen?.value;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() =>
                      setSelectOpen((p: any) => (p ? { ...p, value: opt } : p))
                    }
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 4,
                      borderBottomWidth: 1,
                      borderBottomColor: RBZ.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: active ? RBZ.primary : RBZ.text,
                      fontWeight: active ? '600' : '400',
                    }}>
                      {opt}
                    </Text>
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
                  const value = field === "lookingFor"
                    ? rawValue === "Long-term" ? "serious" :
                      rawValue === "Casual" ? "casual" :
                      rawValue === "Friends" ? "friends" :
                      rawValue === "GymBuddy" ? "gymbuddy" : rawValue
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