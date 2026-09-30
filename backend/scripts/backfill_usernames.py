"""
One-time fix: claim the usernames of accounts made BEFORE unique usernames.

Every name needs a claim document (usernames/<lowercase name>) or the app
thinks it's free. Accounts from before that change don't have one yet.

Run from the backend folder (with the venv active):
    python -m scripts.backfill_usernames           # dry run: only SHOWS what it would do
    python -m scripts.backfill_usernames --apply   # actually writes the claims

If several accounts share a name, the OLDEST account keeps it (or whoever
already has the claim). The others are listed so they can pick a new name
in Settings - the script never renames anyone by itself.
"""

import sys
from collections import defaultdict

from firebase_admin import auth as admin_auth

from routes.firebase_helpers import db


def account_created_ms(uid):
    """When the account was made (for 'oldest keeps the name'). Unknown -> last."""
    try:
        return admin_auth.get_user(uid).user_metadata.creation_timestamp or float("inf")
    except Exception:
        return float("inf")


def main():
    apply = "--apply" in sys.argv

    # 1) Group every account by its lowercase username
    by_name = defaultdict(list)  # "sam" -> [(uid, "Sam"), ...]
    for snap in db.collection("users").stream():
        name = (snap.to_dict() or {}).get("username")
        if name:
            by_name[name.lower()].append((snap.id, name))

    to_claim, conflicts = [], []

    # 2) Decide who owns each name
    for lower, accounts in sorted(by_name.items()):
        claim = db.collection("usernames").document(lower).get()
        if claim.exists:
            owner_uid = claim.to_dict().get("uid")
        else:
            # Nobody has claimed it yet -> the oldest account gets it
            owner_uid = min(accounts, key=lambda a: account_created_ms(a[0]))[0]
            owner_name = next(n for uid, n in accounts if uid == owner_uid)
            to_claim.append((lower, owner_uid, owner_name))

        for uid, name in accounts:
            if uid != owner_uid:
                conflicts.append((name, uid))

    # 3) Report (and write, with --apply)
    print(f"{len(by_name)} usernames, {len(to_claim)} need a claim.\n")
    for lower, uid, name in to_claim:
        print(f"  claim  {lower:<22} -> {name} ({uid})")
        if apply:
            db.collection("usernames").document(lower).set({"uid": uid, "username": name})

    if conflicts:
        print("\n⚠️  These accounts share a name someone else owns.")
        print("   Log in as each one and pick a new username in Settings:")
        for name, uid in conflicts:
            print(f"  {name} ({uid})")

    print("\n✅ Claims written." if apply else "\nDry run - nothing written. Add --apply to write the claims.")


if __name__ == "__main__":
    main()
