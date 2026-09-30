// The app's background: latte-coloured, with faded coffee beans scattered
// across the whole screen (inspired by apps with soft floating bubbles).
//
// Why faded and scattered? Dark beans in one corner compete with whatever
// sits on top of them. Faint beans everywhere read as texture instead, so
// text and buttons can sit on top of them without clashing.
//
// Use it instead of <ImageBackground source={background_screen.png}>:
//   <BeanBackground style={styles.background}>...screen...</BeanBackground>

import { COLORS } from "@/constants/theme";
import { Image } from "expo-image";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

// Sebika's six hand-drawn beans, and each one's shape (width ÷ height),
// so they're never stretched
const BEANS = [
  { source: require("@/assets/images/beans/bean-1.png"), aspectRatio: 96 / 71 },
  { source: require("@/assets/images/beans/bean-2.png"), aspectRatio: 75 / 88 },
  { source: require("@/assets/images/beans/bean-3.png"), aspectRatio: 113 / 82 },
  { source: require("@/assets/images/beans/bean-4.png"), aspectRatio: 92 / 72 },
  { source: require("@/assets/images/beans/bean-5.png"), aspectRatio: 94 / 92 },
  { source: require("@/assets/images/beans/bean-6.png"), aspectRatio: 107 / 125 },
];

// Where each bean goes. x and y are PERCENTAGES of the screen, so the pattern
// fits any phone size. size = width in points, rotate = degrees.
// Fixed (not random), so the pattern is the same every time a screen opens.
const LAYOUT = [
  { bean: 0, x: 8, y: 4, size: 30, rotate: -20 },
  { bean: 2, x: 62, y: 7, size: 42, rotate: 15 },
  { bean: 4, x: 88, y: 15, size: 26, rotate: 40 },
  { bean: 1, x: 30, y: 17, size: 22, rotate: -35 },
  { bean: 5, x: 5, y: 28, size: 46, rotate: 10 },
  { bean: 3, x: 72, y: 30, size: 34, rotate: -60 },
  { bean: 0, x: 42, y: 38, size: 26, rotate: 80 },
  { bean: 2, x: 90, y: 44, size: 50, rotate: -10 },
  { bean: 4, x: 15, y: 50, size: 30, rotate: 25 },
  { bean: 1, x: 58, y: 55, size: 40, rotate: -25 },
  { bean: 5, x: 32, y: 64, size: 24, rotate: 55 },
  { bean: 3, x: 80, y: 68, size: 28, rotate: 110 },
  { bean: 0, x: 6, y: 75, size: 54, rotate: -45 },
  { bean: 2, x: 48, y: 79, size: 32, rotate: 30 },
  { bean: 4, x: 90, y: 86, size: 44, rotate: -15 },
  { bean: 1, x: 24, y: 91, size: 36, rotate: 70 },
  { bean: 5, x: 64, y: 96, size: 26, rotate: -70 },
];

const BEAN_OPACITY = 0.35; // how faded the beans are (0 = invisible, 1 = full colour)

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function BeanBackground({ children, style }: Props) {
  return (
    <View style={[styles.screen, style]}>
      {/* The bean layer: fills the screen behind everything.
          pointerEvents="none" = taps go straight through to the screen above. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {LAYOUT.map((spot, i) => (
          <Image
            key={i}
            source={BEANS[spot.bean].source}
            style={{
              position: "absolute",
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: spot.size,
              aspectRatio: BEANS[spot.bean].aspectRatio,
              opacity: BEAN_OPACITY,
              // move back by half its size so (x, y) is the bean's CENTRE, then turn it
              transform: [{ translateX: -spot.size / 2 }, { translateY: -spot.size / 2 }, { rotate: `${spot.rotate}deg` }],
            }}
          />
        ))}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.latte, // the same tan as the old background picture
  },
});
