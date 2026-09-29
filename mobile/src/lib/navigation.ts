// Opening someone's profile from anywhere (feed, post page, friends list...).
//
// One helper so every screen behaves the same:
//   - tapping YOURSELF jumps to your own Profile tab (with your saved posts etc.)
//   - tapping anyone else opens their profile page on top

import { router } from "expo-router";

export function openUserProfile(userId: string | null | undefined, myId: string | undefined) {
  if (!userId) return; // very old posts may not have a user id
  if (userId === myId) {
    router.navigate("/profile");
    return;
  }
  router.push({ pathname: "/user/[userId]", params: { userId } });
}
