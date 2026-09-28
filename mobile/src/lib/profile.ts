// Changing your profile: photo, username and bio.
// Same storage places as the web app's settings pages, so both stay in sync.

import { db, storage } from "@/lib/firebase";
import { updateProfile, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

// Upload a new profile photo and set it as the account's photo
export async function saveProfilePhoto(user: User, photoUri: string) {
  const photoBlob = await (await fetch(photoUri)).blob();

  // Always the same file name, so a new photo REPLACES the old one
  const photoRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
  await uploadBytes(photoRef, photoBlob, { contentType: "image/jpeg" });

  // Adding the time to the link makes phones fetch the NEW photo
  // instead of showing the old one they remembered (cached)
  const url = `${await getDownloadURL(photoRef)}&v=${Date.now()}`;
  await updateProfile(user, { photoURL: url });
}

// Save a new username: on the account itself AND in the users collection
export async function saveUsername(user: User, username: string) {
  await updateProfile(user, { displayName: username });
  // merge: true = only change this field, keep everything else (like bio)
  await setDoc(doc(db, "users", user.uid), { username }, { merge: true });
}

// Save a new bio in the users collection
export async function saveBio(userId: string, bio: string) {
  await setDoc(doc(db, "users", userId), { bio }, { merge: true });
}
