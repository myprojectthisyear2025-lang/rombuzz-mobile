// src/features/meetMiddle/components/MeetMiddleFullScreenMap.tsx
//
// RomBuzz Meet in the Middle fullscreen map.
//
// Purpose:
// - Opens a Snapchat-style fullscreen map experience using RomBuzz branding.
// - Respects iOS/Android safe areas.
// - Shows privacy-safe approximate participant markers, midpoint, and place markers.
// - Lets the user pan/zoom/slide the native map naturally.
// - Does NOT expose exact peer GPS.
// - Does NOT copy Snapchat/Snap Map branding.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";
import MeetMiddleNativeMap from "@/src/features/meetMiddle/components/MeetMiddleNativeMap";
import type {
  MeetMiddlePlace,
  MeetMiddleSession,
} from "@/src/features/meetMiddle/meetMiddleTypes";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  line: "rgba(177,18,60,0.14)",
  green: "#059669",
};

type Props = {
  visible: boolean;
  peerName: string;
  session?: MeetMiddleSession | null;
  places: MeetMiddlePlace[];
  selectedPlace?: MeetMiddlePlace | null;
  onClose: () => void;
  onSelectPlace?: (place: MeetMiddlePlace) => void;
};

export default function MeetMiddleFullScreenMap({
  visible,
  peerName,
  session,
  places,
  selectedPlace,
  onClose,
  onSelectPlace,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.screen,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <LinearGradient
          colors={["#FFFFFF", "#FFF5F8"]}
          style={styles.header}
        >
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="chevron-down" size={24} color={RBZ.ink} />
          </Pressable>

          <View style={styles.titleWrap}>
            <View style={styles.logoDot}>
              <MeetMiddleMiniLogo size={30} />
            </View>

            <View style={styles.titleTextWrap}>
              <Text style={styles.title}>RomBuzz Map</Text>
              <Text numberOfLines={1} style={styles.subtitle}>
                Approximate meetup view with {peerName || "your match"}
              </Text>
            </View>
          </View>

          <View style={styles.headerButtonGhost}>
            <Ionicons name="shield-checkmark" size={21} color={RBZ.green} />
          </View>
        </LinearGradient>

        <View style={styles.mapShell}>
          <MeetMiddleNativeMap
            session={session}
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={onSelectPlace}
            fullScreen
            showParticipantLabels
          />
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.privacyRow}>
            <Ionicons name="shield-checkmark" size={16} color={RBZ.green} />
            <Text style={styles.privacyText}>
              User markers are approximate. Exact GPS stays private.
            </Text>
          </View>

          {selectedPlace ? (
            <View style={styles.selectedCard}>
              <View style={styles.selectedIcon}>
                <Ionicons
                  name={selectedPlace.isMidpoint ? "navigate-circle" : "location"}
                  size={21}
                  color={RBZ.white}
                />
              </View>

              <View style={styles.selectedBody}>
                <Text numberOfLines={1} style={styles.selectedTitle}>
                  {selectedPlace.isMidpoint ? "Midpoint" : selectedPlace.name}
                </Text>

                <Text numberOfLines={2} style={styles.selectedAddress}>
                  {String(
                    selectedPlace.address ||
                      selectedPlace.category ||
                      "Selected meetup spot"
                  ).trim()}
                </Text>
              </View>

              <Pressable
                onPress={() => onSelectPlace?.(selectedPlace)}
                style={({ pressed }) => [
                  styles.chooseButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.chooseButtonText}>Choose</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: RBZ.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonGhost: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: RBZ.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  mapShell: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  bottomPanel: {
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: RBZ.line,
  },
  privacyRow: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  privacyText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "900",
    flexShrink: 1,
    textAlign: "center",
  },
  selectedCard: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: RBZ.line,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBody: {
    flex: 1,
    minWidth: 0,
  },
  selectedTitle: {
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  selectedAddress: {
    color: RBZ.gray,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  chooseButton: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
  chooseButtonText: {
    color: RBZ.white,
    fontSize: 12,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});