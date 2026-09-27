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

def get_posts_by_place_id(place_id):
    try:
        posts_ref = db.collection('uploads')
        #query = posts_ref.where('place_id', '==', place_id)
        #docs = query.stream()
        docs = posts_ref.where('place_id', '==', place_id).stream()
        items = []
        for snap in docs:
            d = snap.to_dict() or {}
            items.append({
                'id': snap.id,
                'image_url': d.get('image_url'),
                'caption': d.get('caption'),
                'rating': d.get('rating'),
                'user_id': d.get('user_id'),
                'cafe_name': d.get('cafe_name'),
                'user': d.get('user'), 
                'user_avatar': d.get('user_avatar'),
                'created_at': d.get('created_at')
            }) 
        print(f"🔎 get_posts_by_place_id({place_id}) → {len(items)} rows")
        return items

    except Exception as e:
        import traceback; traceback.print_exc()
        print("❌ Firestore error in get_posts_by_place_id:", e)
        return []
    #return items