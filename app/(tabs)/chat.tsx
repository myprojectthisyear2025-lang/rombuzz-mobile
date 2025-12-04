/**
 * ============================================================
 * 📁 File: app/(tabs)/chat.tsx
 * 🎯 Purpose: RomBuzz Chat List Screen (placeholder)
 * This will later show chat rooms, unread counts, and active users.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.subtitle}>Messages • Online Users</Text>
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
