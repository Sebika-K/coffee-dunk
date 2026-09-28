import { COLORS } from "@/constants/theme";
import { CafeCard } from "@/components/CafeCard";
import { SearchBar } from "@/components/SearchBar";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { Cafe, fetchNearbyCafes } from "@/lib/api";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();

  const [city, setCity] = useState("");
  const [cafes, setCafes] = useState<Cafe[] | null>(null); // null = haven't searched yet
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const hasSearched = cafes !== null;

  return (
    <ImageBackground
      // Illustration before searching; the plain background (like the web
      // results page) once there are cards to look at
      source={
        hasSearched
          ? require("@/assets/images/background_screen.png")
          : require("@/assets/images/search_screen.png")
      }
      style={styles.background}
      resizeMode="cover"
    >
      {/* Before searching: bar sits below the illustration.
          After searching: bar moves to the top, results below. */}
      <View
        style={
          hasSearched
            ? [styles.topArea, { paddingTop: insets.top + 12 }]
            : [styles.belowArt, keyboardOpen && styles.aboveKeyboard]
        }
      >
        <SearchBar value={city} onChangeText={setCity} onSubmit={handleSearch} />
        {isLoading && <ActivityIndicator color={COLORS.plum} style={styles.spinner} />}
        {errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>

      {hasSearched && (
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
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  belowArt: {
    position: "absolute",
    top: "67%", // just under the girl's feet in the illustration
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  aboveKeyboard: {
    top: "38%", // slide up while typing so the keyboard doesn't cover it
  },
  topArea: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
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
