import { COLORS, PILL } from "@/constants/theme";
import { router } from "expo-router";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The landing screen: first thing people see when they open the app.
// The logo is part of the background picture; the two buttons sit at the bottom.
export default function LandingScreen() {
  // How much space the phone reserves at the bottom (e.g. the home-bar line on newer iPhones),
  // so the buttons never sit on top of it.
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require("@/assets/images/landing_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={[styles.buttons, { bottom: insets.bottom + 24 }]}>
        {/* Main action: new people signing up. Filled plum so it stands out most. */}
        <Pressable
          style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
          onPress={() => router.push("/signup")}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, styles.primaryText]}>Sign up</Text>
        </Pressable>

        {/* Second action: people who already have an account. Quieter cream pill. */}
        <Pressable
          style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
          onPress={() => router.push("/login")}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, styles.secondaryText]}>Log in</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, // fill the whole screen
  },
  buttons: {
    position: "absolute",
    left: 24, // side margins so the buttons don't touch the screen edges
    right: 24,
    gap: 12, // space between the two buttons
  },
  button: {
    height: 52, // comfortably above Apple's 44pt minimum tap size
    borderRadius: 26, // half the height = fully rounded pill
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: COLORS.plum,
    boxShadow: PILL.shadow,
  },
  secondary: {
    backgroundColor: COLORS.cream, // same cream as the nav pill and search bar
    boxShadow: PILL.shadow,
  },
  pressed: {
    opacity: 0.8, // small visual feedback when tapped
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600", // semi-bold: easier to read than regular weight
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: COLORS.plum,
  },
});
