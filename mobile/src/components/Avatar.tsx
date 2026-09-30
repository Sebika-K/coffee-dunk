// A round profile picture.
// If the person has uploaded a photo, show it. If not, show a plum circle
// with the first letter of their name (like Gmail), instead of a tiny logo.

import { COLORS } from "@/constants/theme";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  photoUrl: string | null | undefined; // their uploaded photo, if any
  name: string | null | undefined; // used for the letter when there's no photo
  size: number; // width and height in points
};

export function Avatar({ photoUrl, name, size }: Props) {
  // Same size and fully round for both versions, so they line up anywhere
  const circle = { width: size, height: size, borderRadius: size / 2 };

  // Only real web links are photos (old posts may hold a leftover website path)
  if (photoUrl?.startsWith("http")) {
    return <Image source={{ uri: photoUrl }} style={circle} />;
  }

  // First letter of their name, in capitals. "?" if we don't know the name.
  const letter = name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.letterCircle, circle]}>
      {/* The letter grows with the circle: about 45% of its size looks balanced */}
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  letterCircle: {
    backgroundColor: COLORS.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
