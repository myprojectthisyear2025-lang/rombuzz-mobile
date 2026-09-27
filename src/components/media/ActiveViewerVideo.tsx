import { diagnosticVideo } from "@/src/performance/diagnostics/media";
import type { AVPlaybackStatusSuccess, Video, VideoProps } from "expo-av";
import React, { forwardRef, useRef } from "react";

const PerfVideo = diagnosticVideo("video-viewer");

// Keep the page and playback snapshot, release the native player while hidden.
// The initial status stays stable during progress updates; it is restored only
// when the player mounts again, not sent back on every native status callback.
export const ActiveViewerVideo = forwardRef<Video, VideoProps & {
  active: boolean;
  canUpdate: () => boolean;
}>(({ active, canUpdate, ...props }, ref) => {
  const snapshot = useRef<AVPlaybackStatusSuccess | null>(null);
  const sourceKey = typeof props.source === "object" && props.source && "uri" in props.source ? props.source.uri : props.source;
  const lastSource = useRef(sourceKey);
  const mounted = useRef(false);
  const generation = useRef(0);
  const initial = useRef({ positionMillis: 0, shouldPlay: props.shouldPlay });
  if (lastSource.current !== sourceKey) {
    lastSource.current = sourceKey;
    snapshot.current = null;
    mounted.current = false;
    generation.current++;
  }
  if (mounted.current !== active) generation.current++;
  const currentGeneration = generation.current;
  if (active && !mounted.current) initial.current = {
    positionMillis: snapshot.current?.positionMillis || 0,
    shouldPlay: snapshot.current
      ? (snapshot.current.shouldPlay ?? snapshot.current.isPlaying) && !snapshot.current.didJustFinish
      : props.shouldPlay,
  };
  mounted.current = active;

  if (!active) return null;
  return <PerfVideo {...props} ref={ref} {...initial.current} onPlaybackStatusUpdate={status => {
    if (!mounted.current || generation.current !== currentGeneration || !canUpdate()) return;
    if (status.isLoaded) snapshot.current = status;
    props.onPlaybackStatusUpdate?.(status);
  }} />;
});
ActiveViewerVideo.displayName = "ActiveViewerVideo";
