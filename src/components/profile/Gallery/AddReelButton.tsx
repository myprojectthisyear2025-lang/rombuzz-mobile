import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

export default function AddReelButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Ionicons name="add-circle" size={18} color="#b5179e" />
      <Text style={styles.text}>Add Reel</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(181,23,158,0.08)",
  },
  text: { fontWeight: "800", color: "#b5179e" },
});
