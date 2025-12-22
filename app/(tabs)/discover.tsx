/**
 * ============================================================
 * 📁 File: app/(tabs)/discover.tsx
 * 🎯 Purpose: RomBuzz Discover Screen - Swipe Matching
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
} as const;

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "nearby", label: "Nearby" },
    { id: "online", label: "Online" },
    { id: "verified", label: "Verified" },
    { id: "new", label: "New" },
  ];

  const profiles = [
    {
      id: 1,
      name: "Alexandra",
      age: 26,
      distance: "2 km away",
      bio: "Coffee lover • Adventure seeker • Dog mom",
      image: "https://images.unsplash.com/photo-1494790108755-2616b786d4d1?w=400&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Michael",
      age: 29,
      distance: "5 km away",
      bio: "Photographer • Traveler • Foodie",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
    },
    {
      id: 3,
      name: "Sophia",
      age: 24,
      distance: "3 km away",
      bio: "Artist • Yoga enthusiast • Bookworm",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4]}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={RBZ.white} />
        </Pressable>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find your perfect match</Text>
      </LinearGradient>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterChip,
              activeFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Profiles Grid */}
      <ScrollView style={styles.profilesContainer}>
        <View style={styles.profilesGrid}>
          {profiles.map((profile) => (
            <Pressable key={profile.id} style={styles.profileCard}>
              <Image source={{ uri: profile.image }} style={styles.profileImage} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.profileOverlay}
              >
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {profile.name}, {profile.age}
                  </Text>
                  <Text style={styles.profileDistance}>{profile.distance}</Text>
                  <Text style={styles.profileBio}>{profile.bio}</Text>
                </View>
              </LinearGradient>
              
              {/* Action Buttons */}
              <View style={styles.profileActions}>
                <Pressable style={[styles.actionButton, styles.passButton]}>
                  <Ionicons name="close" size={24} color={RBZ.white} />
                </Pressable>
                <Pressable style={[styles.actionButton, styles.likeButton]}>
                  <Ionicons name="heart" size={24} color={RBZ.white} />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Discover Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>128</Text>
              <Text style={styles.statLabel}>Viewed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Liked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>18</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RBZ.light,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: RBZ.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#fde2e4",
    opacity: 0.9,
  },
  filtersContainer: {
    backgroundColor: RBZ.white,
    paddingVertical: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: RBZ.c1,
    borderColor: RBZ.c1,
  },
  filterText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  filterTextActive: {
    color: RBZ.white,
  },
  profilesContainer: {
    flex: 1,
    padding: 16,
  },
  profilesGrid: {
    gap: 16,
  },
  profileCard: {
    height: 400,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    padding: 16,
    justifyContent: "flex-end",
  },
  profileInfo: {
    gap: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: RBZ.white,
  },
  profileDistance: {
    fontSize: 14,
    color: RBZ.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: RBZ.white,
    opacity: 0.9,
  },
  profileActions: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  passButton: {
    backgroundColor: "#6b7280",
  },
  likeButton: {
    backgroundColor: RBZ.c3,
  },
  statsCard: {
    backgroundColor: RBZ.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.c1,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: RBZ.c1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: RBZ.gray,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
});