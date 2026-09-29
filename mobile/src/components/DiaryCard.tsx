// "Your coffee diary" card on the profile: most ordered drink,
// highest rated drink and favourite tasting note.

import { tastingNoteLabel } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { DiaryStats, formatRating } from "@/lib/stats";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  stats: DiaryStats;
  title?: string; // e.g. "Sam's coffee diary" on a friend's profile
};

export function DiaryCard({ stats, title = "Your coffee diary" }: Props) {
  const { mostOrdered, highestRated, favouriteNote } = stats;

  // No journal posts yet (only old posts, or none) -> a friendly nudge instead
  if (!mostOrdered && !highestRated && !favouriteNote) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>
          Add what you drank when you post, and your coffee stats will appear here ☕
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {mostOrdered && (
        <DiaryRow
          icon="repeat"
          label="Most ordered"
          value={mostOrdered.name}
          detail={`${mostOrdered.count}×`}
        />
      )}
      {highestRated && (
        <DiaryRow
          icon="star"
          label="Highest rated"
          value={highestRated.name}
          detail={`${formatRating(highestRated.average)} ★`}
        />
      )}
      {favouriteNote && (
        <DiaryRow
          icon="leaf-outline"
          label="Favourite note"
          value={tastingNoteLabel(favouriteNote.id)}
          detail={`${favouriteNote.count}×`}
        />
      )}
    </View>
  );
}

// The allowed icon names, taken straight from the Ionicons component,
// so TypeScript catches a misspelled icon name
type IconName = ComponentProps<typeof Ionicons>["name"];

function DiaryRow({ icon, label, value, detail }: { icon: IconName; label: string; value: string; detail: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={16} color={COLORS.plum} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
    gap: 12,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.plum,
  },
  empty: {
    color: COLORS.plum,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.placeholder,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.plum,
  },
  detail: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.plum,
  },
});
