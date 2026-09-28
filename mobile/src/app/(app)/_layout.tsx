import { Stack } from "expo-router";

// Screens inside the app (only for logged-in users).
// The bottom nav pill will be added here in step 2.4b.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="search" />
    </Stack>
  );
}
