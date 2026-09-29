// Your friends: requests to answer, your friends, and requests you've sent.

import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { avatarSource } from "@/lib/format";
import {
  acceptFriendRequest,
  fetchMyFriends,
  MyFriends,
  PublicProfile,
  removeFriendship,
} from "@/lib/friends";
import { openUserProfile } from "@/lib/navigation";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EMPTY: MyFriends = { friends: [], incoming: [], sent: [] };

export default function FriendsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<MyFriends>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null); // person being accepted/removed

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setData(await fetchMyFriends(user.uid));
    } catch (error) {
      console.log("Friends load failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Reload whenever this screen comes into view (e.g. back from Find friends)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Run an action for one person, show a spinner on their row, then reload
  async function act(personId: string, action: () => Promise<void>) {
    setBusyId(personId);
    try {
      await action();
      await load();
    } catch (error) {
      console.log("Friend action failed:", error);
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function confirmUnfriend(person: PublicProfile) {
    if (!user) return;
    Alert.alert(`Remove ${person.username}?`, "You'll stop seeing each other's coffee.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => act(person.id, () => removeFriendship(user.uid, person.id)),
      },
    ]);
  }

  if (!user) return null;
  const myId = user.uid;
  const { friends, incoming, sent } = data;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.title}>Friends</Text>
        <Pressable
          onPress={() => router.push("/find-friends")}
          style={styles.iconButton}
          accessibilityLabel="Find friends"
        >
          <Ionicons name="person-add-outline" size={22} color={COLORS.plum} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.plum} style={styles.spinner} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          {/* Requests waiting for me */}
          {incoming.length > 0 && (
            <Section title={`Friend requests (${incoming.length})`}>
              {incoming.map((person) => (
                <PersonRow key={person.id} person={person} busy={busyId === person.id}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => act(person.id, () => acceptFriendRequest(myId, person.id))}
                  >
                    <Text style={styles.primaryText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => act(person.id, () => removeFriendship(myId, person.id))}
                  >
                    <Text style={styles.secondaryText}>Decline</Text>
                  </Pressable>
                </PersonRow>
              ))}
            </Section>
          )}

          {/* My friends */}
          <Section title={`Your friends (${friends.length})`}>
            {friends.length === 0 ? (
              <Text style={styles.empty}>
                No friends yet. Tap the 👤+ above to find people by username.
              </Text>
            ) : (
              friends.map((person) => (
                <PersonRow key={person.id} person={person} busy={busyId === person.id}>
                  <Pressable
                    onPress={() => confirmUnfriend(person)}
                    hitSlop={8}
                    accessibilityLabel={`Remove ${person.username}`}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.placeholder} />
                  </Pressable>
                </PersonRow>
              ))
            )}
          </Section>

          {/* Requests I sent */}
          {sent.length > 0 && (
            <Section title="Sent requests">
              {sent.map((person) => (
                <PersonRow key={person.id} person={person} busy={busyId === person.id}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => act(person.id, () => removeFriendship(myId, person.id))}
                  >
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </Pressable>
                </PersonRow>
              ))}
            </Section>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// A titled group of rows
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// One person: photo, name, and whatever buttons are passed in (children)
function PersonRow({
  person,
  busy,
  children,
}: {
  person: PublicProfile;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.row}>
      {/* Photo + name open their profile; the buttons on the right do their own thing */}
      <Pressable style={styles.person} onPress={() => openUserProfile(person.id, undefined)}>
        <Image source={avatarSource(person.photo_url)} style={styles.avatar} />
        <Text style={styles.username} numberOfLines={1}>
          {person.username}
        </Text>
      </Pressable>
      {busy ? <ActivityIndicator color={COLORS.plum} /> : <View style={styles.actions}>{children}</View>}
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
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.plum,
  },
  empty: {
    color: COLORS.placeholder,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "white",
  },
  person: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.plum,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  primaryButton: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.plum,
    justifyContent: "center",
  },
  primaryText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
    justifyContent: "center",
  },
  secondaryText: {
    color: COLORS.plum,
  },
});
