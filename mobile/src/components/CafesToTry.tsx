// "Because you love Iced oat latte - try these cafés" (Phase 6).

import { describeDrink } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { Recommendations } from "@/lib/api";
import { formatRating } from "@/lib/stats";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  recommendations: Recommendations | null;
};

export function CafesToTry({ recommendations }: Props) {
  // No favourite drink yet -> nothing to base recommendations on
  if (!recommendations?.favourite) return null;

  const drinkName = describeDrink(recommendations.favourite) ?? "your favourite drink";
  const { cafes } = recommendations;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>✨ Cafés to try</Text>
      <Text style={styles.subtitle}>
        Because you love <Text style={styles.bold}>{drinkName.toLowerCase()}</Text>
      </Text>

      {cafes.length === 0 ? (
        // The "cold start": not enough other people's ratings yet
        <Text style={styles.empty}>
          No suggestions yet. As more people rate {drinkName.toLowerCase()} at other cafés, they'll show up here.
        </Text>
      ) : (
        cafes.map((cafe) => (
          <Pressable
            key={cafe.place_id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              router.push({
                pathname: "/search/cafe/[placeId]",
                params: { placeId: cafe.place_id, name: cafe.cafe_name ?? "Café" },
              })
            }
          >
            <View style={styles.rowText}>
              <Text style={styles.cafeName} numberOfLines={1}>
                {cafe.cafe_name ?? "Café"}
              </Text>
              <Text style={styles.detail}>
                {drinkName} here: {formatRating(cafe.average)} ★ · {cafe.count}{" "}
                {cafe.count === 1 ? "rating" : "ratings"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.placeholder} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
    gap: 10,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.plum,
  },
  subtitle: {
    marginTop: -6,
    fontSize: 13,
    color: COLORS.plum,
  },
  bold: {
    fontWeight: "700",
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.plum,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "white",
  },
  rowPressed: {
    backgroundColor: COLORS.sand,
  },
  rowText: {
    flex: 1,
  },
  cafeName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.plum,
  },
  detail: {
    fontSize: 13,
    color: COLORS.placeholder,
  },
});
