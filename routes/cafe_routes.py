import os
import requests
from flask import Blueprint, render_template, request, jsonify
from .firebase_helpers import get_posts_by_place_id
from dotenv import load_dotenv
from firebase_admin import auth as admin_auth

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Create the Blueprint
cafe_bp = Blueprint("cafe", __name__)

@cafe_bp.route("/results")
def results():
    city = request.args.get("city", "").strip()
    radius = request.args.get("radius", 5000)
    cafes = []

    if city:
        #Get coordinates for the city
        geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={city}&key={GOOGLE_API_KEY}"
        geo_resp = requests.get(geocode_url).json()
        
        if geo_resp['status'] == 'OK':
            location = geo_resp['results'][0]['geometry']['location']
            lat, lng = location['lat'], location['lng']

            #Get cafes
            places_url = (
                f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                f"?location={lat},{lng}&radius={radius}&type=cafe&keyword=coffee&key={GOOGLE_API_KEY}"
            )
            places_resp = requests.get(places_url).json()
            
            for place in places_resp.get('results', []):
                cafes.append({
                    'name': place['name'],
                    'rating': place.get('rating', 'N/A'),
                    'image_url': get_place_photo(place),
                    'place_id': place['place_id']
                })
    # Sort cafes by rating (descending)
    sorted_cafes = sorted(
        cafes, key=lambda x: x['rating'] if isinstance(x['rating'], (int, float)) else 0, reverse=True
    )

    return render_template("results.html", cafes=sorted_cafes, city=city, radius=radius)


def get_place_photo(place):
    """Return Google Place photo URL or placeholder"""
    photos = place.get("photos")
    if photos:
        photo_ref = photos[0]['photo_reference']
        return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_ref}&key={GOOGLE_API_KEY}"
    return "/static/images/placeholder.jpg"


@cafe_bp.route("/api/cafes/search")
def api_cafe_search():
    """
    Server-side proxy to Google Places Text Search so the client
    can find cafés by name/city. Returns a small, clean JSON list.
    """
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"error": "Missing query ?q=..."}), 400

    try:
        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": q,           
            "type": "cafe",       
            "keyword": "coffee",  # bias toward coffee
            "key": GOOGLE_API_KEY
        }
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()

        results = []
        for p in data.get("results", []):
            results.append({
                "name": p.get("name"),
                "place_id": p.get("place_id"),
                "address": p.get("formatted_address"),
                "rating": p.get("rating"),
            })

        return jsonify({
            "status": data.get("status"),
            "results": results
        })

    except requests.RequestException as e:
        return jsonify({"error": "Upstream request failed", "detail": str(e)}), 502
    

@cafe_bp.route("/cafe/<place_id>")
def cafe_detail(place_id):
    cafe_name = request.args.get("name", "")
    uploads = get_posts_by_place_id(place_id)

    for u in uploads:
        u["image_url"]   = u.get("image_url")   or "/static/assets/placeholder-post.jpg"
        u["caption"]     = u.get("caption")     or ""
        u["rating"]      = u.get("rating")      or "N/A"

        # If user fields are missing/None, fetch from Firebase Auth once
        if not u.get("user") or not u.get("user_avatar"):
            uid = u.get("user_id")
            if uid:
                try:
                    fu = admin_auth.get_user(uid)
                    if not u.get("user"):
                        u["user"] = (fu.display_name or
                                     (fu.email.split("@")[0] if fu.email else "Anon"))
                    if not u.get("user_avatar"):
                        u["user_avatar"] = fu.photo_url or "/static/assets/default-avatar.jpg"
                except Exception:
                    # Safe fallbacks if lookup fails
                    u["user"] = u.get("user") or "Anon"
                    u["user_avatar"] = u.get("user_avatar") or "/static/assets/default-avatar.jpg"
            else:
                # No uid stored—fallbacks
                u["user"] = u.get("user") or "Anon"
                u["user_avatar"] = u.get("user_avatar") or "/static/assets/default-avatar.jpg"

    
    return render_template("cafe_detail.html",
                            cafe_name=cafe_name,
                            uploads=uploads)