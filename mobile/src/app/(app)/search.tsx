import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { StyleSheet, Text, View } from "react-native";

// Temporary home screen - the real café search is built in step 2.5
export default function SearchScreen() {
  const { user } = useAuth();
  const name = user?.displayName || user?.email;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi, {name} ☕</Text>
      <Text style={styles.subtitle}>Café search coming in step 2.5</Text>
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
});
