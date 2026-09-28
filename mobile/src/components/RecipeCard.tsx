// The recipe of a homemade coffee, shown on its post page (Phase 7.3).

import { brewMethodLabel, Recipe } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { formatRatio } from "@/lib/format";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: Props) {
  // Only the amounts that were filled in, e.g. ["18 g coffee", "250 ml water"]
  const amounts = [
    recipe.coffee_g && `${recipe.coffee_g} g coffee`,
    recipe.water_ml && `${recipe.water_ml} ml water`,
    recipe.milk_ml && `${recipe.milk_ml} ml milk`,
  ].filter((a): a is string => Boolean(a));

  const ratio = formatRatio(recipe.coffee_g, recipe.water_ml);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📝 Recipe</Text>

      <Detail label="Method" value={brewMethodLabel(recipe.method)} />
      {recipe.beans && <Detail label="Beans" value={recipe.beans} />}

      {amounts.length > 0 && (
        <View style={styles.chipsRow}>
          {amounts.map((amount) => (
            <Text key={amount} style={styles.chip}>
              {amount}
            </Text>
          ))}
          {ratio && <Text style={[styles.chip, styles.ratioChip]}>Ratio {ratio}</Text>}
        </View>
      )}

      {recipe.sweetener && <Detail label="Sweetener" value={recipe.sweetener} />}

      {recipe.steps && (
        <View style={styles.steps}>
          <Text style={styles.label}>Steps</Text>
          {/* Text keeps the line breaks the person typed */}
          <Text style={styles.stepsText}>{recipe.steps}</Text>
        </View>
      )}
    </View>
  );
}

// "Label: value" on one line
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.detail}>
      <Text style={styles.label}>{label}: </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.15)",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.plum,
  },
  detail: {
    fontSize: 15,
    color: COLORS.plum,
  },
  label: {
    fontWeight: "700",
    color: COLORS.plum,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    fontSize: 13,
    color: COLORS.plum,
    backgroundColor: COLORS.sand,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  ratioChip: {
    backgroundColor: COLORS.plum,
    color: "white",
    fontWeight: "600",
  },
  steps: {
    gap: 4,
    marginTop: 2,
  },
  stepsText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.plum,
  },
});
