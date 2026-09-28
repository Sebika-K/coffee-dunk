// Public profiles: the small part of each user that OTHER people can see
// (username + photo), stored in the "users" collection.
//
// Why? Firebase Auth only lets the app read the logged-in user's own name and
// photo. To find friends and show them in a feed, everyone needs a public copy.

import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Everyone's username for display: their chosen name, or the start of their email
export function usernameFor(user: User): string {
  return user.displayName || user.email?.split("@")[0] || "coffee-lover";
}

// Create or update the user's public profile from their account details.
// merge: true = only these fields change; their bio (and anything else) is kept.
export async function syncPublicProfile(user: User) {
  const username = usernameFor(user);
  await setDoc(
    doc(db, "users", user.uid),
    {
      username,
      username_lower: username.toLowerCase(), // for case-insensitive search
      photo_url: user.photoURL ?? null,
    },
    { merge: true }
  );
}
