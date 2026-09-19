/**
 * Path: src/features/auth/signup/SignupForm.tsx
 * Purpose: Render the email, OTP, Google, Apple, and login-link signup controls.
 */

import {
  Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import AppleSignupButton from "./AppleSignupButton";

import {
  signupFormStyles as styles,
} from "./signupFormStyles";

import {
  useSignupThemeStyles,
} from "./useSignupThemeStyles";

type SignupController =
  ReturnType<
    typeof import(
      "./useSignupController"
    ).useSignupController
  >;

type Props = {
  controller:
    SignupController;
};

export default function SignupForm({
  controller,
}: Props) {
  const {
    colors,
  } = useRomBuzzTheme();

  const theme =
    useSignupThemeStyles();

  const {
    email,
    code,
    step,
    countdown,
    loading,
    googleLoading,
    appleLoading,
    error,
    success,
    codeRef,
    isBusy,
    changeEmail,
    changeCode,
    sendCode,
    verifyCode,
    handleGoogleSignup,
    handleAppleSignup,
    backToEmail,
    goToLogin,
  } = controller;

  return (
    <>
      <View
        style={
          styles.stepHeader
        }
      >
        <Text
          style={[
            styles.title,
            theme.title,
          ]}
        >
          {step === 1
            ? "Create your account"
            : "Check your email"}
        </Text>

        <Text
          style={[
            styles.caption,
            theme.caption,
          ]}
        >
          {step === 1
            ? "Use your email or continue with a provider to begin."
            : `We sent a 6-digit code to ${email
                .trim()
                .toLowerCase()}.`}
        </Text>
      </View>

      {error ? (
        <View
          style={[
            styles.messageBox,
            theme.errorBox,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              theme.errorText,
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}

      {success ? (
        <View
          style={[
            styles.messageBox,
            theme.successBox,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              theme.successText,
            ]}
          >
            {success}
          </Text>
        </View>
      ) : null}

      {step === 1 ? (
        <>
          <View
            style={[
              styles.inputShell,
              theme.inputShell,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              style={
                theme.inputIcon
              }
            />

            <TextInput
              style={[
                styles.input,
                theme.input,
              ]}
              placeholder="Email address"
              placeholderTextColor={
                colors.textMuted
              }
              value={email}
              onChangeText={
                changeEmail
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={
                sendCode
              }
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              theme.primaryButton,

              loading &&
                styles.disabled,
            ]}
            onPress={sendCode}
            disabled={
              loading ||
              countdown > 0
            }
            activeOpacity={0.82}
          >
            {loading &&
            !googleLoading &&
            !appleLoading ? (
              <ActivityIndicator
                color={
                  colors.white
                }
              />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  theme.primaryButtonText,
                ]}
              >
                {countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Send Verification Code"}
              </Text>
            )}
          </TouchableOpacity>

          <View
            style={
              styles.dividerRow
            }
          >
            <View
              style={[
                styles.dividerLine,
                theme.dividerLine,
              ]}
            />

            <Text
              style={[
                styles.dividerText,
                theme.dividerText,
              ]}
            >
              or
            </Text>

            <View
              style={[
                styles.dividerLine,
                theme.dividerLine,
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.socialButton,
              theme.socialButton,

              isBusy &&
                styles.disabled,
            ]}
            disabled={isBusy}
            onPress={
              handleGoogleSignup
            }
            activeOpacity={0.82}
          >
            {googleLoading ? (
              <ActivityIndicator
                color={
                  colors.brand
                }
              />
            ) : (
              <View
                style={
                  styles.socialContent
                }
              >
                <View
                  style={[
                    styles.googleIconCircle,
                    theme.googleIconCircle,
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        "https://developers.google.com/identity/images/g-logo.png",
                    }}
                    style={
                      styles.googleLogo
                    }
                    resizeMode="contain"
                  />
                </View>

                <Text
                  style={[
                    styles.socialText,
                    theme.socialText,
                  ]}
                >
                  Signup with Google
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <AppleSignupButton
            disabled={isBusy}
            onPress={
              handleAppleSignup
            }
          />

          <TouchableOpacity
            style={
              styles.loginLink
            }
            onPress={goToLogin}
            disabled={isBusy}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.loginMuted,
                theme.loginMuted,
              ]}
            >
              Already have an
              account?
            </Text>

            <Text
              style={[
                styles.loginStrong,
                theme.loginStrong,
              ]}
            >
              {" "}
              Login
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View
            style={[
              styles.inputShell,
              theme.inputShell,
            ]}
          >
            <Ionicons
              name="keypad-outline"
              size={18}
              style={
                theme.inputIcon
              }
            />

            <TextInput
              ref={codeRef}
              style={[
                styles.input,
                styles.codeInput,
                theme.input,
              ]}
              placeholder="6-digit code"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={
                changeCode
              }
              returnKeyType="done"
              onSubmitEditing={
                verifyCode
              }
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              theme.primaryButton,

              loading &&
                styles.disabled,
            ]}
            onPress={
              verifyCode
            }
            disabled={loading}
            activeOpacity={0.82}
          >
            {loading ? (
              <ActivityIndicator
                color={
                  colors.white
                }
              />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  theme.primaryButtonText,
                ]}
              >
                Verify Code
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              theme.secondaryButton,

              (loading ||
                countdown > 0) &&
                styles.disabled,
            ]}
            onPress={sendCode}
            disabled={
              loading ||
              countdown > 0
            }
            activeOpacity={0.78}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                theme.secondaryButtonText,
              ]}
            >
              {countdown > 0
                ? `Resend code in ${countdown}s`
                : "Resend verification code"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={
              backToEmail
            }
            disabled={loading}
            activeOpacity={0.72}
          >
            <Text
              style={[
                styles.backText,
                theme.backText,
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );
}