import os
import firebase_admin
from firebase_admin import credentials, firestore

# Path to the secret key, built from THIS file's location (routes/),
# so it works no matter which folder the server is started from.
KEY_PATH = os.path.join(os.path.dirname(__file__), "..", "secrets", "firebase-key.json")

# Initialize Firebase (only once globally)
if not firebase_admin._apps:
    cred = credentials.Certificate(KEY_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_posts_by_cafe(cafe_name):
    posts_ref = db.collection('posts')
    query = posts_ref.where('cafe', '==', cafe_name)
    docs = query.stream()
    return [
        {
            'image_url': doc.get('image_url'),
            'caption': doc.get('caption'),
            'rating': doc.get('rating'),
            'user': doc.get('user'),
            'user_avatar': doc.get('user_avatar')
        } for doc in docs
    ]

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
    }


def get_posts_where(field, value):
    """All posts where `field` equals `value`, e.g. get_posts_where('drink', 'latte')."""
    try:
        docs = db.collection('uploads').where(field, '==', value).stream()
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
