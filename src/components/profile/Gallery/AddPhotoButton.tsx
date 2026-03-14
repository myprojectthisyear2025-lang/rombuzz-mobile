import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

export default function AddPhotoButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Ionicons name="add-circle" size={18} color="#d8345f" />
      <Text style={styles.text}>Add Photo</Text>
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
    backgroundColor: "rgba(216,52,95,0.08)",
  },
  text: { fontWeight: "800", color: "#d8345f" },
});
