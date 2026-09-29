// The "Spill The City" illustration as a compact banner (Phase 8.1).
//
// The original image is a full phone-screen poster: mostly plain background,
// with the title + drawing in the middle band (about 23%–66% of its height).
// We show ONLY that band, scaled down, on a matching background colour -
// so the art keeps its charm without taking over the whole screen.

import { COLORS } from "@/constants/theme";
import { Image } from "expo-image";
import { StyleSheet, useWindowDimensions, View } from "react-native";

const IMAGE_ASPECT = 780 / 1688; // width ÷ height of search_screen.png
const BAND_TOP = 0.23; // where the title starts (fraction of the image height)
const BAND_BOTTOM = 0.66; // where the drawing ends
const SCALE = 0.75; // show the art at 75% of the screen width

export function ArtBanner() {
  const { width: screenWidth } = useWindowDimensions(); // updates if the screen size changes

  const imageWidth = screenWidth * SCALE;
  const imageHeight = imageWidth / IMAGE_ASPECT;

  return (
    // A "window" exactly as tall as the band we want to see...
    <View style={[styles.window, { height: imageHeight * (BAND_BOTTOM - BAND_TOP) }]}>
      {/* ...and the full image, shifted up so the band lines up with the window */}
      <Image
        source={require("@/assets/images/search_screen.png")}
        style={{ width: imageWidth, height: imageHeight, marginTop: -imageHeight * BAND_TOP }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    overflow: "hidden", // hide everything outside the band
    alignItems: "center",
    backgroundColor: COLORS.latte,
  },
});
