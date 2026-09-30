// The floating bottom navigation pill (☕ feed, 🔍 search, your avatar),
// rebuilt from the web app's nav-pill.css / nav-pill.js.

import { Avatar } from "@/components/Avatar";
import { COLORS, PILL } from "@/constants/theme";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { useAuth } from "@/lib/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function NavPill() {
  const { photoURL, displayName } = useAuth();
  const pathname = usePathname(); // which screen we're on, e.g. "/search" or "/search/cafe/ChIJ…"
  const insets = useSafeAreaInsets(); // space taken by the iPhone home bar, notch, etc.
  const keyboardOpen = useKeyboardOpen();

  // Like the web version: hide the pill while typing
  if (keyboardOpen) return null;

  return (
    <View style={[styles.pill, { bottom: insets.bottom + 12 }]}>
      <PillIcon
        icon="cafe"
        label="Feed"
        isActive={pathname === "/feed" || pathname === "/"}
        onPress={() => router.navigate("/feed")}
      />
      <PillIcon
        icon="search"
        label="Discover"
        isActive={pathname.startsWith("/search")}
        onPress={() => router.navigate("/search")}
      />

      <Pressable
        onPress={() => router.navigate("/profile")}
        style={[styles.avatarButton, pathname === "/profile" && styles.activeAvatar]}
        accessibilityLabel="Profile"
      >
        <Avatar photoUrl={photoURL} name={displayName} size={40} />
      </Pressable>
    </View>
  );
}

// One icon button in the pill (filled icon when active, outline when not)
function PillIcon({
  icon,
  label,
  isActive,
  onPress,
}: {
  icon: "cafe" | "search";
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.homeButton, isActive && styles.active]}
      accessibilityLabel={label}
    >
      <Ionicons name={isActive ? icon : `${icon}-outline`} size={24} color={COLORS.plum} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    alignSelf: "center", // centred horizontally
    height: PILL.height,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 999, // fully rounded ends
    backgroundColor: COLORS.cream,
    boxShadow: PILL.shadow,
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
  // Highlight for the screen you're currently on
  active: {
    backgroundColor: "rgba(125, 46, 77, 0.12)",
  },
  activeAvatar: {
    borderColor: COLORS.plum,
  },
});
