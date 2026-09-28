// The 🔖 "Want to try" button. Filled when saved, outline when not.

import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

type Props = {
  isSaved: boolean;
  onToggle: () => void;
  size?: number;
};

export function SaveButton({ isSaved, onToggle, size = 22 }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? "Remove from Want to try" : "Save to Want to try"}
    >
      <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={size} color={COLORS.plum} />
    </Pressable>
  );
}
