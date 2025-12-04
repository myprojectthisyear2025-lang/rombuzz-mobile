/**
 * ============================================================
 * 📁 File: app/(tabs)/index.tsx
 * 🎯 Purpose: RomBuzz Mobile Home Screen Placeholder
 * This is the first screen users see inside the tab navigator.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RomBuzz Mobile</Text>
      <Text style={styles.subtitle}>Android + iOS</Text>
      <Text style={styles.text}>Let’s build this 🔥</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#888',
  },
});
