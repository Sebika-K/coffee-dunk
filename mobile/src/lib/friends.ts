// Friends: finding people and friend requests.
//
// DATA DESIGN - one document per PAIR of people, in the "friendships" collection:
//   friendships/<idA>_<idB>
//     members:      [idA, idB]   who's in this friendship
//     requested_by: idA          who sent the request
//     status:       "pending" | "accepted"
//     created_at:   time of the request
//
// The document id is the two user ids SORTED alphabetically, so Sam+Sebika and
// Sebika+Sam are always the SAME document. That makes duplicate or crossed
// requests impossible - there's only ever one friendship per pair.

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

export type PublicProfile = {
  id: string;
  username: string;
  photo_url: string | null;
};

export type Friendship = {
  members: string[];
  requested_by: string;
  status: "pending" | "accepted";
};

// Relationship between ME and someone else, from my point of view
export type FriendState = "none" | "requested" | "incoming" | "friends";

// The one document id for a pair of users (always in the same order)
export function pairId(userA: string, userB: string): string {
  return [userA, userB].sort().join("_");
}

// Find people whose username STARTS WITH the search text (not case-sensitive)
export async function searchUsers(text: string, myId: string): Promise<PublicProfile[]> {
  const q = text.trim().toLowerCase();
  if (q === "") return [];

  // "Starts with" trick: everything from "sam" up to "sam" + the highest
  // possible character matches "sam", "samantha", "sam_k"...
  const snapshot = await getDocs(
    query(
      collection(db, "users"),
      where("username_lower", ">=", q),
      where("username_lower", "<=", q + ""),
      orderBy("username_lower"),
      limit(15)
    )
  );

  return snapshot.docs
    .filter((d) => d.id !== myId) // don't show yourself
    .map((d) => ({
      id: d.id,
      username: d.data().username ?? "coffee-lover",
      photo_url: d.data().photo_url ?? null,
    }));
}

// How am I connected to this person?
export async function getFriendState(myId: string, otherId: string): Promise<FriendState> {
  const snap = await getDoc(doc(db, "friendships", pairId(myId, otherId)));
  if (!snap.exists()) return "none";

  const friendship = snap.data() as Friendship;
  if (friendship.status === "accepted") return "friends";
  return friendship.requested_by === myId ? "requested" : "incoming";
}

// Send a friend request
export async function sendFriendRequest(myId: string, otherId: string) {
  await setDoc(doc(db, "friendships", pairId(myId, otherId)), {
    members: [myId, otherId],
    requested_by: myId,
    status: "pending",
    created_at: serverTimestamp(),
  });
}
