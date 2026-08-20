/**
 * ============================================================
 * 📁 File: src/features/auth/login/AppleLoginButton.tsx
 * 🎯 Purpose: Hide Apple authentication on non-iOS platforms.
 *
 * LOCATION:
 *   src/features/auth/login/AppleLoginButton.tsx
 *
 * USED BY:
 *   LoginForm.tsx on Android/web.
 *
 * RESPONSIBILITIES:
 *   - Match the iOS component prop contract for TypeScript.
 *   - Render nothing outside iOS.
 * ============================================================
 */

type Props = {
  disabled: boolean;
  onPress: () => void;
};

export default function AppleLoginButton(_props: Props) {
  return null;
}