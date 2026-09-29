// Changing your profile: photo, username and bio.
// Same storage places as the web app's settings pages, so both stay in sync.

import { db, storage } from "@/lib/firebase";
import { updateProfile, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { syncPublicProfile } from "@/lib/users";
import { claimUsername } from "@/lib/usernames";

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
  await syncPublicProfile(user); // so friends see the new photo too
}

// Save a new username: claim it first (fails if it's taken), then put it on
// the account. claimUsername also updates the public profile and frees the old name.
export async function saveUsername(user: User, username: string) {
  await claimUsername(user.uid, username, user.displayName);
  await updateProfile(user, { displayName: username });
}

// Save a new bio in the users collection
export async function saveBio(userId: string, bio: string) {
  await setDoc(doc(db, "users", userId), { bio }, { merge: true });
}
