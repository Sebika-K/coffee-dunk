import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Temporary profile screen
export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.displayName || "Your profile"}</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <Pressable style={styles.button} onPress={() => signOut(auth)}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.sand,
  },
  title: {
    fontSize: 22,
    color: COLORS.plum,
    fontWeight: "600",
  },
  subtitle: {
    color: COLORS.plum,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.plum,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
