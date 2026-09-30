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
import { SuggestionList } from "@/components/SuggestionList";
import { usePlaceSuggestions } from "@/hooks/usePlaceSuggestions";
import { COLORS } from "@/constants/theme";
import {
  Cafe,
  CafePage,
  PlaceSuggestion,
  fetchCafesNearPoint,
  fetchCitySuggestions,
  fetchMoreCafes,
  fetchNearbyCafes,
  fetchRecommendations,
  Recommendations,
} from "@/lib/api";
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "@/lib/recentSearches";
import * as Location from "expo-location";
import { useAuth } from "@/lib/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  // true while the person is typing in the search bar - only then do we show suggestions
  // (not when the app fills the bar itself, e.g. after tapping a recent search)
  const [isTyping, setIsTyping] = useState(false);
  const { suggestions, endSession } = usePlaceSuggestions(isTyping ? city : "", fetchCitySuggestions);
  const [cafes, setCafes] = useState<Cafe[] | null>(null); // null = haven't searched yet
  const [isLoading, setIsLoading] = useState(false);
  // Ticket for the next 20 cafés of the current search (null = no more)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // spinner at the bottom of the list
  const [errorMessage, setErrorMessage] = useState("");
  const [resultsTitle, setResultsTitle] = useState(""); // e.g. "Cafés near you"
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
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

  // Load recent searches (saved on this phone) once, when Discover first opens
  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  // Shared by every kind of search: show a spinner, run it, show results or an error
  async function runSearch(title: string, search: () => Promise<CafePage>) {
    if (isLoading) return;
    Keyboard.dismiss(); // put the keyboard away so the results are visible
    setErrorMessage("");
    setIsLoading(true);
    try {
      const page = await search();
      setCafes(page.cafes);
      setNextPageToken(page.nextPageToken);
      setResultsTitle(title);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCityChange(text: string) {
    setCity(text);
    setIsTyping(true);
  }

  // Search by city (typed, picked from suggestions, or tapped from recent searches).
  // cityName can be the full "Dallas, TX, USA" - the full name finds the right
  // Dallas, while the title just says "Cafés in Dallas".
  async function searchCity(cityName: string) {
    const name = cityName.trim();
    if (name === "") return;
    setIsTyping(false); // hide the suggestions
    setCity(name);
    await runSearch(`Cafés in ${shortName(name)}`, () => fetchNearbyCafes(name));
    setRecentSearches(await addRecentSearch(name));
  }

  // Tapped a suggestion: that typing session is over, then search it
  function pickSuggestion(suggestion: PlaceSuggestion) {
    endSession();
    searchCity(suggestion.description);
  }

  // 📍 Near me: ask for location permission, get the phone's position, search there
  async function searchNearMe() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Location needed",
        "To find cafés near you, allow location access for this app in your phone's Settings. You can still search by city."
      );
      return;
    }
    setCity("");
    setIsTyping(false);
    await runSearch("Cafés near you", async () => {
      // A recent known position is instant; otherwise ask for a fresh one
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      return fetchCafesNearPoint(position.coords.latitude, position.coords.longitude);
    });
  }

  // Near the bottom of the list: fetch the next 20 cafés and add them on.
  // Google allows 3 batches (60 cafés) per search, then nextPageToken is null.
  async function loadMore() {
    if (!nextPageToken || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    try {
      const page = await fetchMoreCafes(nextPageToken);
      setCafes((current) => {
        // Skip any café we already show (Google occasionally repeats one)
        const shown = new Set((current ?? []).map((cafe) => cafe.place_id));
        return [...(current ?? []), ...page.cafes.filter((cafe) => !shown.has(cafe.place_id))];
      });
      setNextPageToken(page.nextPageToken);
    } catch (error) {
      // Not worth an error message: the cafés already shown are still fine.
      // Stop trying, so we don't keep failing while they scroll.
      console.log("Loading more cafés failed:", error);
      setNextPageToken(null);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleClearRecent() {
    await clearRecentSearches();
    setRecentSearches([]);
  }

  // Back to the Discover home
  function clearSearch() {
    setIsTyping(false);
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
          <SearchBar value={city} onChangeText={handleCityChange} onSubmit={() => searchCity(city)} />
          <SuggestionList suggestions={suggestions} onPick={pickSuggestion} />

          {/* Quick options under the search bar */}
          <View style={styles.quickRow}>
            <Pressable style={styles.nearMeButton} onPress={searchNearMe} disabled={isLoading}>
              <Ionicons name="navigate" size={15} color="white" />
              <Text style={styles.nearMeText}>Near me</Text>
            </Pressable>
            {recentSearches.map((recent) => (
              <Pressable key={recent} style={styles.recentChip} onPress={() => searchCity(recent)}>
                <Ionicons name="time-outline" size={13} color={COLORS.plum} />
                <Text style={styles.recentText}>{shortName(recent)}</Text>
              </Pressable>
            ))}
            {recentSearches.length > 0 && (
              <Pressable onPress={handleClearRecent} hitSlop={8}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            )}
          </View>

          {status}
        </View>

        <ForYou recommendations={recommendations} />
        <FriendsCafes cafes={friendCafes} />

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
          <SearchBar value={city} onChangeText={handleCityChange} onSubmit={() => searchCity(city)} />
        </View>
      </View>
      <View style={styles.resultsSuggestions}>
        <SuggestionList suggestions={suggestions} onPick={pickSuggestion} />
      </View>
      <Text style={styles.resultsTitle}>{resultsTitle}</Text>
      <View style={styles.statusArea}>{status}</View>

      <FlatList
        data={cafes}
        keyExtractor={(cafe) => cafe.place_id}
        numColumns={2} // a two-column grid, like the web gallery
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag" // scrolling puts the keyboard away
        ListEmptyComponent={<Text style={styles.emptyText}>No cafés found here. Try another search.</Text>}
        onEndReached={loadMore} // called when you scroll near the bottom
        onEndReachedThreshold={0.5} // "near" = within half a screen of the end
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator color={COLORS.plum} style={styles.loadMoreSpinner} /> : null
        }
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

// "Dallas, TX, USA" -> "Dallas" (for titles and chips; the full name is kept for searching)
function shortName(place: string) {
  return place.split(",")[0].trim();
}

const styles = StyleSheet.create({
  resultsSuggestions: {
    paddingHorizontal: 12,
    marginTop: -8, // sit snugly under the search bar row
    marginBottom: 8,
  },
  loadMoreSpinner: {
    marginVertical: 20,
  },
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
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap", // chips flow onto the next line when needed
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  nearMeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.plum,
  },
  nearMeText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
  },
  recentText: {
    color: COLORS.plum,
    fontSize: 13,
  },
  clearText: {
    color: COLORS.plum,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  // Results
  resultsTitle: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.plum,
  },
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
