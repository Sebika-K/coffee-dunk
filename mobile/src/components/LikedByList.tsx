// On YOUR post: who liked it. Only you can see this.

import { COLORS } from "@/constants/theme";
import { avatarSource } from "@/lib/format";
import { PublicProfile } from "@/lib/friends";
import { openUserProfile } from "@/lib/navigation";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  likers: PublicProfile[];
};

export function LikedByList({ likers }: Props) {
  if (likers.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="heart" size={18} color={COLORS.heart} />
        <Text style={styles.title}>Liked by</Text>
      </View>
      {likers.map((person) => (
        <Pressable
          key={person.id}
          style={styles.row}
          onPress={() => openUserProfile(person.id, undefined)}
        >
          <Image source={avatarSource(person.photo_url)} style={styles.avatar} />
          <Text style={styles.name} numberOfLines={1}>
            {person.username}
          </Text>
        </Pressable>
      ))}
      <Text style={styles.privateNote}>Only you can see who liked your post.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.15)",
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: COLORS.plum,
  },
  privateNote: {
    fontSize: 12,
    color: COLORS.placeholder,
  },
});
