// The floating bottom navigation pill (🏠 + your avatar),
// rebuilt from the web app's nav-pill.css / nav-pill.js.

import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function NavPill() {
  const { user } = useAuth();
  const pathname = usePathname(); // which screen we're on, e.g. "/search"
  const insets = useSafeAreaInsets(); // space taken by the iPhone home bar, notch, etc.
  const keyboardOpen = useKeyboardOpen();

  // Like the web version: hide the pill while typing
  if (keyboardOpen) return null;

  const avatar = user?.photoURL
    ? { uri: user.photoURL }
    : require("@/assets/images/default-avatar.jpg");

  return (
    <View style={[styles.pill, { bottom: insets.bottom + 12 }]}>
      <Pressable
        onPress={() => router.navigate("/search")}
        style={[styles.homeButton, pathname === "/search" && styles.active]}
        accessibilityLabel="Home"
      >
        <Text style={styles.homeIcon}>🏠</Text>
      </Pressable>

      <Pressable
        onPress={() => router.navigate("/profile")}
        style={[styles.avatarButton, pathname === "/profile" && styles.activeAvatar]}
        accessibilityLabel="Profile"
      >
        <Image source={avatar} style={styles.avatarImage} />
      </Pressable>
    </View>
  );
}

// A small custom "hook": returns true while the keyboard is on screen
function useKeyboardOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // iPhone can tell us just BEFORE the keyboard moves; Android only after
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showListener = Keyboard.addListener(showEvent, () => setIsOpen(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setIsOpen(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return isOpen;
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    alignSelf: "center", // centred horizontally
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 999, // fully rounded ends
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  homeIcon: {
    fontSize: 26,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden", // crop the photo into a circle
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  // Highlight for the screen you're currently on
  active: {
    backgroundColor: "rgba(125, 46, 77, 0.12)",
  },
  activeAvatar: {
    borderColor: COLORS.plum,
  },
});
