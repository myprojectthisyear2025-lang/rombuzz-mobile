/**
 * Path: src/components/settings/SettingsDialog.tsx
 * Purpose: Present Settings alerts with RomBuzz typography while preserving each action and confirmation.
 */
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Keyboard, Modal, ScrollView, StyleSheet, Text, View, type AlertButton } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont, useRomBuzzTypography } from "@/src/design/rombuzzTypography";
import { SettingsButton } from "./SettingsControls";

type Dialog = { title: string; message?: string; buttons: AlertButton[] };
type ShowAlert = (title: string, message?: string, buttons?: AlertButton[]) => void;
const DialogContext = createContext<ShowAlert | null>(null);

export function SettingsDialogProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useRomBuzzTheme();
  const fontsLoaded = useRomBuzzTypography();
  const insets = useSafeAreaInsets();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const activeDialog = useRef<Dialog | null>(null);
  const showAlert = useCallback<ShowAlert>((title, message, buttons) => {
    Keyboard.dismiss();
    const next = { title, message, buttons: buttons?.length ? buttons : [{ text: "OK" }] };
    activeDialog.current = next;
    setDialog(next);
  }, []);

  const selectAction = (button: AlertButton) => {
    // Clear before invoking the original callback, which may open the next confirmation.
    if (activeDialog.current !== dialog) return;
    activeDialog.current = null;
    setDialog(null);
    button.onPress?.();
  };

  return (
    <DialogContext.Provider value={showAlert}>
      {children}
      <Modal
        visible={!!dialog && fontsLoaded}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          const cancel = dialog?.buttons.find((button) => button.style === "cancel");
          if (cancel) selectAction(cancel);
        }}
      >
        <View
          style={[
            styles.backdrop,
            {
              backgroundColor: colors.overlay,
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
              paddingLeft: insets.left + 20,
              paddingRight: insets.right + 20,
            },
          ]}
        >
          <View
            accessibilityViewIsModal
            style={[styles.dialog, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
                {dialog?.title}
              </Text>
              {dialog?.message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{dialog.message}</Text>
              ) : null}
              {dialog?.buttons.map((button, index) => (
                <SettingsButton
                  key={index}
                  label={button.text ?? "OK"}
                  variant={
                    button.style === "destructive"
                      ? "danger"
                      : button.style === "cancel"
                        ? "secondary"
                        : "primary"
                  }
                  onPress={() => selectAction(button)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useSettingsAlert() {
  const showAlert = useContext(DialogContext);
  if (!showAlert) throw new Error("Settings alerts require SettingsDialogProvider");
  return showAlert;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", alignItems: "center" },
  dialog: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "100%",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  content: { padding: 20 },
  title: { fontSize: 20, lineHeight: 27, fontFamily: RBZFont.extraBold, letterSpacing: -0.4 },
  message: { fontSize: 13, lineHeight: 20, fontFamily: RBZFont.regular, marginTop: 10, marginBottom: 4 },
});
