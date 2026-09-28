import { COLORS } from "@/constants/theme";
import { SearchBar } from "@/components/SearchBar";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { Cafe, fetchNearbyCafes } from "@/lib/api";
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
      source={require("@/assets/images/search_screen.png")}
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
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No cafés found. Try another city.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.cafeName}>{item.name}</Text>
              <Text style={styles.rating}>{item.rating ?? "–"} ⭐</Text>
            </View>
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
    gap: 8,
  },
  row: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cafeName: {
    flex: 1,
    color: COLORS.plum,
    fontSize: 16,
  },
  rating: {
    color: COLORS.plum,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.plum,
    marginTop: 24,
  },
});
