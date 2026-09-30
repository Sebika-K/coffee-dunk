import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

# Path to the secret key, built from THIS file's location (routes/),
# so it works no matter which folder the server is started from.
KEY_PATH = os.path.join(os.path.dirname(__file__), "..", "secrets", "firebase-key.json")

# Initialize Firebase (only once globally).
#   On your Mac: use the secret key file in backend/secrets/.
#   Online (Google Cloud Run): there's no key file - the server already runs
#   AS a Google "service account" of your project, so Firebase can use that
#   identity directly ("Application Default Credentials"). No secret to upload.
if not firebase_admin._apps:
    if os.path.exists(KEY_PATH):
        firebase_admin.initialize_app(credentials.Certificate(KEY_PATH))
    else:
        firebase_admin.initialize_app()

db = firestore.client()

def doc_to_post(snap):
    """Turn one Firestore document into a plain dictionary (a "post")."""
    d = snap.to_dict() or {}
    return {
        'id': snap.id,
        'image_url': d.get('image_url'),
        'caption': d.get('caption'),
        'rating': d.get('rating'),
        'user_id': d.get('user_id'),
        'cafe_name': d.get('cafe_name'),
        'place_id': d.get('place_id'),
        'user': d.get('user'),
        'user_avatar': d.get('user_avatar'),
        'created_at': d.get('created_at'),
        # Journal fields (Phase 3). Old posts don't have them -> None / []
        'drink': d.get('drink'),
        'drink_custom': d.get('drink_custom'),
        'milk': d.get('milk'),
        'temperature': d.get('temperature'),
        'notes': d.get('notes') or [],
        # Homemade coffee (Phase 7.3). Old posts have no source -> "cafe"
        'source': d.get('source') or 'cafe',
        'recipe': d.get('recipe'),
    }


def get_posts_where(field, value):
    """All posts where `field` equals `value`, e.g. get_posts_where('drink', 'latte')."""
    try:
        docs = db.collection('uploads').where(filter=FieldFilter(field, '==', value)).stream()
        items = [doc_to_post(snap) for snap in docs]
        print(f"🔎 posts where {field} == {value} → {len(items)} rows")
        return items
    except Exception as e:
        import traceback; traceback.print_exc()
        print(f"❌ Firestore error (posts where {field} == {value}):", e)
        return []


def get_posts_by_place_id(place_id):
    return get_posts_where('place_id', place_id)


def get_posts_by_user(user_id):
    return get_posts_where('user_id', user_id)


def get_posts_by_drink(drink):
    return get_posts_where('drink', drink)


def get_friend_ids(user_id):
    """The ids of a user's ACCEPTED friends (Phase 7.6)."""
    try:
        docs = (db.collection('friendships')
                .where(filter=FieldFilter('members', 'array_contains', user_id))
                .stream())
        ids = set()
        for snap in docs:
            d = snap.to_dict() or {}
            if d.get('status') != 'accepted':
                continue
            ids.update(m for m in d.get('members', []) if m != user_id)
        return ids
    except Exception as e:
        print("❌ Firestore error in get_friend_ids:", e)
        return set()
