// Choose which café a post is for: suggestions appear while typing the name,
// or press search for a full list. Tap one to choose it.

import { COLORS } from "@/constants/theme";
import { SuggestionList } from "@/components/SuggestionList";
import { usePlaceSuggestions } from "@/hooks/usePlaceSuggestions";
import { CafeSearchResult, fetchCafeSuggestions, PlaceSuggestion, searchCafesByName } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export type ChosenCafe = { placeId: string; name: string };

type Props = {
  selected: ChosenCafe | null;
  onSelect: (cafe: ChosenCafe) => void;
  onClear: () => void;
};

export function CafePicker({ selected, onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CafeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false); // only suggest while typing
  // Where the phone is, if the app is already allowed to know (null otherwise)
  const [near, setNear] = useState<{ latitude: number; longitude: number } | null>(null);

  // Nearby cafés make better suggestions. We only use the location if permission
  // was ALREADY given (e.g. via "Near me") - we don't pop up a request just for this.
  useEffect(() => {
    let isActive = true;
    Location.getForegroundPermissionsAsync()
      .then((permission) => (permission.granted ? Location.getLastKnownPositionAsync() : null))
      .then((position) => {
        if (isActive && position) setNear(position.coords);
      })
      .catch(() => {}); // no location: suggestions still work, just not sorted by distance
    return () => {
      isActive = false;
    };
  }, []);

  // useCallback keeps this the "same" function between redraws (unless the
  // location changes), so the suggestions hook doesn't re-run for no reason
  const fetchSuggestions = useCallback(
    (text: string, sessionToken: string) => fetchCafeSuggestions(text, sessionToken, near),
    [near]
  );
  const { suggestions, endSession } = usePlaceSuggestions(isTyping ? query : "", fetchSuggestions);

  function handleQueryChange(text: string) {
    setQuery(text);
    setIsTyping(true);
    setResults([]); // old full-search results no longer match what's typed
  }

  // Tapped a suggestion: choose that café straight away
  function pickSuggestion(suggestion: PlaceSuggestion) {
    endSession();
    setIsTyping(false);
    setQuery("");
    onSelect({ placeId: suggestion.place_id, name: suggestion.main });
  }

  async function handleSearch() {
    if (query.trim() === "") return;
    setIsTyping(false); // the full results replace the suggestions
    setErrorMessage("");
    setIsLoading(true);
    try {
      const found = await searchCafesByName(query.trim());
      setResults(found);
      if (found.length === 0) setErrorMessage("No cafés found. Try adding the city.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  // A café is chosen: show it as a "chip" with an ✕ to change it
  if (selected) {
    return (
      <View style={styles.chip}>
        <Ionicons name="cafe" size={18} color={COLORS.plum} />
        <Text style={styles.chipText} numberOfLines={1}>
          {selected.name}
        </Text>
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Change café">
          <Ionicons name="close-circle" size={20} color={COLORS.placeholder} />
        </Pressable>
      </View>
    );
  }

  // No café yet: show the search box and results
  return (
    <View style={styles.wrapper}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search cafés (e.g. Mozart's Austin)"
          placeholderTextColor={COLORS.placeholder}
          value={query}
          onChangeText={handleQueryChange}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCorrect={false}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} accessibilityLabel="Search cafés">
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="search" size={18} color="white" />
          )}
        </Pressable>
      </View>

      <SuggestionList suggestions={suggestions} onPick={pickSuggestion} />

      {errorMessage !== "" && <Text style={styles.message}>{errorMessage}</Text>}

      {/* A short list, so a plain map() is fine here (no FlatList needed) */}
      {results.map((cafe) => (
        <Pressable
          key={cafe.place_id}
          style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
          onPress={() => {
            onSelect({ placeId: cafe.place_id, name: cafe.name });
            setResults([]);
            setQuery("");
          }}
        >
          <Text style={styles.resultName}>{cafe.name}</Text>
          {cafe.address && (
            <Text style={styles.resultAddress} numberOfLines={1}>
              {cafe.address}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
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
    color: COLORS.plum,
    fontSize: 14,
  },
  result: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.15)",
  },
  resultPressed: {
    backgroundColor: COLORS.sand,
  },
  resultName: {
    color: COLORS.plum,
    fontWeight: "600",
    fontSize: 15,
  },
  resultAddress: {
    color: COLORS.placeholder,
    fontSize: 13,
    marginTop: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.25)",
  },
  chipText: {
    flex: 1,
    color: COLORS.plum,
    fontWeight: "600",
    fontSize: 15,
  },
});
