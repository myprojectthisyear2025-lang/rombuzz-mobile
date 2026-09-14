/**
 * Path: src/features/socialStats/SocialStatsUserCard.tsx
 * Purpose: Theme-aware person card for Likes Sent, Likes You, and Matches lists.
 */

import {
  Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

type Props = {
  user: SocialStatsUser;

  activeTab:
    | SocialStatsTab
    | null;

  onView: (
    id: string
  ) => void;

  onChat: (
    id: string
  ) => void;

  onRespond: (
    id: string,
    action:
      | "accept"
      | "reject"
  ) => void;

  onUnmatch: (
    id: string,
    name: string
  ) => void;

  onRemove: (
    id: string,
    name: string
  ) => void;

  onReport: (
    user: SocialStatsUser
  ) => void;
};

export default function SocialStatsUserCard(
  props: Props
) {
  const {
    colors,
  } = useRomBuzzTheme();

  const {
    user,
    activeTab,
  } = props;

  const id =
    socialUserId(user);

  if (!id) {
    return null;
  }

  const name =
    String(
      user?.firstName ||
        user?.name ||
        "User"
    );

  const fullName =
    [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    name;

  const meta =
    [
      user?.age
        ? `${user.age}`
        : "",

      user?.location ||
        "",

      user?.gender ||
        "",
    ]
      .filter(Boolean)
      .join("  •  ");

  const actionStyle = (
    primary = false
  ) => [
    styles.action,

    primary
      ? styles.primaryAction
      : styles.secondaryAction,

    {
      backgroundColor:
        primary
          ? colors.brand
          : colors.surfaceMuted,

      borderColor:
        primary
          ? colors.brand
          : colors.border,
    },
  ];

  const actionTextColor = (
    primary = false
  ) =>
    primary
      ? colors.white
      : colors.text;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },
      ]}
    >
      <TouchableOpacity
        style={
          styles.profileRow
        }
        onPress={() =>
          props.onView(id)
        }
        activeOpacity={0.78}
      >
        <View
          style={[
            styles.avatarWrap,
            {
              backgroundColor:
                colors.surfaceMuted,
            },
          ]}
        >
          {user.avatar ? (
            <Image
              source={{
                uri:
                  user.avatar,
              }}
              style={
                styles.avatar
              }
            />
          ) : (
            <View
              style={
                styles.avatarFallback
              }
            >
              <Text
                style={[
                  styles.avatarLetter,
                  {
                    color:
                      colors.brand,
                  },
                ]}
              >
                {(
                  user.firstName?.[0] ||
                  user.lastName?.[0] ||
                  "U"
                ).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View
          style={styles.info}
        >
          <View
            style={
              styles.nameRow
            }
          >
            <Text
              style={[
                styles.name,
                {
                  color:
                    colors.text,
                },
              ]}
              numberOfLines={1}
            >
              {fullName}
            </Text>

            {user.verified ? (
              <Ionicons
                name="checkmark-circle"
                size={15}
                color="#2F8BFF"
                style={{
                  marginLeft: 5,
                }}
              />
            ) : null}
          </View>

          {meta ? (
            <Text
              style={[
                styles.meta,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {meta}
            </Text>
          ) : null}

          {user.bio ? (
            <Text
              style={[
                styles.bio,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {user.bio}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <View
        style={
          styles.actions
        }
      >
        {activeTab ===
        "likedYou" ? (
          <>
            <TouchableOpacity
              style={
                actionStyle(
                  true
                )
              }
              onPress={() =>
                props.onRespond(
                  id,
                  "accept"
                )
              }
            >
              <Ionicons
                name="heart"
                size={15}
                color={
                  colors.white
                }
              />

              <Text
                style={[
                  styles.actionText,
                  {
                    color:
                      colors.white,
                  },
                ]}
              >
                Accept
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                actionStyle()
              }
              onPress={() =>
                props.onRespond(
                  id,
                  "reject"
                )
              }
            >
              <Ionicons
                name="close"
                size={17}
                color={
                  colors.text
                }
              />

              <Text
                style={[
                  styles.actionText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Reject
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        {activeTab ===
        "liked" ? (
          <TouchableOpacity
            style={
              actionStyle()
            }
            onPress={() =>
              props.onRemove(
                id,
                name
              )
            }
          >
            <Ionicons
              name="close"
              size={17}
              color={
                colors.text
              }
            />

            <Text
              style={[
                styles.actionText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Remove
            </Text>
          </TouchableOpacity>
        ) : null}

        {activeTab ===
        "matches" ? (
          <>
            <TouchableOpacity
              style={
                actionStyle(
                  true
                )
              }
              onPress={() =>
                props.onChat(
                  id
                )
              }
            >
              <Ionicons
                name="chatbubble"
                size={14}
                color={
                  colors.white
                }
              />

              <Text
                style={[
                  styles.actionText,
                  {
                    color:
                      colors.white,
                  },
                ]}
              >
                Chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                actionStyle()
              }
              onPress={() =>
                props.onUnmatch(
                  id,
                  name
                )
              }
            >
              <Ionicons
                name="person-remove-outline"
                size={15}
                color={
                  colors.text
                }
              />

              <Text
                style={[
                  styles.actionText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Unmatch
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          style={
            actionStyle()
          }
          onPress={() =>
            props.onView(id)
          }
        >
          <Ionicons
            name="eye-outline"
            size={15}
            color={
              actionTextColor()
            }
          />

          <Text
            style={[
              styles.actionText,
              {
                color:
                  actionTextColor(),
              },
            ]}
          >
            View
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={
          styles.reportButton
        }
        onPress={() =>
          props.onReport(
            user
          )
        }
      >
        <Ionicons
          name="flag-outline"
          size={13}
          color={
            colors.textMuted
          }
        />

        <Text
          style={[
            styles.reportText,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          Report
        </Text>
      </TouchableOpacity>
    </View>
  );
}