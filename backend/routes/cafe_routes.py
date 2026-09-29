import os
import requests
from urllib.parse import quote
from flask import Blueprint, render_template, request, jsonify, Response
from .firebase_helpers import get_posts_by_place_id, get_posts_by_user, get_posts_by_drink, get_friend_ids
from .parsing import parse_coordinates, parse_radius
from .privacy import visible_posts
from .drink_stats import top_drinks, favourite_drink, recommend_cafes
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
    # City name -> latitude/longitude
    geo = requests.get(
        GEOCODE_URL, params={"address": city, "key": GOOGLE_API_KEY}, timeout=10
    ).json()
    if geo.get("status") != "OK":
        return [], geo.get("error_message") or geo.get("status")

    location = geo["results"][0]["geometry"]["location"]
    return find_cafes_near_point(location["lat"], location["lng"], radius)


def find_cafes_near_point(lat, lng, radius):
    """
    Cafés around a map point (latitude, longitude). Used for a searched city
    (after turning its name into a point) and for "Near me" (the phone's
    own location, Phase 8.1d). Returns (cafes, error) like above.
    """
    places = requests.get(
        NEARBY_URL,
        params={
            "location": f"{lat},{lng}",
            "radius": radius,
            "type": "cafe",
            "keyword": "coffee",
            "key": GOOGLE_API_KEY,
        },
        timeout=10,
    ).json()
    if places.get("status") not in ("OK", "ZERO_RESULTS"):
        return [], places.get("error_message") or places.get("status")

    # Keep only the fields our app uses
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

    # Highest rated first (cafés with no rating go last)
    cafes.sort(key=lambda c: c["rating"] or 0, reverse=True)
    return cafes, None


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
    Two ways to say WHERE:
      /api/cafes/nearby?city=Austin&radius=5000
      /api/cafes/nearby?lat=30.27&lng=-97.74     ("Near me", Phase 8.1d)
    """
    city = (request.args.get("city") or "").strip()
    has_point = request.args.get("lat") is not None or request.args.get("lng") is not None
    point = parse_coordinates(request.args.get("lat"), request.args.get("lng")) if has_point else None

    if has_point and point is None:
        return jsonify({"error": "Invalid location. Use ?lat=...&lng=... with real coordinates."}), 400
    if not city and point is None:
        return jsonify({"error": "Missing city. Use ?city=... (or ?lat=...&lng=...)"}), 400

    radius = parse_radius(request.args.get("radius"))

    try:
        if point is not None:
            cafes, error = find_cafes_near_point(point[0], point[1], radius)
        else:
            cafes, error = find_cafes_near_city(city, radius)
    except requests.RequestException as e:
        return jsonify({"error": "Could not reach Google", "detail": str(e)}), 502

    if error:
        return jsonify({"error": error}), 502

    return jsonify({"city": city, "radius": radius, "count": len(cafes), "cafes": cafes})


PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo"


def get_place_photo(photo_ref):
    """
    Build the photo address for the web page. It points at OUR server
    (/api/photo), not Google, so the secret key never reaches the browser.
    """
    if photo_ref:
        return f"/api/photo?ref={quote(photo_ref)}"
    return "/static/images/placeholder.jpg"


@cafe_bp.route("/api/photo")
def api_photo():
    """
    Photo middleman. The app/browser sends a photo_ref, the server adds the
    secret key, fetches the image from Google, and passes the image back.
    Example: /api/photo?ref=Aa-ngMb...&w=400
    """
    photo_ref = (request.args.get("ref") or "").strip()
    if not photo_ref:
        return jsonify({"error": "Missing photo ref. Use ?ref=..."}), 400

    # Width in pixels: default 400, kept between 50 and 1600 (Google's max)
    try:
        width = max(50, min(int(request.args.get("w", 400)), 1600))
    except ValueError:
        width = 400

    try:
        google_resp = requests.get(
            PHOTO_URL,
            params={"maxwidth": width, "photo_reference": photo_ref, "key": GOOGLE_API_KEY},
            timeout=10,
        )
    except requests.RequestException:
        return jsonify({"error": "Could not reach Google"}), 502

    if google_resp.status_code != 200:
        return jsonify({"error": "Photo not available"}), 404

    return Response(
        google_resp.content,
        mimetype=google_resp.headers.get("Content-Type", "image/jpeg"),
        # Let the phone/browser reuse this photo for a day instead of asking
        # again - fewer Google requests, faster scrolling.
        headers={"Cache-Control": "public, max-age=86400"},
    )


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
    

def get_cafe_posts(place_id):
    """
    Shared logic used by BOTH the web page (/cafe/<place_id>) and the mobile
    API (/api/cafes/<place_id>/posts).

    Loads all posts for one café from Firestore and fills in missing user
    names/avatars from Firebase Auth. Missing values stay None - it's up to
    whoever DISPLAYS the data (web page or app) to choose a fallback image.
    Returns posts newest first.
    """
    posts = get_posts_by_place_id(place_id)
    user_cache = {}  # uid -> Firebase user, so each person is looked up only once

    for p in posts:
        if p.get("user") and p.get("user_avatar"):
            continue  # already complete, nothing to look up

        uid = p.get("user_id")
        if not uid:
            continue

        if uid not in user_cache:
            try:
                user_cache[uid] = admin_auth.get_user(uid)
            except Exception:
                user_cache[uid] = None  # lookup failed; remember so we don't retry

        fu = user_cache[uid]
        if fu:
            if not p.get("user"):
                p["user"] = fu.display_name or (fu.email.split("@")[0] if fu.email else None)
            if not p.get("user_avatar"):
                p["user_avatar"] = fu.photo_url

    # Newest first (posts without a date go last)
    posts.sort(key=lambda p: p["created_at"].timestamp() if p.get("created_at") else 0, reverse=True)
    return posts


@cafe_bp.route("/cafe/<place_id>")
def cafe_detail(place_id):
    """Web page version: adds display fallbacks, then renders HTML."""
    cafe_name = request.args.get("name", "")
    uploads = get_cafe_posts(place_id)

    for u in uploads:
        u["image_url"]   = u.get("image_url")   or "/static/images/placeholder.jpg"
        u["caption"]     = u.get("caption")     or ""
        u["rating"]      = u.get("rating")      or "N/A"
        u["user"]        = u.get("user")        or "Anon"
        u["user_avatar"] = u.get("user_avatar") or "/static/assets/default-avatar.jpg"

    return render_template("cafe_detail.html", cafe_name=cafe_name, uploads=uploads)


@cafe_bp.route("/api/cafes/<place_id>/posts")
def api_cafe_posts(place_id):
    """
    Mobile app version: posts at one café as JSON, newest first.
    FRIENDS ONLY: needs a login, and returns just your own posts and your
    friends' posts. (Top drinks below still count everyone - anonymously.)
    Example: /api/cafes/ChIJOzVa9gSLj4ARFQqljssXWUI/posts
    """
    user_id, problem = get_logged_in_user_id()
    if problem:
        message, status = problem
        return jsonify({"error": message}), status

    posts = visible_posts(get_cafe_posts(place_id), user_id, get_friend_ids(user_id))

    for p in posts:
        # Dates aren't JSON-friendly, so send them as standard text
        # like "2025-08-12T14:03:22+00:00"
        if p.get("created_at"):
            p["created_at"] = p["created_at"].isoformat()

    return jsonify({"place_id": place_id, "count": len(posts), "posts": posts})


@cafe_bp.route("/api/cafes/<place_id>/top-drinks")
def api_cafe_top_drinks(place_id):
    """
    The best-rated drinks at one café, based on everyone's posts (Phase 5).
    Example: /api/cafes/ChIJOzVa9gSLj4ARFQqljssXWUI/top-drinks
    """
    posts = get_posts_by_place_id(place_id)
    drinks = top_drinks(posts, limit=3)
    return jsonify({"place_id": place_id, "top_drinks": drinks})


def get_logged_in_user_id():
    """
    Who is making this request? The app sends the user's Firebase ID token
    in the "Authorization: Bearer <token>" header. We ask Firebase to VERIFY
    it - a token can't be faked or edited, so this is proof of who they are.

    Returns (user_id, None) if it worked, or (None, (message, status_code))
    explaining what went wrong. Two very different failures:
      401 - the USER's problem: no token, or a bad/expired one -> log in again
      503 - the SERVER's problem: we couldn't reach Google to check the token
            (a network hiccup) -> nothing wrong with the login, try again soon
    """
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, ("Please log in.", 401)
    token = header[len("Bearer "):]
    try:
        return admin_auth.verify_id_token(token)["uid"], None
    except admin_auth.CertificateFetchError as e:
        # Couldn't download Google's public keys (e.g. a network timeout)
        print("⚠️ Couldn't reach Google to verify the login (will retry next time):", e)
        return None, ("Couldn't verify your login right now. Please try again.", 503)
    except Exception as e:
        print("❌ Invalid ID token:", e)
        return None, ("Please log in.", 401)


@cafe_bp.route("/api/recommendations")
def api_recommendations():
    """
    "You love X - try these cafés" for the logged-in user (Phase 6).
    Requires the Authorization header (see get_logged_in_user_id).
    """
    user_id, problem = get_logged_in_user_id()
    if problem:
        message, status = problem
        return jsonify({"error": message}), status

    # 1) What's their favourite drink?
    my_posts = get_posts_by_user(user_id)
    favourite = favourite_drink(my_posts)
    if not favourite:
        return jsonify({"favourite": None, "cafes": []})

    # 2) Everyone's posts of that drink, from every café
    drink_posts = get_posts_by_drink(favourite["drink"])

    # 3) Cafés where others rate it highly, that they haven't been to yet
    been_to = {p["place_id"] for p in my_posts if p.get("place_id")}
    # (Phase 7.6: friends' ratings count more)
    friend_ids = get_friend_ids(user_id)
    cafes = recommend_cafes(drink_posts, favourite, been_to,
                            exclude_user_id=user_id, friend_ids=friend_ids)

    return jsonify({
        "favourite": {k: favourite[k] for k in ("drink", "drink_custom", "milk", "temperature")},
        "cafes": cafes,
    })
