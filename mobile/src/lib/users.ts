// Public profiles: the small part of each user that OTHER people can see
// (username + photo), stored in the "users" collection.
//
// Why? Firebase Auth only lets the app read the logged-in user's own name and
// photo. To find friends and show them in a feed, everyone needs a public copy.

import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { claimUsername } from "@/lib/usernames";

// Everyone's username for display: their chosen name, or the start of their email
export function usernameFor(user: User): string {
  return user.displayName || user.email?.split("@")[0] || "coffee-lover";
}

// Create or update the user's public profile from their account details.
// merge: true = only these fields change; their bio (and anything else) is kept.
//
// The username is only copied if the account HAS one (displayName). Right
// after signing up it doesn't yet - the signup screen claims the name first
// (see usernames.ts), and we mustn't overwrite that with the email prefix.
export async function syncPublicProfile(user: User) {
  const nameFields = user.displayName
    ? { username: user.displayName, username_lower: user.displayName.toLowerCase() }
    : {};
  await setDoc(
    doc(db, "users", user.uid),
    { ...nameFields, photo_url: user.photoURL ?? null },
    { merge: true }
  );
}

// Remember WHEN someone agreed to the Terms of Use and Privacy Policy
// (they tick the box at signup). Useful proof if it's ever needed.
export async function recordTermsAccepted(uid: string) {
  await setDoc(doc(db, "users", uid), { terms_accepted_at: serverTimestamp() }, { merge: true });
}

// Accounts made BEFORE unique usernames have no claim yet. On login, claim
// their current name if it's free. If someone else already has it, leave it -
// they can pick a new name in Settings.
export async function claimExistingUsername(user: User) {
  if (!user.displayName) return;
  try {
    await claimUsername(user.uid, user.displayName);
  } catch (error) {
    console.log(`Couldn't claim existing username "${user.displayName}":`, error);
  }
}
