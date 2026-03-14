import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

const RBZ = {
  c2: "#d8345f",
  c4: "#b5179e",
  white: "#fff",
  ink: "#111827",
};

export default function GalleryTabs({
  active,
  onChange,
  photosCount,
  reelsCount,
}: {
  active: "photos" | "reels";
  onChange: (v: "photos" | "reels") => void;
  photosCount: number;
  reelsCount: number;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange("photos")}
        style={[styles.btn, active === "photos" && { backgroundColor: RBZ.c2 }]}
      >
        <Ionicons
          name="images"
          size={16}
          color={active === "photos" ? RBZ.white : RBZ.c2}
        />
        <Text style={[styles.text, active === "photos" && { color: RBZ.white }]}>
          Photos ({photosCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("reels")}
        style={[styles.btn, active === "reels" && { backgroundColor: RBZ.c4 }]}
      >
        <Ionicons
          name="videocam"
          size={16}
          color={active === "reels" ? RBZ.white : RBZ.c4}
        />
        <Text style={[styles.text, active === "reels" && { color: RBZ.white }]}>
          Reels ({reelsCount})
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  text: { fontWeight: "800", color: RBZ.ink },
});
