// The list of autocomplete suggestions shown under a search bar.
// Each row: a pin icon, the main name in bold ("Dallas"), the rest faded ("TX, USA").

import { COLORS } from "@/constants/theme";
import { PlaceSuggestion } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  suggestions: PlaceSuggestion[];
  onPick: (suggestion: PlaceSuggestion) => void;
};

export function SuggestionList({ suggestions, onPick }: Props) {
  if (suggestions.length === 0) return null; // nothing to show: take up no space

  return (
    <View style={styles.box}>
      {suggestions.map((suggestion, i) => (
        <Pressable
          key={suggestion.place_id}
          onPress={() => onPick(suggestion)}
          style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
        >
          <Ionicons name="location-outline" size={18} color={COLORS.plum} />
          <View style={styles.texts}>
            <Text style={styles.main} numberOfLines={1}>
              {suggestion.main}
            </Text>
            {suggestion.secondary && (
              <Text style={styles.secondary} numberOfLines={1}>
                {suggestion.secondary}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    maxWidth: 380, // same width as the search bar
    marginTop: 8,
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    overflow: "hidden", // keep the pressed highlight inside the rounded corners
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11, // rows end up ~48pt tall: easy to tap
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth, // the thinnest line the screen can draw
    borderTopColor: "rgba(125, 46, 77, 0.15)",
  },
  pressed: {
    backgroundColor: "rgba(125, 46, 77, 0.08)",
  },
  texts: {
    flex: 1,
  },
  main: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.plum,
  },
  secondary: {
    fontSize: 13,
    color: "rgba(125, 46, 77, 0.6)",
  },
});
