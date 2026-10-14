/**
 * File: src/features/auth/onboarding/photos/SignupPhotoGrid.tsx
 * Purpose: Displays six photo slots in a two-column grid.
 * Supports adding, replacing, removing, and dragging photos to reorder.
 * Highlights the first photo as the profile avatar.
 * Sends photo actions to Step4Photos, which updates the signup form.
 * Includes accessibility actions for reordering without dragging.
 */

import { useStep4PhotosStyles } from "@/app/auth/register-full/styles/useStep4PhotosStyles";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Animated, Image, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const GAP = 12;

type Props = {
  photos: string[];
  disabled: boolean;
  onPick: (index: number) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
};

export default function SignupPhotoGrid(props: Props) {
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const size = (width - GAP) / 2;
  const height = size * 1.12;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: width ? height * 3 + GAP * 2 : 1 }}
    >
      {width > 0 && Array.from({ length: 6 }, (_, index) => (
        <PhotoTile
          key={props.photos[index] || `empty-${index}`}
          {...props}
          index={index}
          size={size}
          height={height}
          locked={props.disabled || dragging}
          onDragging={setDragging}
        />
      ))}
    </View>
  );
}

type TileProps = Props & {
  index: number;
  size: number;
  height: number;
  locked: boolean;
  onDragging: (active: boolean) => void;
};

function PhotoTile(p: TileProps) {
  const s = useStep4PhotosStyles();
  const translation = useRef(new Animated.ValueXY()).current;
  const [active, setActive] = useState(false);
  const [target, setTarget] = useState(p.index);
  const destination = useRef(p.index);
  const uri = p.photos[p.index];

  const reset = () => {
    translation.setValue({ x: 0, y: 0 });
    setActive(false);
    p.onDragging(false);
  };

  const drag = Gesture.Pan()
    .runOnJS(true)
    .enabled(!!uri && !p.disabled)
    .activateAfterLongPress(250)
    .onStart(() => {
      destination.current = p.index;
      setTarget(p.index);
      setActive(true);
      p.onDragging(true);
    })
    .onUpdate((e) => {
      const col = Math.max(0, Math.min(1,
        Math.round(p.index % 2 + e.translationX / (p.size + GAP)),
      ));
      const row = Math.max(0, Math.min(2,
        Math.round(
          Math.floor(p.index / 2) +
          e.translationY / (p.height + GAP),
        ),
      ));
      destination.current = Math.min(
        p.photos.length - 1, row * 2 + col,
      );
      setTarget(destination.current);
      translation.setValue({
        x: e.translationX, y: e.translationY,
      });
    })
    .onEnd(() => {
      const to = destination.current;
      reset();
      if (to !== p.index) p.onMove(p.index, to);
    })
    .onFinalize(reset);

  return (
    <Animated.View
      style={[
        s.tile,
        {
          position: "absolute",
          width: p.size, height: p.height,
          left: (p.index % 2) * (p.size + GAP),
          top: Math.floor(p.index / 2) * (p.height + GAP),
          zIndex: active ? 20 : 0,
          transform: [
            ...translation.getTranslateTransform(),
            { scale: active ? 1.04 : 1 },
          ],
        },
        !uri && s.emptyTile,
        p.index === 0 && !!uri && s.avatarTile,
        active && s.dragTile,
      ]}
    >
      <Pressable
        style={s.fill}
        disabled={p.locked}
        accessibilityRole="button"
        accessibilityLabel={
          uri ? `Replace photo ${p.index + 1}` : "Add photos"
        }
        onPress={() => p.onPick(p.index)}
      >
        {uri ? (
          <Image source={{ uri }} style={s.fill} />
        ) : (
          <View style={s.emptyContent}>
            <Text style={s.plus}>+</Text>
            <Text style={s.muted}>Add photo</Text>
          </View>
        )}
      </Pressable>

      {!!uri && <>
        <View pointerEvents="none" style={s.number}>
          <Text style={s.overlayText}>{p.index + 1}</Text>
        </View>

        <Pressable
          style={s.remove}
          disabled={p.locked}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Remove photo ${p.index + 1}`}
          onPress={() => p.onRemove(p.index)}
        >
          <Ionicons name="close" size={18} color="#17171C" />
        </Pressable>

        {(p.index === 0 || active) && (
          <View pointerEvents="none" style={s.badge}>
            <Text style={s.badgeText}>
              {active ? `Move to #${target + 1}` : "Profile photo"}
            </Text>
          </View>
        )}

        <GestureDetector gesture={drag}>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`Reorder photo ${p.index + 1}. Hold and drag.`}
            accessibilityActions={[
              { name: "increment", label: "Move later" },
              { name: "decrement", label: "Move earlier" },
              { name: "activate", label: "Make profile photo" },
            ]}
            onAccessibilityAction={(e) => {
              if (p.locked) return;
              const action = e.nativeEvent.actionName;
              const to = action === "activate"
                ? 0
                : p.index + (action === "increment" ? 1 : -1);
              if (to >= 0 && to < p.photos.length) {
                p.onMove(p.index, to);
              }
            }}
            style={s.grip}
          >
            <Ionicons name="apps" size={22} color="white" />
          </View>
        </GestureDetector>
      </>}
    </Animated.View>
  );
}