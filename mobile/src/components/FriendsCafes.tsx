// "Where your friends went": cafés from your friends' recent posts,
// as a row of small cards you can swipe sideways (Phase 8.1c).

import { Avatar } from "@/components/Avatar";
import { COLORS } from "@/constants/theme";
import { formatTimeAgo } from "@/lib/format";
import { FriendCafe } from "@/lib/stats";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  cafes: FriendCafe[];
};

export function FriendsCafes({ cafes }: Props) {
  if (cafes.length === 0) return null; // no friends' café posts yet -> hide

  return (
    <View style={styles.section}>
      <Text style={styles.title}>☕ Where your friends went</Text>

      {/* horizontal = swipe sideways; the page itself still scrolls up and down */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {cafes.map((cafe) => (
          <Pressable
            key={cafe.place_id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() =>
              router.push({
                pathname: "/search/cafe/[placeId]",
                params: { placeId: cafe.place_id, name: cafe.cafe_name },
              })
            }
          >
            <Image
              source={
                cafe.photo_url
                  ? { uri: cafe.photo_url }
                  : require("@/assets/images/cafe-placeholder.jpg")
              }
              style={styles.photo}
              contentFit="cover"
              transition={200}
            />
            <Text style={styles.cafeName} numberOfLines={1}>
              {cafe.cafe_name}
            </Text>

            {/* Up to 3 overlapping avatars + "sam & 2 others" */}
            <View style={styles.friendsRow}>
              {cafe.friends.slice(0, 3).map((friend, i) => (
                <Avatar
                  key={i}
                  photoUrl={friend.avatar}
                  name={friend.name}
                  size={20}
                  style={[styles.avatarBorder, i > 0 && styles.avatarOverlap]}
                />
              ))}
              <Text style={styles.friendsText} numberOfLines={1}>
                {friendsLabel(cafe.friends.map((f) => f.name))}
              </Text>
            </View>

            {cafe.last_visit && <Text style={styles.time}>{formatTimeAgo(cafe.last_visit)}</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ["sam"] -> "sam", ["sam","jo"] -> "sam & jo", ["sam","jo","al"] -> "sam & 2 others"
function friendsLabel(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} & ${names.length - 1} others`;
}

const CARD_WIDTH = 150;

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    gap: 10,
  },
  title: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.plum,
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    padding: 8,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.85,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: COLORS.sand,
  },
  cafeName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.plum,
  },
  friendsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBorder: {
    borderWidth: 1.5,
    borderColor: "white",
  },
  avatarOverlap: {
    marginLeft: -7, // tuck each avatar slightly under the previous one
  },
  friendsText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.plum,
  },
  time: {
    fontSize: 11,
    color: COLORS.placeholder,
  },
});
