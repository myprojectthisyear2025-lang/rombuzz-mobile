/**
 * ============================================================
 * 📁 File: src/components/story/StoryViewer.tsx
 * 🎯 Purpose: Instagram-style fullscreen Story Viewer (RomBuzz)
 *
 * Features:
 *  - Fullscreen modal
 *  - Auto-progress timer
 *  - Tap left / right to navigate
 *  - Image / Video / Text stories
 *  - Marks stories as viewed
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal, PanResponder, Pressable,
  SafeAreaView,
  Text,
  View
} from "react-native";

import { API_BASE } from "@/src/config/api";

const { width, height } = Dimensions.get("window");

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#fff",
};

type Props = {
  stories: any[];
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  } | null;
  onClose: () => void;
};


export default function StoryViewer({ stories, owner, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);

const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const story = stories[index] ?? null;
const ownerName =
  `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() || "User";


const pan = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
    onPanResponderRelease: (_, g) => {
      if (g.dy > 120) {
        onClose();
      }
    },
  })
).current;

  // ---------------------------
  // Mark story as viewed
  // ---------------------------
  const markViewed = async (id: string) => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      if (!token) return;

      await fetch(`${API_BASE}/stories/${id}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {}
  };

  // ---------------------------
  // Auto progress
  // ---------------------------
  useEffect(() => {
    if (!story) return;

markViewed(story.id || story._id);

    const duration =
      story.type === "video" ? 8000 : 5000; // ms

    timerRef.current = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index]);


  // ---------------------------
  // Navigation
  // ---------------------------
  const goNext = () => {
    if (index < stories.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  // ---------------------------
  // Render content
  // ---------------------------
  const renderStory = () => {
    if (story.type === "image") {
      return (
        <Image
          source={{ uri: story.mediaUrl }}
          style={{ width, height }}
          resizeMode="cover"
        />
      );
    }

    if (story.type === "video") {
      return (
      <Video
          source={{ uri: story.mediaUrl }}
          style={{ width, height }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted={muted}
          isLooping={false}
        />

      );
    }

    // TEXT STORY
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: RBZ.c1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: RBZ.white,
            fontSize: 32,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {story.text}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible transparent animationType="fade">
<SafeAreaView
  {...pan.panHandlers}
  style={{ flex: 1, backgroundColor: "#000" }}
>
   {/* Story */}
{!story ? (
  <View style={{ flex: 1, backgroundColor: "#000" }} />
) : (
  renderStory()
)}

        {/* Tap zones */}
       <Pressable
  style={{ position: "absolute", left: 0, top: 0, width: width / 2, height }}
  onPress={goPrev}
  onLongPress={() => timerRef.current && clearTimeout(timerRef.current)}
  onPressOut={() => setIndex((i) => i)}
/>

<Pressable
  style={{ position: "absolute", right: 0, top: 0, width: width / 2, height }}
  onPress={goNext}
  onLongPress={() => timerRef.current && clearTimeout(timerRef.current)}
  onPressOut={() => setIndex((i) => i)}
/>


        {/* Top bar */}
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            right: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Progress */}
        <View style={{ flex: 1 }}>
  {/* Progress bar */}
  <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
    {stories.map((_: any, i: number) => (
      <View
        key={i}
        style={{
          flex: 1,
          height: 3,
          backgroundColor:
            i <= index ? RBZ.white : "rgba(255,255,255,0.3)",
          borderRadius: 3,
        }}
      />
    ))}
  </View>

  {/* Owner avatar + name (clickable) */}
<Pressable
  onPress={() => {
    Alert.alert("View Profile", "Profile page coming soon!");
  }}
  style={{
    flexDirection: "row",
    alignItems: "center",
  }}
>
  {/* Avatar */}
  {owner?.avatar ? (
    <Image
      source={{ uri: owner.avatar }}
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
      }}
    />
  ) : (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        marginRight: 8,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="person" size={12} color={RBZ.white} />
    </View>
  )}

  {/* Name */}
  <Text
    style={{
      color: RBZ.white,
      fontSize: 15,
      fontWeight: "700",
    }}
    numberOfLines={1}
  >
    {ownerName}
  </Text>
</Pressable>

</View>

{/* Close button */}
<Pressable onPress={onClose} style={{ marginLeft: 12 }}>
  <Ionicons name="close" size={28} color={RBZ.white} />
</Pressable>

        </View>
      </SafeAreaView>
    </Modal>
  );
}
