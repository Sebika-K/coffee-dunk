// Five tappable stars. Replaces the web app's "Rating (1-5)" number box.

import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  value: number; // 0 = not rated yet, 1-5 = number of stars
  onChange?: (value: number) => void; // leave out to just SHOW a rating (read-only)
  size?: number;
};

export function StarRating({ value, onChange, size = 34 }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange?.(star)}
          disabled={!onChange} // read-only stars can't be tapped
          hitSlop={6} // makes each star a little easier to tap
          accessibilityLabel={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Ionicons
            name={star <= value ? "star" : "star-outline"} // filled up to the chosen star
            size={size}
            color={COLORS.plum}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
});
