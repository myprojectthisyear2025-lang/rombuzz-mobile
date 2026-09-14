/**
 * Path: src/features/socialStats/SocialStatsListModal.tsx
 * Purpose: Modern light/dark modal for existing Social Stats connection lists.
 */

import {
  Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import RBZReportSheet from "@/src/components/reporting/RBZReportSheet";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  socialListStyles as styles,
} from "./socialStatsListStyles";

import {
  SocialStatsTab,
  SocialStatsUser,
  socialUserId,
} from "./socialStatsTypes";

import SocialStatsUserCard from "./SocialStatsUserCard";

import {
  useSocialStatsListActions,
} from "./useSocialStatsListActions";

type Props = {
  visible: boolean;
  onClose: () => void;
  activeTab:
    | SocialStatsTab
    | null;
  list: SocialStatsUser[];
  listLoading: boolean;
  onRefresh: () => void;
};

const COPY = {
  liked: [
    "Likes Sent",
    "People you've liked",
  ],
  likedYou: [
    "Likes You",
    "People who liked your profile",
  ],
  matches: [
    "Matches",
    "Your mutual connections",
  ],
} as const;

export default function SocialStatsListModal(
  props: Props
) {
  const insets =
    useSafeAreaInsets();

  const {
    colors,
  } = useRomBuzzTheme();

  const actions =
    useSocialStatsListActions(
      props
    );

  const copy =
    props.activeTab
      ? COPY[
          props.activeTab
        ]
      : ["", ""];

  const emptyTitle =
    props.activeTab ===
    "liked"
      ? "No likes sent yet"
      : props.activeTab ===
        "likedYou"
      ? "No likes waiting"
      : "No matches yet";

  const emptyText =
    props.activeTab ===
    "liked"
      ? "Profiles you like will appear here."
      : props.activeTab ===
        "likedYou"
      ? "When someone likes you, they’ll appear here."
      : "Keep exploring and your matches will appear here.";

  return (
    <Modal
      visible={
        props.visible
      }
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={
        props.onClose
      }
    >
      <View
        style={[
          styles.screen,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Math.max(
                  insets.top,
                  14
                ),
            },
          ]}
        >
          <TouchableOpacity
            onPress={
              props.onClose
            }
            style={[
              styles.headerButton,
              {
                backgroundColor:
                  colors.surfaceMuted,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={
                colors.icon
              }
            />
          </TouchableOpacity>

          <View
            style={
              styles.titleWrap
            }
          >
            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {copy[0]}
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {copy[1]}
            </Text>
          </View>

          <TouchableOpacity
            onPress={
              props.onRefresh
            }
            style={[
              styles.headerButton,
              {
                backgroundColor:
                  colors.surfaceMuted,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Ionicons
              name="refresh"
              size={19}
              color={
                colors.icon
              }
            />
          </TouchableOpacity>
        </View>

        <View
          style={styles.body}
        >
          {props.listLoading ? (
            <View
              style={
                styles.loading
              }
            >
              <ActivityIndicator
                size="large"
                color={
                  colors.brand
                }
              />

              <Text
                style={[
                  styles.loadingText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Loading
                connections...
              </Text>
            </View>
          ) : props.list
              .length === 0 ? (
            <View
              style={
                styles.empty
              }
            >
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor:
                      colors.brandSoft,
                  },
                ]}
              >
                <Ionicons
                  name={
                    props.activeTab ===
                    "matches"
                      ? "people-outline"
                      : "heart-outline"
                  }
                  size={34}
                  color={
                    colors.brand
                  }
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {emptyTitle}
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {emptyText}
              </Text>
            </View>
          ) : (
            <FlatList
              data={
                props.list
              }
              keyExtractor={(
                item
              ) =>
                socialUserId(
                  item
                )
              }
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.listContent
              }
              removeClippedSubviews
              initialNumToRender={
                6
              }
              windowSize={7}
              maxToRenderPerBatch={
                6
              }
              updateCellsBatchingPeriod={
                50
              }
              renderItem={({
                item,
              }) => (
                <SocialStatsUserCard
                  user={item}
                  activeTab={
                    props.activeTab
                  }
                  onView={
                    actions.viewProfile
                  }
                  onChat={
                    actions.chat
                  }
                  onRespond={
                    actions.respondLike
                  }
                  onUnmatch={
                    actions.unmatch
                  }
                  onRemove={
                    actions.cancelLike
                  }
                  onReport={
                    actions.report
                  }
                />
              )}
            />
          )}
        </View>

        {actions.reportUser ? (
          <RBZReportSheet
            visible={
              actions.reportSheetOpen
            }
            onClose={
              actions.closeReport
            }
            onSubmitted={() => {
              actions.closeReport();
              props.onRefresh();
            }}
            target={{
              targetType:
                "profile",

              targetId:
                String(
                  actions
                    .reportUser
                    .id || ""
                ),

              reportedUserId:
                String(
                  actions
                    .reportUser
                    .id || ""
                ),

              targetOwnerId:
                String(
                  actions
                    .reportUser
                    .id || ""
                ),

              source:
                props.activeTab ===
                "matches"
                  ? "mobile_social_stats_matches"
                  : props.activeTab ===
                    "likedYou"
                  ? "mobile_social_stats_liked_you"
                  : "mobile_social_stats_liked",

              title:
                actions
                  .reportUser
                  .displayName ||
                "RomBuzz user",

              subtitle:
                props.activeTab ===
                "matches"
                  ? "Matched profile"
                  : props.activeTab ===
                    "likedYou"
                  ? "User who liked you"
                  : "Profile you liked",

              avatar:
                actions
                  .reportUser
                  .avatar || "",

              evidenceSnapshot: {
                screen:
                  "social_stats",

                activeTab:
                  props.activeTab,

                reportedUserId:
                  String(
                    actions
                      .reportUser
                      .id || ""
                  ),

                reportedUserName:
                  actions
                    .reportUser
                    .displayName ||
                  "",

                reportedUserAvatar:
                  actions
                    .reportUser
                    .avatar || "",

                age:
                  actions
                    .reportUser
                    .age || null,

                location:
                  actions
                    .reportUser
                    .location ||
                  "",

                gender:
                  actions
                    .reportUser
                    .gender || "",

                allowUnmatch:
                  props.activeTab ===
                  "matches",
              },
            }}
          />
        ) : null}
      </View>
    </Modal>
  );
}