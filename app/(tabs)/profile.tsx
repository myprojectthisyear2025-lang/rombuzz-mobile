/**
 * ============================================================
 * 📁 File: app/(tabs)/profile.tsx
 * 🎯 Purpose: RomBuzz Mobile Profile Screen + Upgrade UI
 * This screen shows basic profile info and upgrade button.
 * ============================================================
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>

      {/* 👤 PROFILE HEADER */}
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.subtext}>Welcome to RomBuzz Mobile</Text>

      {/* 👑 UPGRADE SECTION */}
      <View style={styles.upgradeBox}>
        <Text style={styles.upgradeTitle}>RomBuzz+</Text>
        <Text style={styles.upgradeSubtitle}>Unlock premium features</Text>

        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
  },

  subtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },

  upgradeBox: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff8e7',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffe4a3',
  },

  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d4a000',
  },

  upgradeSubtitle: {
    fontSize: 14,
    color: '#b89500',
    marginBottom: 15,
  },

  upgradeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ffcc00',
    borderRadius: 10,
  },

  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
