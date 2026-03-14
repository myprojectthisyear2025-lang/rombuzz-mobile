import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";

export default function PhotoGrid({
  items,
  onOpen,
  size,
}: {
  items: any[];
  onOpen: (m: any) => void;
  size: number;
}) {

return (
 <FlatList
  data={items}
  keyExtractor={(item, index) => String(item?.id ?? item?.url ?? index)}
  numColumns={3}
  scrollEnabled={false}
  showsVerticalScrollIndicator={false}
    columnWrapperStyle={{ gap: 8 }}
    contentContainerStyle={{ gap: 8, paddingTop: 10 }}
    removeClippedSubviews
    initialNumToRender={12}
    windowSize={7}
    maxToRenderPerBatch={12}
    updateCellsBatchingPeriod={50}
    getItemLayout={(_, index) => {
      // each row is size + gap (8)
      const row = Math.floor(index / 3);
      const length = size + 8;
      return { length, offset: row * length, index };
    }}
    renderItem={({ item }) => (
      <Pressable
        onPress={() => onOpen(item)}
        style={[styles.item, { width: size, height: size }]}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.img}
          resizeMode="cover"
          fadeDuration={0} // android: avoids extra fade work
        />

        <View style={styles.visibilityBadge}>
       <Ionicons
  name={
    item.caption?.includes("scope:matches")
      ? "people"
      : item.caption?.includes("scope:private")
      ? "lock-closed"
      : "globe"
  }
  size={12}
  color="#fff"
/>

        </View>
      </Pressable>
    )}
  />
);
}



const styles = StyleSheet.create({

// AFTER
item: {
  aspectRatio: 1,
  borderRadius: 14,
  overflow: "hidden",
  backgroundColor: "#f1f1f1",
},

  img: { width: "100%", height: "100%" },
  visibilityBadge: {
  position: "absolute",
  bottom: 6,
  right: 6,
  backgroundColor: "rgba(0,0,0,0.65)",
  borderRadius: 999,
  padding: 6,
},

});

