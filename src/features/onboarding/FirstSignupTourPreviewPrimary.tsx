/**
 * Path: src/features/onboarding/FirstSignupTourPreviewPrimary.tsx
 * Purpose: Mini previews for Home, Discover, MicroBuzz, and Let’sBuzz Tour steps.
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
  | "home"
  | "discover"
  | "microbuzz"
  | "letsbuzz";

export default function FirstSignupTourPreviewPrimary({
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

  if (preview === "home") {
    return (
      <View style={s.frame}>
        <Header
          meta="Romance & Buzz"
        />

        <View
          style={s.content}
        >
          <View
            style={s.cards}
          >
            <Feature
              icon="flash"
              title="MicroBuzz"
              copy="Vibes nearby"
            />

            <Feature
              icon="sparkles"
              title="Discover"
              copy="Curated matches"
            />
          </View>

          <View
            style={
              s.pulseGrid
            }
          >
            {[
              [
                "location-outline",
                "Nearby",
              ],
              [
                "people-outline",
                "Matches",
              ],
              [
                "chatbubble-outline",
                "Chats",
              ],
              [
                "person-outline",
                "Profile",
              ],
            ].map(
              ([
                icon,
                label,
              ]) => (
                <View
                  key={label}
                  style={
                    s.pulse
                  }
                >
                  <Ionicons
                    name={
                      icon as any
                    }
                    size={15}
                    color={
                      colors.icon
                    }
                  />

                  <Text
                    style={
                      s.muted
                    }
                  >
                    {label}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
      </View>
    );
  }

  if (
    preview === "discover"
  ) {
    return (
      <View style={s.frame}>
        <Header
          meta="Discover"
        />

        <View
          style={s.content}
        >
          <View
            style={
              s.discoverCard
            }
          >
            <View
              style={
                s.personBubble
              }
            >
              <Ionicons
                name="person"
                size={31}
                color={
                  colors.iconMuted
                }
              />
            </View>

            <Text
              style={
                s.discoverName
              }
            >
              Discover profile
            </Text>

            <View
              style={s.chips}
            >
              <View
                style={s.chip}
              >
                <Text
                  style={
                    s.chipText
                  }
                >
                  Shared vibe
                </Text>
              </View>

              <View
                style={s.chip}
              >
                <Text
                  style={
                    s.chipText
                  }
                >
                  Nearby
                </Text>
              </View>
            </View>

            <View
              style={
                s.actions
              }
            >
              <Action
                icon="close"
                bg={
                  colors.overlay
                }
                color={
                  colors.white
                }
              />

              <Action
                icon="heart"
                bg={
                  colors.brand
                }
                color={
                  colors.white
                }
                large
              />

              <Action
                icon="person"
                bg={
                  colors.surface
                }
                color={
                  colors.text
                }
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (
    preview === "microbuzz"
  ) {
    return (
      <View style={s.frame}>
        <Header
          meta="Location On"
        />

        <View
          style={s.radar}
        >
          {[
            174,
            126,
            78,
          ].map((size) => (
            <View
              key={size}
              style={[
                s.radarRing,
                {
                  width: size,
                  height: size,
                },
              ]}
            />
          ))}

          <View
            style={[
              s.radarDot,
              {
                left: "24%",
                top: "29%",
              },
            ]}
          >
            <Ionicons
              name="person"
              size={12}
              color={
                colors.iconMuted
              }
            />
          </View>

          <View
            style={[
              s.radarDot,
              {
                right: "23%",
                bottom: "28%",
              },
            ]}
          >
            <Ionicons
              name="person"
              size={12}
              color={
                colors.iconMuted
              }
            />
          </View>

          <View
            style={
              s.radarCenter
            }
          >
            <Ionicons
              name="flash"
              size={22}
              color={
                colors.brand
              }
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.frame}>
      <Header
        meta="Let’sBuzz"
      />

      <View style={s.tabs}>
        <Tab
          icon="newspaper"
          label="Posts"
          active
        />

        <Tab
          icon="play-circle-outline"
          label="Reels"
        />
      </View>

      <View style={s.post}>
        <View style={s.row}>
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
              Match activity
            </Text>

            <Text
              style={
                s.miniCopy
              }
            >
              Moments from people
              you matched with
            </Text>
          </View>
        </View>

        <View
          style={s.postMedia}
        >
          <Ionicons
            name="image-outline"
            size={23}
            color={
              colors.iconMuted
            }
          />
        </View>
      </View>
    </View>
  );

  function Feature({
    icon,
    title,
    copy,
  }: {
    icon: any;
    title: string;
    copy: string;
  }) {
    return (
      <View
        style={
          s.featureCard
        }
      >
        <View
          style={
            s.featureIcon
          }
        >
          <Ionicons
            name={icon}
            size={16}
            color={
              colors.brand
            }
          />
        </View>

        <View>
          <Text
            style={
              s.featureTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              s.featureCopy
            }
          >
            {copy}
          </Text>
        </View>
      </View>
    );
  }

  function Action({
    icon,
    bg,
    color,
    large = false,
  }: {
    icon: any;
    bg: string;
    color: string;
    large?: boolean;
  }) {
    return (
      <View
        style={[
          s.action,
          {
            backgroundColor:
              bg,
          },
          large && {
            width: 47,
            height: 47,
            borderRadius: 24,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={
            large
              ? 22
              : 18
          }
          color={color}
        />
      </View>
    );
  }

  function Tab({
    icon,
    label,
    active = false,
  }: {
    icon: any;
    label: string;
    active?: boolean;
  }) {
    return (
      <View style={s.tab}>
        <View style={s.row}>
          <Ionicons
            name={icon}
            size={14}
            color={
              active
                ? colors.brand
                : colors.iconMuted
            }
          />

          <Text
            style={[
              s.tabText,
              {
                color:
                  active
                    ? colors.brand
                    : colors.textMuted,
              },
            ]}
          >
            {label}
          </Text>
        </View>

        {active ? (
          <View
            style={
              s.tabIndicator
            }
          />
        ) : null}
      </View>
    );
  }
}