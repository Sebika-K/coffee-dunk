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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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

// Accept a request someone sent me
export async function acceptFriendRequest(myId: string, otherId: string) {
  await updateDoc(doc(db, "friendships", pairId(myId, otherId)), { status: "accepted" });
}

// Remove the friendship document: used to DECLINE a request, CANCEL one I sent,
// or UNFRIEND someone. It's the same action in all three cases.
export async function removeFriendship(myId: string, otherId: string) {
  await deleteDoc(doc(db, "friendships", pairId(myId, otherId)));
}

// One person's public profile
async function fetchProfile(userId: string): Promise<PublicProfile> {
  const snap = await getDoc(doc(db, "users", userId));
  const data = snap.data();
  return {
    id: userId,
    username: data?.username ?? "coffee-lover",
    photo_url: data?.photo_url ?? null,
  };
}

export type MyFriends = {
  friends: PublicProfile[]; // accepted
  incoming: PublicProfile[]; // requests waiting for ME to answer
  sent: PublicProfile[]; // requests I sent that they haven't answered
};

// Just the ids of everyone I'm connected to (no names/photos - quick)
async function fetchConnectionIds(myId: string) {
  // "array-contains": every friendship where I'm one of the two members
  const snapshot = await getDocs(
    query(collection(db, "friendships"), where("members", "array-contains", myId))
  );

  const friendIds: string[] = [];
  const incomingIds: string[] = [];
  const sentIds: string[] = [];

  for (const docSnap of snapshot.docs) {
    const f = docSnap.data() as Friendship;
    const otherId = f.members.find((id) => id !== myId);
    if (!otherId) continue;

    if (f.status === "accepted") friendIds.push(otherId);
    else if (f.requested_by === myId) sentIds.push(otherId);
    else incomingIds.push(otherId);
  }
  return { friendIds, incomingIds, sentIds };
}

// The ids of my (accepted) friends - used by the feed
export async function fetchFriendIds(myId: string): Promise<string[]> {
  return (await fetchConnectionIds(myId)).friendIds;
}

// Everyone I'm connected to, sorted into friends / incoming / sent
export async function fetchMyFriends(myId: string): Promise<MyFriends> {
  const { friendIds, incomingIds, sentIds } = await fetchConnectionIds(myId);

  // Load everyone's name + photo at the same time
  const [friends, incoming, sent] = await Promise.all([
    Promise.all(friendIds.map(fetchProfile)),
    Promise.all(incomingIds.map(fetchProfile)),
    Promise.all(sentIds.map(fetchProfile)),
  ]);

  // Alphabetical friends list
  friends.sort((a, b) => a.username.localeCompare(b.username));
  return { friends, incoming, sent };
}
