/**
 * ============================================================
 * 📁 Location: app/wallet.tsx
 * 🪙 Purpose: RomBuzz BuzzCoin Wallet screen.
 *
 * Used by:
 *  - Mobile app route: /wallet
 *
 * V1 behavior:
 *  - Shows spendable BuzzCoin balance.
 *  - Shows normal wallet transaction history.
 *  - Hides creator earnings, pending payout, withdrawal UI,
 *    and creator/payout ledger entries.
 *
 * Future creator-wallet functionality remains in this file
 * behind a V1 visibility flag so it can be restored later
 * without rebuilding the wallet.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config/api";
import { useBuzzCoinWallet } from "@/src/hooks/gifts/useBuzzCoinWallet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

/**
 * V1 launch:
 * Creator earnings, pending payouts and withdrawal UI remain
 * implemented but hidden until RomBuzz enables that system.
 */
const SHOW_CREATOR_WALLET_V1 = false;

const COLORS = {
  primary: "#b1123c",
  primaryLight: "#d8345f",
  primaryGradientStart: "#b1123c",
  primaryGradientEnd: "#e9486a",
  secondary: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  inkLight: "#374151",
  muted: "#6b7280",
  mutedLight: "#9ca3af",
  background: "#fafaf9",
  cardBg: "#ffffff",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  border: "rgba(0,0,0,0.08)",
  borderLight: "rgba(0,0,0,0.05)",
};

type LedgerRow = {
  id?: string;
  _id?: string;
  userId?: string;
  type?: string;
  amountBC?: number;
  balanceAfterBC?: number;
  source?: string;
  referenceId?: string;
  reason?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
};

type WalletTab = "all" | "spending" | "earning";

function formatBC(value: any) {
  const n = Math.floor(Number(value) || 0);
  return n.toLocaleString();
}

function formatDate(value: any) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(value: any) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function isDebit(row: LedgerRow) {
  const amount = Number(row?.amountBC || 0);
  const type = String(row?.type || "").toLowerCase();
  if (amount < 0) return true;
  return type.includes("send") || type.includes("debit") || type.includes("withdrawal_request");
}

function isCredit(row: LedgerRow) {
  const amount = Number(row?.amountBC || 0);
  return amount > 0 && !isDebit(row);
}

function isCreatorWalletRow(row: LedgerRow) {
  const bucket = String(
    row?.metadata?.walletBucket || ""
  )
    .trim()
    .toLowerCase();

  const type = String(row?.type || "")
    .trim()
    .toLowerCase();

  const source = String(row?.source || "")
    .trim()
    .toLowerCase();

  return (
    bucket === "earned" ||
    bucket === "pending" ||
    type === "withdrawal_request" ||
    type.includes("creator_earning") ||
    (
      source === "chat_media_unlock" &&
      type === "gift_receive"
    )
  );
}

function getBucketLabel(row: LedgerRow) {
  const bucket = String(row?.metadata?.walletBucket || "").toLowerCase();
  if (bucket === "earned") return "Creator earnings";
  if (bucket === "pending") return "Pending payout";
  return "Spendable balance";
}

function getRowTitle(row: LedgerRow) {
  const source = String(row?.source || "").toLowerCase();
  const type = String(row?.type || "").toLowerCase();
  const reason = String(row?.reason || "").trim();

  if (source === "chat_media_unlock" && type === "gift_receive") return "Gifted media earning";
  if (source === "chat_media_unlock" && type === "gift_send") return "Gifted media unlocked";
  if (type === "gift_receive") return "Gift received";
  if (type === "gift_send") return "Gift sent";
  if (type === "dev_credit") return "Test BuzzCoin added";
  if (type === "withdrawal_request") return "Withdrawal request";
  return reason || "BuzzCoin activity";
}

function getRowSubtitle(row: LedgerRow) {
  const source = String(row?.source || "").toLowerCase();
  const bucket = getBucketLabel(row);
  const date = formatDate(row?.createdAt);
  const time = formatTime(row?.createdAt);
  const when = [date, time].filter(Boolean).join(" • ");

  if (source === "chat_media_unlock") return [`${bucket}`, "Paid media", when].filter(Boolean).join(" • ");
  if (source === "gift") return [`${bucket}`, "Gift system", when].filter(Boolean).join(" • ");
  return [bucket, when].filter(Boolean).join(" • ");
}

async function fetchLedgerRows() {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");
  const res = await fetch(`${API_BASE}/gifts/ledger?limit=80`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || data?.error || "Failed to load wallet history.");
  }
  return Array.isArray(data?.ledger) ? data.ledger : [];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PremiumBalanceCard({ icon, title, value, subtitle, gradientColors, badgeColor }: any) {
  return (
    <AnimatedPressable
      entering={FadeInDown.delay(100).springify()}
      layout={Layout.springify()}
      style={styles.premiumCardWrapper}
    >
      <LinearGradient
        colors={gradientColors || [COLORS.cardBg, COLORS.cardBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumBalanceCard}
      >
        <View style={styles.premiumCardHeader}>
          <View style={[styles.premiumIconContainer, { backgroundColor: badgeColor || COLORS.primary }]}>
            <Ionicons name={icon} size={20} color={COLORS.white} />
          </View>
          <Text style={styles.premiumCardTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <View style={styles.premiumValueContainer}>
          <Text style={styles.premiumValue}>{formatBC(value)}</Text>
          <Text style={styles.premiumCurrency}>BC</Text>
        </View>

        <Text style={styles.premiumCardSubtitle}>{subtitle}</Text>

        <View style={styles.premiumCardFooter}>
          <View style={styles.premiumDot} />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

function PremiumActionCard({ icon, title, subtitle, gradientColors, onPress }: any) {
  return (
    <AnimatedPressable
      entering={FadeInDown.delay(140).springify()}
      layout={Layout.springify()}
      onPress={onPress}
      style={styles.premiumCardWrapper}
    >
      <LinearGradient
        colors={gradientColors || [COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumActionCard}
      >
        <View style={styles.premiumCardHeader}>
          <View style={styles.premiumActionIcon}>
            <Ionicons name={icon} size={18} color={COLORS.white} />
          </View>
          <Text style={styles.premiumActionTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <Text style={styles.premiumActionSubtitle} numberOfLines={3}>
          {subtitle}
        </Text>

        <View style={styles.premiumActionFooter}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

function LedgerItem({ row, index }: { row: LedgerRow; index: number }) {
  const debit = isDebit(row);
  const credit = isCredit(row);
  const amount = Math.abs(Number(row?.amountBC || 0));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      layout={Layout.springify()}
      style={styles.ledgerItem}
    >
      <View style={[styles.ledgerIcon, debit ? styles.ledgerIconDebit : styles.ledgerIconCredit]}>
        <Ionicons name={debit ? "arrow-up" : "arrow-down"} size={18} color={COLORS.white} />
      </View>

      <View style={styles.ledgerTextWrap}>
        <Text style={styles.ledgerTitle} numberOfLines={1}>
          {getRowTitle(row)}
        </Text>
        <Text style={styles.ledgerSub} numberOfLines={2}>
          {getRowSubtitle(row)}
        </Text>
      </View>

      <View style={styles.ledgerAmountWrap}>
        <Text style={[styles.ledgerAmount, debit ? styles.amountDebit : styles.amountCredit]}>
          {debit ? "-" : credit ? "+" : ""}
          {formatBC(amount)}
        </Text>
        <Text style={styles.ledgerUnit}>BC</Text>
      </View>
    </Animated.View>
  );
}

export default function WalletScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTabletDevice = width >= 768;

  const topSafePad = Math.max(insets.top + 14, 32);
  const bottomSafePad = Math.max(insets.bottom + 128, 150);
  const bottomSpacerHeight = Math.max(insets.bottom + 70, 96);

  const {
    balanceBC,
    earnedBC,
    pendingBC,
    locked,
    lockReason,
    loading,
    error,
    reload,
  } = useBuzzCoinWallet(true);

  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<WalletTab>("all");

  const loadLedger = useCallback(async () => {
    try {
      setLedgerLoading(true);
      setLedgerError("");
      const rows = await fetchLedgerRows();
      setLedger(rows);
    } catch (err: any) {
      setLedgerError(err?.message || "Could not load wallet history.");
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([reload(), loadLedger()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadLedger, reload]);

  const visibleLedger = useMemo(() => {
    if (SHOW_CREATOR_WALLET_V1) {
      return ledger;
    }

    return ledger.filter(
      (row) => !isCreatorWalletRow(row)
    );
  }, [ledger]);

  const filteredLedger = useMemo(() => {
    if (tab === "spending") {
      return visibleLedger.filter(
        (row) => isDebit(row)
      );
    }

    if (tab === "earning") {
      return visibleLedger.filter(
        (row) => !isDebit(row)
      );
    }

    return visibleLedger;
  }, [visibleLedger, tab]);

  const totalSpent = useMemo(() => {
    return visibleLedger
      .filter((row) => isDebit(row))
      .reduce(
        (sum, row) =>
          sum +
          Math.abs(
            Number(row?.amountBC || 0)
          ),
        0
      );
  }, [visibleLedger]);

  const totalEarnedInHistory = useMemo(() => {
    return visibleLedger
      .filter((row) => !isDebit(row))
      .reduce(
        (sum, row) =>
          sum +
          Math.abs(
            Number(row?.amountBC || 0)
          ),
        0
      );
  }, [visibleLedger]);

  const openWithdrawComingSoon = () => {
    Alert.alert(
      "Withdrawals coming soon",
      "Creator earnings are being tracked now, but bank withdrawals are not available yet. This protects RomBuzz while payout, KYC, tax, refund, and safety rules are finalized."
    );
  };

  return (
    <View style={styles.safe}>
      <LinearGradient
        colors={[COLORS.background, COLORS.white]}
        style={styles.gradientBg}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          styles.content,
          isTabletDevice && styles.contentTablet,
          {
            paddingTop: topSafePad,
            paddingBottom: bottomSafePad,
          },
        ]}
        scrollIndicatorInsets={{
          top: topSafePad,
          bottom: bottomSafePad,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressViewOffset={topSafePad}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <View>
            <Text style={styles.kicker}>RomBuzz Wallet</Text>
            <Text style={[styles.title, isTabletDevice && styles.titleTablet]}>BuzzCoin</Text>
          </View>
          <LinearGradient
            colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
            style={styles.headerBadge}
          >
            <Ionicons name="diamond" size={22} color={COLORS.white} />
          </LinearGradient>
        </Animated.View>

        {/* Locked Warning */}
        {locked && (
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.lockedBox}>
            <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
            <Text style={styles.lockedText}>Wallet locked{lockReason ? `: ${lockReason}` : ""}</Text>
          </Animated.View>
        )}

        {/* Loading/Error States */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading wallet...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={28} color={COLORS.primary} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
              ) : (
          <>
            {/* Premium Balance Cards - 2 x 2 grid */}
            <View style={styles.premiumGridContainer}>
              <PremiumBalanceCard
                icon="wallet-outline"
                title="Spendable"
                value={balanceBC}
                subtitle="Use for gifts, boosts & unlocks"
                gradientColors={["#ffffff", "#fff5f8"]}
                badgeColor={COLORS.primary}
              />
              <PremiumBalanceCard
                icon="cash-outline"
                title="Creator Earnings"
                value={earnedBC}
                subtitle="From paid media unlocks"
                gradientColors={["#ffffff", "#fff7ed"]}
                badgeColor="#f59e0b"
              />
              <PremiumBalanceCard
                icon="time-outline"
                title="Pending Payout"
                value={pendingBC}
                subtitle="Reserved for future payout"
                gradientColors={["#ffffff", "#f8fafc"]}
                badgeColor="#3b82f6"
              />
                     <PremiumActionCard
                icon="card"
                title="Withdraw Earnings"
                subtitle="Coming soon after payout rules are ready"
                gradientColors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
                onPress={openWithdrawComingSoon}
              />
            </View>

            {/* V1 wallet stats */}
            <Animated.View
              entering={
                FadeInDown
                  .delay(250)
                  .springify()
              }
              style={styles.statsRow}
            >
              {SHOW_CREATOR_WALLET_V1 && (
                <View style={styles.statCard}>
                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Total Earned
                  </Text>

                  <Text
                    style={
                      styles.statValue
                    }
                  >
                    {formatBC(
                      totalEarnedInHistory
                    )}{" "}
                    BC
                  </Text>
                </View>
              )}

              <View style={styles.statCard}>
                <Text
                  style={styles.statLabel}
                >
                  Total Spent
                </Text>

                <Text
                  style={styles.statValue}
                >
                  {formatBC(totalSpent)} BC
                </Text>
              </View>
            </Animated.View>
          </>
        )}

        {/* History Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {ledgerLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>

          {/* V1 history tabs */}
          <View style={styles.tabs}>
            {(
              SHOW_CREATOR_WALLET_V1
                ? (
                    [
                      "all",
                      "spending",
                      "earning",
                    ] as WalletTab[]
                  )
                : (
                    [
                      "all",
                      "spending",
                    ] as WalletTab[]
                  )
            ).map((t) => (
              <Pressable
                key={t}
                onPress={() =>
                  setTab(t)
                }
                style={[
                  styles.tabBtn,
                  tab === t &&
                    styles.tabActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === t &&
                      styles.tabTextActive,
                  ]}
                >
                  {t === "all"
                    ? "All"
                    : t ===
                        "spending"
                      ? "Spending"
                      : "Earnings"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Ledger Content */}
          {ledgerError ? (
            <View style={styles.emptyBox}>
              <Ionicons name="warning-outline" size={40} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>Could not load history</Text>
              <Text style={styles.emptySub}>{ledgerError}</Text>
            </View>
          ) : filteredLedger.length === 0 && !ledgerLoading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.primaryLight} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>
                Your transactions will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.ledgerList}>
              {filteredLedger.map((row, index) => (
                <LedgerItem key={row?.id || row?._id || index} row={row} index={index} />
              ))}
            </View>
          )}

          {/* V1 wallet note */}
          <View style={styles.noteBox}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={COLORS.primary}
            />

            <Text style={styles.noteText}>
              BuzzCoin is an in-app virtual balance
              for supported RomBuzz features.
            </Text>
          </View>

          <View style={{ height: bottomSpacerHeight }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    paddingHorizontal: 16,
  },
  contentTablet: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.ink,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
  },
  titleTablet: {
    fontSize: 40,
  },
  headerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  lockedBox: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.15)",
  },
  lockedText: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  loadingCard: {
    minHeight: 200,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  errorCard: {
    minHeight: 150,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorText: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  // New premium grid styles
  premiumGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  premiumCardWrapper: {
    width: SHOW_CREATOR_WALLET_V1
      ? "48.2%"
      : "100%",
    marginBottom: 12,
  },
  premiumBalanceCard: {
    height: 172,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  premiumActionCard: {
    height: 172,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  premiumCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },
  premiumIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
   premiumCardTitle: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  premiumValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginBottom: 9,
  },
  premiumValue: {
    color: COLORS.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  premiumCurrency: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  premiumCardSubtitle: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: "500",
    lineHeight: 15,
  },
  premiumCardFooter: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  premiumDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
   premiumActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumActionTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
    textTransform: "uppercase",
  },
  premiumActionSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 10.5,
    fontWeight: "600",
    lineHeight: 15,
    paddingRight: 18,
  },
  premiumActionFooter: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },
  withdrawBtn: {
    marginVertical: 16,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  withdrawGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  withdrawIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawTextWrap: {
    flex: 1,
  },
  withdrawTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  withdrawSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statValue: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },
  historySection: {
    marginTop: 8,
    paddingBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 20,
    fontWeight: "800",
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: COLORS.white,
  },
  ledgerList: {
    gap: 12,
    marginBottom: 20,
  },
  ledgerItem: {
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ledgerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ledgerIconDebit: {
    backgroundColor: COLORS.error,
  },
  ledgerIconCredit: {
    backgroundColor: COLORS.success,
  },
  ledgerTextWrap: {
    flex: 1,
  },
  ledgerTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  ledgerSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 4,
  },
  ledgerAmountWrap: {
    alignItems: "flex-end",
  },
  ledgerAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  amountDebit: {
    color: COLORS.error,
  },
  amountCredit: {
    color: COLORS.success,
  },
  ledgerUnit: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  emptyBox: {
    minHeight: 200,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  emptySub: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
  noteBox: {
    marginTop: 8,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff7fb",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.1)",
  },
  noteText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
});