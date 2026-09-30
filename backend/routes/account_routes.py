"""
Deleting an account and EVERYTHING that belongs to it (Apple requires this).

Why on the backend? The app's database rules deliberately stop you from
deleting other people's documents - e.g. your like sitting inside a friend's
post, or a friendship document you share. The Admin SDK used here skips
those rules, so it can clean up everything in one place.
"""

import os

from firebase_admin import auth as admin_auth
from firebase_admin import storage
from flask import Blueprint, jsonify
from google.cloud.firestore_v1.base_query import FieldFilter

from .cafe_routes import get_logged_in_user_id
from .firebase_helpers import db

account_bp = Blueprint("account", __name__)

# Where the photos live (same bucket as EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET in the app)
STORAGE_BUCKET = os.environ.get("FIREBASE_STORAGE_BUCKET", "coffee-dunk.firebasestorage.app")

BATCH_SIZE = 400  # Firestore allows up to 500 changes per batch


def find_documents_to_delete(uid):
    """Every Firestore document that belongs to this user, as {path: reference}.
    A dict keyed by path, so nothing is listed twice (e.g. your own like on your own post)."""
    found = {}

    def add(ref):
        found[ref.path] = ref

    # 1) Your posts, and the likes inside them
    for post in db.collection("uploads").where(filter=FieldFilter("user_id", "==", uid)).stream():
        for like in post.reference.collection("likes").stream():
            add(like.reference)
        add(post.reference)

    # 2) Likes YOU gave on other people's posts. A "collection group" searches
    #    every "likes" subcollection at once; a like's id is the liker's id.
    #    (This reads all likes - fine for a friends app; a big app would store
    #    the liker's id as a field so it could be queried directly.)
    for like in db.collection_group("likes").stream():
        if like.id == uid:
            add(like.reference)

    # 3) Friendships and requests you're part of
    for f in db.collection("friendships").where(filter=FieldFilter("members", "array_contains", uid)).stream():
        add(f.reference)

    # 4) Your saved list + block list, 5) your username claim(s), 6) your profile
    user_ref = db.collection("users").document(uid)
    for saved in user_ref.collection("saved").stream():
        add(saved.reference)
    for blocked in user_ref.collection("blocked").stream():
        add(blocked.reference)
    # ...and other people's blocks OF you (the block's id is the blocked person's id)
    for block in db.collection_group("blocked").stream():
        if block.id == uid:
            add(block.reference)
    # (Reports are kept on purpose - they're the record of what was reported.)
    for claim in db.collection("usernames").where(filter=FieldFilter("uid", "==", uid)).stream():
        add(claim.reference)
    add(user_ref)

    return found


def delete_account(uid):
    """Delete all of a user's data, then the login account itself. Returns counts."""
    refs = list(find_documents_to_delete(uid).values())
    for i in range(0, len(refs), BATCH_SIZE):
        batch = db.batch()
        for ref in refs[i:i + BATCH_SIZE]:
            batch.delete(ref)
        batch.commit()

    # Photos: post photos (uploads/<uid>/...) and the profile photo (avatars/<uid>/...)
    bucket = storage.bucket(STORAGE_BUCKET)
    files = 0
    for prefix in (f"uploads/{uid}/", f"avatars/{uid}/"):
        for blob in bucket.list_blobs(prefix=prefix):
            blob.delete()
            files += 1

    # LAST: the login account. If anything above failed, we never get here, so
    # the person can still log in and try again (nothing is left half-deleted
    # with no way back in).
    admin_auth.delete_user(uid)
    return {"documents": len(refs), "files": files}


@account_bp.route("/api/account/delete", methods=["POST"])
def api_delete_account():
    """Delete the logged-in user's account. Needs the Authorization header."""
    uid, problem = get_logged_in_user_id()
    if problem:
        message, status = problem
        return jsonify({"error": message}), status

    try:
        counts = delete_account(uid)
    except Exception as e:
        print("❌ Account deletion failed for", uid, ":", e)
        return jsonify({"error": "Couldn't delete your account. Please try again."}), 500

    print(f"🗑️  Deleted account {uid}: {counts}")
    return jsonify({"deleted": True, **counts})
