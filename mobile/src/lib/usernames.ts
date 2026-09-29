// Unique usernames.
//
// DATA DESIGN - one "claim" document per username, in the "usernames" collection:
//   usernames/<username in lowercase>   { uid, username }
// A document id can only exist ONCE, so only one person can hold each name.
// "Sam" and "sam" are the same claim (the id is lowercase), so people can't
// pick look-alike names that differ only in capitals.
//
// The database rules make sure you can only create a claim for YOURSELF and
// never take over someone else's (see firebase/firestore.rules).

import { db } from "@/lib/firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

function claimRef(username: string) {
  return doc(db, "usernames", username.toLowerCase());
}

// Thrown when someone else already has the name, so screens can show a nice message
export class UsernameTakenError extends Error {
  constructor(username: string) {
    super(`"${username}" is already taken.`);
  }
}

// Is this a good username? Returns a message to show, or null if it's fine.
// Letters, numbers, dots and underscores only - no spaces, so names are easy
// to search for and tell apart (like Instagram).
export function usernameProblem(username: string): string | null {
  if (username.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters.`;
  if (username.length > USERNAME_MAX) return `Username can be at most ${USERNAME_MAX} characters.`;
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return "Use only letters, numbers, dots (.) and underscores (_).";
  }
  return null;
}

// Quick check before signing up (readable without being logged in).
// Only a hint - claimUsername() below is the check that really counts.
export async function isUsernameAvailable(username: string, myId?: string): Promise<boolean> {
  const snap = await getDoc(claimRef(username));
  return !snap.exists() || snap.data().uid === myId;
}

// Take a username for this user, and let go of their old one.
//
// A TRANSACTION reads and writes together as one step: Firestore re-runs it if
// someone else changed the claim in between. So if two people grab "sam" at the
// same moment, exactly one of them gets it - the other gets UsernameTakenError.
//
// It also updates the public profile (users/<uid>) in the same step, so the
// claim and the profile can never disagree.
export async function claimUsername(uid: string, username: string, oldUsername?: string | null) {
  await runTransaction(db, async (transaction) => {
    const newClaim = await transaction.get(claimRef(username));
    if (newClaim.exists() && newClaim.data().uid !== uid) {
      throw new UsernameTakenError(username);
    }

    // Release the old name (only if it's really ours, and really different)
    const releaseOld = oldUsername && oldUsername.toLowerCase() !== username.toLowerCase();
    const oldClaim = releaseOld ? await transaction.get(claimRef(oldUsername)) : null;

    // (A transaction must do all its reads before any writes)
    transaction.set(claimRef(username), { uid, username });
    if (oldClaim?.exists() && oldClaim.data().uid === uid) {
      transaction.delete(oldClaim.ref);
    }
    transaction.set(
      doc(db, "users", uid),
      { username, username_lower: username.toLowerCase() },
      { merge: true }
    );
  });
}
