"""
Debug tool: shows step by step how "Cafés to try" is worked out for one user.

Run from the backend folder (with the venv active):
    python -m scripts.debug_recommendations <username>

It uses the SAME functions as the real /api/recommendations route,
so what you see here is exactly what the app gets.
"""

import sys

from google.cloud.firestore_v1.base_query import FieldFilter

from routes.drink_stats import (
    FRIEND_WEIGHT,
    NEUTRAL_RATING,
    confidence_score,
    drink_key,
    favourite_drink,
    recommend_cafes,
    top_drinks,
)
from routes.firebase_helpers import db, get_friend_ids, get_posts_by_drink, get_posts_by_user


def describe(p):
    """A readable drink name, e.g. 'iced / oat / latte'."""
    drink = p.get("drink_custom") if p.get("drink") == "other" else p.get("drink")
    return " / ".join(str(x) for x in (p.get("temperature"), p.get("milk"), drink) if x)


def find_user(username):
    q = username.strip().lower()
    docs = list(db.collection("users").where(filter=FieldFilter("username_lower", "==", q)).stream())
    if not docs:
        sys.exit(f"No user with username '{username}'. (Usernames are matched ignoring upper/lower case.)")
    if len(docs) > 1:
        print(f"⚠️  {len(docs)} users share this username - using the first one.")
    return docs[0].id


def name_of(user_id):
    snap = db.collection("users").document(user_id).get()
    return (snap.to_dict() or {}).get("username", user_id) if snap.exists else user_id


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python -m scripts.debug_recommendations <username>")

    user_id = find_user(sys.argv[1])
    print(f"\n👤 {sys.argv[1]}  (id {user_id})")

    # 1) Favourite drink
    my_posts = get_posts_by_user(user_id)
    print(f"\n1) YOUR POSTS: {len(my_posts)}")
    print("   Your drinks, best first (score must be ≥ 3.5 to count as a favourite):")
    for d in top_drinks(my_posts, limit=10):
        print(f"   - {describe(d):30} avg {d['average']}  ({d['count']} posts)  score {d['score']}")
    favourite = favourite_drink(my_posts)
    if not favourite:
        print("\n   ❌ No favourite yet -> no recommendations.")
        print("      Tip: give a drink 5★ (one 5★ post scores 3.67, which is enough).")
        return
    print(f"\n   ⭐ FAVOURITE: {describe(favourite)}")
    print("      (Recommendations only use posts with EXACTLY this drink + milk + hot/iced.)")

    # 2) Friends
    friend_ids = get_friend_ids(user_id)
    print(f"\n2) FRIENDS: {len(friend_ids)}  ->  {', '.join(name_of(f) for f in friend_ids) or 'none'}")
    print(f"   (A friend's rating counts {FRIEND_WEIGHT}x.)")

    # 3) Candidates
    been_to = {p["place_id"] for p in my_posts if p.get("place_id")}
    drink_posts = get_posts_by_drink(favourite["drink"])
    wanted = drink_key(favourite)
    print(f"\n3) EVERY POST OF '{favourite['drink']}' IN THE DATABASE: {len(drink_posts)}")
    for p in drink_posts:
        who = name_of(p.get("user_id"))
        reason = "✅ counts"
        if p.get("user_id") == user_id:
            reason = "⏭️  skipped: your own post"
        elif drink_key(p) != wanted:
            reason = f"⏭️  skipped: different drink ({describe(p)})"
        elif not p.get("place_id"):
            reason = "⏭️  skipped: homemade (no café)"
        elif p["place_id"] in been_to:
            reason = "⏭️  skipped: a café you've already posted at"
        elif p.get("user_id") in friend_ids:
            reason = f"✅ counts x{FRIEND_WEIGHT} (friend)"
        print(f"   - {who:15} {p.get('rating')}★ at {p.get('cafe_name') or '(home)':25} {reason}")

    # 4) Result
    cafes = recommend_cafes(drink_posts, favourite, been_to,
                            exclude_user_id=user_id, friend_ids=friend_ids)
    print(f"\n4) CAFÉS TO TRY (only scores above {NEUTRAL_RATING} are recommended):")
    if not cafes:
        print("   (none yet)")
    for i, c in enumerate(cafes, 1):
        friends = f"  ❤️ {c['friends_count']} friend(s)" if c["friends_count"] else ""
        print(f"   {i}. {c['cafe_name']:25} avg {c['average']}  ({c['count']} ratings)  score {c['score']}{friends}")
    print()


if __name__ == "__main__":
    main()
