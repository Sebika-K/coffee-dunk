import { Stack } from "expo-router";

// Everything for logged-in users:
//   (tabs)  - the main screens with the nav pill (search, profile)
//   upload    - slides up OVER the tabs as a modal, like Instagram's "new post"
//   settings  - slides in from the side, over the tabs (no nav pill)
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="upload" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
