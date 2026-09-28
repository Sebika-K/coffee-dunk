// Choose which café a post is for: search by name, tap a result.

import { COLORS } from "@/constants/theme";
import { CafeSearchResult, searchCafesByName } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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

  async function handleSearch() {
    if (query.trim() === "") return;
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
          onChangeText={setQuery}
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
