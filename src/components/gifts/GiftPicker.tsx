/**
 * ============================================================
 * 📁 Location: src/components/gifts/GiftPicker.tsx
 * 🎁 Purpose: Reusable RomBuzz gift picker modal.
 *
 * Used by:
 *  - Future LetsBuzz posts/reels gift button
 *  - Future View Profile fullscreen media gift button
 *  - Future Chat gift button
 *  - Future BuzzPoke / MicroBuzz gift entry points
 *
 * What this file does:
 *  - Opens as a modal.
 *  - Filters gifts by placement.
 *  - Shows wallet balance.
 *  - Sends gift through POST /api/gifts/send.
 *  - Calls onSent after successful gift.
 *
 * Important:
 *  - This file does not wire itself into existing screens.
 *  - Existing screens should later render <GiftPicker /> with target props.
 * ============================================================
 */

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getGiftsByPlacement,
  RomBuzzGift,
  RomBuzzGiftPlacement,
} from "../../config/rombuzzGifts";
import { useBuzzCoinWallet } from "../../hooks/gifts/useBuzzCoinWallet";
import { useGiftCatalog } from "../../hooks/gifts/useGiftCatalog";
import { useSendGift } from "../../hooks/gifts/useSendGift";
import GiftBalancePill from "./GiftBalancePill";
import GiftCard from "./GiftCard";

type Props = {
  visible: boolean;
  onClose: () => void;

  receiverId: string;
  placement: RomBuzzGiftPlacement;
  targetType: string;
  targetId: string;

  title?: string;
  subtitle?: string;

  onSent?: (payload: {
    giftId: string;
    transactionId: string;
    priceBC: number;
  }) => void;
};

export default function GiftPicker({
  visible,
  onClose,
  receiverId,
  placement,
  targetType,
  targetId,
  title = "Send a Gift",
  subtitle = "Pick a gift and send it instantly.",
  onSent,
}: Props) {
  const {
    balanceBC,
    locked,
    lockReason,
    loading: walletLoading,
    error: walletError,
    reload: reloadWallet,
  } = useBuzzCoinWallet(visible);

  const {
    enabledGifts: backendGifts,
    loading: catalogLoading,
    error: catalogError,
  } = useGiftCatalog(visible);

  const { send, sending } = useSendGift();

  const backendGiftIds = useMemo(() => {
    return new Set(
      backendGifts
        .filter((gift) => gift.allowedPlacements?.includes(placement))
        .map((gift) => gift.giftId)
    );
  }, [backendGifts, placement]);

  const frontendGifts = useMemo(() => {
    const byPlacement = getGiftsByPlacement(placement);

    return backendGiftIds.size > 0
      ? byPlacement.filter((gift) => backendGiftIds.has(gift.id))
      : byPlacement;
  }, [backendGiftIds, placement]);

  async function handleSend(gift: RomBuzzGift) {
    if (locked) {
      Alert.alert("Wallet locked", lockReason || "Your BuzzCoin wallet is locked.");
      return;
    }

    if (balanceBC < gift.priceBC) {
      Alert.alert(
        "Not enough BuzzCoin",
        `You need ${gift.priceBC} BC to send ${gift.name}. Your balance is ${balanceBC} BC.`
      );
      return;
    }

    try {
      const res = await send({
        receiverId,
        giftId: gift.id,
        placement,
        targetType,
        targetId,
        appPlatform: "mobile",
        appVersion: "",
        metadata: {
          source: "GiftPicker",
        },
      });

      await reloadWallet();

      onSent?.({
        giftId: res.giftId,
        transactionId: res.transactionId,
        priceBC: res.priceBC,
      });

      Alert.alert("Gift sent", `${gift.name} was sent successfully.`);
      onClose();
    } catch (err: any) {
      Alert.alert("Gift failed", err?.message || "Could not send gift.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              <Text numberOfLines={2} style={styles.subtitle}>
                {subtitle}
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.balanceRow}>
            <GiftBalancePill
              balanceBC={balanceBC}
              loading={walletLoading}
              locked={locked}
              error={walletError}
            />
          </View>

              {!!catalogError && (
            <Text style={styles.errorText}>{catalogError}</Text>
          )}

          {catalogLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Loading gifts...</Text>
            </View>
          ) : (
            <FlatList
              data={frontendGifts}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <GiftCard
                  gift={item}
                  disabled={sending}
                  locked={item.premiumOnly}
                  onPress={handleSend}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>No gifts available</Text>
                  <Text style={styles.emptyText}>
                    This placement does not have gifts enabled yet.
                  </Text>
                </View>
              }
            />
          )}

          {sending && (
            <View style={styles.sendingOverlay}>
              <ActivityIndicator />
              <Text style={styles.sendingText}>Sending gift...</Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "86%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFF7FB",
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    paddingRight: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#3B102A",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5B73",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#5A1238",
  },
  balanceRow: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    flexDirection: "row",
  },
   errorText: {
    marginHorizontal: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#D12B5C",
  },
  loadingWrap: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B3358",
  },
  grid: {
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emptyWrap: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#3B102A",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5B73",
    textAlign: "center",
  },
  sendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,247,251,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendingText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#5A1238",
  },
});
