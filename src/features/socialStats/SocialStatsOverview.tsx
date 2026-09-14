/**
 * Path: src/features/socialStats/SocialStatsOverview.tsx
 * Purpose: Locked Social Stats overview design matching the RomBuzz Home visual system.
 */

import {
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  socialOverviewStyles as styles,
} from "./socialStatsOverviewStyles";

import {
  SocialStatsCounts,
  SocialStatsTab,
  SocialStatsUser,
} from "./socialStatsTypes";

type Props = {
  social: SocialStatsCounts;
  preview: SocialStatsUser[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenList: (
    tab: SocialStatsTab
  ) => void;
};

function AvatarStack({
  users,
  count,
}: {
  users: SocialStatsUser[];
  count: number;
}) {
  const {
    colors,
  } = useRomBuzzTheme();

  const shown =
    users.slice(0, 4);

  const visibleUsers =
    shown.length
      ? shown
      : count > 0
      ? [{}, {}, {}]
      : [];

  return (
    <View
      style={
        styles.recentAvatars
      }
    >
      {visibleUsers.map(
        (user, index) =>
          user.avatar ? (
            <Image
              key={`${user.avatar}-${index}`}
              source={{
                uri:
                  user.avatar,
              }}
              style={[
                styles.previewAvatar,
                index
                  ? styles.previewAvatarOffset
                  : null,
                {
                  borderColor:
                    colors.surface,
                  backgroundColor:
                    colors.surfaceMuted,
                },
              ]}
            />
          ) : (
            <View
              key={`fallback-${index}`}
              style={[
                styles.previewAvatar,
                styles.previewFallback,
                index
                  ? styles.previewAvatarOffset
                  : null,
                {
                  borderColor:
                    colors.surface,
                  backgroundColor:
                    colors.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={14}
                color={
                  colors.iconMuted
                }
              />
            </View>
          )
      )}

      {count >
      shown.length ? (
        <View
          style={[
            styles.previewMore,
            {
              backgroundColor:
                colors.brandSoft,
            },
          ]}
        >
          <Text
            style={[
              styles.previewMoreText,
              {
                color:
                  colors.brand,
              },
            ]}
          >
            +
            {count -
              shown.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  meta,
  onPress,
}: {
  icon: React.ComponentProps<
    typeof FontAwesome5
  >["name"];
  label: string;
  value: number;
  meta?: string;
  onPress?: () => void;
}) {
  const {
    colors,
  } = useRomBuzzTheme();

  return (
    <TouchableOpacity
      style={[
        styles.metricCard,
        {
          backgroundColor:
            colors.surface,
          borderColor:
            colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={
        onPress
          ? 0.75
          : 1
      }
      disabled={!onPress}
    >
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor:
              colors.brandSoft,
          },
        ]}
      >
        <FontAwesome5
          name={icon}
          size={15}
          color={colors.brand}
        />
      </View>

      <Text
        style={[
          styles.metricLabel,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.metricValue,
          {
            color:
              colors.text,
          },
        ]}
      >
        {value}
      </Text>

      {meta ? (
        <Text
          style={[
            styles.metricMeta,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {meta}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function SocialStatsOverview(
  props: Props
) {
  const {
    colors,
    isDark,
  } = useRomBuzzTheme();

  const heroBackground =
    isDark
      ? "#24171D"
      : "#FFF1F5";

  const heroBorder =
    isDark
      ? "#6A2B42"
      : "#FFD0DC";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
      refreshControl={
        <RefreshControl
          refreshing={
            props.refreshing
          }
          onRefresh={
            props.onRefresh
          }
          tintColor={
            colors.brand
          }
          colors={[
            colors.brand,
          ]}
        />
      }
    >
      <TouchableOpacity
        style={[
          styles.hero,
          {
            backgroundColor:
              heroBackground,
            borderColor:
              heroBorder,
          },
        ]}
        onPress={() =>
          props.onOpenList(
            "likedYou"
          )
        }
        activeOpacity={0.82}
      >
        <View
          style={[
            styles.heroGlow,
            {
              backgroundColor:
                colors.brandSoft,
            },
          ]}
        />

        <View
          style={
            styles.heroTop
          }
        >
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor:
                  colors.brandSoft,
              },
            ]}
          >
            <Ionicons
              name="heart"
              size={25}
              color={
                colors.brand
              }
            />
          </View>

          <View
            style={
              styles.heroCopy
            }
          >
            <Text
              style={[
                styles.heroLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Likes You
            </Text>

            <View
              style={
                styles.heroCountRow
              }
            >
              <Text
                style={[
                  styles.heroCount,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {
                  props.social
                    .likedYouCount
                }
              </Text>

              <View
                style={[
                  styles.heroPill,
                  {
                    borderColor:
                      heroBorder,
                    backgroundColor:
                      colors.brandSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroPillText,
                    {
                      color:
                        colors.brand,
                    },
                  ]}
                >
                  Waiting for you
                </Text>
              </View>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.brand}
          />
        </View>

        <View
          style={
            styles.previewRow
          }
        >
          <AvatarStack
            users={
              props.preview
            }
            count={
              props.social
                .likedYouCount
            }
          />
        </View>
      </TouchableOpacity>

      <View
        style={
          styles.metricsRow
        }
      >
        <MetricCard
          icon="paper-plane"
          label="Likes Sent"
          value={
            props.social
              .likedCount
          }
          onPress={() =>
            props.onOpenList(
              "liked"
            )
          }
        />

        <MetricCard
          icon="heart"
          label="Matches"
          value={
            props.social
              .matchCount
          }
          onPress={() =>
            props.onOpenList(
              "matches"
            )
          }
        />

        <MetricCard
          icon="eye"
          label="Views Today"
          value={
            props.social
              .viewsToday
          }
          meta={`${props.social.viewsTotal} total`}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.recent,
          {
            backgroundColor:
              colors.surface,
            borderColor:
              colors.border,
          },
        ]}
        onPress={() =>
          props.onOpenList(
            "likedYou"
          )
        }
        activeOpacity={0.78}
      >
        <View
          style={
            styles.recentHeader
          }
        >
          <Text
            style={[
              styles.recentTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Recent activity
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.brand}
          />
        </View>

        <View
          style={
            styles.recentBody
          }
        >
          {props.social
            .likedYouCount >
          0 ? (
            <AvatarStack
              users={
                props.preview
              }
              count={
                props.social
                  .likedYouCount
              }
            />
          ) : (
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor:
                    colors.brandSoft,
                },
              ]}
            >
              <Ionicons
                name="heart-outline"
                size={15}
                color={
                  colors.brand
                }
              />
            </View>
          )}

          <Text
            style={[
              styles.recentText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {props.social
              .likedYouCount >
            0
              ? "People who liked your profile are waiting here."
              : "New profile likes will show up here."}
          </Text>
        </View>
      </TouchableOpacity>

      <View
        style={
          styles.sideNote
        }
        pointerEvents="none"
      >
        <Text
          style={[
            styles.sideNoteText,
            {
              color:
                colors.brand,
            },
          ]}
        >
          More than matches ♡
        </Text>
      </View>
    </ScrollView>
  );
}