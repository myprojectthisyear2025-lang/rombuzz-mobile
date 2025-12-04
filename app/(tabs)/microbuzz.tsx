/**
 * ============================================================
 * 📁 File: app/(tabs)/microbuzz.tsx
 * 🎯 Purpose: MicroBuzz Screen (placeholder)
 * This will later become the selfie + live radar connection flow.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';

export default function MicroBuzzScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MicroBuzz</Text>
      <Text style={styles.subtitle}>Real-time Radar • Nearby Buzz</Text>
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
