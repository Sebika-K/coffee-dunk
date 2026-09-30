import { Stack } from "expo-router";

// Everything for logged-in users:
//   (tabs)  - the main screens with the nav pill (search, profile)
//   upload    - slides up OVER the tabs as a modal, like Instagram's "new post"
//   settings  - slides in from the side, over the tabs (no nav pill)
//   post      - one journal entry, full screen (also slides in from the side)
//   user      - someone else's profile (tap a name or photo anywhere)
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="upload" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="find-friends" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="user/[userId]" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="blocked" />
    </Stack>
  );
}
