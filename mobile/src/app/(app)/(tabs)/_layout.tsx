import { NavPill } from "@/components/NavPill";
import { Tabs } from "expo-router";

// The main tabs, switched with the nav pill:  ☕ feed · 🔍 search · profile.
// The FIRST tab listed is where the app opens - the friends feed.
// Tabs keep each screen alive when you switch away, so e.g. your search
// results are still there when you come back from your profile.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <NavPill />}>
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
