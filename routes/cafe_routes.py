import os
import requests
from flask import Blueprint, render_template, request
from .firebase_helpers import get_posts_by_place_id
from dotenv import load_dotenv

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


@cafe_bp.route("/cafe/<place_id>")
def cafe_detail(place_id):
    cafe_name = request.args.get("name", "")
    uploads = get_posts_by_place_id(place_id)
    return render_template("cafe_detail.html", cafe_name=cafe_name, uploads=uploads)