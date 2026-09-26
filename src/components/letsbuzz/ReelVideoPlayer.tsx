import { diagnosticVideo } from "@/src/performance/diagnostics/media";
import { ResizeMode, type Video } from "expo-av";
import React, { useCallback, useMemo, useRef, type MutableRefObject } from "react";
import type { StyleProp, ViewStyle } from "react-native";

const PerfVideo = diagnosticVideo("reel-video");

// Only the native player leaves the tree on blur/background. Its owning list,
// index, scroll offset, mute/pause choice, and cached feed stay mounted.
export function ReelVideoPlayer({
  id, uri, playing, muted, style, players, positions,
}: {
  id: string;
  uri: string;
  playing: boolean;
  muted: boolean;
  style: StyleProp<ViewStyle>;
  players: MutableRefObject<Record<string, Video>>;
  positions: Map<string, number>;
}) {
  const initialPosition = useRef(positions.get(id) || 0).current;
  const source = useMemo(() => ({ uri }), [uri]);
  const attach = useCallback((video: Video | null) => {
    if (video) players.current[id] = video;
    else delete players.current[id];
  }, [id, players]);

  return <PerfVideo
    ref={attach}
    source={source}
    style={style}
    resizeMode={ResizeMode.CONTAIN}
    positionMillis={initialPosition}
    shouldPlay={playing}
    isLooping
    isMuted={muted}
    useNativeControls={false}
    progressUpdateIntervalMillis={500}
    onPlaybackStatusUpdate={status => {
      if (status.isLoaded) positions.set(id, status.positionMillis);
    }}
    onError={() => {}}
  />;
}
