// The top of a profile: photo, three numbers (posts / cafés / average ★) and bio.
// Shared by YOUR profile tab and a friend's profile page, so both look the same.

import { COLORS } from "@/constants/theme";
import { DiaryStats, formatRating } from "@/lib/stats";
import { Avatar } from "@/components/Avatar";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  photoUrl: string | null | undefined; // their photo, if any
  name: string; // for the letter avatar when there is no photo
  stats: DiaryStats | null; // null = hide the numbers (e.g. not friends yet)
  bio: string;
};

export function ProfileSummary({ photoUrl, name, stats, bio }: Props) {
  return (
    <View>
      <View style={styles.profileRow}>
        <Avatar photoUrl={photoUrl} name={name} size={84} style={styles.avatarBorder} />
        {stats && (
          <View style={styles.stats}>
            <Stat value={stats.totalPosts} label="POSTS" />
            <Stat value={stats.cafesTried} label="CAFÉS" />
            <Stat
              value={stats.averageRating === null ? "–" : formatRating(stats.averageRating)}
              label="AVG ★"
            />
          </View>
        )}
      </View>
      {bio !== "" && <Text style={styles.bio}>{bio}</Text>}
    </View>
  );
}

// One number + label, e.g. "12 POSTS"
function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 16,
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: "white",
  },
  stats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.plum,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.plum,
    marginTop: 2,
  },
  bio: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.plum,
  },
});
