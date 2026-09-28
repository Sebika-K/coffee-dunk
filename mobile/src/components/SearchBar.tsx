// A soft, rounded search bar that matches the nav pill.

import { COLORS, PILL } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string; // the ? means this one is optional
};

export function SearchBar({ value, onChangeText, onSubmit, placeholder = "Search a city…" }: Props) {
  const canSubmit = value.trim() !== "";

  return (
    <View style={styles.bar}>
      <Ionicons name="search" size={20} color={COLORS.placeholder} />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search" // the keyboard's Enter key says "Search"
        onSubmitEditing={onSubmit} // ...and pressing it searches
        autoCorrect={false}
      />

      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.goButton,
          pressed && styles.goButtonPressed,
          !canSubmit && styles.goButtonDisabled,
        ]}
        accessibilityLabel="Search"
      >
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    maxWidth: 380,
    height: PILL.height,
    borderRadius: PILL.height / 2, // perfectly round ends
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.25)", // thin, soft plum outline
    boxShadow: PILL.shadow,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 8,
    gap: 10,
  },
  input: {
    flex: 1, // take all the space the icons don't
    height: "100%",
    fontSize: 16,
    color: COLORS.plum,
  },
  goButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  goButtonPressed: {
    opacity: 0.8,
  },
  goButtonDisabled: {
    opacity: 0.35,
  },
});
