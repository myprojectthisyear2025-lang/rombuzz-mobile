/**
 * ============================================================
 * 📁 File: app/(tabs)/notifications.tsx
 * 🎯 Purpose: RomBuzz Notifications Screen (placeholder)
 * This will later show likes, comments, matches, and alerts.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Likes • Comments • Matches • Alerts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
});
