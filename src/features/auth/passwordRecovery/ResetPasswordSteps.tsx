/**
 * Path: src/features/auth/passwordRecovery/ResetPasswordSteps.tsx
 * Purpose: Render the verify-code and new-password stages without changing reset logic.
 */

import React from "react";

import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    recoveryStyles as styles,
} from "./passwordRecoveryStyles";

import {
    ErrorBox,
    PasswordField,
    PrimaryButton,
} from "./ResetPasswordControls";

export function VerifyCodeStep({
  colors,
  theme,
  ...props
}: any) {
  return (
    <>
      <Text
        style={[
          styles.subtitle,
          theme.subtitle,
        ]}
      >
        Enter the 6-digit code
        sent to your email.
      </Text>

      {props.error ? (
        <ErrorBox
          error={props.error}
          theme={theme}
        />
      ) : null}

      <View
        style={[
          styles.inputShell,
          theme.inputShell,
        ]}
      >
        <TextInput
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
          value={props.code}
          onChangeText={
            props.setCode
          }
        />
      </View>

      <PrimaryButton
        loading={props.loading}
        onPress={
          props.handleVerifyCode
        }
        label="Verify Code"
        colors={colors}
        theme={theme}
      />

      <TouchableOpacity
        style={styles.linkButton}
        onPress={
          props.handleResendCode
        }
        disabled={
          props.cooldown > 0
        }
      >
        <Text
          style={[
            styles.link,
            theme.link,
          ]}
        >
          {props.cooldown > 0
            ? `Resend code in ${props.cooldown}s`
            : "Resend code"}
        </Text>
      </TouchableOpacity>
    </>
  );
}

export function NewPasswordStep({
  colors,
  theme,
  barWidth,
  setBarWidth,
  ...props
}: any) {
  return (
    <>
      <Text
        style={[
          styles.subtitle,
          theme.subtitle,
        ]}
      >
        Set your new password.
      </Text>

      {props.error ? (
        <ErrorBox
          error={props.error}
          theme={theme}
        />
      ) : null}

      <PasswordField
        value={props.password}
        onChangeText={
          props.setPassword
        }
        placeholder="New password"
        showPassword={
          props.showPassword
        }
        toggle={() =>
          props.setShowPassword(
            (
              value: boolean
            ) => !value
          )
        }
        colors={colors}
        theme={theme}
      />

      <View
        style={[
          styles.strengthBar,
          theme.strengthBar,
        ]}
        onLayout={(event) =>
          setBarWidth(
            event.nativeEvent.layout
              .width
          )
        }
      >
        <View
          style={[
            styles.strengthFill,
            {
              width:
                barWidth *
                (
                  props.strength
                    .level / 4
                ),

              backgroundColor:
                props.strength
                  .color,
            },
          ]}
        />
      </View>

      <Text
        style={[
          styles.strengthText,
          {
            color:
              props.strength
                .color,
          },
        ]}
      >
        {props.strength.label}
      </Text>

      <PasswordField
        value={props.confirm}
        onChangeText={
          props.setConfirm
        }
        placeholder="Confirm new password"
        showPassword={
          props.showPassword
        }
        colors={colors}
        theme={theme}
      />

      <PrimaryButton
        loading={props.loading}
        onPress={
          props.handleSetPassword
        }
        label="Update Password"
        colors={colors}
        theme={theme}
      />
    </>
  );
}