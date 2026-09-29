"""
Reading input from URLs safely. Anyone can type anything into a URL,
so these helpers must never crash and never accept nonsense.

Plain Python - no Flask, no Firebase - so they're easy to test
(see tests/test_parsing.py).
"""

def parse_coordinates(lat_text, lng_text):
    """
    Read a latitude/longitude pair from the URL safely.
    Returns (lat, lng) as numbers, or None if missing or impossible.
    (Latitude goes from -90 to 90, longitude from -180 to 180.)
    """
    try:
        lat, lng = float(lat_text), float(lng_text)
    except (TypeError, ValueError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return lat, lng


def parse_radius(value):
    """Read the radius from the URL safely: default 5000 m, max 50000 m (Google's limit)."""
    try:
        return max(1, min(int(value), 50000))
    except (TypeError, ValueError):
        return 5000
