import { COLORS } from "@/constants/theme";
import { friendlyError } from "@/lib/authErrors";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  // STATE: values this screen remembers. When they change, the screen redraws.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false); // true while waiting for Firebase
  const [errorMessage, setErrorMessage] = useState(""); // shown in the card when not empty

  // Only allow logging in once both fields are filled, and not while already trying
  const canSubmit = email.trim() !== "" && password !== "" && !isLoading;

  async function handleLogin() {
    setErrorMessage("");
    setIsLoading(true);
    try {
      // Ask Firebase to check the email + password. `await` pauses here
      // until Firebase answers (it has to go over the internet).
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const name = result.user.displayName || result.user.email;
      Alert.alert("Welcome back!", `Logged in as ${name}`);
    } catch (error) {
      console.log("Login failed:", error instanceof FirebaseError ? error.code : error);
      setErrorMessage(friendlyError(error));
    } finally {
      // Runs whether it worked or failed
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (email.trim() === "") {
      setErrorMessage("Type your email above first, then tap Forgot Password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Check your email", "If an account exists, a reset link is on its way.");
    } catch (error) {
      setErrorMessage(friendlyError(error));
    }
  }

  return (
    <ImageBackground
      source={require("@/assets/images/background_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Hide the white header bar on this screen */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Moves the card up when the keyboard opens, so it isn't covered */}
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <TextInput
            style={[styles.input, styles.emailInput]}
            placeholder="Email"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Pressable style={styles.forgotButton} onPress={handleForgotPassword}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
              !canSubmit && styles.loginButtonDisabled,
            ]}
          >
            <Text style={styles.loginButtonText}>{isLoading ? "Logging in…" : "Login"}</Text>
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.fadedText}>Don't have an account? </Text>
            <Pressable>
              <Text style={styles.linkText}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, // fill the whole screen
  },
  keyboardArea: {
    flex: 1,
    justifyContent: "center", // centre the card vertically
    alignItems: "center", // centre the card horizontally
  },
  card: {
    backgroundColor: COLORS.plum,
    width: "85%",
    maxWidth: 340,
    borderRadius: 12,
    padding: 20,
  },
  input: {
    height: 48,
    backgroundColor: COLORS.sand,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.plum,
  },
  emailInput: {
    marginTop: 30,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 12,
  },
  forgotButton: {
    alignSelf: "flex-end", // push to the right edge of the card
    marginTop: 10,
    marginBottom: 25,
  },
  linkText: {
    color: COLORS.link,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  loginButton: {
    alignSelf: "center",
    minWidth: 122,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonPressed: {
    backgroundColor: "rgba(216, 208, 203, 0.15)", // subtle feedback while pressed
  },
  loginButtonDisabled: {
    opacity: 0.4, // faded until both fields are filled in
  },
  loginButtonText: {
    color: COLORS.fadedWhite,
    fontSize: 18,
  },
  signupRow: {
    flexDirection: "row", // put the two texts side by side
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  fadedText: {
    color: COLORS.fadedWhite,
    fontSize: 15,
  },
});
