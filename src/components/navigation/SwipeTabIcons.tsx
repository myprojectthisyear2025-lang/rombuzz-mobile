import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function SwipeTabIcons({
  routes,
  onPress,
}: {
  routes: string[];
  onPress: (route: string) => void;
}) {
  return (
    <View style={styles.page}>
      {routes.map((r) => (
        <TouchableOpacity
          key={r}
          onPress={() => onPress(r)}
          style={styles.iconWrap}
        >
          <Ionicons
            name="heart"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d8345f",
  },
});
