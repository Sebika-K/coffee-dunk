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

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
NEARBY_URL  = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


def find_cafes_near_city(city, radius):
    """
    Shared logic used by BOTH the web page (/results) and the mobile API
    (/api/cafes/nearby). Turns a city name into coordinates, then asks
    Google for cafés around that point.

    Returns (cafes, error). If something goes wrong, cafes is [] and
    error explains why; otherwise error is None.
    """
    # 1) City name -> latitude/longitude
    geo = requests.get(
        GEOCODE_URL, params={"address": city, "key": GOOGLE_API_KEY}, timeout=10
    ).json()
    if geo.get("status") != "OK":
        return [], geo.get("error_message") or geo.get("status")

    location = geo["results"][0]["geometry"]["location"]

    # 2) Cafés near that point
    places = requests.get(
        NEARBY_URL,
        params={
            "location": f"{location['lat']},{location['lng']}",
            "radius": radius,
            "type": "cafe",
            "keyword": "coffee",
            "key": GOOGLE_API_KEY,
        },
        timeout=10,
    ).json()
    if places.get("status") not in ("OK", "ZERO_RESULTS"):
        return [], places.get("error_message") or places.get("status")

    # 3) Keep only the fields our app uses
    cafes = []
    for place in places.get("results", []):
        photos = place.get("photos")
        cafes.append({
            "name": place.get("name"),
            "place_id": place.get("place_id"),
            "address": place.get("vicinity"),
            "rating": place.get("rating"),  # None if the café has no rating yet
            "photo_ref": photos[0]["photo_reference"] if photos else None,
        })

    # 4) Highest rated first (cafés with no rating go last)
    cafes.sort(key=lambda c: c["rating"] or 0, reverse=True)
    return cafes, None


def parse_radius(value):
    """Read the radius from the URL safely: default 5000 m, max 50000 m (Google's limit)."""
    try:
        return max(1, min(int(value), 50000))
    except (TypeError, ValueError):
        return 5000


@cafe_bp.route("/results")
def results():
    """Web page version (unchanged behaviour for the existing website)."""
    city = request.args.get("city", "").strip()
    radius = parse_radius(request.args.get("radius"))
    cafes = []

    if city:
        found, _error = find_cafes_near_city(city, radius)
        for c in found:
            cafes.append({
                "name": c["name"],
                "place_id": c["place_id"],
                "rating": c["rating"] if c["rating"] is not None else "N/A",
                "image_url": get_place_photo(c["photo_ref"]),
            })

    return render_template("results.html", cafes=cafes, city=city, radius=radius)


@cafe_bp.route("/api/cafes/nearby")
def api_cafes_nearby():
    """
    Mobile app version: same search, but returns plain JSON data.
    Example: /api/cafes/nearby?city=Austin&radius=5000
    """
    city = (request.args.get("city") or "").strip()
    if not city:
        return jsonify({"error": "Missing city. Use ?city=..."}), 400

    radius = parse_radius(request.args.get("radius"))

    try:
        cafes, error = find_cafes_near_city(city, radius)
    except requests.RequestException as e:
        return jsonify({"error": "Could not reach Google", "detail": str(e)}), 502

    if error:
        return jsonify({"error": error}), 502

    return jsonify({"city": city, "radius": radius, "count": len(cafes), "cafes": cafes})


def get_place_photo(photo_ref):
    """Return Google Place photo URL or placeholder (used by the web page only)."""
    if photo_ref:
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
            "error_message": data.get("error_message"),  # Google's reason when something fails
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