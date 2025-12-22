/**
 * ============================================================================
 * 📁 File: app/(tabs)/profile.tsx
 * 🎯 RomBuzz Mobile — Profile Screen (Complete)
 *
 * Shows user profile with completion ring and upgrade options
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState(0.55);

  useEffect(() => {
    // Load user data (simulated)
    setTimeout(() => {
      setUserData({
        name: "Alex Johnson",
        age: 28,
        location: "New York",
        bio: "Coffee enthusiast. Adventure seeker. Always up for a good conversation.",
      });
      setProfileCompletion(0.75);
    }, 500);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Gradient */}
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Profile</Text>
        <Text style={styles.headerSubtitle}>Welcome to your RomBuzz world</Text>
      </LinearGradient>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Avatar with completion ring */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.completionRing,
              { borderWidth: Math.max(2, Math.floor(profileCompletion * 4)) },
            ]}
          >
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1494790108755-2616b786d4d1?w=400&auto=format&fit=crop" }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.completionBadge}>
            <Text style={styles.completionText}>
              {Math.round(profileCompletion * 100)}% complete
            </Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {userData?.name || "Loading..."}
          </Text>
          <Text style={styles.userDetails}>
            {userData?.age} • {userData?.location || "Location"}
          </Text>
          <Text style={styles.userBio}>
            {userData?.bio || "Add a bio to tell others about yourself"}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>128</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>Buzz</Text>
          </View>
        </View>
      </View>

      {/* 👑 UPGRADE SECTION */}
      <View style={styles.upgradeBox}>
        <View style={styles.upgradeHeader}>
          <Ionicons name="diamond" size={24} color="#d4a000" />
          <Text style={styles.upgradeTitle}>RomBuzz+</Text>
        </View>
        <Text style={styles.upgradeSubtitle}>
          Unlock premium features and get seen more
        </Text>

        <View style={styles.upgradeFeatures}>
          <Feature text="Priority in Discover" />
          <Feature text="Unlimited rewinds" />
          <Feature text="See who liked you" />
          <Feature text="Advanced filters" />
        </View>

        <Pressable
          style={styles.upgradeButton}
          onPress={() => router.push("/upgrade")}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <SettingItem icon="settings-outline" label="Account Settings" />
        <SettingItem icon="notifications-outline" label="Notifications" />
        <SettingItem icon="lock-closed-outline" label="Privacy" />
        <SettingItem icon="help-circle-outline" label="Help & Support" />
        <SettingItem icon="log-out-outline" label="Log Out" isLast />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function SettingItem({ 
  icon, 
  label, 
  isLast = false 
}: { 
  icon: string; 
  label: string; 
  isLast?: boolean 
}) {
  return (
    <Pressable style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={22} color={RBZ.c1} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={RBZ.gray} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RBZ.light,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: RBZ.white,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fde2e4",
    opacity: 0.9,
  },
  profileCard: {
    backgroundColor: RBZ.white,
    margin: 16,
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  completionRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: RBZ.c3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: RBZ.white,
  },
  completionBadge: {
    backgroundColor: RBZ.c2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  completionText: {
    color: RBZ.white,
    fontSize: 11,
    fontWeight: "700",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: RBZ.c1,
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: RBZ.gray,
    marginBottom: 12,
  },
  userBio: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    width: "100%",
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
  upgradeBox: {
    margin: 16,
    padding: 20,
    backgroundColor: "#fff8e7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffe4a3",
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#d4a000",
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: "#b89500",
    marginBottom: 16,
  },
  upgradeFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffcc00",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#78350f",
  },
  settingsSection: {
    backgroundColor: RBZ.white,
    margin: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.c1,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },
});