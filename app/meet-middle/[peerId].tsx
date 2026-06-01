// app/meet-middle/[peerId].tsx
//
// RomBuzz Meet in the Middle placeholder screen.
//
// Purpose:
// - First mobile entry screen for the new Meet in the Middle feature.
// - Receives peerId, name, and avatar from route params.
// - Uses a light romantic RomBuzz theme.
// - Respects iOS/Android safe areas and tablet/large-screen sizing.
// - Shows a clear Meet in the Middle logo.
// - Does NOT request location yet.
// - Does NOT call backend yet.
// - Does NOT open map yet.
// - This screen only proves navigation works from Chat Thread Info and Chat Header.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";
import MeetMiddleFinalMeetupCard from "@/src/features/meetMiddle/components/MeetMiddleFinalMeetupCard";
import MeetMiddleLocationConsentCard from "@/src/features/meetMiddle/components/MeetMiddleLocationConsentCard";
import MeetMiddleMapStage from "@/src/features/meetMiddle/components/MeetMiddleMapStage";
import MeetMiddlePlaceConfirmationCard from "@/src/features/meetMiddle/components/MeetMiddlePlaceConfirmationCard";
import MeetMiddleSuggestionsReadyCard from "@/src/features/meetMiddle/components/MeetMiddleSuggestionsReadyCard";
import {
  acceptMeetMiddlePlace,
  rejectMeetMiddlePlace,
  selectMeetMiddlePlace,
} from "@/src/features/meetMiddle/meetMiddleApi";
import { useMeetMiddleLocationShare } from "@/src/features/meetMiddle/useMeetMiddleLocationShare";
import { useMeetMiddleRequest } from "@/src/features/meetMiddle/useMeetMiddleRequest";
import { useMeetMiddleSessionResume } from "@/src/features/meetMiddle/useMeetMiddleSessionResume";
import {
  extractMeetMiddleSocketSession,
  useMeetMiddleSessionSocket,
} from "@/src/features/meetMiddle/useMeetMiddleSessionSocket";
import type {
  MeetMiddlePlace,
  MeetMiddleSession,
} from "@/src/features/meetMiddle/meetMiddleTypes";

type MeetMiddleParams = {
  peerId?: string;
  name?: string;
  avatar?: string;
  sessionId?: string;
  stage?: string;
  source?: string;
};

type MeetMiddleStage =
  | "intro"
  | "request-sent"
  | "location-consent"
  | "waiting-peer"
  | "suggestions-ready"
  | "map-stage"
  | "place-selected"
  | "place-confirmation"
  | "final-confirmed";

function getSessionId(session?: MeetMiddleSession | null) {
  return String(
    session?.sessionId ||
      session?.id ||
      session?._id ||
      ""
  ).trim();
}

function getResponseSession(payload: any): MeetMiddleSession | null {
  return (
    payload?.session ||
    payload?.data?.session ||
    payload?.meetMiddleSession ||
    payload?.data?.meetMiddleSession ||
    null
  );
}

function getResponseStatus(payload: any) {
  const session = getResponseSession(payload);

  return String(
    payload?.status ||
      payload?.data?.status ||
      session?.status ||
      ""
  )
    .trim()
    .toLowerCase();
}

function getResponseSelectedPlace(payload: any): MeetMiddlePlace | null {
  const session = getResponseSession(payload);

  return (
    payload?.place ||
    payload?.data?.place ||
    payload?.selectedPlace ||
    payload?.data?.selectedPlace ||
    session?.selectedPlace ||
    null
  );
}

function getEntityId(value: any) {
  return String(
    value?._id ||
      value?.id ||
      value?.userId ||
      value ||
      ""
  ).trim();
}

function getResponseRejectedById(payload: any) {
  return getEntityId(
    payload?.rejectedBy ||
      payload?.data?.rejectedBy ||
      payload?.actorId ||
      payload?.data?.actorId ||
      ""
  );
}

function getSharedById(payload: any) {
  return getEntityId(
    payload?.sharedBy ||
      payload?.data?.sharedBy ||
      payload?.actorId ||
      payload?.data?.actorId ||
      ""
  );
}

function getSharedUserIds(session?: MeetMiddleSession | null) {
  const sharedFromList = Array.isArray((session as any)?.locationSharedBy)
    ? (session as any).locationSharedBy.map((id: any) => String(id || "").trim()).filter(Boolean)
    : [];

  const sharedFromParticipants = Array.isArray((session as any)?.approximateParticipants)
    ? (session as any).approximateParticipants
        .filter((participant: any) => participant?.hasSharedLocation === true)
        .map((participant: any) =>
          String(participant?.userId || participant?.id || "").trim()
        )
        .filter(Boolean)
    : [];

  return Array.from(new Set([...sharedFromList, ...sharedFromParticipants]));
}

function hasUserSharedLocation(
  session: MeetMiddleSession | null | undefined,
  userId: string
) {
  const cleanUserId = String(userId || "").trim();
  if (!cleanUserId) return false;

  return getSharedUserIds(session).includes(cleanUserId);
}

function responseHasSuggestions(payload: any) {
  const session = getResponseSession(payload);

  const places =
    payload?.places ||
    payload?.data?.places ||
    payload?.suggestions ||
    payload?.data?.suggestions ||
    session?.places ||
    session?.suggestions ||
    [];

  const midpoint =
    payload?.midpoint ||
    payload?.data?.midpoint ||
    session?.midpoint ||
    null;

  const midpointPlace =
    payload?.midpointPlace ||
    payload?.data?.midpointPlace ||
    session?.midpointPlace ||
    null;

  return (
    getResponseStatus(payload) === "suggestions_ready" ||
    getResponseStatus(payload) === "suggestions-ready" ||
    getResponseStatus(payload) === "ready" ||
    Array.isArray(places) && places.length > 0 ||
    !!midpoint ||
    !!midpointPlace
  );
}

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#fff5f8",
  line: "rgba(177,18,60,0.12)",
};

function MeetMiddleHeroLogo() {
  return (
    <View style={styles.logoOuter}>
      <LinearGradient colors={["#FFFFFF", "#FFF2F7"]} style={styles.logoCard}>
        <View style={styles.logoGlow}>
          <MeetMiddleMiniLogo size={72} />
        </View>

        <View style={styles.logoLabelPill}>
          <Ionicons name="heart" size={11} color={RBZ.c2} />
          <Text style={styles.logoLabelText}>Meet halfway</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function MeetMiddleScreen() {
  const params = useLocalSearchParams<MeetMiddleParams>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const peerId = String(params.peerId || "");
  const routeSessionId = String(params.sessionId || "").trim();
  const routeStage = String(params.stage || "").trim();

  const [activeSessionId, setActiveSessionId] = useState(routeSessionId);
   const [screenStage, setScreenStage] = useState<MeetMiddleStage>(
    routeSessionId || routeStage === "location-consent"
      ? "location-consent"
      : "intro"
  );

  const [selectedMeetPlace, setSelectedMeetPlace] =
    useState<MeetMiddlePlace | null>(null);
  const [pendingConfirmPlace, setPendingConfirmPlace] =
    useState<MeetMiddlePlace | null>(null);
   const [finalMeetPlace, setFinalMeetPlace] =
    useState<MeetMiddlePlace | null>(null);
  const [selectingPlace, setSelectingPlace] = useState(false);
  const [placeActionLoading, setPlaceActionLoading] = useState(false);
  const [selectPlaceError, setSelectPlaceError] = useState("");
  const [placeActionError, setPlaceActionError] = useState("");

  const localPlaceRejectSessionRef = useRef("");
  const localPlaceRejectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    loading: meetRequestLoading,
    sent: meetRequestSent,
    error: meetRequestError,
    session: meetRequestSession,
    canStart: canStartMeetRequest,
    startRequest: startMeetRequest,
    resetRequest: resetMeetRequest,
  } = useMeetMiddleRequest(peerId);

        const {
    loading: locationShareLoading,
    error: locationShareError,
    session: locationShareSession,
    rawResponse: locationShareRawResponse,
    peerShared,
    waitingForPeer,
    suggestionsReady,
    shareLocation,
    markWaitingForPeer,
    markPeerSharedLocation,
    markSuggestionsReady,
    reset: resetLocationShare,
  } = useMeetMiddleLocationShare(activeSessionId);

  const resumeSession = useMeetMiddleSessionResume(activeSessionId);

  const displayName = useMemo(() => {
    const rawName = typeof params.name === "string" ? params.name.trim() : "";
    return rawName || "your match";
  }, [params.name]);
   const avatar = useMemo(() => {
    const rawAvatar = typeof params.avatar === "string" ? params.avatar.trim() : "";
    return rawAvatar || "";
  }, [params.avatar]);

   useEffect(() => {
    if (!routeSessionId) return;

    setActiveSessionId(routeSessionId);
    setScreenStage("location-consent");
  }, [routeSessionId]);

   useEffect(() => {
    if (!resumeSession.session) return;

    const nextSessionId = getSessionId(resumeSession.session);

    if (nextSessionId) {
      setActiveSessionId(nextSessionId);
    }

    if (resumeSession.stage) {
      setScreenStage(resumeSession.stage as MeetMiddleStage);
    }

    const viewerSharedLocation = hasUserSharedLocation(
      resumeSession.session,
      resumeSession.viewerId
    );

    const peerSharedLocation = hasUserSharedLocation(
      resumeSession.session,
      peerId
    );

    if (resumeSession.stage === "waiting-peer" && viewerSharedLocation) {
      markWaitingForPeer(resumeSession.session);
    } else if (
      resumeSession.stage === "location-consent" &&
      peerSharedLocation &&
      !viewerSharedLocation
    ) {
      markPeerSharedLocation(resumeSession.session);
    } else if (
      resumeSession.stage === "location-consent" &&
      !peerSharedLocation &&
      !viewerSharedLocation
    ) {
      resetLocationShare();
    }

    setSelectedMeetPlace(resumeSession.selectedPlace);
    setPendingConfirmPlace(resumeSession.pendingConfirmPlace);
    setFinalMeetPlace(resumeSession.finalMeetPlace);
    setSelectPlaceError("");
    setPlaceActionError("");
  }, [
    peerId,
    resumeSession.session,
    resumeSession.stage,
    resumeSession.viewerId,
    resumeSession.selectedPlace,
    resumeSession.pendingConfirmPlace,
    resumeSession.finalMeetPlace,
    markWaitingForPeer,
    markPeerSharedLocation,
    resetLocationShare,
  ]);

  useEffect(() => {
    const nextSessionId = getSessionId(meetRequestSession);
    if (!nextSessionId) return;

    setActiveSessionId(nextSessionId);
  }, [meetRequestSession]);

  useEffect(() => {
    return () => {
      if (localPlaceRejectTimerRef.current) {
        clearTimeout(localPlaceRejectTimerRef.current);
        localPlaceRejectTimerRef.current = null;
      }
    };
  }, []);

   const handleStartMeetRequest = useCallback(async () => {
    const result = await startMeetRequest();
    const nextSessionId = getSessionId(result?.session || null);

    if (nextSessionId) {
      setActiveSessionId(nextSessionId);
      setScreenStage("request-sent");
    }
  }, [startMeetRequest]);

  const handleShareLocation = useCallback(async () => {
    const result = await shareLocation();

    const response: any = result?.response || null;
    const responseSession: any =
      getResponseSession(response) ||
      result?.session ||
      null;

    console.log("📍 MeetMiddle location share result:", {
      activeSessionId,
      status: getResponseStatus(response),
      hasSuggestions: responseHasSuggestions(response),
      sessionId: getSessionId(responseSession),
      placesCount:
        response?.places?.length ||
        response?.data?.places?.length ||
        response?.suggestions?.length ||
        response?.data?.suggestions?.length ||
        responseSession?.places?.length ||
        responseSession?.suggestions?.length ||
        0,
      hasMidpoint: !!(
        response?.midpoint ||
        response?.data?.midpoint ||
        responseSession?.midpoint
      ),
      hasMidpointPlace: !!(
        response?.midpointPlace ||
        response?.data?.midpointPlace ||
        responseSession?.midpointPlace
      ),
    });

    if (responseHasSuggestions(response)) {
      setScreenStage("suggestions-ready");
      return;
    }

    if (result) {
      setScreenStage("waiting-peer");
    }
  }, [activeSessionId, shareLocation]);

   useMeetMiddleSessionSocket(activeSessionId, {
    onAccepted: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);
      const nextSessionId = getSessionId(session);

      if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

      setScreenStage("location-consent");
    },
      onLocationWaiting: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);
      const sharedById = getSharedById(payload);

      if (sharedById && sharedById === peerId) {
        markPeerSharedLocation(session);
        setScreenStage("location-consent");
        return;
      }

      markWaitingForPeer(session);
      setScreenStage("waiting-peer");
    },
    onLocationPeerShared: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);
      const sharedById = getSharedById(payload);

      if (sharedById && sharedById !== peerId) {
        markWaitingForPeer(session);
        setScreenStage("waiting-peer");
        return;
      }

      markPeerSharedLocation(session);
      setScreenStage("location-consent");
    },
       onSuggestionsReady: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);

      console.log("📍 MeetMiddle suggestions ready socket:", {
        activeSessionId,
        payloadSessionId: getSessionId(session),
        status: getResponseStatus(payload),
        hasSuggestions: responseHasSuggestions(payload),
        placesCount:
          payload?.places?.length ||
          payload?.data?.places?.length ||
          session?.places?.length ||
          session?.suggestions?.length ||
          0,
      });

      markSuggestionsReady(session, payload);
      setScreenStage("suggestions-ready");
    },
     onPlaceSelected: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);
      const nextSessionId = getSessionId(session);
      const place = getResponseSelectedPlace(payload);

      if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

      if (session) {
        markSuggestionsReady(session, payload);
      }

      setSelectedMeetPlace(place);
      setPendingConfirmPlace(null);
      setFinalMeetPlace(null);
      setPlaceActionError("");
      setScreenStage("place-selected");
    },
    onPlaceConfirmationNeeded: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);
      const nextSessionId = getSessionId(session);
      const place = getResponseSelectedPlace(payload);

      if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

         if (session) {
        markSuggestionsReady(session, payload);
      }

      if (screenStage === "place-selected") {
        return;
      }

      setPendingConfirmPlace(place);
      setPlaceActionError("");
      setScreenStage("place-confirmation");
    },
    onFinalConfirmed: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);
      const nextSessionId = getSessionId(session);
      const place = getResponseSelectedPlace(payload);

      if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

      if (session) {
        markSuggestionsReady(session, payload);
      }

      setFinalMeetPlace(place || selectedMeetPlace || pendingConfirmPlace);
      setPendingConfirmPlace(null);
      setPlaceActionError("");
      setScreenStage("final-confirmed");
    },
    onPlaceRejected: (payload) => {
      const session = extractMeetMiddleSocketSession(payload);
      const nextSessionId = getSessionId(session);
      const rejectedById = getResponseRejectedById(payload);
      const viewerId = String(resumeSession.viewerId || "").trim();

      const rejectedByMe =
        (!!viewerId && !!rejectedById && rejectedById === viewerId) ||
        (!!nextSessionId && localPlaceRejectSessionRef.current === nextSessionId);

      if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

       if (session) {
        markSuggestionsReady(session, payload);
      }

      if (rejectedByMe) {
        localPlaceRejectSessionRef.current = "";
      }

      setPendingConfirmPlace(null);
      setSelectedMeetPlace(null);
      setPlaceActionError("");
      setSelectPlaceError(
        rejectedByMe
          ? ""
          : `${displayName} wants to pick another meetup spot.`
      );
      setScreenStage("map-stage");
    },
  });

   const showLocationConsent =
    screenStage === "location-consent" ||
    screenStage === "waiting-peer" ||
    screenStage === "suggestions-ready";

  const shouldHideIntroBlock =
    showLocationConsent ||
    suggestionsReady ||
    screenStage === "map-stage" ||
    screenStage === "place-selected" ||
    screenStage === "place-confirmation" ||
    screenStage === "final-confirmed";

   const activeMeetSession = useMemo(() => {
    const rawSession = getResponseSession(locationShareRawResponse);

    return (
      rawSession ||
      locationShareSession ||
      resumeSession.session ||
      meetRequestSession ||
      null
    );
  }, [
    locationShareSession,
    locationShareRawResponse,
    resumeSession.session,
    meetRequestSession,
  ]);

    const handleContinueToMap = useCallback(() => {
    setScreenStage("map-stage");
  }, []);

      const handleBackToSuggestions = useCallback(() => {
    setScreenStage("suggestions-ready");
  }, []);

  const handleMessagePeer = useCallback(() => {
    if (!peerId) {
      router.back();
      return;
    }

    router.push({
      pathname: "/chat/[peerId]",
      params: {
        peerId,
        name: displayName,
        avatar,
      },
    });
  }, [peerId, displayName, avatar]);

  const handleAcceptSelectedPlace = useCallback(async () => {
    const sessionId = activeSessionId || getSessionId(activeMeetSession);

    if (!sessionId) {
      setPlaceActionError("Meet session is missing. Please reopen this meetup.");
      return;
    }

    setPlaceActionLoading(true);
    setPlaceActionError("");

    try {
      const response = await acceptMeetMiddlePlace(sessionId);
      const nextSession = getResponseSession(response);
      const nextSessionId = getSessionId(nextSession);
      const place = getResponseSelectedPlace(response);

      if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

      if (nextSession) {
        markSuggestionsReady(nextSession);
      }

      setFinalMeetPlace(place || pendingConfirmPlace);
      setPendingConfirmPlace(null);
      setScreenStage("final-confirmed");
    } catch (err: any) {
      setPlaceActionError(
        err?.message || "Could not confirm this meetup spot. Please try again."
      );
    } finally {
      setPlaceActionLoading(false);
    }
  }, [activeSessionId, activeMeetSession, markSuggestionsReady, pendingConfirmPlace]);

   const handlePickAnotherPlace = useCallback(async () => {
    const sessionId = activeSessionId || getSessionId(activeMeetSession);

    if (!sessionId) {
      setPlaceActionError("Meet session is missing. Please reopen this meetup.");
      return;
    }

    localPlaceRejectSessionRef.current = sessionId;

    if (localPlaceRejectTimerRef.current) {
      clearTimeout(localPlaceRejectTimerRef.current);
      localPlaceRejectTimerRef.current = null;
    }

    localPlaceRejectTimerRef.current = setTimeout(() => {
      localPlaceRejectSessionRef.current = "";
      localPlaceRejectTimerRef.current = null;
    }, 10000);

    setPlaceActionLoading(true);
    setPlaceActionError("");
    setSelectPlaceError("");

    try {
      const response = await rejectMeetMiddlePlace(sessionId);
      const nextSession = getResponseSession(response);
      const nextSessionId = getSessionId(nextSession);

      if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

      if (nextSession) {
        markSuggestionsReady(nextSession, response);
      }

      setPendingConfirmPlace(null);
      setSelectedMeetPlace(null);
      setSelectPlaceError("");
      setScreenStage("map-stage");
    } catch (err: any) {
      localPlaceRejectSessionRef.current = "";

      setPlaceActionError(
        err?.message || "Could not reject this meetup spot. Please try again."
      );
    } finally {
      setPlaceActionLoading(false);
    }
  }, [activeSessionId, activeMeetSession, markSuggestionsReady]);

  const handleSelectPlace = useCallback(async (place: MeetMiddlePlace) => {
    const sessionId = activeSessionId || getSessionId(activeMeetSession);

    if (!sessionId) {
      setSelectPlaceError("Meet session is missing. Please reopen this meetup.");
      return;
    }

    if (!place || !String(place.name || "").trim()) {
      setSelectPlaceError("Please choose a valid meetup spot.");
      return;
    }

    setSelectingPlace(true);
    setSelectPlaceError("");

    try {
      const response = await selectMeetMiddlePlace(sessionId, place);
      const nextSession = getResponseSession(response);
      const nextSessionId = getSessionId(nextSession);

        if (nextSessionId) {
        setActiveSessionId(nextSessionId);
      }

      if (nextSession) {
        markSuggestionsReady(nextSession);
      }

      setSelectedMeetPlace(place);
      setPendingConfirmPlace(null);
      setFinalMeetPlace(null);
      setScreenStage("place-selected");
    } catch (err: any) {
      setSelectPlaceError(
        err?.message || "Could not select this meetup spot. Please try again."
      );
    } finally {
      setSelectingPlace(false);
    }
  }, [activeSessionId, activeMeetSession, markSuggestionsReady]);
   const isMapStage =
    screenStage === "map-stage" ||
    screenStage === "place-selected" ||
    screenStage === "place-confirmation" ||
    screenStage === "final-confirmed";

    const isTabletLike = width >= 720;
  const isNarrowPhone = width < 380;
  const horizontalPadding = isTabletLike ? 28 : isNarrowPhone ? 6 : 10;
  const cardMaxWidth = isTabletLike ? 520 : 9999;
  const topInset = Math.max(insets.top, 6);
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={styles.safeRoot}>
      <LinearGradient
        colors={["#FFFFFF", "#FFF7FA", "#FDF2FF"]}
        style={styles.screen}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: topInset,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={RBZ.ink} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Meet in the Middle</Text>
            <Text style={styles.headerSubtitle}>Plan a halfway meetup</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>

              <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
             paddingHorizontal: horizontalPadding,
              paddingBottom: bottomInset + 8,
              minHeight: Math.max(height - topInset - bottomInset - 58, 390),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
                <View style={[styles.centerWrap, { maxWidth: cardMaxWidth }]}>
                <View
              style={[
                styles.heroCard,
                shouldHideIntroBlock && styles.heroCardConsentOnly,
              ]}
            >
              {!shouldHideIntroBlock ? (
                <>
                  <View style={styles.badge}>
                    <Ionicons name="sparkles" size={15} color={RBZ.c2} />
                    <Text style={styles.badgeText}>Romantic meetup planner</Text>
                  </View>

                  <MeetMiddleHeroLogo />

                  <Text style={styles.title}>
                    Meet halfway, without the awkward planning.
                  </Text>

                  <Text style={styles.description}>
                    RomBuzz will help you and {displayName} find a comfortable middle spot when both of you are ready to share location.
                  </Text>

                  <View style={styles.matchCard}>
                    <View style={styles.avatarRing}>
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                      ) : (
                        <LinearGradient colors={[RBZ.c2, RBZ.c4]} style={styles.avatarFallback}>
                          <Ionicons name="person" size={30} color={RBZ.white} />
                        </LinearGradient>
                      )}
                    </View>

                    <View style={styles.matchTextWrap}>
                      <Text style={styles.matchLabel}>Planning with</Text>
                      <Text numberOfLines={1} style={styles.matchName}>
                        {displayName}
                      </Text>
                    </View>

                    <View style={styles.matchIcon}>
                      <MeetMiddleMiniLogo size={29} />
                    </View>
                  </View>
                </>
              ) : null}

              {isMapStage ? (
                <>
                      <MeetMiddleMapStage
                    peerName={displayName}
                    session={activeMeetSession}
                    rawResponse={locationShareRawResponse}
                    onBackToSummary={handleBackToSuggestions}
                    onSelectPlace={handleSelectPlace}
                  />

                  {resumeSession.loading ? (
                    <View style={styles.placeStatusBox}>
                      <Ionicons name="sync" size={18} color={RBZ.c2} />
                      <Text style={styles.placeStatusText}>
                        Restoring your latest meetup session...
                      </Text>
                    </View>
                  ) : null}

                  {!!resumeSession.error ? (
                    <View style={styles.placeErrorBox}>
                      <Ionicons name="warning" size={18} color="#DC2626" />
                      <Text style={styles.placeErrorText}>
                        {resumeSession.error}
                      </Text>
                    </View>
                  ) : null}

                               {selectingPlace ? (
                    <View style={styles.placeStatusBox}>
                      <Ionicons name="hourglass" size={18} color={RBZ.c2} />
                      <Text style={styles.placeStatusText}>
                        Sending your meetup spot to {displayName}...
                      </Text>
                    </View>
                                  ) : screenStage === "place-selected" && selectedMeetPlace ? (
                    <View style={styles.placeStatusBox}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <View style={styles.placeStatusTextWrap}>
                        <Text style={styles.placeStatusTitle}>
                          Waiting for {displayName} to confirm
                        </Text>
                        <Text numberOfLines={2} style={styles.placeStatusText}>
                          You picked {selectedMeetPlace.isMidpoint ? "the midpoint" : selectedMeetPlace.name}.
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {!!selectPlaceError ? (
                    <View style={styles.placeErrorBox}>
                      <Ionicons name="warning" size={18} color="#DC2626" />
                      <Text style={styles.placeErrorText}>{selectPlaceError}</Text>
                    </View>
                  ) : null}
                </>
                      ) : showLocationConsent || suggestionsReady ? (
                screenStage === "suggestions-ready" || suggestionsReady ? (
                  <MeetMiddleSuggestionsReadyCard
                    peerName={displayName}
                    session={activeMeetSession}
                    rawResponse={locationShareRawResponse}
                    onContinueToMap={handleContinueToMap}
                  />
                ) : (
                 <MeetMiddleLocationConsentCard
                    peerName={displayName}
                    loading={locationShareLoading}
                    error={locationShareError}
                    peerShared={peerShared && screenStage === "location-consent"}
                    waitingForPeer={waitingForPeer || screenStage === "waiting-peer"}
                    suggestionsReady={false}
                    onShareLocation={handleShareLocation}
                  />
                )
              ) : (
                <>
                  <Pressable
                    onPress={handleStartMeetRequest}
                    disabled={!canStartMeetRequest || meetRequestSent}
                    style={({ pressed }) => [
                      styles.startButtonWrap,
                      (pressed && canStartMeetRequest && !meetRequestSent) && styles.pressed,
                      (!canStartMeetRequest || meetRequestSent) && styles.startButtonDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        meetRequestSent
                          ? ["#10B981", "#059669"]
                          : [RBZ.c2, RBZ.c4]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.startButton}
                    >
                                      
                      <MeetMiddleMiniLogo size={23} />
                      <Text style={styles.startButtonText}>
                        {meetRequestLoading
                          ? "Sending request..."
                          : meetRequestSent
                            ? "Request Sent"
                            : "Start Meet in the Middle"}
                      </Text>
                      <Ionicons
                        name={meetRequestSent ? "checkmark-circle" : "arrow-forward"}
                        size={20}
                        color={RBZ.white}
                      />
                    </LinearGradient>
                  </Pressable>

                  {meetRequestSent ? (
                    <View style={styles.successBox}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <Text style={styles.successText}>
                        Meet request sent to {displayName}. We’ll wait for them before location sharing starts.
                      </Text>
                    </View>
                  ) : meetRequestError ? (
                    <View style={styles.errorBox}>
                      <Ionicons name="warning" size={18} color="#DC2626" />
                      <View style={styles.errorTextWrap}>
                        <Text style={styles.errorText}>{meetRequestError}</Text>
                        <Pressable onPress={resetMeetRequest} hitSlop={8}>
                          <Text style={styles.retryText}>Try again</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.infoBox}>
                      <Ionicons name="shield-checkmark" size={18} color={RBZ.c2} />
                      <Text style={styles.infoText}>
                        Next step: we’ll ask both users before sharing live location. Nothing is sent yet.
                      </Text>
                    </View>
                  )}
                </>
              )}

                {!!peerId && <Text style={styles.debugHidden}>Peer ID ready</Text>}
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={screenStage === "place-confirmation" && !!pendingConfirmPlace}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {}}
        >
          <View style={styles.popupBackdrop}>
            <View style={styles.popupCardWrap}>
              {pendingConfirmPlace ? (
                <MeetMiddlePlaceConfirmationCard
                  peerName={displayName}
                  place={pendingConfirmPlace}
                  loading={placeActionLoading}
                  error={placeActionError}
                  onAccept={handleAcceptSelectedPlace}
                  onPickAnother={handlePickAnotherPlace}
                />
              ) : null}
            </View>
          </View>
        </Modal>

        <Modal
          visible={screenStage === "final-confirmed" && !!finalMeetPlace}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setScreenStage("map-stage")}
        >
          <View style={styles.popupBackdrop}>
            <View style={styles.popupCardWrap}>
              <Pressable
                onPress={() => setScreenStage("map-stage")}
                style={({ pressed }) => [
                  styles.popupCloseButton,
                  pressed && styles.pressed,
                ]}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color={RBZ.ink} />
              </Pressable>

              {finalMeetPlace ? (
                <MeetMiddleFinalMeetupCard
                  peerName={displayName}
                  place={finalMeetPlace}
                  onMessagePeer={handleMessagePeer}
                />
              ) : null}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: RBZ.white,
  },
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 54,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: RBZ.line,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: RBZ.ink,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.1,
  },
  headerSubtitle: {
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
   headerRightSpacer: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
   scrollContent: {
    paddingTop: 2,
    alignItems: "center",
  },
  centerWrap: {
    width: "100%",
  },
   heroCard: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: RBZ.line,
    shadowColor: "#b1123c",
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
   heroCardConsentOnly: {
    borderRadius: 22,
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 5,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF0F6",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.16)",
    marginBottom: 10,
  },
  badgeText: {
    color: RBZ.c1,
    fontSize: 11,
    fontWeight: "900",
  },
   logoOuter: {
    alignSelf: "center",
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F6",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
    shadowColor: RBZ.c2,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 7,
    marginBottom: 10,
  },
   logoCard: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.16)",
  },
  logoGlow: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5F9",
  },
   logoLabelPill: {
    position: "absolute",
    bottom: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.14)",
  },
  logoLabelText: {
    color: RBZ.c1,
    fontSize: 10,
    fontWeight: "900",
  },
   title: {
    color: RBZ.ink,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.35,
    marginTop: 2,
  },
  description: {
    color: "#5b2536",
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 9,
    paddingHorizontal: 2,
  },
   matchCard: {
    marginTop: 14,
    borderRadius: 22,
    padding: 10,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.13)",
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: "#FFF0F6",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.18)",
  },
   avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  matchTextWrap: {
    flex: 1,
    paddingHorizontal: 11,
  },
   matchLabel: {
    color: RBZ.gray,
    fontSize: 10.5,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  matchName: {
    color: RBZ.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  matchIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F6",
  },
      startButtonWrap: {
    marginTop: 16,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: RBZ.c2,
    shadowOpacity: 0.20,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  startButtonDisabled: {
    opacity: 0.82,
  },
  startButton: {
    minHeight: 52,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 14,
  },
   startButtonText: {
    color: RBZ.white,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: 0.1,
  },
  infoBox: {
    marginTop: 12,
    borderRadius: 18,
    padding: 11,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.13)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
   infoText: {
    flex: 1,
    color: "#6f3145",
    fontSize: 11.8,
    lineHeight: 16,
    fontWeight: "700",
  },
  successBox: {
    marginTop: 12,
    borderRadius: 18,
    padding: 11,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.18)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  successText: {
    flex: 1,
    color: "#065F46",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "800",
  },
  errorBox: {
    marginTop: 16,
    borderRadius: 20,
    padding: 13,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  errorTextWrap: {
    flex: 1,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "800",
  },
  retryText: {
    color: RBZ.c2,
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 6,
  },
   placeStatusBox: {
    marginTop: 14,
    borderRadius: 22,
    padding: 13,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.18)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  placeStatusTextWrap: {
    flex: 1,
  },
  placeStatusTitle: {
    color: "#065F46",
    fontSize: 13,
    fontWeight: "900",
  },
  placeStatusText: {
    flex: 1,
    color: "#065F46",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  placeErrorBox: {
    marginTop: 12,
    borderRadius: 20,
    padding: 13,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  placeErrorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "800",
  },
  debugHidden: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.34)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  popupCardWrap: {
    width: "100%",
    maxWidth: 430,
    position: "relative",
  },
  popupCloseButton: {
    position: "absolute",
    top: -12,
    right: -6,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: RBZ.line,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
});