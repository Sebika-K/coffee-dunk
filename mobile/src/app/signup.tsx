import { BeanBackground } from "@/components/BeanBackground";
import { COLORS } from "@/constants/theme";
import { friendlyError } from "@/lib/authErrors";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { openPage, PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import { recordTermsAccepted, syncPublicProfile } from "@/lib/users";
import {
  claimUsername,
  isUsernameAvailable,
  USERNAME_MAX,
  usernameProblem,
  UsernameTakenError,
} from "@/lib/usernames";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
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
  // Apple requires people to agree to the Terms before posting anything
  const [agreed, setAgreed] = useState(false);

  // Sign up only works once every box is filled AND the terms are ticked
  const canSubmit =
    email.trim() !== "" && username.trim() !== "" && password !== "" && agreed && !isLoading;

  async function handleSignup() {
    setErrorMessage("");

    // Check what we can on the phone first - no need to ask Firebase
    // about a password we already know is too short.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    const name = username.trim();
    const problem = usernameProblem(name);
    if (problem) {
      setErrorMessage(problem);
      return;
    }

    setIsLoading(true);
    try {
      // 1) Is the name free? Checked BEFORE creating the account, so we don't
      //    make an account and then have to tell them the name is taken.
      if (!(await isUsernameAvailable(name))) {
        setErrorMessage(`"${name}" is already taken. Try another username.`);
        return;
      }

      // 2) Create the account (this also logs the new user in)
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 3) Claim the username. In the rare case someone grabbed it in the last
      //    few seconds, undo: delete the brand-new account and ask for another name.
      try {
        await claimUsername(result.user.uid, name);
      } catch (claimError) {
        await result.user.delete();
        throw claimError;
      }

      // 4) Save the username as the account's display name too
      await updateProfile(result.user, { displayName: name });
      await syncPublicProfile(result.user); // public profile with the chosen username
      await recordTermsAccepted(result.user.uid); // when they agreed to the terms
      refreshUser(); // show the username right away (not the email)
      // The app moves into the logged-in screens automatically (see _layout.tsx)
    } catch (error) {
      console.log("Signup failed:", error instanceof FirebaseError ? error.code : error);
      setErrorMessage(
        error instanceof UsernameTakenError
          ? `"${name}" is already taken. Try another username.`
          : friendlyError(error)
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Full-colour beans here (same as Login): the card sits in the middle, so there's room for them
  return (
    <BeanBackground style={styles.background} beanOpacity={1}>
      {/* Tapping anywhere outside a text box closes the keyboard (same as Login) */}
      <Pressable style={styles.tapArea} onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.keyboardArea}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Create your account</Text>

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
              maxLength={USERNAME_MAX}
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

            {/* "I agree" checkbox. Tapping the row ticks it; tapping the underlined
                words opens that page instead (a Text inside a Text can have its own onPress). */}
            <Pressable
              style={styles.agreeRow}
              onPress={() => setAgreed(!agreed)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              hitSlop={6}
            >
              <Ionicons name={agreed ? "checkbox" : "square-outline"} size={22} color="#FFFFFF" />
              <Text style={styles.agreeText}>
                I agree to the{" "}
                <Text style={styles.agreeLink} onPress={() => openPage(TERMS_URL)}>
                  Terms of Use
                </Text>{" "}
                and{" "}
                <Text style={styles.agreeLink} onPress={() => openPage(PRIVACY_URL)}>
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSignup}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                !canSubmit && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>{isLoading ? "Creating account…" : "Sign up"}</Text>
            </Pressable>

            <View style={styles.bottomRow}>
              <Text style={styles.fadedText}>Already have an account? </Text>
              {/* replace: swap this screen for Login instead of stacking on top */}
              <Link href="/login" replace>
                <Text style={styles.linkText}>Log in</Text>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </BeanBackground>
  );
}

const styles = StyleSheet.create({
  agreeRow: {
    flexDirection: "row", // box on the left, sentence on the right
    alignItems: "flex-start",
    gap: 10,
    marginTop: 18,
  },
  agreeText: {
    flex: 1, // let the sentence wrap onto two lines if it needs to
    color: COLORS.fadedWhite,
    fontSize: 14,
    lineHeight: 20,
  },
  agreeLink: {
    color: "#FFFFFF",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  background: {
    flex: 1,
  },
  tapArea: {
    flex: 1, // cover the whole screen so a tap anywhere counts
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
  firstInput: {
    marginBottom: 14,
  },
  spacedInput: {
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 12,
  },
  button: {
    height: 52, // full width of the card, pill shaped (same as Login)
    borderRadius: 26,
    marginTop: 24,
    backgroundColor: COLORS.cream,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5, // faded until every field is filled in
  },
  buttonText: {
    color: COLORS.plum,
    fontSize: 17,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  fadedText: {
    color: COLORS.fadedWhite,
    fontSize: 15,
  },
  linkText: {
    color: "#FFFFFF", // readable on plum (the old bright blue clashed)
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
