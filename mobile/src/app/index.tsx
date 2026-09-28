import { COLORS } from "@/constants/theme";
import { Link, Stack } from "expo-router";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

// The landing screen: first thing people see when they open the app
export default function LandingScreen() {
  return (
    <ImageBackground
      source={require("@/assets/images/landing_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Hide the white header bar on this screen */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.bottomLinks}>
        <View style={styles.row}>
          <Text style={styles.text}>Already have an account? </Text>
          <Link href="/login">
            <Text style={styles.link}>Login</Text>
          </Link>
        </View>

        <View style={styles.row}>
          <Text style={styles.text}>Don't have an account? </Text>
          {/* Sign Up screen comes in step 2.3 - this does nothing yet */}
          <Pressable>
            <Text style={styles.link}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, // fill the whole screen
  },
  bottomLinks: {
    position: "absolute",
    bottom: 60, // sit near the bottom, like the web version
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 10,
  },
  row: {
    flexDirection: "row", // text and link side by side
    alignItems: "center",
  },
  text: {
    color: COLORS.plum,
    fontSize: 17,
  },
  link: {
    color: COLORS.linkPurple,
    fontSize: 17,
    textDecorationLine: "underline",
  },
});
