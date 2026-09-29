// Discover (Phase 8): find cafés. Before searching it's a "home" with the
// illustration as a compact banner and (from the next steps) suggestions;
// after searching it shows the café results.

import { ArtBanner } from "@/components/ArtBanner";
import { ForYou } from "@/components/ForYou";
import { FriendsCafes } from "@/components/FriendsCafes";
import { fetchFriendIds } from "@/lib/friends";
import { fetchFeed } from "@/lib/posts";
import { FriendCafe, groupFriendCafes } from "@/lib/stats";
import { CafeCard } from "@/components/CafeCard";
import { SearchBar } from "@/components/SearchBar";
import { COLORS } from "@/constants/theme";
import { Cafe, fetchNearbyCafes, fetchRecommendations, Recommendations } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [city, setCity] = useState("");
  const [cafes, setCafes] = useState<Cafe[] | null>(null); // null = haven't searched yet
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [friendCafes, setFriendCafes] = useState<FriendCafe[]>([]);

  // Load the Discover sections whenever Discover comes into view. They're
  // bonuses: if one fails (e.g. the backend is off), that section just doesn't show.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let isActive = true;
      fetchRecommendations(user)
        .then((result) => {
          if (isActive) setRecommendations(result);
        })
        .catch((error) => console.log("Recommendations failed:", error));

      // "Where your friends went": friends' recent posts (only theirs, not mine),
      // grouped into cafés. Straight from Firebase - no backend needed.
      fetchFriendIds(user.uid)
        .then((friendIds) => (friendIds.length > 0 ? fetchFeed(friendIds) : []))
        .then((posts) => {
          if (isActive) setFriendCafes(groupFriendCafes(posts));
        })
        .catch((error) => console.log("Friends' cafés failed:", error));

      return () => {
        isActive = false;
      };
    }, [user])
  );

  async function handleSearch() {
    if (city.trim() === "" || isLoading) return;

    Keyboard.dismiss(); // put the keyboard away so the results are visible
    setErrorMessage("");
    setIsLoading(true);
    try {
      const results = await fetchNearbyCafes(city.trim());
      setCafes(results);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  // Back to the Discover home
  function clearSearch() {
    setCafes(null);
    setErrorMessage("");
  }

  const status = (
    <>
      {isLoading && <ActivityIndicator color={COLORS.plum} style={styles.spinner} />}
      {errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}
    </>
  );

  // ---------- Discover home (before searching) ----------
  if (cafes === null) {
    return (
      <ScrollView
        style={styles.home}
        contentContainerStyle={[styles.homeContent, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets // keeps the search bar above the keyboard
      >
        <ArtBanner />
        <View style={styles.searchArea}>
          <SearchBar value={city} onChangeText={setCity} onSubmit={handleSearch} />
          {status}
        </View>

        <ForYou recommendations={recommendations} />
        <FriendsCafes cafes={friendCafes} />

        {/* "Near me" and recent searches arrive in the next step */}
      </ScrollView>
    );
  }

  // ---------- Search results ----------
  return (
    <ImageBackground
      source={require("@/assets/images/background_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={[styles.topArea, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={clearSearch} style={styles.backButton} accessibilityLabel="Back to Discover">
          <Ionicons name="chevron-back" size={22} color={COLORS.plum} />
        </Pressable>
        <View style={styles.flexOne}>
          <SearchBar value={city} onChangeText={setCity} onSubmit={handleSearch} />
        </View>
      </View>
      <View style={styles.statusArea}>{status}</View>

      <FlatList
        data={cafes}
        keyExtractor={(cafe) => cafe.place_id}
        numColumns={2} // a two-column grid, like the web gallery
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag" // scrolling puts the keyboard away
        ListEmptyComponent={<Text style={styles.emptyText}>No cafés found. Try another city.</Text>}
        renderItem={({ item }) => (
          <CafeCard
            cafe={item}
            onPress={() =>
              // Open this café's page, passing its id (in the address) and name
              router.push({
                pathname: "/search/cafe/[placeId]",
                params: { placeId: item.place_id, name: item.name },
              })
            }
          />
        )}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Discover home
  home: {
    flex: 1,
    backgroundColor: COLORS.latte, // matches the illustration, so the banner blends in
  },
  homeContent: {
    paddingBottom: 120, // room for the nav pill
  },
  searchArea: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  // Results
  background: {
    flex: 1,
  },
  topArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  flexOne: {
    flex: 1,
  },
  statusArea: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  spinner: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 12,
    color: COLORS.plum,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 8,
    borderRadius: 6,
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120, // leave room so the nav pill doesn't cover the last café
    gap: 16, // space between rows
  },
  gridRow: {
    gap: 16, // space between the two cards in a row
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.plum,
    marginTop: 24,
  },
});
