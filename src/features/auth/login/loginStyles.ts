/**
 * ============================================================
 * 📁 File: src/features/auth/login/loginStyles.ts
 * 🎯 Purpose: Shared styles for the modular RomBuzz login screen.
 *
 * LOCATION:
 *   src/features/auth/login/loginStyles.ts
 *
 * USED BY:
 *   LoginScreenView.tsx, LoginForm.tsx, AppleLoginButton.ios.tsx
 *
 * RESPONSIBILITIES:
 *   Preserve the existing login appearance while staying under 200 lines.
 * ============================================================
 */

import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    justifyContent: "center",
  },

  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },

  orb: {
    position: "absolute",
    borderRadius: 999,
  },

  orbTop: {
    width: 230,
    height: 230,
    top: -72,
    right: -84,
    backgroundColor: "#ffe3f1",
    opacity: 0.92,
  },

  orbMiddle: {
    width: 150,
    height: 150,
    top: 245,
    left: -88,
    backgroundColor: "#ffb7d8",
    opacity: 0.32,
  },

  orbBottom: {
    width: 260,
    height: 260,
    bottom: -132,
    right: -92,
    backgroundColor: "#fff0f8",
    opacity: 1,
  },

  gridLineOne: {
    position: "absolute",
    top: 82,
    left: -40,
    width: 460,
    height: 1,
    backgroundColor: "#ffe0ef",
    transform: [{ rotate: "-18deg" }],
  },

  gridLineTwo: {
    position: "absolute",
    top: 150,
    left: -90,
    width: 520,
    height: 1,
    backgroundColor: "#fff0f7",
    transform: [{ rotate: "-18deg" }],
  },

  gridLineThree: {
    position: "absolute",
    bottom: 96,
    left: -70,
    width: 520,
    height: 1,
    backgroundColor: "#ffe6f2",
    transform: [{ rotate: "16deg" }],
  },

  header: {
    alignItems: "center",
    marginBottom: 14,
    minHeight: 138,
    justifyContent: "center",
  },

  logoWrapper: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#ff176e",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },

  logo: { width: 78, height: 78 },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#ff176e",
    marginTop: 14,
    letterSpacing: 0.4,
  },

  subtitle: {
    fontSize: 14,
    color: "#725161",
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 22,
    lineHeight: 20,
    fontWeight: "600",
  },

  formCard: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 24,
    padding: 14,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: "#ffe1ef",
    shadowColor: "#ff9fd9",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#fff0f4",
    borderWidth: 1,
    borderColor: "#ffc3d4",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
  },

  errorIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#ff0044",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 20,
  },

  errorText: {
    flex: 1,
    color: "#b0002f",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },

  form: { width: "100%" },
  inputGroup: { marginBottom: 10 },

  inputLabel: {
    color: "#4f2d3c",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    marginLeft: 3,
  },

  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff7fb",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffd8ea",
    minHeight: 55,
    paddingHorizontal: 14,
  },

  inputIcon: {
    width: 24,
    color: "#ff176e",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginRight: 8,
  },

  input: {
    flex: 1,
    color: "#25101a",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: Platform.OS === "ios" ? 15 : 11,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7fb",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffd8ea",
    minHeight: 55,
    paddingLeft: 14,
    paddingRight: 8,
  },

  passwordInput: {
    flex: 1,
    color: "#25101a",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: Platform.OS === "ios" ? 15 : 11,
  },

  showButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#ffe3f1",
  },

  showButtonText: {
    color: "#ff176e",
    fontSize: 13,
    fontWeight: "900",
  },

  primaryButton: {
    minHeight: 55,
    backgroundColor: "#ff176e",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    overflow: "hidden",
    shadowColor: "#ff176e",
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },

  primaryButtonShine: {
    position: "absolute",
    top: -28,
    left: -40,
    width: 96,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    transform: [{ rotate: "22deg" }],
  },

  disabledButton: { opacity: 0.7 },

  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  inlineLinkWrapper: {
    marginTop: 11,
    alignSelf: "flex-end",
    paddingVertical: 4,
  },

  inlineLinkText: {
    color: "#7b5d6a",
    fontSize: 13,
    fontWeight: "800",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 17,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f2d5e2",
  },

  dividerText: {
    marginHorizontal: 10,
    color: "#9a7c89",
    fontSize: 13,
    fontWeight: "800",
  },

  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ead7df",
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  googleButtonContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  googleIconCircle: {
    position: "absolute",
    left: 16,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  googleLogoImage: {
    width: 20,
    height: 20,
  },

  googleButtonText: {
    fontSize: 15,
    color: "#202124",
    fontWeight: "900",
  },

  appleButtonWrap: {
    width: "100%",
    height: 54,
    marginBottom: 11,
  },

  appleButton: {
    width: "100%",
    height: 54,
  },

  secondaryButton: {
    backgroundColor: "#ffe3f1",
    borderRadius: 20,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffc8e2",
  },

  secondaryButtonText: {
    fontSize: 15,
    color: "#ff176e",
    fontWeight: "900",
  },
});