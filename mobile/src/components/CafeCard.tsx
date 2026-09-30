// One café in the results grid, rebuilt from the web app's result.css.

import { COLORS } from "@/constants/theme";
import { Cafe, cafePhotoUrl } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  cafe: Cafe;
  onPress: () => void;
};

export function CafeCard({ cafe, onPress }: Props) {
  // Use the café's photo if Google has one, otherwise our placeholder
  const photo = cafe.photo_ref
    ? { uri: cafePhotoUrl(cafe.photo_ref) }
    : require("@/assets/images/cafe-placeholder.jpg");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image source={photo} style={styles.photo} contentFit="cover" transition={200} />

      {/* numberOfLines = the mobile version of CSS line-clamp */}
      <Text style={styles.name} numberOfLines={2}>
        {cafe.name}
      </Text>

      {/* The street, so two cafés with the same name can be told apart */}
      {cafe.address && (
        <Text style={styles.address} numberOfLines={1}>
          {cafe.address}
        </Text>
      )}

      {/* Plum star + number, matching the stars used on posts */}
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={13} color={COLORS.plum} />
        <Text style={styles.rating}>{cafe.rating ?? "No rating yet"}</Text>
        {cafe.rating != null && cafe.rating_count ? (
          <Text style={styles.reviewCount}>· {formatCount(cafe.rating_count)} reviews</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// 950 -> "950", 1234 -> "1.2k", 25000 -> "25k" (short enough for a small card)
function formatCount(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands < 10 ? thousands.toFixed(1).replace(".0", "") : Math.round(thousands)}k`;
}

const styles = StyleSheet.create({
  card: {
    flex: 1, // share the row equally with the card next to it
    maxWidth: "48%", // keeps a lone last card from stretching full width
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 10, // text lines up on the left, like Google Maps / Yelp cards
    boxShadow: "2px 2px 6px rgba(0, 0, 0, 0.1)",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }], // a tiny "press in" effect
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3, // wider than tall, so more cafés fit on screen
    borderRadius: 12,
    backgroundColor: COLORS.sand, // shows while the photo loads
  },
  name: {
    marginTop: 8,
    fontWeight: "700",
    color: COLORS.plum,
    fontSize: 15,
    lineHeight: 19,
  },
  address: {
    marginTop: 2,
    fontSize: 13,
    color: "rgba(125, 46, 77, 0.6)", // faded plum: less important than the name
  },
  ratingRow: {
    flexDirection: "row", // star and number side by side
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  rating: {
    fontWeight: "600",
    fontSize: 13,
    color: COLORS.plum,
  },
  reviewCount: {
    fontSize: 13,
    color: "rgba(125, 46, 77, 0.6)", // same faded plum as the address
  },
});
