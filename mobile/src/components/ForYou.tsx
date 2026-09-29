// "For you" on Discover: cafés to try, because of the drink you love (Phase 6),
// ranked with your friends' taste counting more (Phase 7.6).

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

export function ForYou({ recommendations }: Props) {
  // Nothing to suggest yet (no favourite drink, or no one else has rated it
  // at a new café) -> hide the whole section rather than show an empty card
  if (!recommendations?.favourite || recommendations.cafes.length === 0) return null;

  const drinkName = describeDrink(recommendations.favourite) ?? "your favourite drink";
  const { cafes } = recommendations;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>✨ For you</Text>
      <Text style={styles.subtitle}>
        Because you love <Text style={styles.bold}>{drinkName.toLowerCase()}</Text>
      </Text>

      {cafes.map((cafe) => (
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
            {/* Social proof: friends' opinions count most */}
            {cafe.friends_count > 0 && (
              <Text style={styles.friends}>
                ❤️ {cafe.friends_count} {cafe.friends_count === 1 ? "friend" : "friends"} rated it
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.placeholder} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 20,
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
  friends: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.heart,
  },
  detail: {
    fontSize: 13,
    color: COLORS.placeholder,
  },
});
