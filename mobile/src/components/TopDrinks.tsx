// "What to order here": a café's best drinks, from everyone's ratings.

import { describeDrink } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { TopDrink } from "@/lib/api";
import { formatRating } from "@/lib/stats";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  drinks: TopDrink[];
};

export function TopDrinks({ drinks }: Props) {
  // No journal posts at this café yet -> show nothing
  if (drinks.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>☕ What to order here</Text>

      {drinks.map((drink, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.rank}>{index + 1}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {describeDrink(drink)}
          </Text>
          <Text style={styles.detail}>
            {formatRating(drink.average)} ★ · {drink.count} {drink.count === 1 ? "rating" : "ratings"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
    gap: 10,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.plum,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    backgroundColor: COLORS.plum,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.plum,
  },
  detail: {
    fontSize: 13,
    color: COLORS.plum,
  },
});
