/**
 * ============================================================
 * 📁 File: src/features/auth/signup/AppleSignupButton.tsx
 * 🎯 Purpose: Hide Apple signup outside iOS.
 *
 * LOCATION:
 *   src/features/auth/signup/AppleSignupButton.tsx
 *
 * USED BY:
 *   RomBuzz signup form on Android/web.
 *
 * RESPONSIBILITIES:
 *   - Match the iOS component prop contract.
 *   - Render no Apple signup UI outside iOS.
 * ============================================================
 */

type Props = {
  disabled: boolean;
  onPress: () => void;
};

export default function AppleSignupButton(
  _props: Props,
) {
  return null;
}