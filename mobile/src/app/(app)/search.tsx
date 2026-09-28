import { COLORS } from "@/constants/theme";
import { Cafe, fetchNearbyCafes } from "@/lib/api";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();

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

  const searchBar = (
    <View style={styles.searchBar}>
      <TextInput
        style={styles.input}
        placeholder="Enter the city name"
        placeholderTextColor={COLORS.placeholder}
        value={city}
        onChangeText={setCity}
        returnKeyType="search" // keyboard's Enter key says "Search"
        onSubmitEditing={handleSearch} // ...and pressing it searches
        autoCorrect={false}
      />
      <Pressable style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>
    </View>
  );

  return (
    <ImageBackground
      source={require("@/assets/images/search_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Before searching: bar sits in the middle, like the web page.
          After searching: bar moves to the top, results below. */}
      <View
        style={[
          hasSearched ? styles.topArea : styles.centerArea,
          { paddingTop: insets.top + 12 },
        ]}
      >
        {searchBar}
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
  centerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topArea: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    backgroundColor: COLORS.plum,
    width: "100%",
    maxWidth: 380,
    height: 66,
    borderRadius: 33,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1, // take all the space the button doesn't
    height: 38,
    borderRadius: 5,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: COLORS.sand,
    color: COLORS.plum,
  },
  button: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: COLORS.sand,
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.plum,
    fontSize: 15,
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
