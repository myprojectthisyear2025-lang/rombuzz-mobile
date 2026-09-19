/**
 * Path: src/features/onboarding/FirstSignupTourPreviewSecondary.tsx
 * Purpose: Mini previews for Chat, Social Stats, Notifications, and Profile Tour steps.
 */

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    Ionicons,
} from "@expo/vector-icons";

import React, {
    useMemo,
} from "react";

import {
    Text,
    View,
} from "react-native";

import {
    createFirstSignupTourPreviewStyles,
} from "./FirstSignupTourPreview.styles";

type Preview =
  | "chat"
  | "social"
  | "notifications"
  | "profile";

export default function FirstSignupTourPreviewSecondary({
  preview,
}: {
  preview: Preview;
}) {
  const {
    colors,
    isDark,
  } = useRomBuzzTheme();

  const s = useMemo(
    () =>
      createFirstSignupTourPreviewStyles(
        colors,
        isDark
      ),
    [
      colors,
      isDark,
    ]
  );

  const Header = ({
    meta,
  }: {
    meta: string;
  }) => (
    <View style={s.topLine}>
      <Text
        style={s.miniBrand}
      >
        Rom
        <Text
          style={
            s.brandAccent
          }
        >
          Buzz
        </Text>
      </Text>

      <Text style={s.muted}>
        {meta}
      </Text>
    </View>
  );

  if (preview === "chat") {
    return (
      <View style={s.frame}>
        <Header
          meta="Search matches"
        />

        <View
          style={s.content}
        >
          <Conversation
            unread
          />

          <Conversation />

          <Conversation />
        </View>
      </View>
    );
  }

  if (
    preview === "social"
  ) {
    return (
      <View style={s.frame}>
        <Header
          meta="Social Stats"
        />

        <View
          style={s.content}
        >
          <View
            style={s.hero}
          >
            <View
              style={s.row}
            >
              <View
                style={
                  s.iconBubble
                }
              >
                <Ionicons
                  name="heart"
                  size={17}
                  color={
                    colors.brand
                  }
                />
              </View>

              <View
                style={s.grow}
              >
                <Text
                  style={
                    s.miniTitle
                  }
                >
                  Likes You
                </Text>

                <Text
                  style={
                    s.miniCopy
                  }
                >
                  New profile likes
                  appear here
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={
                  colors.brand
                }
              />
            </View>
          </View>

          <View
            style={s.metrics}
          >
            <Metric
              icon="paper-plane"
              label="Likes Sent"
            />

            <Metric
              icon="heart"
              label="Matches"
            />

            <Metric
              icon="eye"
              label="Views Today"
            />
          </View>
        </View>
      </View>
    );
  }

  if (
    preview ===
    "notifications"
  ) {
    return (
      <View style={s.frame}>
        <Header
          meta="Notifications"
        />

        <View
          style={s.content}
        >
          <Notice
            icon="heart"
            label="Like activity"
          />

          <Notice
            icon="flash"
            label="Buzz activity"
          />

          <Notice
            icon="gift-outline"
            label="Gift activity"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={s.frame}>
      <Header
        meta="Preview · Wallet · Settings"
      />

      <View
        style={
          s.profileHero
        }
      >
        <Ionicons
          name="person-outline"
          size={50}
          color="rgba(255,255,255,0.68)"
        />

        <View
          style={
            s.profileActions
          }
        >
          {[
            "eye-outline",
            "wallet-outline",
            "settings-outline",
          ].map(
            (icon) => (
              <View
                key={icon}
                style={
                  s.profileAction
                }
              >
                <Ionicons
                  name={
                    icon as any
                  }
                  size={12}
                  color="#FFFFFF"
                />
              </View>
            )
          )}
        </View>

        <Text
          style={
            s.profileName
          }
        >
          Your profile
        </Text>
      </View>

      <View
        style={
          s.profileTabs
        }
      >
        <ProfileTab
          icon="images-outline"
          label="Gallery"
          active
        />

        <ProfileTab
          icon="person-outline"
          label="About"
        />

        <ProfileTab
          icon="lock-closed-outline"
          label="Private Notes"
        />
      </View>
    </View>
  );

  function Conversation({
    unread = false,
  }: {
    unread?: boolean;
  }) {
    return (
      <View
        style={
          s.listRow
        }
      >
        <View
          style={s.avatar}
        >
          <Ionicons
            name="person"
            size={14}
            color={
              colors.iconMuted
            }
          />
        </View>

        <View style={s.grow}>
          <Text
            style={
              s.miniTitle
            }
          >
            Match
          </Text>

          <Text
            style={
              s.miniCopy
            }
          >
            Conversation preview
          </Text>
        </View>

        {unread ? (
          <View
            style={
              s.unreadDot
            }
          />
        ) : null}
      </View>
    );
  }

  function Metric({
    icon,
    label,
  }: {
    icon: any;
    label: string;
  }) {
    return (
      <View
        style={s.metric}
      >
        <Ionicons
          name={icon}
          size={14}
          color={
            colors.brand
          }
        />

        <Text
          style={[
            s.miniCopy,
            {
              marginTop: 5,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  }

  function Notice({
    icon,
    label,
  }: {
    icon: any;
    label: string;
  }) {
    return (
      <View
        style={s.notice}
      >
        <View
          style={
            s.iconBubble
          }
        >
          <Ionicons
            name={icon}
            size={15}
            color={
              colors.brand
            }
          />
        </View>

        <View style={s.grow}>
          <Text
            style={
              s.miniTitle
            }
          >
            {label}
          </Text>

          <Text
            style={
              s.miniCopy
            }
          >
            Important RomBuzz
            activity
          </Text>
        </View>
      </View>
    );
  }

  function ProfileTab({
    icon,
    label,
    active = false,
  }: {
    icon: any;
    label: string;
    active?: boolean;
  }) {
    return (
      <View
        style={
          s.profileTab
        }
      >
        <Ionicons
          name={icon}
          size={13}
          color={
            active
              ? colors.brand
              : colors.iconMuted
          }
        />

        <Text
          style={[
            s.muted,
            {
              color:
                active
                  ? colors.text
                  : colors.textSecondary,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  }
}