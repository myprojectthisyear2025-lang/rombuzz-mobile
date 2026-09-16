import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import Constants from "expo-constants";

type KeyboardArgs = {
  bottomInset: number;
  settleToLatest: (animated?: boolean) => void;
};
export function useChatKeyboard({ bottomInset, settleToLatest }: KeyboardArgs) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // ✅ Bottom spacing for inverted chat list:
  // composer is part of layout, not overlayed, so list only needs a tiny visual gap
  const SAFE_BOTTOM_INSET = Math.max(0, Number(bottomInset || 0));

  // ✅ Android edge-to-edge / 3-button navigation can report bottom inset as 0.
  // Measure the real system navigation area and use a stronger fallback so the
  // composer never sits under the phone navigation buttons.
  const WINDOW_H = Dimensions.get("window").height;
  const SCREEN_H = Dimensions.get("screen").height;
  const STATUS_BAR_H = Math.max(0, Number(Constants.statusBarHeight || 0));

  const ANDROID_SYSTEM_BOTTOM_AREA =
    Platform.OS === "android"
      ? Math.max(0, SCREEN_H - WINDOW_H - STATUS_BAR_H)
      : 0;

  const ANDROID_NAV_FALLBACK_PAD =
    Platform.OS === "android"
      ? Math.max(50, Math.min(64, ANDROID_SYSTEM_BOTTOM_AREA || 50))
      : 0;

  const COMPOSER_SAFE_BOTTOM_PAD = keyboardOpen
    ? Platform.OS === "ios"
      ? 2
      : 2
    : Platform.OS === "ios"
      ? Math.max(10, Math.min(24, SAFE_BOTTOM_INSET + 4))
      : Math.max(
          46,
          Math.min(64, SAFE_BOTTOM_INSET || ANDROID_NAV_FALLBACK_PAD),
        );

  // ✅ KeyboardAvoidingView starts below our custom header, so iOS does not need
  // the header height subtracted here. Keeping this at 0 makes the composer sit
  // directly above the keyboard like Instagram/Messenger.
  const IOS_KEYBOARD_VERTICAL_OFFSET = 0;

  const LATEST_MESSAGE_GAP = keyboardOpen ? 4 : 8;
  const LIST_BOTTOM_PAD = LATEST_MESSAGE_GAP;
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    // ✅ Important:
    // iOS keyboardWillHide fires before the keyboard is gone.
    // Use keyboardDidHide so the UI returns to the exact closed state after
    // the keyboard animation finishes.
    const hideEvt = "keyboardDidHide";

    const settleAfterKeyboardLayout = (delayMs = 0) => {
      const run = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            settleToLatest(false);
          });
        });
      };

      if (delayMs > 0) {
        const timer = setTimeout(run, delayMs);
        return () => clearTimeout(timer);
      }

      run();
      return () => {};
    };

    let cleanupHideSettle: (() => void) | null = null;

    const showSub = Keyboard.addListener(showEvt, () => {
      if (cleanupHideSettle) {
        cleanupHideSettle();
        cleanupHideSettle = null;
      }

      setKeyboardOpen(true);
      settleAfterKeyboardLayout(0);
    });

    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardOpen(false);

      // ✅ Android and iOS both need one final settle after the keyboard is gone.
      // iOS animations can finish a little later, so give it a slightly longer
      // second settle to return exactly to the closed-chat layout.
      settleAfterKeyboardLayout(0);
      cleanupHideSettle = settleAfterKeyboardLayout(
        Platform.OS === "ios" ? 180 : 120,
      );
    });

    return () => {
      if (cleanupHideSettle) cleanupHideSettle();
      showSub.remove();
      hideSub.remove();
    };
  }, [settleToLatest]);

  return {
    keyboardOpen,
    setKeyboardOpen,
    COMPOSER_SAFE_BOTTOM_PAD,
    IOS_KEYBOARD_VERTICAL_OFFSET,
    LIST_BOTTOM_PAD,
  };
}
