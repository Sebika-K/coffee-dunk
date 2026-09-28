// Creating a new post: upload the photo, then save the post details.
// Same data shape as the web app's upload.js, so old and new posts match.

import { db, storage } from "@/lib/firebase";
import { Post } from "@/lib/api";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

type NewPost = {
  photoUri: string; // the photo's location on the phone (file:///...)
  placeId: string;
  cafeName: string;
  caption: string;
  rating: number;
  user: User;
};

export async function createPost({ photoUri, placeId, cafeName, caption, rating, user }: NewPost) {
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
    image_url: imageUrl,
    caption: caption,
    rating: rating,
    place_id: placeId,
    cafe_name: cafeName,
    user_id: user.uid,
    user: user.displayName || user.email?.split("@")[0] || "anon",
    user_avatar: user.photoURL ?? null, // null, NOT a website path (see step 2.6b)
    created_at: serverTimestamp(), // Firebase fills in the exact time
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

  // Turn each Firestore document into the same Post shape the backend sends
  return snapshot.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      image_url: d.image_url ?? null,
      caption: d.caption ?? null,
      rating: d.rating ?? null,
      user_id: d.user_id ?? null,
      user: d.user ?? null,
      user_avatar: d.user_avatar ?? null,
      cafe_name: d.cafe_name ?? null,
      created_at: d.created_at instanceof Timestamp ? d.created_at.toDate().toISOString() : null,
    };
  });
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
