// Creating a new post: upload the photo, then save the post details.
// Same data shape as the web app's upload.js, so old and new posts match.

import { db, storage } from "@/lib/firebase";
import { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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
