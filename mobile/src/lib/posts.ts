// Creating a new post: upload the photo, then save the post details.
// Same data shape as the web app's upload.js, so old and new posts match.

import { db, storage } from "@/lib/firebase";
import {
  DrinkId,
  MilkId,
  Recipe,
  SourceId,
  TastingNoteId,
  TemperatureId,
} from "@/constants/drinks";
import { Post } from "@/lib/api";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

// Everything about a post you can choose on the upload screen (and change later)
export type PostDetails = {
  placeId: string | null; // null for homemade coffee
  cafeName: string | null;
  caption: string;
  rating: number;
  // Journal fields (Phase 3)
  drink: DrinkId;
  drinkCustom: string; // only used when drink is "other"
  milk: MilkId | null;
  temperature: TemperatureId | null;
  notes: TastingNoteId[];
  // Homemade coffee (Phase 7.3)
  source: SourceId;
  recipe: Recipe | null;
};

// A NEW post also needs the photo and who's posting
type NewPost = PostDetails & {
  photoUri: string; // the photo's location on the phone (file:///...)
  user: User;
};

// PostDetails -> the database's field names. Used by BOTH create and update,
// so a new post and an edited post are always saved in exactly the same shape.
function detailsToFields(details: PostDetails) {
  const isHome = details.source === "home";
  return {
    caption: details.caption,
    rating: details.rating,
    place_id: isHome ? null : details.placeId,
    cafe_name: isHome ? null : details.cafeName,
    // Journal fields: saved as ids (e.g. "latte"), never display text
    drink: details.drink,
    drink_custom: details.drink === "other" ? details.drinkCustom : null,
    milk: details.milk,
    temperature: details.temperature,
    notes: details.notes,
    // Where it came from; homemade posts carry their recipe
    source: details.source,
    recipe: isHome ? details.recipe : null,
  };
}

export async function createPost({ photoUri, user, ...details }: NewPost) {
  // 1) Read the photo from the phone as a "blob" (raw file data)
  const photoResponse = await fetch(photoUri);
  const photoBlob = await photoResponse.blob();

  // 2) Upload it to Firebase Storage, in a folder per user (like the web app)
  const photoRef = ref(storage, `uploads/${user.uid}/${Date.now()}.jpg`);
  await uploadBytes(photoRef, photoBlob, { contentType: "image/jpeg" });

  // 3) Get the photo's public link, so screens can display it
  const imageUrl = await getDownloadURL(photoRef);

  // 4) Save the post in the "uploads" collection - where the backend reads from
  await addDoc(collection(db, "uploads"), {
    ...detailsToFields(details), // what, where, rating... (shared with updatePost)
    image_url: imageUrl,
    user_id: user.uid,
    user: user.displayName || user.email?.split("@")[0] || "anon",
    user_avatar: user.photoURL ?? null, // null, NOT a website path (see step 2.6b)
    created_at: serverTimestamp(), // Firebase fills in the exact time
  });
}

// Edit one of YOUR posts. Only the details change - the photo, the owner and
// the original date stay as they were. "updateDoc" only touches the fields we
// pass in, so everything else on the post is left alone.
export async function updatePost(postId: string, details: PostDetails) {
  await updateDoc(doc(db, "uploads", postId), {
    ...detailsToFields(details),
    edited_at: serverTimestamp(), // handy later, e.g. an "edited" label
  });
}

// All posts by ONE user, newest first (for the profile page).
// Your own posts come straight from Firestore - the same query the web
// app's profile.js used, so the database index it needs already exists.
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const q = query(
    collection(db, "uploads"),
    where("user_id", "==", userId),
    orderBy("created_at", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docToPost);
}

// ONE post by its id (for the post page), or null if it doesn't exist (e.g. deleted)
export async function fetchPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, "uploads", postId));
  return snap.exists() ? docToPost(snap) : null;
}

// Turn a Firestore document into the same Post shape the backend sends.
// Shared by fetchUserPosts and fetchPost, so both always match.
export function docToPost(docSnap: DocumentSnapshot): Post {
  const d = docSnap.data() ?? {};
  return {
    id: docSnap.id,
    image_url: d.image_url ?? null,
    caption: d.caption ?? null,
    rating: d.rating ?? null,
    user_id: d.user_id ?? null,
    user: d.user ?? null,
    user_avatar: d.user_avatar ?? null,
    cafe_name: d.cafe_name ?? null,
    place_id: d.place_id ?? null,
    created_at: d.created_at instanceof Timestamp ? d.created_at.toDate().toISOString() : null,
    drink: d.drink ?? null,
    drink_custom: d.drink_custom ?? null,
    milk: d.milk ?? null,
    temperature: d.temperature ?? null,
    notes: Array.isArray(d.notes) ? d.notes : [],
    source: d.source === "home" ? "home" : "cafe", // old posts have no source
    recipe: d.recipe ?? null,
  };
}

// The friends feed: newest posts from me + my friends.
//
// "Fan-out on read": we build the feed when it's opened, by asking for posts
// whose author is in my list, split into groups and the results merged.
//
// We use groups of 10, not 30: the database rules check "are we friends?" for
// each author, and Firestore allows at most 10 of those look-ups per query.
const MAX_IN = 10;

export async function fetchFeed(authorIds: string[], maxPosts = 30): Promise<Post[]> {
  // Split the authors into groups of 30
  const groups: string[][] = [];
  for (let i = 0; i < authorIds.length; i += MAX_IN) {
    groups.push(authorIds.slice(i, i + MAX_IN));
  }

  // One query per group, all at the same time
  const snapshots = await Promise.all(
    groups.map((group) =>
      getDocs(
        query(
          collection(db, "uploads"),
          where("user_id", "in", group),
          orderBy("created_at", "desc"),
          limit(maxPosts)
        )
      )
    )
  );

  // Merge, newest first, keep the first `maxPosts`
  return snapshots
    .flatMap((snap) => snap.docs.map(docToPost))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, maxPosts);
}

// A user's bio, saved in the "users" collection (empty if they haven't written one)
export async function fetchUserBio(userId: string): Promise<string> {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data().bio ?? "" : "";
}

// Delete one of YOUR posts: the database entry first, then the photo file.
export async function deletePost(post: Post) {
  // 1) Remove the post from Firestore - after this, it's gone from every screen
  await deleteDoc(doc(db, "uploads", post.id));

  // 2) Remove the photo file from Storage (a download link works as a reference).
  //    If this part fails, the post is still deleted - we just log it,
  //    like the web app did, rather than showing the user an error.
  if (post.image_url?.startsWith("http")) {
    try {
      await deleteObject(ref(storage, post.image_url));
    } catch (error) {
      console.log("Photo file not deleted (post was):", error);
    }
  }
}
