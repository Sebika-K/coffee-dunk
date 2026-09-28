import { Stack } from "expo-router";

// The search tab has its own stack of screens:
//   search (index)  →  café page  →  (more later)
// so you can swipe back from a café to your results.
export default function SearchLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
