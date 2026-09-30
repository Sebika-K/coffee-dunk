// A round profile picture.
// If the person has uploaded a photo, show it. If not, show a plum circle
// with the first letter of their name (like Gmail), instead of a tiny logo.

import { COLORS } from "@/constants/theme";
import { Image } from "expo-image";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
  photoUrl: string | null | undefined; // their uploaded photo, if any
  name: string | null | undefined; // used for the letter when there's no photo
  size: number; // width and height in points
  style?: StyleProp<ViewStyle>; // extra looks, e.g. a white border
};

export function Avatar({ photoUrl, name, size, style }: Props) {
  // Same size and fully round for both versions, so they line up anywhere
  const circle = { width: size, height: size, borderRadius: size / 2 };

  // A photo is a web link ("https://...") or, in Settings, a photo just picked
  // from the phone ("file://..."). Old web posts may hold a leftover website
  // path like "/static/assets/default-avatar.jpg" - that isn't a real photo.
  if (photoUrl && !photoUrl.startsWith("/")) {
    return (
      // The circle is a View that crops the photo inside it, so the same
      // extra styles (like a border) work for photos and letters alike
      <View style={[styles.photoCircle, circle, style]}>
        <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />
      </View>
    );
  }

  // First letter of their name, in capitals. "?" if we don't know the name.
  const letter = name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.letterCircle, circle, style]}>
      {/* The letter grows with the circle: about 45% of its size looks balanced */}
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photoCircle: {
    overflow: "hidden", // cut the square photo into a circle
  },
  photo: {
    width: "100%",
    height: "100%",
  },
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
