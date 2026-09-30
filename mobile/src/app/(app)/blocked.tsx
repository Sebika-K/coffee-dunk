// Blocked accounts: everyone you've blocked, with an Unblock button.

import { Avatar } from "@/components/Avatar";
import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { PublicProfile } from "@/lib/friends";
import { fetchBlockedProfiles, unblockUser } from "@/lib/safety";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BlockedScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchBlockedProfiles(user.uid)
      .then(setPeople)
      .catch((error) => console.log("Blocked list load failed:", error))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleUnblock(person: PublicProfile) {
    if (!user) return;
    try {
      await unblockUser(user.uid, person.id);
      // Remove them from the list (a NEW list, never edit the old one)
      setPeople((current) => current.filter((p) => p.id !== person.id));
    } catch (error) {
      console.log("Unblock failed:", error);
      Alert.alert("Couldn't unblock", "Please try again.");
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.title}>Blocked accounts</Text>
        <View style={styles.iconButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.plum} style={styles.spinner} />
      ) : (
        <FlatList
          data={people}
          keyExtractor={(person) => person.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>You haven't blocked anyone.</Text>}
          ListFooterComponent={
            people.length > 0 ? (
              <Text style={styles.note}>
                Unblocking doesn't make you friends again - you'd need to send a new request.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar photoUrl={item.photo_url} name={item.username} size={44} />
              <Text style={styles.username} numberOfLines={1}>
                {item.username}
              </Text>
              <Pressable style={styles.unblockButton} onPress={() => handleUnblock(item)}>
                <Text style={styles.unblockText}>Unblock</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.plum,
  },
  spinner: {
    marginTop: 40,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  empty: {
    color: COLORS.placeholder,
    fontSize: 15,
    textAlign: "center",
    marginTop: 24,
  },
  note: {
    marginTop: 8,
    color: COLORS.placeholder,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "white",
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.plum,
  },
  unblockButton: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
    justifyContent: "center",
  },
  unblockText: {
    color: COLORS.plum,
  },
});
