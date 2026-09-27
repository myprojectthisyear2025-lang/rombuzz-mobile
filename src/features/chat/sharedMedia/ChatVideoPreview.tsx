import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { diagnosticImage } from "@/src/performance/diagnostics/media";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import type { ChatMediaRow } from "../mediaHub/chatMediaRows";
import { chatVideoThumbnail } from "./chatVideoPreviewSource";

const PreviewImage = diagnosticImage("shared-media-video-preview");
export default function ChatVideoPreview({ item }: { item: ChatMediaRow }) {
  const { colors } = useRomBuzzTheme();
  const uri = chatVideoThumbnail(item);
  const [failed, setFailed] = useState("");
  return (
    <View style={[styles.frame, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name="play-circle-outline" size={32} color={colors.textMuted} />
      {uri && failed !== uri ? <PreviewImage source={{ uri }} style={StyleSheet.absoluteFillObject}
        resizeMode="cover" resizeMethod="resize" fadeDuration={0} onError={() => setFailed(uri)} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({ frame: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" } });
