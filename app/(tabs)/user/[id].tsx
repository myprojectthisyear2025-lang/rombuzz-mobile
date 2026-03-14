/**
 * ============================================================
 * 📁 File: app/(tabs)/user/[id].tsx
 * 🎯 Purpose: RomBuzz Mobile — ViewProfile (Other User)
 *
 * SOURCE OF TRUTH:
 *  - Always loads profile by `id` from route params
 *  - NO preview cache (prevents wrong-user rendering)
 *
 * Backend (best-effort, unchanged):
 *  - GET `${API_BASE}/users/:id`
 *  - fallback → GET `${API_BASE}/profile/:id`
 *
 * ============================================================
 */

import { API_BASE } from "@/src/config/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

/* 🎨 RomBuzz Colors */
const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  black: "#0b0b10",
  gray: "#6b7280",
  soft: "#f7f7fb",
} as const;

/* ===================== HELPERS ===================== */

function computeAge(dob: any) {
  if (!dob) return null;
  try {
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

/* ===================== SCREEN ===================== */

export default function ViewUserProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const id = String(params?.id || "");

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  /* ===================== LOAD PROFILE ===================== */

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      // 🔑 reset state on every id change
      setUser(null);
      setError("");
      setLoading(true);

      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        const headers = { Authorization: `Bearer ${token || ""}` };

        const tryUrls = [
          `${API_BASE}/users/${id}`,
          `${API_BASE}/profile/${id}`,
        ];

        let found: any = null;

        for (const url of tryUrls) {
          const res = await fetch(url, { headers });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            found = data?.user || data?.profile || data;
            break;
          }
        }

        if (!found) throw new Error("Profile not accessible");

        setUser(found);
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const age = computeAge(user?.dob);

  const hero =
    (Array.isArray(user?.media) && user.media[0]) ||
    user?.avatar ||
    "https://picsum.photos/800/1000";

  /* ===================== UI ===================== */

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={RBZ.white} />
        </Pressable>

        <View style={{ paddingLeft: 50 }}>
          <Text style={styles.title}>
            {(user?.firstName || "Profile") + (age ? `, ${age}` : "")}
          </Text>
          <Text style={styles.sub}>
            {user?.city ? String(user.city) : "RomBuzz"}
          </Text>
        </View>
      </LinearGradient>

      {/* States */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={RBZ.c3} />
          <Text style={styles.centerText}>Loading profile…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={26} color={RBZ.c3} />
          <Text style={styles.errTitle}>Can’t open profile</Text>
          <Text style={styles.errSub}>{error}</Text>
          <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero */}
          <View style={styles.heroWrap}>
            <Image source={{ uri: hero }} style={styles.hero} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.85)"]}
              style={styles.heroShade}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>
                {user?.firstName || "Someone"}{" "}
                {user?.lastName ? String(user.lastName) : ""}
                {age ? ` • ${age}` : ""}
              </Text>
              {user?.orientation && (
                <Text style={styles.heroSub}>
                  {String(user.orientation)}
                </Text>
              )}
            </View>
          </View>

          {/* Interests */}
          {Array.isArray(user?.interests) && user.interests.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Interests</Text>
              <View style={styles.chipsRow}>
                {user.interests.slice(0, 12).map((x: any, idx: number) => (
                  <View key={`${x}-${idx}`} style={styles.chip}>
                    <Text style={styles.chipText}>{String(x)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Hobbies */}
          {Array.isArray(user?.hobbies) && user.hobbies.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Hobbies</Text>
              <View style={styles.chipsRow}>
                {user.hobbies.slice(0, 12).map((x: any, idx: number) => (
                  <View key={`${x}-${idx}`} style={styles.chipAlt}>
                    <Text style={styles.chipTextAlt}>{String(x)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Gallery */}
          {Array.isArray(user?.media) && user.media.length > 1 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Gallery</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {user.media.slice(0, 12).map((uri: any, idx: number) => (
                  <Image
                    key={`${uri}-${idx}`}
                    source={{ uri: String(uri) }}
                    style={styles.galleryImg}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RBZ.soft },

  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 54,
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: RBZ.white, fontSize: 18, fontWeight: "900" },
  sub: { color: "rgba(255,255,255,0.86)", marginTop: 2, fontWeight: "700" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    gap: 10,
  },
  centerText: { color: RBZ.gray, fontWeight: "700" },

  errTitle: {
    color: RBZ.black,
    fontWeight: "900",
    fontSize: 18,
    marginTop: 4,
  },
  errSub: {
    color: RBZ.gray,
    fontWeight: "700",
    textAlign: "center",
  },

  primaryBtn: {
    marginTop: 8,
    backgroundColor: RBZ.c1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryBtnText: { color: RBZ.white, fontWeight: "900" },

  heroWrap: {
    marginTop: 14,
    marginHorizontal: 14,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  hero: { width: "100%", height: 420 },
  heroShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  heroInfo: { position: "absolute", left: 16, right: 16, bottom: 16 },
  heroName: { color: RBZ.white, fontSize: 22, fontWeight: "900" },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    marginTop: 6,
  },

  block: {
    marginTop: 14,
    marginHorizontal: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  blockTitle: {
    color: RBZ.c1,
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 12,
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(233,72,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.22)",
  },
  chipText: { color: RBZ.c1, fontWeight: "900" },

  chipAlt: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(181,23,158,0.12)",
    borderWidth: 1,
    borderColor: "rgba(181,23,158,0.22)",
  },
  chipTextAlt: { color: RBZ.c4, fontWeight: "900" },

  galleryImg: {
    width: Math.min(160, width * 0.42),
    height: 200,
    borderRadius: 18,
    backgroundColor: "#eee",
  },
});
