/**
 * Path: src/components/match/MatchCelebrateOverlay.tsx
 * Purpose: Match celebration animation, auto-chat timer, and Stay in MicroBuzz control.
 */

import {
  useRouter,
} from "expo-router";

import React, {
  useEffect,
  useRef,
} from "react";

import {
  Animated,
  Modal,
  StyleSheet,
  View,
} from "react-native";

import MatchCelebrateBurst from "./MatchCelebrateBurst";
import MatchCelebrateCard from "./MatchCelebrateCard";

const AUTO_CHAT_MS = 3500;

type Props = {
  visible: boolean;

  matchUser: {
    id: string;
    firstName?: string;
    selfieUrl?: string;
    avatar?: string;
  } | null;

  myAvatar?: string;

  pendingCount?: number;

  onDone:
    () => void;

  onStay?:
    () => void;
};

export default function MatchCelebrateOverlay({
  visible,
  matchUser,
  myAvatar,
  pendingCount = 0,
  onDone,
  onStay,
}: Props) {
  const router =
    useRouter();

  const fade =
    useRef(
      new Animated.Value(0)
    ).current;

  const scale =
    useRef(
      new Animated.Value(0.9)
    ).current;

  const doneRef =
    useRef(onDone);

  const stayRef =
    useRef(onStay);

  const finishedRef =
    useRef(false);

  doneRef.current =
    onDone;

  stayRef.current =
    onStay;

  function openChat() {
    if (
      !matchUser?.id ||
      finishedRef.current
    ) {
      return;
    }

    finishedRef.current =
      true;

    doneRef.current();

    router.push(
      `/chat/${matchUser.id}`
    );
  }

  function stayHere() {
    if (
      finishedRef.current
    ) {
      return;
    }

    finishedRef.current =
      true;

    if (
      stayRef.current
    ) {
      stayRef.current();
    } else {
      doneRef.current();
    }
  }

  useEffect(() => {
    if (
      !visible ||
      !matchUser?.id
    ) {
      return;
    }

    finishedRef.current =
      false;

    fade.setValue(0);
    scale.setValue(0.9);

    Animated.parallel([
      Animated.timing(
        fade,
        {
          toValue: 1,
          duration: 240,
          useNativeDriver:
            true,
        }
      ),

      Animated.spring(
        scale,
        {
          toValue: 1,
          tension: 62,
          friction: 7,
          useNativeDriver:
            true,
        }
      ),
    ]).start();

    const timer =
      setTimeout(() => {
        if (
          finishedRef.current
        ) {
          return;
        }

        finishedRef.current =
          true;

        doneRef.current();

        router.push(
          `/chat/${matchUser.id}`
        );
      }, AUTO_CHAT_MS);

    return () =>
      clearTimeout(timer);
  }, [
    fade,
    matchUser?.id,
    router,
    scale,
    visible,
  ]);

  if (
    !visible ||
    !matchUser
  ) {
    return null;
  }

  const avatar =
    matchUser.avatar ||
    matchUser.selfieUrl ||
    "https://i.pravatar.cc/300";

  return (
    <Modal
      visible
      transparent
      animationType="none"
    >
      <View
        style={
          styles.root
        }
      >
        <Animated.View
          style={[
            styles.dim,
            {
              opacity:
                fade,
            },
          ]}
        />

        <MatchCelebrateBurst
          visible={
            visible
          }
        />

        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity:
                fade,

              transform: [
                {
                  scale,
                },
              ],
            },
          ]}
        >
          <MatchCelebrateCard
            firstName={
              matchUser.firstName
            }
            matchAvatar={
              avatar
            }
            myAvatar={
              myAvatar
            }
            pendingCount={
              pendingCount
            }
            onChat={
              openChat
            }
            onStay={
              stayHere
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 22,
    },

    dim: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        "rgba(5,5,9,0.78)",
    },

    cardWrap: {
      width: "100%",
      maxWidth: 380,
    },
  });