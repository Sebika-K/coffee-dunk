import { NavPill } from "@/components/NavPill";
import { Tabs } from "expo-router";

// Screens inside the app (only for logged-in users).
// Tabs keep each screen alive when you switch away, so e.g. your search
// results are still there when you come back from your profile.
export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <NavPill />}>
      <Tabs.Screen name="search" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
