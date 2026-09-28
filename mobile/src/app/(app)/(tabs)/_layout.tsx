import { NavPill } from "@/components/NavPill";
import { Tabs } from "expo-router";

// The two main tabs (🏠 search and profile), switched with the nav pill.
// Tabs keep each screen alive when you switch away, so e.g. your search
// results are still there when you come back from your profile.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <NavPill />}>
      <Tabs.Screen name="search" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
