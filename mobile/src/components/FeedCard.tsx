// One post in the friends feed: photo first, then who / what / where.

import { LikeButton } from "@/components/LikeButton";
import { SaveButton } from "@/components/SaveButton";
import { StarRating } from "@/components/StarRating";
import { brewMethodLabel, describeDrink, tastingNoteLabel } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { avatarSource, formatTimeAgo } from "@/lib/format";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  post: Post;
  // Leave out the "on..." functions to hide the buttons (e.g. on your own posts)
  isSaved?: boolean;
  onToggleSave?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
};

export function FeedCard({
  post,
  isSaved = false,
  onToggleSave,
  isLiked = false,
  onToggleLike,
}: Props) {
  const drinkName = describeDrink(post);

  function openPost() {
    router.push({ pathname: "/post/[postId]", params: { postId: post.id } });
  }

  function openCafe() {
    if (!post.place_id) return;
    router.push({
      pathname: "/search/cafe/[placeId]",
      params: { placeId: post.place_id, name: post.cafe_name ?? "Café" },
    });
  }

  return (
    <Pressable onPress={openPost} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Who + when */}
      <View style={styles.userRow}>
        <Image source={avatarSource(post.user_avatar)} style={styles.avatar} />
        <Text style={styles.username} numberOfLines={1}>
          {post.user ?? "Anon"}
        </Text>
        {post.created_at && <Text style={styles.time}>{formatTimeAgo(post.created_at)}</Text>}
      </View>

      {/* The coffee */}
      <Image
        source={
          post.image_url ? { uri: post.image_url } : require("@/assets/images/cafe-placeholder.jpg")
        }
        style={styles.photo}
        contentFit="cover"
        transition={200}
      />

      {/* Actions, like Instagram: ❤️ on the left, 🔖 on the right */}
      {(onToggleLike || onToggleSave) && (
        <View style={styles.actionRow}>
          {onToggleLike && <LikeButton isLiked={isLiked} onToggle={onToggleLike} />}
          <View style={styles.spacer} />
          {onToggleSave && <SaveButton isSaved={isSaved} onToggle={onToggleSave} size={24} />}
        </View>
      )}

      {/* What + how good */}
      <View style={styles.drinkRow}>
        <Text style={styles.drink} numberOfLines={1}>
          {drinkName ?? "Coffee"}
        </Text>
        <StarRating value={post.rating ?? 0} size={16} />
      </View>

      {/* Where: made at home (with a hint that there's a recipe inside)... */}
      {post.source === "home" && (
        <View style={styles.cafeRow}>
          <Ionicons name="home-outline" size={15} color={COLORS.plum} />
          <Text style={styles.cafeName} numberOfLines={1}>
            Made at home
            {post.recipe ? ` · ${brewMethodLabel(post.recipe.method)} · recipe inside` : ""}
          </Text>
        </View>
      )}

      {/* ...or at a café - its own tap target, opens the café page */}
      {post.source === "cafe" && post.cafe_name && (
        <Pressable onPress={openCafe} disabled={!post.place_id} style={styles.cafeRow} hitSlop={6}>
          <Ionicons name="location-outline" size={15} color={COLORS.plum} />
          <Text style={styles.cafeName} numberOfLines={1}>
            {post.cafe_name}
          </Text>
          {post.place_id && <Ionicons name="chevron-forward" size={14} color={COLORS.placeholder} />}
        </Pressable>
      )}

      {post.notes.length > 0 && (
        <View style={styles.notesRow}>
          {post.notes.map((note) => (
            <Text key={note} style={styles.note}>
              {tastingNoteLabel(note)}
            </Text>
          ))}
        </View>
      )}

      {post.caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {post.caption}
        </Text>
      ) : null}

    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  },
  pressed: {
    opacity: 0.92,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  username: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.plum,
  },
  time: {
    fontSize: 12,
    color: COLORS.placeholder,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 14,
    backgroundColor: COLORS.sand,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -2,
    marginBottom: -4,
  },
  spacer: {
    flex: 1,
  },
  drinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drink: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.plum,
  },
  cafeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -4,
  },
  cafeName: {
    flexShrink: 1,
    fontSize: 14,
    color: COLORS.plum,
  },
  notesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  note: {
    fontSize: 12,
    color: COLORS.plum,
    backgroundColor: COLORS.sand,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.plum,
  },
});
