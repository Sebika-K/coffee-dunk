// One café in the results grid, rebuilt from the web app's result.css.

import { COLORS } from "@/constants/theme";
import { Cafe, cafePhotoUrl } from "@/lib/api";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";

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
      <Text style={styles.rating}>{cafe.rating ?? "No rating"} ⭐</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, // share the row equally with the card next to it
    maxWidth: "48%", // keeps a lone last card from stretching full width
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    boxShadow: "2px 2px 6px rgba(0, 0, 0, 0.1)",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }], // a tiny "press in" effect
  },
  photo: {
    width: "100%",
    aspectRatio: 168 / 203, // same shape as the web cards
    borderRadius: 12,
    backgroundColor: COLORS.sand, // shows while the photo loads
  },
  name: {
    marginTop: 8,
    fontWeight: "700",
    color: COLORS.plum,
    textAlign: "center",
    lineHeight: 19,
    minHeight: 38, // always 2 lines tall, so every card is the same height
  },
  rating: {
    marginTop: 2,
    fontWeight: "700",
    fontSize: 13,
    color: COLORS.plum,
  },
});
