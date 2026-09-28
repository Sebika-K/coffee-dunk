// Find friends: search by username and send friend requests.

import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { avatarSource } from "@/lib/format";
import {
  FriendState,
  getFriendState,
  PublicProfile,
  searchUsers,
  sendFriendRequest,
} from "@/lib/friends";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// A search result + how I'm connected to them
type Result = PublicProfile & { state: FriendState };

export default function FindFriendsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState("");
  const [results, setResults] = useState<Result[] | null>(null); // null = haven't searched
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSearch() {
    if (!user || text.trim() === "") return;
    setErrorMessage("");
    setIsSearching(true);
    try {
      const people = await searchUsers(text, user.uid);
      // Look up my relationship with each person, all at the same time
      const states = await Promise.all(people.map((p) => getFriendState(user.uid, p.id)));
      setResults(people.map((p, i) => ({ ...p, state: states[i] })));
    } catch (error) {
      console.log("Friend search failed:", error);
      setErrorMessage("Couldn't search right now. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAdd(person: Result) {
    if (!user) return;
    // Show "Requested" straight away (feels instant), then save
    updateState(person.id, "requested");
    try {
      await sendFriendRequest(user.uid, person.id);
    } catch (error) {
      console.log("Friend request failed:", error);
      updateState(person.id, "none"); // undo the instant change
      setErrorMessage("Couldn't send the request. Please try again.");
    }
  }

  // Change one person's state in the list (a NEW list - never edit the old one)
  function updateState(personId: string, state: FriendState) {
    setResults((current) =>
      current ? current.map((p) => (p.id === personId ? { ...p, state } : p)) : current
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.title}>Find friends</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by username"
          placeholderTextColor={COLORS.placeholder}
          value={text}
          onChangeText={setText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} accessibilityLabel="Search">
          {isSearching ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="search" size={18} color="white" />
          )}
        </Pressable>
      </View>

      {errorMessage !== "" && <Text style={styles.message}>{errorMessage}</Text>}

      <FlatList
        data={results ?? []}
        keyExtractor={(person) => person.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          results !== null ? <Text style={styles.message}>No one found with that username.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={avatarSource(item.photo_url)} style={styles.avatar} />
            <Text style={styles.username} numberOfLines={1}>
              {item.username}
            </Text>
            <StateButton state={item.state} onAdd={() => handleAdd(item)} />
          </View>
        )}
      />
    </View>
  );
}

// The button/label on the right of each person
function StateButton({ state, onAdd }: { state: FriendState; onAdd: () => void }) {
  if (state === "none") {
    return (
      <Pressable style={styles.addButton} onPress={onAdd}>
        <Ionicons name="person-add-outline" size={16} color="white" />
        <Text style={styles.addText}>Add</Text>
      </Pressable>
    );
  }
  const labels = {
    requested: "Requested",
    incoming: "Wants to be friends",
    friends: "Friends ✓",
  };
  return <Text style={styles.stateText}>{labels[state]}</Text>;
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
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.2)",
    fontSize: 15,
    color: COLORS.plum,
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    color: COLORS.plum,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "white",
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.plum,
  },
  addText: {
    color: "white",
    fontWeight: "600",
  },
  stateText: {
    color: COLORS.placeholder,
    fontSize: 13,
  },
});
