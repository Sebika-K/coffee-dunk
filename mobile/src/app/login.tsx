import { Stack } from "expo-router";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Colours taken from the web app's login.css, kept in one place
const COLORS = {
  plum: "#7D2E4D",
  sand: "#D8D0CB",
  fadedWhite: "rgba(252, 251, 251, 0.57)",
  placeholder: "rgba(114, 35, 35, 0.57)",
  link: "#0a58ff",
};

export default function LoginScreen() {
  return (
    <ImageBackground
      source={require("@/assets/images/background_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Hide the white header bar on this screen */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.card}>
        <TextInput
          style={[styles.input, styles.emailInput]}
          placeholder="Email"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry
          autoComplete="password"
        />

        <Pressable style={styles.forgotButton}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.fadedText}>Don't have an account? </Text>
          <Pressable>
            <Text style={styles.linkText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, // fill the whole screen
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
    width: 122,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonPressed: {
    backgroundColor: "rgba(216, 208, 203, 0.15)", // subtle feedback while pressed
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
