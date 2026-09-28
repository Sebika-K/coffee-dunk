import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

// A small custom "hook": returns true while the keyboard is on screen
export function useKeyboardOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // iPhone can tell us just BEFORE the keyboard moves; Android only after
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showListener = Keyboard.addListener(showEvent, () => setIsOpen(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setIsOpen(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return isOpen;
}
