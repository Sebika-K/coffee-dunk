// Wrap a photo so a DOUBLE tap likes it, with a big heart that pops and fades
// (like Instagram). A single tap can still do something else (e.g. open the post).
//
// How we tell a single tap from a double tap: after a tap we wait a moment
// (DOUBLE_TAP_MS). If a second tap comes in that time -> double tap.
// If not -> it was a single tap. That short wait is why apps with double-tap
// feel a tiny bit slower to open things on a single tap.

import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useRef } from "react";
import { Animated, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

const DOUBLE_TAP_MS = 250;

type Props = {
  children: ReactNode;
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function DoubleTapHeart({ children, onDoubleTap, onSingleTap, style }: Props) {
  // useRef = values that survive redraws but DON'T cause one when they change
  const lastTapAt = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Animated values drive the heart's size and see-through-ness smoothly
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // If the screen closes while we're waiting, cancel the pending single tap
  useEffect(() => {
    return () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    };
  }, []);

  function popHeart() {
    scale.setValue(0.3);
    opacity.setValue(1);
    Animated.sequence([
      // Bounce up to full size...
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      // ...stay a moment, then fade out
      Animated.timing(opacity, { toValue: 0, duration: 250, delay: 250, useNativeDriver: true }),
    ]).start();
  }

  function handlePress() {
    const now = Date.now();

    // Second tap soon after the first -> DOUBLE tap
    if (now - lastTapAt.current < DOUBLE_TAP_MS) {
      lastTapAt.current = 0;
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current); // it wasn't a single tap after all
      singleTapTimer.current = null;
      popHeart();
      onDoubleTap();
      return;
    }

    // First tap -> wait to see if a second one follows
    lastTapAt.current = now;
    if (onSingleTap) {
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        onSingleTap();
      }, DOUBLE_TAP_MS);
    }
  }

  return (
    <Pressable onPress={handlePress} style={style}>
      {children}
      {/* The heart sits on top of the photo; pointerEvents="none" lets taps pass through it */}
      <Animated.View
        pointerEvents="none"
        style={[styles.heartLayer, { opacity, transform: [{ scale }] }]}
      >
        <Ionicons name="heart" size={96} color="white" style={styles.heart} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heartLayer: {
    position: "absolute", // cover the whole photo
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    // A soft shadow so the white heart shows on light photos too
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowRadius: 12,
  },
});
