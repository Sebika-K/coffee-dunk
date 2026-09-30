// Safety: blocking people and reporting posts/people (the App Store requires both).
//
// DATA DESIGN
//   users/<me>/blocked/<theirId>   { blocked_at }   my PRIVATE block list
//   reports/<auto id>              { reporter_id, reported_user_id, post_id,
//                                    reason, created_at }
// Reports can be CREATED by anyone logged in, but never read from the app -
// only you (the owner) read them, in the Firebase Console.

import { db } from "@/lib/firebase";
import { fetchProfile, pairId, PublicProfile } from "@/lib/friends";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

function blockRef(myId: string, otherId: string) {
  return doc(db, "users", myId, "blocked", otherId);
}

// Block someone: add them to my block list AND end our friendship, together.
// Because posts are friends-only, ending the friendship hides our posts from
// each other straight away. The rules then stop them sending a new request.
export async function blockUser(myId: string, otherId: string) {
  const batch = writeBatch(db);
  batch.set(blockRef(myId, otherId), { blocked_at: serverTimestamp() });

  // Only delete the friendship if there is one (the rules check who's in it,
  // which fails for a document that doesn't exist)
  const friendship = doc(db, "friendships", pairId(myId, otherId));
  if ((await getDoc(friendship)).exists()) batch.delete(friendship);

  await batch.commit();
}

export async function unblockUser(myId: string, otherId: string) {
  await deleteDoc(blockRef(myId, otherId));
}

// The ids of everyone I've blocked (to hide them from search)
export async function fetchBlockedIds(myId: string): Promise<Set<string>> {
  const snapshot = await getDocs(collection(db, "users", myId, "blocked"));
  return new Set(snapshot.docs.map((d) => d.id));
}

// Everyone I've blocked, with name + photo (for the Blocked accounts screen)
export async function fetchBlockedProfiles(myId: string): Promise<PublicProfile[]> {
  const ids = await fetchBlockedIds(myId);
  return Promise.all([...ids].map(fetchProfile));
}

export const REPORT_REASONS = [
  { id: "inappropriate", label: "Inappropriate or offensive" },
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Bullying or harassment" },
  { id: "other", label: "Something else" },
] as const;
export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

// Report a post (postId) or a person (postId null)
export async function reportContent(report: {
  reporterId: string;
  reportedUserId: string;
  postId: string | null;
  reason: ReportReasonId;
}) {
  await addDoc(collection(db, "reports"), {
    reporter_id: report.reporterId,
    reported_user_id: report.reportedUserId,
    post_id: report.postId,
    reason: report.reason,
    created_at: serverTimestamp(),
  });
}
