/**
 * ============================================================
 * 📁 File: app/(tabs)/discover.tsx
 * 🎯 Purpose: RomBuzz Discover Screen (placeholder)
 * This will later become the swipe/discover matching page.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.subtitle}>Matches • Swiping • Recommendations</Text>
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
