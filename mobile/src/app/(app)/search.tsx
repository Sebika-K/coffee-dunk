import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Temporary home screen
export default function SearchScreen() {
  const { user } = useAuth();
  const name = user?.displayName || user?.email;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi, {name} ☕</Text>
      <Text style={styles.subtitle}>Café search coming in step 2.5</Text>

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
    gap: 12,
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
