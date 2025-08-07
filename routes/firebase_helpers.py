import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase (only once globally)
if not firebase_admin._apps:
    cred = credentials.Certificate("secrets/firebase-key.json")
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
    posts_ref = db.collection('uploads')
    query = posts_ref.where('place_id', '==', place_id)
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