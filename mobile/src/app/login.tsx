import { COLORS } from "@/constants/theme";
import { friendlyError } from "@/lib/authErrors";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ImageBackground,
  Keyboard,
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
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // No need to navigate here: AuthContext notices the login and
      // the root layout moves us into the app automatically.
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
      setErrorMessage("Type your email above first, then tap Forgot password.");
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

      {/* Tapping anywhere outside a text box closes the keyboard.
          accessible={false} stops screen readers treating the whole screen as one big button. */}
      <Pressable style={styles.tapArea} onPress={Keyboard.dismiss} accessible={false}>
        {/* Moves the card up when the keyboard opens, so it isn't covered */}
        <KeyboardAvoidingView
          style={styles.keyboardArea}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>

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
              <Text style={styles.linkText}>Forgot password?</Text>
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
              <Text style={styles.loginButtonText}>{isLoading ? "Logging in…" : "Log in"}</Text>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.fadedText}>Don't have an account? </Text>
              {/* replace: swap this screen for Sign Up instead of stacking on top */}
              <Link href="/signup" replace>
                <Text style={styles.linkText}>Sign up</Text>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, // fill the whole screen
  },
  tapArea: {
    flex: 1, // cover the whole screen so a tap anywhere counts
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
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderRadius: 12, // rounded to match the card
    backgroundColor: COLORS.sand,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.plum,
  },
  emailInput: {
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 12,
  },
  forgotButton: {
    alignSelf: "flex-end", // push to the right edge of the card
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 4, // a bit more room for the finger
  },
  linkText: {
    color: "#FFFFFF", // readable on plum (the old bright blue clashed)
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  loginButton: {
    height: 52, // full width of the card (no alignSelf), pill shaped
    borderRadius: 26,
    backgroundColor: COLORS.cream,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonPressed: {
    opacity: 0.8, // small feedback while pressed
  },
  loginButtonDisabled: {
    opacity: 0.5, // faded until both fields are filled in
  },
  loginButtonText: {
    color: COLORS.plum,
    fontSize: 17,
    fontWeight: "600",
  },
  signupRow: {
    flexDirection: "row", // put the two texts side by side
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  fadedText: {
    color: COLORS.fadedWhite,
    fontSize: 15,
  },
});
