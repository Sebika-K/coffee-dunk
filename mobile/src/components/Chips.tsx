// Tap-to-choose "chips" (small rounded buttons).
//   ChoiceChips       - pick ONE (drink, milk, hot/iced). Tap again to un-pick.
//   MultiChoiceChips  - pick ANY number (tasting notes).
//
// <T extends string> is a TypeScript "generic": the same component works
// for drinks, milks or notes, and still knows EXACTLY which ids are allowed.

import { COLORS } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Option<T extends string> = { id: T; label: string };

type ChoiceProps<T extends string> = {
  options: readonly Option<T>[];
  selected: T | null;
  onChange: (id: T | null) => void;
};

export function ChoiceChips<T extends string>({ options, selected, onChange }: ChoiceProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = option.id === selected;
        return (
          <Chip
            key={option.id}
            label={option.label}
            isSelected={isSelected}
            // tapping the selected chip again clears the choice
            onPress={() => onChange(isSelected ? null : option.id)}
          />
        );
      })}
    </View>
  );
}

type MultiProps<T extends string> = {
  options: readonly Option<T>[];
  selected: T[];
  onChange: (ids: T[]) => void;
};

export function MultiChoiceChips<T extends string>({ options, selected, onChange }: MultiProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <Chip
            key={option.id}
            label={option.label}
            isSelected={isSelected}
            onPress={() =>
              onChange(
                isSelected
                  ? selected.filter((id) => id !== option.id) // remove it
                  : [...selected, option.id] // add it (a NEW list - never edit the old one)
              )
            }
          />
        );
      })}
    </View>
  );
}

// One chip - used by both components above
function Chip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, isSelected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }} // screen readers say "selected"
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap", // chips flow onto the next line when the row is full
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
    backgroundColor: "white",
  },
  chipSelected: {
    backgroundColor: COLORS.plum,
    borderColor: COLORS.plum,
  },
  chipText: {
    color: COLORS.plum,
    fontSize: 14,
  },
  chipTextSelected: {
    color: "white",
    fontWeight: "600",
  },
});
