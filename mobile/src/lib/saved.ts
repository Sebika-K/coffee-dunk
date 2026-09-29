// Saved 🔖: friends' posts you want to try (Phase 7.4).
//
// DATA DESIGN - a private list INSIDE each user's profile document:
//   users/<myId>/saved/<postId>   { saved_at: time }
// This is a "subcollection": a collection that belongs to one document.
// The document id IS the post id, so saving the same post twice just
// overwrites the same entry - no duplicates possible.

import { Post } from "@/lib/api";
import { db } from "@/lib/firebase";
import { fetchFriendIds } from "@/lib/friends";
import { fetchPost } from "@/lib/posts";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

function savedRef(myId: string, postId: string) {
  return doc(db, "users", myId, "saved", postId);
}

export async function savePost(myId: string, postId: string) {
  await setDoc(savedRef(myId, postId), { saved_at: serverTimestamp() });
}

export async function unsavePost(myId: string, postId: string) {
  await deleteDoc(savedRef(myId, postId));
}

// Have I saved this one post? (post page)
export async function isPostSaved(myId: string, postId: string): Promise<boolean> {
  return (await getDoc(savedRef(myId, postId))).exists();
}

// The ids of everything I've saved, newest save first (feed + profile)
export async function fetchSavedIds(myId: string): Promise<string[]> {
  const snapshot = await getDocs(
    query(collection(db, "users", myId, "saved"), orderBy("saved_at", "desc"))
  );
  return snapshot.docs.map((d) => d.id);
}

// The saved posts themselves, in the order they were saved.
// Only posts you can still see: your own and your CURRENT friends'.
//   - A friend deleted the post -> it disappears.
//   - You unfriended them       -> their posts disappear (the save stays, so
//                                  they come back if you become friends again).
// The database rules block these too; checking here as well means the app
// never depends on the rules alone.
export async function fetchSavedPosts(myId: string): Promise<Post[]> {
  const [ids, friendIds] = await Promise.all([fetchSavedIds(myId), fetchFriendIds(myId)]);
  const canSee = new Set([myId, ...friendIds]);

  const posts = await Promise.all(
    ids.map((id) =>
      fetchPost(id).catch((error) => {
        // Expected for an ex-friend's post once the rules are published
        console.log(`Saved post ${id} not readable:`, error.code ?? error);
        return null;
      })
    )
  );
  return posts.filter((p): p is Post => p !== null && p.user_id !== null && canSee.has(p.user_id));
}
