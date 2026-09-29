// Saved 🔖: friends' posts you want to try (Phase 7.4).
//
// DATA DESIGN - a private list INSIDE each user's profile document:
//   users/<myId>/saved/<postId>   { saved_at: time }
// This is a "subcollection": a collection that belongs to one document.
// The document id IS the post id, so saving the same post twice just
// overwrites the same entry - no duplicates possible.

import { Post } from "@/lib/api";
import { db } from "@/lib/firebase";
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
// If a friend deleted a post, it simply disappears from the list.
export async function fetchSavedPosts(myId: string): Promise<Post[]> {
  const ids = await fetchSavedIds(myId);
  const posts = await Promise.all(ids.map((id) => fetchPost(id).catch(() => null)));
  return posts.filter((p): p is Post => p !== null);
}
