// The ❤️ button: outline when not liked, filled red when liked.

import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

type Props = {
  isLiked: boolean;
  onToggle: () => void;
  size?: number;
};

export function LikeButton({ isLiked, onToggle, size = 26 }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? "Unlike" : "Like"}
    >
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={size}
        color={isLiked ? COLORS.heart : COLORS.plum}
      />
    </Pressable>
  );
}
