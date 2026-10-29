/** Image-only chat video thumbnail; never starts a native player or downloads video segments. */
import { chatVideoThumbnail } from "@/src/features/chat/sharedMedia/chatVideoPreviewSource";
import { chatVideoUri } from "@/src/features/chat/thread/chatVideoSource";
import React, { useState } from "react";
import { Image, View, type ImageProps, type ImageStyle, type StyleProp } from "react-native";

type Props = {
  message: any;
  style?: StyleProp<ImageStyle>;
  protectedMedia?: boolean;
  resizeMode?: ImageProps["resizeMode"];
  onSize?: (size: { width: number; height: number }) => void;
};

export default function ChatVideoPoster({ message, style, protectedMedia, resizeMode = "contain", onSize }: Props) {
  const uri = chatVideoThumbnail({
    url: chatVideoUri(message),
    thumbnailUrl: message?.thumbnailUrl || message?.playback?.thumbnailUrl || message?.cloudflareStream?.thumbnailUrl,
  });
  const [failed, setFailed] = useState("");
  if (!uri || failed === uri) return <View style={style} />;
  return <Image source={{ uri }} style={style} resizeMode={resizeMode}
    blurRadius={protectedMedia ? 48 : 0} fadeDuration={0}
    onError={() => setFailed(uri)}
    onLoad={event => onSize?.({ width: event.nativeEvent.source.width, height: event.nativeEvent.source.height })} />;
}