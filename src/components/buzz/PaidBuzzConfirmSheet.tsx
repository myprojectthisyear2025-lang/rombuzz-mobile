/**
 * ============================================================================
 * 📁 File: src/components/buzz/PaidBuzzConfirmSheet.tsx
 * 🎯 Purpose: Premium confirmation showcase before spending BuzzCoin
 *
 * Used by:
 * - src/components/profile/BuzzPokeCard.tsx
 *
 * What this does:
 * - Showcases the selected Premium Buzz as a desirable experience.
 * - Shows Buzz price and spendable balance.
 * - Lets user remember the paid Buzz for this match.
 * - Lets user cancel, send, or buy BuzzCoin when balance is insufficient.
 * - Does NOT change any Buzz/payment behavior.
 * ============================================================================
 */

import { formatBuzzPrice, type BuzzType } from "@/src/config/buzzTypes";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  buzzType: BuzzType | null;
  spendableBalance: number | null;
  rememberChoice: boolean;
  sending?: boolean;
  onRememberChoiceChange: (nextValue: boolean) => void;
  onCancel: () => void;
  onSend: () => void;
  onBuyBuzzCoin: () => void;
};

export default function PaidBuzzConfirmSheet({
  visible,
  buzzType,
  spendableBalance,
  rememberChoice,
  sending,
  onRememberChoiceChange,
  onCancel,
  onSend,
  onBuyBuzzCoin,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useRomBuzzTheme();

  const notEnough =
    !!buzzType &&
    buzzType.isPaid &&
    spendableBalance !== null &&
    spendableBalance < buzzType.price;

  const shortfall =
    buzzType && spendableBalance !== null
      ? Math.max(0, buzzType.price - spendableBalance)
      : 0;

  const balanceLabel =
    spendableBalance === null
      ? "Unavailable"
      : `${spendableBalance} BC`;

  return (
    <Modal
      visible={visible && !!buzzType}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!sending) onCancel();
      }}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (!sending) onCancel();
        }}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(16, insets.bottom + 10),
            },
          ]}
        >
          {buzzType ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: colors.borderStrong,
                  },
                ]}
              />

              <LinearGradient
                colors={buzzType.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.heroShade} />

                <View style={styles.heroTop}>
                  <View style={styles.premiumBadge}>
                    <Ionicons
                      name="sparkles"
                      size={11}
                      color="#ffffff"
                    />

                    <Text style={styles.premiumBadgeText}>
                      PREMIUM BUZZ
                    </Text>
                  </View>

                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>
                      {formatBuzzPrice(buzzType)}
                    </Text>
                  </View>
                </View>

                <View style={styles.emojiGlow}>
                  <Text style={styles.heroEmoji}>
                    {buzzType.emoji}
                  </Text>
                </View>

                <Text style={styles.heroTitle}>
                  {buzzType.label}
                </Text>

                <Text style={styles.heroDescription}>
                  {buzzType.description}
                </Text>
              </LinearGradient>

              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionEyebrow,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  THE MOMENT
                </Text>

                <Text
                  style={[
                    styles.sectionBody,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {notEnough
                    ? `You need ${shortfall} more BC to send this experience.`
                    : buzzType.confirmBody}
                </Text>
              </View>



              <View
                style={[
                  styles.walletCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.walletColumn}>
                  <Text
                    style={[
                      styles.walletLabel,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    This Buzz
                  </Text>

                  <Text
                    style={[
                      styles.walletValue,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {formatBuzzPrice(buzzType)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.walletDivider,
                    {
                      backgroundColor: colors.border,
                    },
                  ]}
                />

                <View style={styles.walletColumn}>
                  <Text
                    style={[
                      styles.walletLabel,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Your balance
                  </Text>

                  <Text
                    style={[
                      styles.walletValue,
                      {
                        color: notEnough
                          ? "#D86A62"
                          : colors.text,
                      },
                    ]}
                  >
                    {balanceLabel}
                  </Text>
                </View>
              </View>

              {!notEnough ? (
                <Pressable
                  onPress={() =>
                    onRememberChoiceChange(!rememberChoice)
                  }
                  style={[
                    styles.rememberRow,
                    {
                      backgroundColor: colors.surfaceRaised,
                      borderColor: rememberChoice
                        ? colors.brand
                        : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: rememberChoice
                          ? colors.brand
                          : colors.background,

                        borderColor: rememberChoice
                          ? colors.brand
                          : colors.borderStrong,
                      },
                    ]}
                  >
                    {rememberChoice ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#ffffff"
                      />
                    ) : null}
                  </View>

                  <View style={styles.rememberCopy}>
                    <Text
                      style={[
                        styles.rememberTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Remember {buzzType.shortLabel} Buzz for this match
                    </Text>

                    <Text
                      style={[
                        styles.rememberSub,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      Next tap sends it instantly to this match.
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              <Pressable
                disabled={sending}
                onPress={notEnough ? onBuyBuzzCoin : onSend}
                style={({ pressed }) => [
                  styles.ctaWrap,
                  pressed && !sending
                    ? styles.pressed
                    : null,
                ]}
              >
                <LinearGradient
                  colors={buzzType.gradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  {sending ? (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                    />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>
                        {notEnough
                          ? "Get BuzzCoin"
                          : `Send ${buzzType.shortLabel} Buzz`}
                      </Text>

                      <Text style={styles.ctaEmoji}>
                        {buzzType.emoji}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={onCancel}
                disabled={sending}
                style={styles.cancelButton}
              >
                <Text
                  style={[
                    styles.cancelText,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  Not now
                </Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
 backdrop: {
  flex: 1,
  backgroundColor: "rgba(5,8,15,0.68)",
  justifyContent: "center",
},

 sheet: {
  maxHeight: "78%",
  marginHorizontal: 20,
  borderRadius: 24,
  overflow: "hidden",
},

  content: {
    paddingHorizontal: 12,
    paddingTop: 7,
  },

  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 12,
  },

hero: {
  minHeight: 172,
  borderRadius: 20,
  padding: 13,
  overflow: "hidden",
  alignItems: "center",
},

  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,10,18,0.15)",
  },

  heroTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  premiumBadgeText: {
    color: "#ffffff",
    fontFamily: RBZFont.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },

  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(10,12,20,0.24)",
  },

  priceBadgeText: {
    color: "#ffffff",
    fontFamily: RBZFont.bold,
    fontSize: 11,
  },

emojiGlow: {
  width: 62,
  height: 62,
  marginTop: 6,
  borderRadius: 31,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.18)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.28)",
},

heroEmoji: {
  fontSize: 34,
},

heroTitle: {
  marginTop: 7,
  color: "#ffffff",
  fontFamily: RBZFont.extraBold,
  fontSize: 20,
  textAlign: "center",
},

heroDescription: {
  maxWidth: 270,
  marginTop: 3,
  color: "rgba(255,255,255,0.88)",
  fontFamily: RBZFont.medium,
  fontSize: 11.5,
  lineHeight: 16,
  textAlign: "center",
},

 section: {
  paddingHorizontal: 2,
  paddingTop: 11,
},

  sectionEyebrow: {
    fontFamily: RBZFont.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },

  sectionTitle: {
    marginTop: 3,
    fontFamily: RBZFont.bold,
    fontSize: 18,
  },

  sectionBody: {
    marginTop: 5,
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
    lineHeight: 18,
  },

 walletCard: {
  marginTop: 8,
  borderRadius: 14,
  borderWidth: StyleSheet.hairlineWidth,
  paddingVertical: 9,
  flexDirection: "row",
  alignItems: "center",
},

  walletColumn: {
    flex: 1,
    alignItems: "center",
  },

  walletLabel: {
    fontFamily: RBZFont.medium,
    fontSize: 10.5,
  },

  walletValue: {
    marginTop: 3,
    fontFamily: RBZFont.bold,
    fontSize: 16,
  },

  walletDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },

 rememberRow: {
  marginTop: 8,
  borderRadius: 14,
  borderWidth: StyleSheet.hairlineWidth,
  padding: 9,
  flexDirection: "row",
  alignItems: "center",
  gap: 9,
},

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  rememberCopy: {
    flex: 1,
  },

  rememberTitle: {
    fontFamily: RBZFont.semiBold,
    fontSize: 12.5,
  },

  rememberSub: {
    marginTop: 2,
    fontFamily: RBZFont.medium,
    fontSize: 10.5,
    lineHeight: 15,
  },

 ctaWrap: {
  width: "100%",
  marginTop: 11,
  borderRadius: 14,
  overflow: "hidden",
},

cta: {
  minHeight: 46,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
},

  ctaText: {
    color: "#ffffff",
    fontFamily: RBZFont.bold,
    fontSize: 14.5,
  },

  ctaEmoji: {
    fontSize: 17,
  },

  cancelButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontFamily: RBZFont.semiBold,
    fontSize: 12.5,
  },

  pressed: {
    opacity: 0.82,
  },
});