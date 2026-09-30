// The app's background: latte-coloured, with faded coffee beans scattered
// across the whole screen (inspired by apps with soft floating bubbles).
//
// Why faded and scattered? Dark beans in one corner compete with whatever
// sits on top of them. Faint beans everywhere read as texture instead, so
// text and buttons can sit on top of them without clashing.
//
// Use it instead of <ImageBackground source={background_screen.png}>:
//   <BeanBackground style={styles.background}>...screen...</BeanBackground>
//
// The beans also float gently up and down, each at its own speed, like bubbles.

import { COLORS } from "@/constants/theme";
import { Image } from "expo-image";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

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

const FLOAT_DISTANCE = 8; // how far each bean drifts up and down, in points

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function BeanBackground({ children, style }: Props) {
  // Some people turn on "Reduce Motion" in their phone's accessibility settings
  // because movement makes them feel unwell. If it's on, the beans stay still.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => listener.remove();
  }, []);

  return (
    <View style={[styles.screen, style]}>
      {/* The bean layer: fills the screen behind everything.
          pointerEvents="none" = taps go straight through to the screen above. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {LAYOUT.map((spot, i) => (
          <FloatingBean key={i} spot={spot} index={i} still={reduceMotion} />
        ))}
      </View>

      {children}
    </View>
  );
}

// One bean, gently drifting up and down forever.
function FloatingBean({ spot, index, still }: { spot: (typeof LAYOUT)[number]; index: number; still: boolean }) {
  // An Animated.Value is a number that can change smoothly over time WITHOUT
  // redrawing the screen each frame. It goes 0 -> 1 -> 0 -> 1 ... and we turn
  // that into "how far up or down" below. useRef keeps the same one between redraws.
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) return;

    // Each bean gets its own speed (5-9 seconds per drift) and starts at a
    // different time, so they don't all bob together like a marching band
    const duration = 5000 + (index % 5) * 1000;
    const ease = Easing.inOut(Easing.sin); // slow at the top and bottom, like floating

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration, easing: ease, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration, easing: ease, useNativeDriver: true }),
      ])
    );
    // useNativeDriver: the phone's graphics system runs the animation itself,
    // so it stays smooth even while the app is busy (loading, scrolling...)
    const timer = setTimeout(() => animation.start(), (index * 700) % duration);

    // Leaving the screen: stop, so we don't animate beans nobody can see
    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [progress, index, still]);

  // 0 -> 1 becomes "8 points down" -> "8 points up". Odd beans go the other
  // way, so neighbours move in opposite directions.
  const drift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: index % 2 === 0 ? [FLOAT_DISTANCE, -FLOAT_DISTANCE] : [-FLOAT_DISTANCE, FLOAT_DISTANCE],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: spot.size,
        opacity: BEAN_OPACITY,
        // move back by half its size so (x, y) is the bean's CENTRE, drift, then turn it
        transform: [
          { translateX: -spot.size / 2 },
          { translateY: -spot.size / 2 },
          { translateY: drift },
          { rotate: `${spot.rotate}deg` },
        ],
      }}
    >
      <Image source={BEANS[spot.bean].source} style={{ width: "100%", aspectRatio: BEANS[spot.bean].aspectRatio }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.latte, // the same tan as the old background picture
  },
});
