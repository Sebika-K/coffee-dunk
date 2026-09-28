import { COLORS } from "@/constants/theme";
import { friendlyError } from "@/lib/authErrors";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Link } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MIN_PASSWORD_LENGTH = 6; // Firebase's minimum

export default function SignupScreen() {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit =
    email.trim() !== "" && username.trim() !== "" && password !== "" && !isLoading;

  async function handleSignup() {
    setErrorMessage("");

    // Check what we can on the phone first - no need to ask Firebase
    // about a password we already know is too short.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    try {
      // 1) Create the account (this also logs the new user in)
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 2) Save the username as the account's display name,
      //    just like the web app's auth.js did
      await updateProfile(result.user, { displayName: username.trim() });
      refreshUser(); // show the username right away (not the email)
      // The app moves into the logged-in screens automatically (see _layout.tsx)
    } catch (error) {
      console.log("Signup failed:", error instanceof FirebaseError ? error.code : error);
      setErrorMessage(friendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require("@/assets/images/background_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <TextInput
            style={[styles.input, styles.firstInput]}
            placeholder="Email"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={[styles.input, styles.spacedInput]}
            placeholder="Username"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            maxLength={30}
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (at least 6 characters)"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Pressable
            onPress={handleSignup}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              !canSubmit && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>{isLoading ? "Creating account…" : "Sign Up"}</Text>
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={styles.fadedText}>Already have an account? </Text>
            {/* replace: swap this screen for Login instead of stacking on top */}
            <Link href="/login" replace>
              <Text style={styles.linkText}>Login</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  firstInput: {
    marginTop: 30,
    marginBottom: 20,
  },
  spacedInput: {
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 12,
  },
  button: {
    alignSelf: "center",
    minWidth: 122,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 25,
    borderWidth: 1,
    borderColor: COLORS.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    backgroundColor: "rgba(216, 208, 203, 0.15)",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: COLORS.fadedWhite,
    fontSize: 18,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  fadedText: {
    color: COLORS.fadedWhite,
    fontSize: 15,
  },
  linkText: {
    color: COLORS.link,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
