import { Stack } from "expo-router";

// Everything for logged-in users:
//   (tabs)  - the main screens with the nav pill (search, profile)
//   upload  - slides up OVER the tabs as a modal, like Instagram's "new post"
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="upload" options={{ presentation: "modal" }} />
    </Stack>
  );
}
