// Likes on posts (Phase 7.5) - one ❤️, like Instagram, but gentle:
// there are no public like counts. Only the poster sees who liked their post.
//
// DATA DESIGN - a subcollection inside each post:
//   uploads/<postId>/likes/<userId>   { created_at }
// The document id is the LIKER's id: each person can like a post once,
// and unliking just deletes their document.

import { db } from "@/lib/firebase";
import { fetchProfile, PublicProfile } from "@/lib/friends";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

function likeRef(postId: string, userId: string) {
  return doc(db, "uploads", postId, "likes", userId);
}

export async function setLiked(postId: string, myId: string, liked: boolean) {
  if (liked) {
    await setDoc(likeRef(postId, myId), { created_at: serverTimestamp() });
  } else {
    await deleteDoc(likeRef(postId, myId));
  }
}

// Have I liked this post?
export async function isLikedByMe(postId: string, myId: string): Promise<boolean> {
  return (await getDoc(likeRef(postId, myId))).exists();
}

// Which of these posts have I liked? (feed)
// One small read per post, all at the same time - fine for a friends feed
// of ~30 posts; a much bigger app would store this differently.
export async function fetchLikedPostIds(postIds: string[], myId: string): Promise<Set<string>> {
  const results = await Promise.all(
    postIds.map(async (id) => ((await isLikedByMe(id, myId).catch(() => false)) ? id : null))
  );
  return new Set(results.filter((id): id is string => id !== null));
}

// Who liked MY post (only the poster is allowed to read this)
export async function fetchLikersOfMyPost(postId: string): Promise<PublicProfile[]> {
  const snapshot = await getDocs(collection(db, "uploads", postId, "likes"));
  return Promise.all(snapshot.docs.map((d) => fetchProfile(d.id)));
}
