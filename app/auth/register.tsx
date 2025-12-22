// ===========================================================
// 📁 File: app/auth/register.tsx
// 🎯 Purpose: RomBuzz Mobile Register Screen (OTP + password)
// ===========================================================

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE } from "../../src/config/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

const handleSendCode = async () => {
  if (info) return; // 🚫 prevent regenerating OTP
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Email is required to send verification code.");
      return;
    }

    setLoadingSend(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.error || "Failed to send verification code. Try again.";
        setError(message);
        return;
      }

      setInfo(
        "Verification code sent to your email (or logged in console in dev)."
      );
    } catch (err) {
      console.error("send-code error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoadingSend(false);
    }
  };

const handleRegister = async () => {
  console.log("🚨 handleRegister called", {
    email: email.trim().toLowerCase(),
    code: code.trim(),
  });
  setError(null);
  setInfo(null);

  if (!email.trim() || !code.trim() || !password.trim()) {
    setError("Email, verification code, and password are required.");
    return;
  }

  setLoadingRegister(true);
  try {
    // ✅ STEP 1: VERIFY OTP
console.log("🚨 CALLING /auth/verify-code");

const verifyRes = await fetch(`${API_BASE}/auth/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    });

    const verifyData = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok || !verifyData.success) {
      setError(verifyData?.error || "Invalid verification code.");
      return;
    }

    // ✅ STEP 2: REGISTER USER (NO CODE HERE)
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || "Registration failed.");
      return;
    }

    if (!data.token) {
      setError("No token returned from server.");
      return;
    }

    await SecureStore.setItemAsync("RBZ_TOKEN", data.token);
    if (data.user) {
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(data.user));
    }

    router.replace("/(tabs)");
  } catch (err) {
    console.error("register error:", err);
    setError("Network error. Please try again.");
  } finally {
    setLoadingRegister(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Create Your RomBuzz Account</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {info && <Text style={styles.infoText}>{info}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
onChangeText={(val) => {
  setEmail(val);
  setInfo(null); // ✅ allow resend if email changes
}}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.half]}
          placeholder="First name"
          placeholderTextColor="#999"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={[styles.input, styles.half]}
          placeholder="Last name"
          placeholderTextColor="#999"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.codeRow}>
       <TextInput
  style={[styles.input, styles.codeInput]}
  placeholder="Verification code"
  value={code}
  onChangeText={setCode}
  keyboardType="number-pad"
  maxLength={6} // ✅ critical
/>

        <TouchableOpacity
          style={[styles.smallButton, loadingSend && { opacity: 0.7 }]}
          onPress={handleSendCode}
disabled={loadingSend || !!info}
        >
          {loadingSend ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.smallButtonText}>Send Code</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loadingRegister && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={loadingRegister}
      >
        {loadingRegister ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify & Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// ===========================================================
// 🎨 Styles
// ===========================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  input: {
    width: "85%",
    backgroundColor: "#f3f3f3",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    width: "85%",
    backgroundColor: "#ff005c",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  link: {
    color: "#555",
    marginTop: 6,
    fontSize: 15,
  },
  errorText: {
    color: "#ff0044",
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  infoText: {
    color: "#0c9248",
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    width: "85%",
    justifyContent: "space-between",
    gap: 8,
  },
  half: {
    width: "48%",
  },
  codeRow: {
    flexDirection: "row",
    width: "85%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  codeInput: {
    flex: 1,
  },
  smallButton: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
